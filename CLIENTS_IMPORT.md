# Clients Import Guide

## Overview
This guide explains how to import client data from the CSV file into the MySQL database.

## Files Created

1. **`clients_data.sql`** - Contains INSERT statements for 428 clients (Generated)
2. **`import_clients.py`** - Python script for direct database import (requires MySQL running)
3. **`generate_clients_sql.py`** - Generates SQL file from CSV

## CSV Structure

The CSV file (`clients1.csv`) contains these columns:
- `binary_user_id` → `customer_id` (Primary Key)
- `name` → Client name
- `country` → Country
- `joinDate` → `join_date`
- `account_type` → Account type
- `accountNumber` → `account_number`
- `lifetimeDeposits` → `lifetime_deposits`
- `commissionPlan` → `commission_plan`
- `trackingLinkUsed` → `tracking_link_used`
- `tier` → Client tier
- `sub-partner` → `sub_partner` (boolean)
- `partnerId` → `partner_id` (Foreign Key)
- `email` → Email address
- `preferredLanguage` → `preferred_language`
- `gender` → Gender
- `age` → Age
- `total_trades` → (not imported - calculated from trades table)
- `PNL` → (not imported - calculated from trades table)

## Import Steps

### Step 1: Generate SQL (Already Done ✓)

The SQL file has been generated with 428 client records.

### Step 2: Import into MySQL

When MySQL is running:

```bash
mysql -u root -p partner_report < clients_data.sql
```

This will:
- Insert 428 clients into the database
- Handle duplicates with ON DUPLICATE KEY UPDATE
- Update existing records if customer_id already exists

**Import time:** Approximately 5-10 seconds

### Alternative: Direct Import with Python

If MySQL is running, you can use the Python script:

```bash
python3 import_clients.py
```

**Advantages:**
- Real-time progress tracking
- Detailed statistics after import
- Better error handling

## Data Transformations

### Boolean Fields
- `"TRUE"` → `1`
- `"FALSE"` or empty → `0`

### Date Fields
- Format: `YYYY-MM-DD`
- Invalid dates → `NULL`

### Numeric Fields
- Empty values → `0` or `NULL`
- Non-numeric → `0` or `NULL`

### String Fields
- Single quotes escaped
- Empty strings preserved
- Trimmed whitespace

## Verify Import

After importing, verify the data:

```sql
-- Check total count
SELECT COUNT(*) FROM clients;
-- Expected: 428

-- Check data distribution
SELECT country, COUNT(*) as count 
FROM clients 
GROUP BY country 
ORDER BY count DESC 
LIMIT 10;

-- Check partner associations
SELECT 
    partner_id, 
    COUNT(*) as client_count,
    SUM(lifetime_deposits) as total_deposits
FROM clients 
WHERE partner_id IS NOT NULL
GROUP BY partner_id;

-- Check gender distribution
SELECT gender, COUNT(*) as count 
FROM clients 
WHERE gender IS NOT NULL 
GROUP BY gender;

-- Sample data
SELECT * FROM clients LIMIT 10;
```

## Data Statistics

From the CSV file:

### Total Records: **428 clients**

### Countries
All clients are from: **Pakistan**

### Fields Populated
- ✅ Customer ID (binary_user_id)
- ✅ Name
- ✅ Country
- ✅ Join Date
- ✅ Account Type
- ✅ Account Numbers (multiple accounts per client)
- ✅ Lifetime Deposits
- ✅ Commission Plan (mostly empty)
- ✅ Tracking Link Used (mostly empty)
- ✅ Tier (mostly empty)
- ✅ Sub-partner flag
- ✅ Partner ID (162153)
- ✅ Email
- ✅ Preferred Language
- ✅ Gender
- ✅ Age

### Sample Data
```
Customer ID: 8229311
Name: K*****a Z*****m
Country: Pakistan
Join Date: 2021-04-20
Lifetime Deposits: $1,783,371.62
Gender: male
Age: 68
```

## Important Notes

### Partner ID Reference
- All clients have `partner_id = "162153"`
- This partner must exist in the `partners` table
- If not, the import will fail due to foreign key constraint

