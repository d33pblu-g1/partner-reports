# Symbols Import Guide

## Overview
This guide explains how to import trading symbols from the CSV file into the MySQL database.

## Files Created

1. **`symbols_table.sql`** - Creates the symbols table schema
2. **`symbols_data.sql`** - Contains INSERT statements for all 6,494 symbols (Generated)
3. **`import_symbols.py`** - Python script for direct database import (requires MySQL running)
4. **`generate_symbols_sql.py`** - Generates SQL file from CSV

## Database Schema

The `symbols` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Auto-increment primary key |
| `platform` | VARCHAR(50) | Trading platform (DerivX, MT5, cTrader, BO, etc.) |
| `symbol` | VARCHAR(100) | Symbol code on the platform |
| `unified_symbol` | VARCHAR(100) | Standardized symbol name |
| `unified_asset_type` | VARCHAR(100) | Asset type (Commodities, Forex, Stocks, etc.) |
| `unified_asset_sub_type` | VARCHAR(100) | Asset subtype (Energies, Metals, etc.) |
| `unified_category` | VARCHAR(50) | Category (Financial, Synthetic) |
| `platform_symbol_unified_symbol` | VARCHAR(200) | Combined identifier |
| `duplicate_check` | TINYINT | Flag for duplicate detection |
| `validation_check` | TINYINT | Flag for validation status |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Record update time |

### Indexes
- Primary key on `id`
- Index on `platform`
- Index on `symbol`
- Index on `unified_symbol`
- Index on `unified_asset_type`
- Index on `unified_category`
- **Unique constraint** on `(platform, symbol)` combination

## Import Steps

### Step 1: Create the Table

```bash
mysql -u root -p partner_report < symbols_table.sql
```

This creates the `symbols` table with all necessary indexes and constraints.

### Step 2: Import the Data

#### Option A: Using Generated SQL File (Recommended)

```bash
mysql -u root -p partner_report < symbols_data.sql
```

This imports all 6,494 symbols in optimized batch inserts.

**Import time:** Approximately 30-60 seconds depending on your MySQL configuration.

#### Option B: Using Python Script (Direct Import)

```bash
python3 import_symbols.py
```

This requires:
- MySQL server running
- `mysql-connector-python` installed: `pip3 install mysql-connector-python`
- Database credentials configured in the script

**Advantages:**
- Shows real-time progress
- Provides detailed statistics after import
- Handles errors gracefully

### Step 3: Verify Import

```sql
-- Check total count
SELECT COUNT(*) FROM symbols;
-- Expected: 6494

-- Count by platform
SELECT platform, COUNT(*) as count 
FROM symbols 
GROUP BY platform 
ORDER BY count DESC;

-- Count by asset type
SELECT unified_asset_type, COUNT(*) as count 
FROM symbols 
WHERE unified_asset_type IS NOT NULL 
GROUP BY unified_asset_type 
ORDER BY count DESC;

-- Count by category
SELECT unified_category, COUNT(*) as count 
FROM symbols 
WHERE unified_category IS NOT NULL 
GROUP BY unified_category 
ORDER BY count DESC;

-- Sample records
SELECT * FROM symbols LIMIT 10;
```

## Data Statistics

Based on the imported CSV:

### Total Symbols: **6,494**

### Platforms:
The symbols are distributed across multiple trading platforms:
- **MT5** (MetaTrader 5)
- **DerivX**
- **cTrader**
- **BO** (Binary Options)
- And others

### Asset Categories:
- **Financial** - Real market instruments (forex, commodities, stocks)
- **Synthetic** - Derived indices and synthetic instruments

### Asset Types Include:
- Commodities (Energies, Metals, Soft Agricultural, etc.)
- Forex (Major, Minor, Exotic pairs)
- Cryptocurrencies
- Stocks & ETFs
- Derived Indices (Volatility Indices, Basket Indices, etc.)

## Usage Examples

### Find all symbols for a specific platform:
```sql
SELECT symbol, unified_symbol, unified_asset_type 
FROM symbols 
WHERE platform = 'MT5'
ORDER BY symbol;
```

### Find all cryptocurrency symbols:
```sql
SELECT platform, symbol, unified_symbol 
FROM symbols 
WHERE unified_asset_type LIKE '%Crypto%'
ORDER BY platform, symbol;
```

### Find all volatility indices:
```sql
SELECT platform, symbol, unified_symbol 
FROM symbols 
WHERE unified_asset_sub_type LIKE '%Volatility%'
ORDER BY symbol;
```

