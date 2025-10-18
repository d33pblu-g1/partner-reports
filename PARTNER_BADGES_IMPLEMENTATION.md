# Partner Badges Implementation Guide

## Overview
A complete badge tracking system has been implemented to link partners with the badges they have earned.

## Database Structure

### partner_badges Table
```sql
CREATE TABLE partner_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id VARCHAR(20) NOT NULL,
    badge_name VARCHAR(50) NOT NULL,
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE CASCADE,
    UNIQUE KEY unique_partner_badge (partner_id, badge_name),
    INDEX idx_partner_id (partner_id),
    INDEX idx_badge_name (badge_name)
);
```

### Key Features
- **Simple Design**: Stores only `partner_id` and `badge_name`
- **Badge Logic**: If a row exists with both IDs → Badge earned, else → Not earned
- **Unique Constraint**: Prevents duplicate badge assignments
- **Foreign Keys**: Ensures data integrity

## Badge Types (from badges table)

### Commission Badges
- `com1` - $1 in commissions
- `com10` - $10 in commissions
- `com100` - $100 in commissions
- `com1k` - $1,000 in commissions
- `com10k` - $10,000 in commissions
- `com100k` - $100,000 in commissions

### Deposit Badges
- `dep1` - $1 in deposits
- `dep10` - $10 in deposits
- `dep100` - $100 in deposits
- `dep1k` - $1,000 in deposits
- `dep10k` - $10,000 in deposits
- `dep100k` - $100,000 in deposits

## Current Data

### Population Statistics
- **Total badge assignments**: 16
- **Partners with badges**: 3 (100% of partners)
- **Average badges per partner**: 5.33
- **Most earned badges**: 
  - dep1 (100% - all 3 partners)
  - com1, com10, com10k, dep10 (66.7% - 2 partners each)

### Sample Partner Badge Assignments
```
Mirza (162153):
  - com1, com100, dep1 (3 badges)

Apex Affiliates (P-0001):
  - com1, com10, com100k, com10k, dep1, dep10 (6 badges)

BrightReach Media (P-0002):
  - com10, com10k, com1k, dep1, dep10, dep100, dep100k (7 badges)
```

## Database Page

### Visible Tables
The database page now displays **all 7 tables**:
1. **Partners** - Partner information
2. **Clients** - Client records
3. **Trades** - Trading transactions
4. **Deposits** - Deposit records
5. **Badges** - Available badge definitions
6. **Partner Badges** - Partner-badge assignments (NEW)
7. **Partner Tiers** - Tier definitions

### Features Per Table
- Pagination dropdown (25, 50, 75, 100, All)
- Record count display
- CRUD operations (Add, Edit, Delete)
- Searchable and sortable
- Responsive design

## Badges Page (Badge Cabinet)

### Location
`tiers-badges.html` → Badges Gallery section

### How It Works
1. Partner selects their ID from dropdown
2. API fetches badge progress: `/api/index.php?endpoint=badges&action=progress&partner_id=X`
3. Returns all 12 badges with earned status
4. Gallery displays:
   - **Earned badges**: Full color, 100% opacity, highlighted border
   - **Unearned badges**: Grayscale, 30% opacity, faded

### Visual Design
- Badge cards arranged in grid
- Commission badges section (gold theme)
- Deposit badges section (blue theme)
- Progress bars for each badge
- Total earned count and percentage

## API Endpoints

### 1. Get All Tables
```
GET /api/index.php?endpoint=all_tables
```
Returns all database tables for the database page.

### 2. Get Partner Badges
```
GET /api/index.php?endpoint=badges&action=partner&partner_id=162153
```
Returns badges earned by a specific partner.

### 3. Get Badge Progress
```
GET /api/index.php?endpoint=badges&action=progress&partner_id=162153
```
Returns all badges with progress information for a partner.

**Response Format**:
```json
{
  "success": true,
  "data": {
    "partner_id": "162153",
    "total_commissions": 12500.50,
    "total_deposits": 5000.00,
    "badges": [
      {
        "badge_id": 1,
        "badge_name": "com1",
        "badge_criteria": "commissions",
        "badge_trigger": "$1",
        "trigger_amount": 1,
        "current_amount": 12500.50,
        "progress_percent": 100,
        "earned": true,
        "remaining": 0
      },
      ...
    ]
  }
}
```

### 4. Get Badge Summary
```
GET /api/index.php?endpoint=badges&action=summary
```
Returns overall badge statistics.

## SQL Queries

