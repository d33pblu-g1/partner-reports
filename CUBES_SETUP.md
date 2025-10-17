# Data Cubes Setup Guide

## Overview

Data cubes are pre-aggregated tables that significantly improve chart rendering performance. Instead of running complex queries on millions of records every time a chart is requested, the cubes store pre-calculated summaries.

## Performance Benefits

- **10-100x faster** query times for charts
- Reduced database load
- Consistent response times regardless of data volume
- Optimized for time-series and dimensional analysis

## Installation

### 1. Create Cube Tables and Stored Procedures

```bash
# Run the cube creation script
mysql -u root -p partner_report < database_cubes.sql
```

This will create:
- 4 cube tables
- 4 stored procedures to populate cubes
- Indexes for optimized queries

### 2. Populate Initial Data

The script automatically populates the cubes after creation. To manually refresh:

```sql
-- Connect to database
mysql -u root -p partner_report

-- Populate all cubes
CALL populate_commission_cube();
CALL populate_tier_cube();
CALL populate_country_cube();
CALL populate_age_cube();
```

### 3. (Optional) Enable Automatic Refresh

To automatically refresh cubes daily:

```sql
-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Create refresh event
CREATE EVENT IF NOT EXISTS refresh_cubes_daily
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO BEGIN
    CALL populate_commission_cube();
    CALL populate_tier_cube();
    CALL populate_country_cube();
    CALL populate_age_cube();
END;
```

## Cube Tables

### 1. cube_commissions_by_plan

**Purpose**: Stores pre-aggregated commission data grouped by date and commission plan

**Fields**:
- `partner_id`: Partner identifier
- `commission_plan`: Commission plan type (RevShare 30%, CPA, etc.)
- `date`: Date of the data point
- `period_type`: 'daily' or 'monthly'
- `total_commission`: Sum of commissions
- `trade_count`: Number of trades

**Used by**:
- Commissions stacked bar chart
- Commission analytics

**Refresh frequency**: Daily or on-demand

### 2. cube_tier_distribution

**Purpose**: Pre-calculated client distribution by tier

**Fields**:
- `partner_id`: Partner identifier
- `tier`: Client tier (Bronze, Silver, Gold, Platinum)
- `client_count`: Number of clients
- `total_deposits`: Sum of deposits
- `total_commissions`: Sum of commissions
- `snapshot_date`: Date of snapshot

**Used by**:
- Tier distribution pie chart
- Tier analysis reports

**Refresh frequency**: Daily

### 3. cube_country_performance

**Purpose**: Country-level performance metrics

**Fields**:
- `partner_id`: Partner identifier
- `country`: Country name
- `client_count`: Number of clients
- `total_deposits`: Sum of deposits
- `total_commissions`: Sum of commissions
- `trade_count`: Number of trades
- `snapshot_date`: Date of snapshot

**Used by**:
- Country analysis page
- Geographic performance reports

**Refresh frequency**: Daily

### 4. cube_age_distribution

**Purpose**: Client demographic distribution by age groups

**Fields**:
- `partner_id`: Partner identifier
- `age_group`: Age range (18-25, 26-35, etc.)
- `client_count`: Number of clients
- `snapshot_date`: Date of snapshot

**Used by**:
- Population distribution chart
- Demographic analysis

**Refresh frequency**: Daily

## Manual Refresh

To manually refresh cubes (useful after data import):

```sql
-- Refresh all cubes
CALL populate_commission_cube();
CALL populate_tier_cube();
CALL populate_country_cube();
CALL populate_age_cube();

-- Or refresh individual cubes
CALL populate_commission_cube();  -- Takes longest, ~30-60 seconds for large datasets
```

## Monitoring

### Check Cube Status

