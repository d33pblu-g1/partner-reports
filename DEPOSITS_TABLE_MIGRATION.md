# Deposits Table Migration Guide

## Overview
The deposits table has been completely rebuilt using data from `deposits1.csv` with a new structure containing 21 columns for comprehensive deposit tracking.

## Migration Summary

### What Changed
- **Old Table**: Simple 4-column structure (id, binary_user_id, date_time, value)
- **New Table**: Rich 21-column structure from deposits1.csv
- **Records**: 1,624 deposit transactions imported
- **Source**: `/Users/michalisphytides/Downloads/deposits1.csv`

### Column Mapping

#### Key Identifiers
| Old Column | New Column | Type | Description |
|------------|------------|------|-------------|
| binary_user_id | binary_user_id_1 | VARCHAR(50) | User identifier |
| - | transaction_id | VARCHAR(50) | Unique transaction ID |
| - | payment_id | VARCHAR(50) | Payment system ID |

#### Transaction Details
| Old Column | New Column | Type | Description |
|------------|------------|------|-------------|
| date_time | transaction_time | DATETIME | Transaction timestamp |
| value | amount_usd | DECIMAL(15,2) | Amount in USD |
| - | amount | DECIMAL(15,2) | Original amount |
| - | currency_code | VARCHAR(10) | Currency (USD, EUR, etc.) |

#### Payment Information
| New Column | Type | Description |
|------------|------|-------------|
| payment_gateway_code | VARCHAR(100) | Gateway used |
| payment_type_code | VARCHAR(100) | Type of payment |
| payment_processor | VARCHAR(100) | Processing service |
| payment_method | VARCHAR(100) | Method (e.g., easypaisa) |

#### Account Information
| New Column | Type | Description |
|------------|------|-------------|
| account_id | VARCHAR(50) | Account identifier |
| client_loginid | VARCHAR(50) | Client login ID (e.g., CR9122580) |
| affiliate_id | VARCHAR(50) | Partner/affiliate ID |

#### Additional Metadata
| New Column | Type | Description |
|------------|------|-------------|
| remark | TEXT | Transaction description/notes |
| transfer_fees | DECIMAL(15,2) | Fee amount |
| is_pa | VARCHAR(10) | Payment agent flag (TRUE/FALSE) |
| transfer_type | VARCHAR(100) | Type of transfer |
| category | VARCHAR(100) | Transaction category |
| target_loginid | VARCHAR(50) | Target account for transfers |
| target_is_pa | VARCHAR(10) | Target is payment agent flag |

## New Table Structure

```sql
CREATE TABLE deposits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    binary_user_id_1 VARCHAR(50),
    transaction_id VARCHAR(50),
    payment_id VARCHAR(50),
    currency_code VARCHAR(10),
    transaction_time DATETIME,
    amount DECIMAL(15,2),
    payment_gateway_code VARCHAR(100),
    payment_type_code VARCHAR(100),
    account_id VARCHAR(50),
    client_loginid VARCHAR(50),
    remark TEXT,
    transfer_fees DECIMAL(15,2),
    is_pa VARCHAR(10),
    amount_usd DECIMAL(15,2),
    transfer_type VARCHAR(100),
    category VARCHAR(100),
    payment_processor VARCHAR(100),
    payment_method VARCHAR(100),
    affiliate_id VARCHAR(50),
    target_loginid VARCHAR(50),
    target_is_pa VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_binary_user_id (binary_user_id_1),
    INDEX idx_affiliate_id (affiliate_id),
    INDEX idx_transaction_time (transaction_time),
    INDEX idx_category (category)
);
```

## Sample Data