### Check if Partner Has Earned a Badge
```sql
SELECT * FROM partner_badges 
WHERE partner_id = '162153' 
AND badge_name = 'com1';
```

### Get All Badges for a Partner
```sql
SELECT 
    pb.badge_name,
    b.badge_criteria,
    b.badge_trigger,
    pb.earned_date
FROM partner_badges pb
JOIN badges b ON pb.badge_name = b.badge_name
WHERE pb.partner_id = '162153'
ORDER BY b.badge_criteria, b.badge_name;
```

### Award a Badge to a Partner
```sql
INSERT INTO partner_badges (partner_id, badge_name)
VALUES ('162153', 'com1')
ON DUPLICATE KEY UPDATE earned_date = CURRENT_TIMESTAMP;
```

### Remove a Badge from a Partner
```sql
DELETE FROM partner_badges
WHERE partner_id = '162153' 
AND badge_name = 'com1';
```

### Get Badge Distribution
```sql
SELECT 
    badge_name,
    COUNT(*) as partners_earned,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM partners), 1), '%') as percentage
FROM partner_badges
GROUP BY badge_name
ORDER BY partners_earned DESC;
```

### Find Partners Without Any Badges
```sql
SELECT p.partner_id, p.name
FROM partners p
LEFT JOIN partner_badges pb ON p.partner_id = pb.partner_id
WHERE pb.partner_id IS NULL;
```

## Dummy Data Generation

The table was populated with random dummy data:
- 40% chance of earning each badge
- Higher probability for entry-level badges (com1, dep1)
- Realistic distribution across partners

To regenerate random data:
```bash
mysql -u root partner_report < create_partner_badges_simple.sql
```

## Files Created/Modified

### New Files
1. `create_partner_badges_simple.sql` - Table creation and population
2. `api/endpoints/all_tables.php` - Fetch all tables endpoint
3. `PARTNER_BADGES_IMPLEMENTATION.md` - This documentation

### Modified Files
1. `api/index.php` - Added all_tables route
2. `api/endpoints/badges.php` - Updated to use badge_name instead of badge_id
3. `database.html` - Now fetches and displays all 7 tables
4. `database-crud.js` - Already has pagination for all tables

## Testing

### Verify Table Structure
```sql
DESCRIBE partner_badges;
```

### Verify Data
```sql
SELECT COUNT(*) FROM partner_badges;
SELECT * FROM partner_badges LIMIT 10;
```

### Test API
```bash
# Get all tables
curl http://localhost:8000/api/index.php?endpoint=all_tables

# Get partner badges
curl http://localhost:8000/api/index.php?endpoint=badges&action=partner&partner_id=162153

# Get badge progress
curl http://localhost:8000/api/index.php?endpoint=badges&action=progress&partner_id=162153
```

### Test Badge Cabinet
1. Open `http://localhost:8000/tiers-badges.html`
2. Select a partner from dropdown
3. Verify:
   - Earned badges are highlighted (full color)
   - Unearned badges are faded (grayscale)
   - Progress bars show correct percentages
   - Total earned count is accurate

## Future Enhancements

### Potential Features
1. **Auto-Award System**: Automatically award badges based on actual commission/deposit totals
2. **Badge Levels**: Bronze, Silver, Gold variants of each badge
3. **Time-Based Badges**: Monthly/quarterly achievement badges
4. **Leaderboards**: Show top badge earners
5. **Notifications**: Alert partners when they earn new badges
6. **Badge History**: Track when each badge was earned
7. **Revoke Badges**: Admin ability to remove badges
8. **Special Badges**: One-time achievement badges for milestones

### Database Optimizations
- Add indexes on commonly queried columns
- Create materialized views for badge statistics
- Implement caching for badge progress calculations

## Troubleshooting

### Badge Not Showing as Earned
1. Check partner_badges table:
   ```sql
   SELECT * FROM partner_badges WHERE partner_id = 'X' AND badge_name = 'Y';
   ```
2. Verify badge_name spelling matches badges table
3. Clear browser cache and reload page

### API Returns Empty Data
1. Verify MySQL server is running
2. Check PHP server is running on port 8000
3. Review browser console for errors
4. Check API endpoint returns valid JSON

### Database Page Not Loading
1. Verify all_tables endpoint is accessible
2. Check for JavaScript errors in console
3. Ensure database-crud.js is loaded
4. Verify MySQL connection in api/config.php

## Support

For issues or questions about the badge system:
1. Check console logs for errors
2. Verify database structure matches schema
3. Test API endpoints directly
4. Review this documentation for examples