### Search for a specific symbol across platforms:
```sql
SELECT platform, symbol, unified_symbol, unified_asset_type 
FROM symbols 
WHERE unified_symbol LIKE '%Bitcoin%'
ORDER BY platform;
```

### Get unique asset types:
```sql
SELECT DISTINCT unified_asset_type 
FROM symbols 
WHERE unified_asset_type IS NOT NULL 
ORDER BY unified_asset_type;
```

## Integration with Partner Report

### Adding Symbol Filter to Commissions Page

You can enhance the commissions page to filter by symbol:

```php
// In api/endpoints/commissions.php or similar
$symbol = $_GET['symbol'] ?? null;

if ($symbol) {
    $whereClause .= " AND t.symbol = ?";
    $params[] = $symbol;
}
```

### Creating a Symbols API Endpoint

Create `api/endpoints/symbols.php`:

```php
<?php
require_once __DIR__ . '/../config.php';

$db = getDB();

try {
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            $platform = $_GET['platform'] ?? null;
            $category = $_GET['category'] ?? null;
            
            $sql = "SELECT * FROM symbols WHERE 1=1";
            $params = [];
            
            if ($platform) {
                $sql .= " AND platform = ?";
                $params[] = $platform;
            }
            
            if ($category) {
                $sql .= " AND unified_category = ?";
                $params[] = $category;
            }
            
            $sql .= " ORDER BY symbol LIMIT 1000";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            echo json_encode(ApiResponse::success($stmt->fetchAll()));
            break;
            
        case 'platforms':
            $stmt = $db->query("SELECT DISTINCT platform FROM symbols ORDER BY platform");
            echo json_encode(ApiResponse::success($stmt->fetchAll(PDO::FETCH_COLUMN)));
            break;
            
        case 'search':
            $query = $_GET['q'] ?? '';
            if (strlen($query) < 2) {
                echo json_encode(ApiResponse::error('Query too short', 400));
                break;
            }
            
            $stmt = $db->prepare("
                SELECT * FROM symbols 
                WHERE symbol LIKE ? OR unified_symbol LIKE ?
                ORDER BY symbol 
                LIMIT 50
            ");
            $searchTerm = "%{$query}%";
            $stmt->execute([$searchTerm, $searchTerm]);
            echo json_encode(ApiResponse::success($stmt->fetchAll()));
            break;
    }
} catch (Exception $e) {
    echo json_encode(ApiResponse::error($e->getMessage(), 500));
}
?>
```

## Maintenance

### Re-importing Updated Data

If you receive an updated symbols.csv file:

1. **Generate new SQL:**
   ```bash
   python3 generate_symbols_sql.py
   ```

2. **Clear existing data (optional):**
   ```sql
   TRUNCATE TABLE symbols;
   ```

3. **Import new data:**
   ```bash
   mysql -u root -p partner_report < symbols_data.sql
   ```

### Backup Symbols Table

```bash
mysqldump -u root -p partner_report symbols > symbols_backup.sql
```

### Performance Optimization

If queries are slow, consider adding more indexes:

```sql
-- Index for symbol searches
CREATE INDEX idx_symbol_search ON symbols(symbol(20));

-- Index for unified symbol searches  
CREATE INDEX idx_unified_search ON symbols(unified_symbol(20));

-- Composite index for common queries
CREATE INDEX idx_platform_category ON symbols(platform, unified_category);
```

## Troubleshooting

### Error: "Duplicate entry"
**Cause:** Symbol already exists for that platform.
**Solution:** The import uses `ON DUPLICATE KEY UPDATE`, so this shouldn't occur. If it does, check for data inconsistencies in the CSV.

### Error: "Data too long for column"
**Cause:** CSV data exceeds column length.
**Solution:** Increase column size in `symbols_table.sql` and recreate table.

### Slow Import
**Cause:** Large dataset with indexes enabled.
**Solution:** The generated SQL already disables checks during import for speed.

## Next Steps

1. ✅ Create symbols table
2. ✅ Import symbols data
3. ✅ Verify import
4. 🔜 Create symbols API endpoint
5. 🔜 Add symbol filtering to existing pages
6. 🔜 Create symbols search functionality

## Files Summary

- ✅ `symbols_table.sql` - Table schema (19 lines)
- ✅ `symbols_data.sql` - Data import (Generated, ~65,000+ lines)
- ✅ `import_symbols.py` - Direct import script (172 lines)
- ✅ `generate_symbols_sql.py` - SQL generator (113 lines)
- ✅ `SYMBOLS_IMPORT.md` - This documentation