### Example Deposit Record
```json
{
  "id": 1,
  "binary_user_id_1": "17856444",
  "transaction_id": "137913658121",
  "payment_id": "4825035101",
  "currency_code": "USD",
  "transaction_time": "2025-07-01 03:33:11",
  "amount": 50.50,
  "amount_usd": 50.50,
  "payment_gateway_code": "payment_agent_transfer",
  "payment_type_code": "internal_transfer",
  "account_id": "177947681",
  "client_loginid": "CR9122580",
  "remark": "Transfer from Payment Agent Mirza Exchange Services...",
  "transfer_fees": null,
  "is_pa": "FALSE",
  "transfer_type": "From PA To Client (Credit)",
  "category": "Client Deposit",
  "payment_processor": "Back Office",
  "payment_method": null,
  "affiliate_id": "162153",
  "target_loginid": "CR2010135",
  "target_is_pa": "TRUE"
}
```

## API Endpoints Updated

### 1. all_tables.php
**Changes**:
- ORDER BY `transaction_time` (was `date_time`)
- Handles load_all parameter for unlimited records

**Query**:
```php
SELECT * FROM deposits ORDER BY transaction_time DESC LIMIT 1000
```

### 2. badges.php
**Changes**:
- JOIN on `binary_user_id_1` (was `binary_user_id`)
- SUM `amount_usd` (was `value`)
- Filter by `affiliate_id` for partner matching

**Query**:
```php
SELECT COALESCE(SUM(d.amount_usd), 0) as total_deposits
FROM clients c
LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1
WHERE c.partnerId = ? AND d.affiliate_id = ?
```

### 3. dashboard.php
**Changes**:
- JOIN on `binary_user_id_1`
- ORDER BY `transaction_time`

**Query**:
```php
SELECT * FROM deposits 
WHERE binary_user_id_1 IN (?)
ORDER BY transaction_time DESC
```

### 4. metrics.php
**Changes**:
- Updated lifetime and monthly metrics
- SUM `amount_usd` instead of `value`
- DATE_FORMAT on `transaction_time`
- JOIN on `binary_user_id_1`

**Queries**:
```php
// Lifetime
SELECT COALESCE(SUM(c.lifetimeDeposits), 0) as total_deposits
FROM clients c

// Monthly
SELECT COALESCE(SUM(d.amount_usd), 0) as month_deposits
FROM clients c
LEFT JOIN deposits d ON c.binary_user_id = d.binary_user_id_1
  AND DATE_FORMAT(d.transaction_time, '%Y-%m') = ?
```

## Frontend Updates

### database-crud.js
**Updated Schema**:
```javascript
deposits: {
  primaryKey: 'id',
  fields: [
    { name: 'id', type: 'number', label: 'ID' },
    { name: 'binary_user_id_1', type: 'text', label: 'Binary User ID' },
    { name: 'transaction_id', type: 'text', label: 'Transaction ID' },
    { name: 'payment_id', type: 'text', label: 'Payment ID' },
    { name: 'currency_code', type: 'text', label: 'Currency' },
    { name: 'transaction_time', type: 'datetime-local', label: 'Transaction Time' },
    { name: 'amount', type: 'number', label: 'Amount' },
    { name: 'amount_usd', type: 'number', label: 'Amount USD' },
    { name: 'category', type: 'text', label: 'Category' },
    { name: 'affiliate_id', type: 'text', label: 'Affiliate ID' }
  ]
}
```

## Migration Process

### Step 1: Generate Schema
```bash
python3 create_deposits_from_csv.py > create_deposits_table.sql
```

### Step 2: Drop and Create Table
```bash
mysql -u root partner_report < create_deposits_table.sql
```

### Step 3: Import Data
```bash
python3 import_deposits.py
```

**Output**:
```
Starting CSV import...
Imported 1000 rows...
✓ Import complete!
Total rows imported: 1624
Errors encountered: 0
Total rows in deposits table: 1624
```

## Verification Queries

### Check Table Structure
```sql
DESCRIBE deposits;
```

### Verify Record Count
```sql
SELECT COUNT(*) FROM deposits;
-- Expected: 1624
```

### Check by Affiliate
```sql
SELECT 
    affiliate_id,
    COUNT(*) as deposits,
    SUM(amount_usd) as total_usd
FROM deposits
GROUP BY affiliate_id
ORDER BY total_usd DESC;
```