```sql
-- Check commission cube data
SELECT 
    period_type,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    SUM(total_commission) as total_commission
FROM cube_commissions_by_plan
GROUP BY period_type;

-- Check tier distribution
SELECT 
    tier,
    SUM(client_count) as total_clients,
    MAX(snapshot_date) as last_updated
FROM cube_tier_distribution
GROUP BY tier;

-- Check country performance
SELECT 
    COUNT(DISTINCT country) as countries,
    SUM(client_count) as total_clients,
    MAX(snapshot_date) as last_updated
FROM cube_country_performance;
```

### Performance Comparison

```sql
-- Query with cube (fast)
SELECT date, commission_plan, SUM(total_commission)
FROM cube_commissions_by_plan
WHERE period_type = 'daily' AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY date, commission_plan;

-- Query without cube (slow)
SELECT 
    DATE(t.date_time) as date,
    c.commission_plan,
    SUM(t.commission) as total_commission
FROM trades t
JOIN clients c ON t.customer_id = c.customer_id
WHERE t.date_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(t.date_time), c.commission_plan;
```

## Maintenance

### Rebuild Cubes

If data integrity is questioned:

```sql
-- Clear and rebuild commission cube
TRUNCATE TABLE cube_commissions_by_plan;
CALL populate_commission_cube();

-- Clear and rebuild all cubes
TRUNCATE TABLE cube_commissions_by_plan;
TRUNCATE TABLE cube_tier_distribution;
TRUNCATE TABLE cube_country_performance;
TRUNCATE TABLE cube_age_distribution;

CALL populate_commission_cube();
CALL populate_tier_cube();
CALL populate_country_cube();
CALL populate_age_cube();
```

### Cleanup Old Data

Cubes automatically clean up data older than 30 days to prevent unbounded growth:

```sql
-- Tier distribution cleanup (automatic in stored procedure)
DELETE FROM cube_tier_distribution 
WHERE snapshot_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- Manual cleanup if needed
DELETE FROM cube_commissions_by_plan 
WHERE date < DATE_SUB(CURDATE(), INTERVAL 90 DAY);
```

## Troubleshooting

### Cube Not Updating

1. Check if stored procedures exist:
```sql
SHOW PROCEDURE STATUS WHERE Db = 'partner_report';
```

2. Check event scheduler:
```sql
SHOW VARIABLES LIKE 'event_scheduler';
```

3. Check events:
```sql
SHOW EVENTS;
```

### Performance Issues

1. Verify indexes:
```sql
SHOW INDEX FROM cube_commissions_by_plan;
```

2. Analyze table:
```sql
ANALYZE TABLE cube_commissions_by_plan;
```

3. Check table size:
```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables
WHERE table_schema = 'partner_report'
AND table_name LIKE 'cube_%';
```

## API Integration

The API automatically uses cubes when available and falls back to raw tables if not:

```php
// API checks for cube existence
if (tableExists($db, 'cube_commissions_by_plan')) {
    return getStackedDataFromCube($db, $partnerId, $periodType, $limit);
} else {
    return getStackedDataFromTables($db, $partnerId, $periodType, $limit);
}
```

No configuration needed - it's automatic!

## Best Practices

1. **Refresh Schedule**: Run cube refreshes during low-traffic hours
2. **Monitoring**: Set up alerts if cubes haven't been updated in 24+ hours
3. **Backup**: Include cube tables in your backup strategy
4. **Testing**: Test cube accuracy by comparing with raw table queries
5. **Indexes**: Ensure all recommended indexes are created
6. **Partitioning**: For very large datasets, consider table partitioning

## Example Queries

### Get daily commissions for last 30 days
```sql
SELECT date, commission_plan, total_commission
FROM cube_commissions_by_plan
WHERE period_type = 'daily'
AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY date;
```

### Get monthly commissions by plan
```sql
SELECT date, commission_plan, total_commission, trade_count
FROM cube_commissions_by_plan
WHERE period_type = 'monthly'
ORDER BY date DESC
LIMIT 12;
```

### Get tier distribution for a partner
```sql
SELECT tier, client_count, total_commissions
FROM cube_tier_distribution
WHERE partner_id = 'P-0001'
AND snapshot_date = CURDATE();
```