### To create the partner if needed:

```sql
INSERT INTO partners (partner_id, name, tier) 
VALUES ('162153', 'Partner 162153', 'Platinum')
ON DUPLICATE KEY UPDATE name = name;
```

### Account Numbers
- Some clients have multiple account numbers
- Stored as semicolon-separated list
- Example: `MTR20583869;MTR41193844;DXD1141530`

### Duplicate Handling
- Uses `ON DUPLICATE KEY UPDATE`
- Updates: name, country, lifetime_deposits, email, gender, age
- Does NOT update: join_date, account details, partner_id

## Troubleshooting

### Error: "Cannot add or update a child row"

**Cause:** Partner ID 162153 doesn't exist in partners table.

**Solution:**
```sql
INSERT INTO partners (partner_id, name, tier) 
VALUES ('162153', 'Default Partner', 'Bronze');
```

### Error: "Data too long for column"

**Cause:** Some account_number values exceed VARCHAR(50).

**Solution:** Increase column size:
```sql
ALTER TABLE clients MODIFY COLUMN account_number TEXT;
```

### Warning: "Incorrect date value"

**Cause:** Invalid date format in CSV.

**Solution:** Script handles this by setting to NULL.

## Post-Import Tasks

### 1. Import Related Data

After importing clients, you may want to import:
- **Trades data** (references customer_id)
- **Deposits data** (references customer_id)

### 2. Calculate Aggregates

Update computed fields:
```sql
-- Update client counts per partner
UPDATE partners p 
SET client_count = (
    SELECT COUNT(*) 
    FROM clients c 
    WHERE c.partner_id = p.partner_id
);
```

### 3. Rebuild Indexes

```sql
ANALYZE TABLE clients;
```

### 4. Update Data Cubes

If you have data cube tables:
```sql
-- Refresh age distribution cube
CALL refresh_age_distribution_cube();

-- Refresh country performance cube
CALL refresh_country_performance_cube();
```

## Data Quality Checks

Run these queries to check data quality:

```sql
-- Check for clients without partner
SELECT COUNT(*) 
FROM clients 
WHERE partner_id IS NULL;

-- Check for invalid email formats
SELECT COUNT(*) 
FROM clients 
WHERE email NOT LIKE '%@%';

-- Check for clients without deposits
SELECT COUNT(*) 
FROM clients 
WHERE lifetime_deposits = 0;

-- Check age distribution
SELECT 
    CASE 
        WHEN age < 18 THEN 'Under 18'
        WHEN age BETWEEN 18 AND 30 THEN '18-30'
        WHEN age BETWEEN 31 AND 50 THEN '31-50'
        WHEN age BETWEEN 51 AND 70 THEN '51-70'
        ELSE 'Over 70'
    END as age_group,
    COUNT(*) as count
FROM clients
WHERE age IS NOT NULL
GROUP BY age_group
ORDER BY age_group;
```

## Re-importing Updated Data

If you receive an updated CSV file:

1. **Generate new SQL:**
   ```bash
   python3 generate_clients_sql.py
   ```

2. **Backup existing data** (optional):
   ```bash
   mysqldump -u root -p partner_report clients > clients_backup.sql
   ```

3. **Import new data:**
   ```bash
   mysql -u root -p partner_report < clients_data.sql
   ```

The `ON DUPLICATE KEY UPDATE` ensures existing clients are updated, not duplicated.

## Files Summary

- ✅ `clients_data.sql` - Generated SQL import file (~43KB)
- ✅ `import_clients.py` - Direct import script
- ✅ `generate_clients_sql.py` - SQL generator script
- ✅ `CLIENTS_IMPORT.md` - This documentation

## Next Steps

1. ✅ Generate SQL file
2. ⏳ Start MySQL server
3. ⏳ Ensure partner 162153 exists
4. ⏳ Import clients_data.sql
5. ⏳ Verify import with sample queries
6. ⏳ Import related trades and deposits data
7. ⏳ Update data cubes and aggregates