### Sample Data
```sql
SELECT * FROM deposits LIMIT 5;
```

### Check Payment Methods
```sql
SELECT 
    payment_method,
    COUNT(*) as count,
    SUM(amount_usd) as total
FROM deposits
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY count DESC;
```

### Check Categories
```sql
SELECT 
    category,
    COUNT(*) as count,
    SUM(amount_usd) as total
FROM deposits
GROUP BY category
ORDER BY total DESC;
```

## Benefits of New Structure

### 1. Enhanced Tracking
- Full transaction history with IDs
- Payment method and processor visibility
- Fee tracking for reconciliation

### 2. Better Reporting
- Categorized transactions
- Payment agent identification
- Transfer type classification

### 3. Improved Analytics
- Gateway performance analysis
- Payment method preferences
- Fee analysis
- Category-based insights

### 4. Partner Attribution
- Direct affiliate_id linking
- Target account tracking
- PA flag identification

### 5. Audit Trail
- Complete transaction remarks
- Timestamp precision
- Reference IDs for lookup

## Common Queries

### Deposits by Partner
```sql
SELECT 
    affiliate_id,
    COUNT(*) as transactions,
    SUM(amount_usd) as total_deposits,
    AVG(amount_usd) as avg_deposit
FROM deposits
WHERE affiliate_id = '162153'
GROUP BY affiliate_id;
```

### Payment Method Analysis
```sql
SELECT 
    payment_method,
    payment_processor,
    COUNT(*) as transactions,
    SUM(amount_usd) as volume
FROM deposits
WHERE payment_method IS NOT NULL
GROUP BY payment_method, payment_processor
ORDER BY volume DESC;
```

### Category Breakdown
```sql
SELECT 
    category,
    COUNT(*) as count,
    SUM(amount_usd) as total,
    MIN(amount_usd) as min_amount,
    MAX(amount_usd) as max_amount,
    AVG(amount_usd) as avg_amount
FROM deposits
GROUP BY category
ORDER BY total DESC;
```

### Recent Deposits
```sql
SELECT 
    transaction_time,
    client_loginid,
    amount_usd,
    category,
    payment_method
FROM deposits
ORDER BY transaction_time DESC
LIMIT 20;
```

### Payment Agent Deposits
```sql
SELECT 
    is_pa,
    COUNT(*) as count,
    SUM(amount_usd) as total
FROM deposits
GROUP BY is_pa;
```

## Troubleshooting

### Issue: No deposits showing
**Check**: Verify binary_user_id_1 matches client records
```sql
SELECT DISTINCT d.binary_user_id_1
FROM deposits d
LEFT JOIN clients c ON d.binary_user_id_1 = c.binary_user_id
WHERE c.binary_user_id IS NULL;
```

### Issue: Wrong totals in badges
**Check**: Verify affiliate_id filter
```sql
SELECT 
    affiliate_id,
    COUNT(*) as deposits,
    SUM(amount_usd) as total
FROM deposits
WHERE affiliate_id = '162153';
```

### Issue: Date filtering not working
**Check**: transaction_time format
```sql
SELECT 
    DATE_FORMAT(transaction_time, '%Y-%m') as month,
    COUNT(*) as count
FROM deposits
GROUP BY month
ORDER BY month DESC;
```

## Migration Files

1. **create_deposits_from_csv.py** - Schema generator
2. **create_deposits_table.sql** - DDL script  
3. **import_deposits.py** - Data import script
4. **DEPOSITS_TABLE_MIGRATION.md** - This documentation

## Notes

- No foreign key constraints (external data source)
- All API endpoints have been updated
- Database CRUD interface updated
- All queries tested and working
- 1,624 records successfully imported
- Zero import errors

## Support

For issues with the new deposits table:
1. Check column names in queries (binary_user_id_1, transaction_time, amount_usd)
2. Verify affiliate_id for partner filtering
3. Review API endpoint updates
4. Check browser console for errors
5. Verify MySQL connection

