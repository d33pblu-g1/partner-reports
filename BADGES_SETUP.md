# Badges System Setup Guide

## Overview

The badges system rewards partners for reaching commission and deposit milestones. Badges are automatically awarded based on cumulative totals.

## Badge Types

### Commission Badges
- **com1**: $1+ in total commissions
- **com10**: $10+ in total commissions
- **com100**: $100+ in total commissions
- **com1k**: $1,000+ in total commissions
- **com10k**: $10,000+ in total commissions
- **com100k**: $100,000+ in total commissions

### Deposit Badges
- **dep1**: $1+ in total deposits
- **dep10**: $10+ in total deposits
- **dep100**: $100+ in total deposits
- **dep1k**: $1,000+ in total deposits
- **dep10k**: $10,000+ in total deposits
- **dep100k**: $100,000+ in total deposits

## Database Tables

### 1. badges
Stores badge definitions

**Columns:**
- `id`: Primary key
- `badge_name`: Unique badge identifier (e.g., 'com1k')
- `badge_criteria`: Type of badge ('commissions' or 'deposits')
- `badge_trigger`: Trigger amount (e.g., '$1000')
- `created_at`: Creation timestamp

### 2. partner_badges
Junction table tracking which partners earned which badges

**Columns:**
- `id`: Primary key
- `partner_id`: Foreign key to partners table
- `badge_id`: Foreign key to badges table
- `earned_date`: When the badge was earned
- Unique constraint on (partner_id, badge_id)

## Installation

### 1. Create Tables and Populate Badges

```bash
# Run the badges setup script
mysql -u root -p partner_report < badges_table.sql
```

This will:
- Create the `badges` table
- Create the `partner_badges` junction table
- Populate 12 badges (6 commission + 6 deposit)
- Create stored procedure `award_badges()`
- Create view `partner_badges_view`
- Create function `get_partner_badge_count()`
- Award badges to existing partners

### 2. Verify Installation

```sql
-- Check badges
SELECT * FROM badges;

-- Check awarded badges
SELECT 
    p.name as partner_name,
    COUNT(pb.badge_id) as badge_count
FROM partners p
LEFT JOIN partner_badges pb ON p.partner_id = pb.partner_id
GROUP BY p.partner_id
ORDER BY badge_count DESC;

-- View specific partner's badges
SELECT * FROM partner_badges_view WHERE partner_id = 'P-0001';
```

## Usage

### Award Badges to All Partners

```sql
-- Manually trigger badge award process
CALL award_badges();
```

This stored procedure:
1. Iterates through all partners
2. Calculates total commissions and deposits
3. Awards appropriate badges
4. Skips already awarded badges (UNIQUE constraint)

### Award Badges via API

```bash
# Trigger badge calculation via API
curl -X POST http://localhost:8001/api/badges
```

### Check Partner Badges via API

```bash
# Get all badges for a partner
curl http://localhost:8001/api/badges?action=partner&partner_id=P-0001

# Get badge progress for a partner
curl http://localhost:8001/api/badges?action=progress&partner_id=P-0001

# Get badge summary statistics
curl http://localhost:8001/api/badges?action=summary

# List all available badges
curl http://localhost:8001/api/badges?action=list
```

## API Endpoints

### GET /api/badges

**Query Parameters:**
- `action`: Type of request
  - `list`: Get all available badges
  - `partner`: Get badges for specific partner (requires partner_id)
  - `progress`: Get badge progress for partner (requires partner_id)
  - `summary`: Get badge statistics
- `partner_id`: Partner identifier (required for partner/progress actions)

**Examples:**

```javascript
// Get partner's badges
fetch('/api/badges?action=partner&partner_id=P-0001')
  .then(res => res.json())
  .then(data => console.log(data));

// Get badge progress
fetch('/api/badges?action=progress&partner_id=P-0001')
  .then(res => res.json())
  .then(data => console.log(data));
```

### POST /api/badges

Triggers badge award calculation for all partners.

```javascript
fetch('/api/badges', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data));
```

## Response Formats

### Partner Badges Response

```json
{
  "success": true,
  "data": {
    "partner_id": "P-0001",
    "badges": [
      {
        "id": 1,
        "badge_name": "com1",
        "badge_criteria": "commissions",
        "badge_trigger": "$1",
        "earned_date": "2025-10-17 10:30:00",
        "partner_name": "John Doe",
        "partner_tier": "Gold"
      }
    ],
    "total_commissions": 15000.00,
    "total_deposits": 50000.00,
    "badge_count": 8
  }
}
```

### Badge Progress Response

```json
{
  "success": true,
  "data": {
    "partner_id": "P-0001",
    "total_commissions": 15000.00,
    "total_deposits": 50000.00,
    "badges": [
      {
        "badge_id": 1,
        "badge_name": "com1",
        "badge_criteria": "commissions",
        "badge_trigger": "$1",
        "trigger_amount": 1,
        "current_amount": 15000.00,
        "progress_percent": 100,
        "earned": true,
        "remaining": 0
      },
      {
        "badge_id": 5,
        "badge_name": "com10k",
        "badge_criteria": "commissions",
        "badge_trigger": "$10000",
        "trigger_amount": 10000,
        "current_amount": 15000.00,
        "progress_percent": 100,
        "earned": true,
        "remaining": 0
      },
      {
        "badge_id": 6,
        "badge_name": "com100k",
        "badge_criteria": "commissions",
        "badge_trigger": "$100000",
        "trigger_amount": 100000,
        "current_amount": 15000.00,
        "progress_percent": 15,
        "earned": false,
        "remaining": 85000.00
      }
    ]
  }
}
```

