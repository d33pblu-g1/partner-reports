# Partner Table - New Fields Guide

## Overview
Two new fields have been added to the `partners` table to track additional partner information.

## New Fields

### 1. Country_Rank
- **Type**: INT (Integer)
- **Nullable**: Yes
- **Description**: Represents the partner's ranking within their country
- **Usage**: Track and display partner performance rankings by country
- **Example Values**: 1, 2, 3, etc. (1 being the top-ranked partner)

### 2. Alternate_Accounts
- **Type**: TEXT
- **Nullable**: Yes
- **Description**: Stores alternate account identifiers associated with the partner
- **Format**: Comma-separated values for multiple accounts
- **Usage**: Track multiple trading accounts or alternate IDs linked to the same partner
- **Example Values**: 
  - Single account: `"CR123456"`
  - Multiple accounts: `"CR123456,CR789012,CR456789"`

## Database Schema Updates

### Table Structure
```sql
CREATE TABLE partners (
    partner_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(50),
    Country_Rank INT,
    Alternate_Accounts TEXT,
    join_date DATE,
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_country_rank (Country_Rank)
);
```

### Index
- An index has been created on `Country_Rank` for optimized query performance when filtering or sorting by rank.

## API Integration

### Endpoints Updated
The following API endpoints now support the new fields:

#### GET `/api/partners`
Returns all partners including `Country_Rank` and `Alternate_Accounts` fields.

#### GET `/api/partners?id={partner_id}`
Returns a single partner including the new fields.

#### POST `/api/partners`
Create a new partner with optional `Country_Rank` and `Alternate_Accounts`:
```json
{
  "partner_id": "162153",
  "name": "John Doe",
  "tier": "Gold",
  "Country_Rank": 5,
  "Alternate_Accounts": "CR123456,CR789012"
}
```

#### PUT `/api/partners?id={partner_id}`
Update partner information including the new fields:
```json
{
  "name": "John Doe",
  "tier": "Platinum",
  "Country_Rank": 3,
  "Alternate_Accounts": "CR123456,CR789012,CR456789"
}
```

### Field Name Flexibility
The API accepts both camelCase and PascalCase variations:
- `Country_Rank` or `country_rank`
- `Alternate_Accounts` or `alternate_accounts`

## Usage Examples

### Update Partner Rank
```sql
UPDATE partners 
SET Country_Rank = 1 
WHERE partner_id = '162153';
```

### Add Alternate Accounts
```sql
UPDATE partners 
SET Alternate_Accounts = 'CR123456,CR789012,CR456789' 
WHERE partner_id = '162153';
```

### Query Partners by Rank
```sql
-- Get top 10 ranked partners
SELECT partner_id, name, Country_Rank 
FROM partners 
WHERE Country_Rank IS NOT NULL 
ORDER BY Country_Rank ASC 
LIMIT 10;
```

### Parse Alternate Accounts
```sql
-- Find partners with specific alternate account
SELECT partner_id, name, Alternate_Accounts 
FROM partners 
WHERE Alternate_Accounts LIKE '%CR123456%';
```

## Frontend Integration

### Display in Partner Dropdowns
The fields are automatically included in API responses and can be displayed:
- Show rank badge next to partner name
- Display alternate accounts in partner details
- Filter/sort partners by rank

### Example Display Format
```
Partner: John Doe (Gold) [Rank #5]
Alternate Accounts: CR123456, CR789012
```

## Data Migration
If you need to populate these fields with existing data:

```sql
-- Example: Set ranks based on total client count
SET @rank := 0;
UPDATE partners p
LEFT JOIN (
  SELECT partnerId, COUNT(*) as client_count
  FROM clients
  GROUP BY partnerId
) c ON p.partner_id = c.partnerId
SET p.Country_Rank = (@rank := @rank + 1)
ORDER BY c.client_count DESC;
```

## Notes
- Both fields are optional (nullable)
- `Country_Rank` should be unique per country (not enforced at database level)
- `Alternate_Accounts` uses TEXT type to accommodate variable numbers of accounts
- Consider implementing application-level validation for:
  - Rank uniqueness within countries
  - Alternate account format validation
  - Duplicate alternate account prevention

## Files Modified
1. `database_schema.sql` - Updated schema definition
2. `add_partner_columns.sql` - Migration script
3. `api/endpoints/partners.php` - API endpoint updates
4. Database table structure (executed via MySQL)

## Verification
To verify the changes were applied:
```sql
DESCRIBE partners;
```

Expected output should include:
- `Country_Rank` (int, YES, MUL)
- `Alternate_Accounts` (text, YES)