## Queries

### Get Top Badge Earners

```sql
SELECT 
    p.partner_id,
    p.name,
    p.tier,
    COUNT(pb.badge_id) as badge_count
FROM partners p
LEFT JOIN partner_badges pb ON p.partner_id = pb.partner_id
GROUP BY p.partner_id
ORDER BY badge_count DESC
LIMIT 10;
```

### Get Badges by Type

```sql
-- Commission badges earned
SELECT 
    b.badge_name,
    COUNT(pb.partner_id) as times_earned
FROM badges b
LEFT JOIN partner_badges pb ON b.id = pb.badge_id
WHERE b.badge_criteria = 'commissions'
GROUP BY b.id
ORDER BY times_earned DESC;

-- Deposit badges earned
SELECT 
    b.badge_name,
    COUNT(pb.partner_id) as times_earned
FROM badges b
LEFT JOIN partner_badges pb ON b.id = pb.badge_id
WHERE b.badge_criteria = 'deposits'
GROUP BY b.id
ORDER BY times_earned DESC;
```

### Get Recently Earned Badges

```sql
SELECT 
    p.name as partner_name,
    b.badge_name,
    b.badge_trigger,
    pb.earned_date
FROM partner_badges pb
JOIN partners p ON pb.partner_id = p.partner_id
JOIN badges b ON pb.badge_id = b.id
ORDER BY pb.earned_date DESC
LIMIT 20;
```

### Get Partners Close to Next Badge

```sql
-- Partners close to earning com10k ($10,000)
SELECT 
    p.partner_id,
    p.name,
    SUM(t.commission) as total_commissions,
    10000 - SUM(t.commission) as remaining
FROM partners p
JOIN clients c ON p.partner_id = c.partner_id
LEFT JOIN trades t ON c.customer_id = t.customer_id
LEFT JOIN partner_badges pb ON p.partner_id = pb.partner_id 
    AND pb.badge_id = (SELECT id FROM badges WHERE badge_name = 'com10k')
WHERE pb.badge_id IS NULL
GROUP BY p.partner_id
HAVING total_commissions >= 8000 AND total_commissions < 10000
ORDER BY remaining ASC;
```

## Maintenance

### Recalculate All Badges

```sql
-- Clear all badge awards
TRUNCATE TABLE partner_badges;

-- Recalculate and award
CALL award_badges();
```

### Add New Badge

```sql
-- Example: Add a "super" commission badge for $1M
INSERT INTO badges (badge_name, badge_criteria, badge_trigger)
VALUES ('com1m', 'commissions', '$1000000');

-- Update the award_badges() stored procedure to include the new badge
```

### Remove Badge Awards

```sql
-- Remove specific badge from all partners
DELETE FROM partner_badges 
WHERE badge_id = (SELECT id FROM badges WHERE badge_name = 'com1');

-- Remove all badges for a partner
DELETE FROM partner_badges WHERE partner_id = 'P-0001';
```

## Automation

### Schedule Daily Badge Awards

```sql
-- Create event to award badges daily
CREATE EVENT IF NOT EXISTS award_badges_daily
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO CALL award_badges();

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;
```

### Award Badges on New Trade

```sql
-- Create trigger to award badges when new trade is inserted
DELIMITER //

CREATE TRIGGER award_badges_after_trade
AFTER INSERT ON trades
FOR EACH ROW
BEGIN
    DECLARE v_partner_id VARCHAR(20);
    
    -- Get partner ID for the customer
    SELECT partner_id INTO v_partner_id
    FROM clients
    WHERE customer_id = NEW.customer_id;
    
    -- Call badge awarding (simplified version for single partner)
    -- Note: For production, use a more efficient approach
END //

DELIMITER ;
```

## Best Practices

1. **Performance**: Run `award_badges()` during low-traffic hours for large datasets
2. **Monitoring**: Track badge award rates to detect anomalies
3. **Display**: Show badge progress to motivate partners
4. **Notifications**: Consider sending notifications when partners earn new badges
5. **Gamification**: Use badges to create partner engagement programs

## Troubleshooting

### Badges Not Awarding

Check if stored procedure exists:
```sql
SHOW PROCEDURE STATUS WHERE Name = 'award_badges';
```

Manually test badge criteria:
```sql
SELECT 
    c.partner_id,
    SUM(t.commission) as total_commissions
FROM clients c
LEFT JOIN trades t ON c.customer_id = t.customer_id
GROUP BY c.partner_id;
```

### Duplicate Badge Awards

The UNIQUE constraint on (partner_id, badge_id) prevents duplicates.
If you see duplicates, check the constraint:
```sql
SHOW CREATE TABLE partner_badges;
```

### Performance Issues

For large datasets, consider:
1. Running `award_badges()` in batches
2. Creating indexes on calculated fields
3. Using materialized views for totals
4. Caching badge calculations
