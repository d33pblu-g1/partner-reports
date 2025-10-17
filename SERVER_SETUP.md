# Server Setup Guide

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache, Nginx, or PHP built-in server)

## Running the Application

### Option 1: PHP Built-in Server (Recommended for Development)

The easiest way to run the application is using PHP's built-in web server:

```bash
# Navigate to project directory
cd /Users/michalisphytides/Desktop/partner-report

# Start PHP server on port 8000
php -S localhost:8000
```

Then open your browser to: `http://localhost:8000`

### Option 2: Apache Server

If you have Apache with PHP installed:

1. Copy the project to your Apache document root (e.g., `/var/www/html/` or `/Applications/MAMP/htdocs/`)
2. Ensure `.htaccess` file is present (already created)
3. Enable `mod_rewrite` in Apache configuration
4. Access via: `http://localhost/partner-report/`

### Option 3: Nginx

For Nginx, add this location block to your server configuration:

```nginx
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
}
```

## Database Configuration

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE partner_report;
   ```

2. **Configure Database Connection:**
   Edit `api/config.php` and update:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'partner_report');
   define('DB_USER', 'root');
   define('DB_PASS', 'your_password_here');
   ```

3. **Import Schema:**
   ```bash
   mysql -u root -p partner_report < database_schema.sql
   ```

4. **Import Badges Table:**
   ```bash
   mysql -u root -p partner_report < badges_table.sql
   ```

5. **Import Data Cubes (Optional but Recommended):**
   ```bash
   mysql -u root -p partner_report < database_cubes.sql
   ```

6. **Migrate Data from JSON:**
   ```bash
   python3 migrate_to_mysql.py
   ```

## Testing the API

Once the server is running, test the API endpoints:

### Test Dashboard API:
```bash
curl http://localhost:8000/api/index.php?endpoint=dashboard
```

### Test Commissions API:
```bash
curl "http://localhost:8000/api/index.php?endpoint=commissions&chart=stacked&period_type=daily&limit=30"
```

### Test Badges API:
```bash
curl "http://localhost:8000/api/index.php?endpoint=badges&action=list"
```

### Test Partner-Specific Badges:
```bash
curl "http://localhost:8000/api/index.php?endpoint=badges&action=progress&partner_id=P-0001"
```

## Common Issues

### Issue: "Failed to load chart data"

**Cause:** API endpoint not accessible or database not configured.

**Solution:**
1. Verify PHP server is running
2. Check database connection in `api/config.php`
3. Ensure database tables are created and populated
4. Check browser console for exact error message

### Issue: 404 on API calls

**Cause:** Incorrect URL or missing URL rewriting.

**Solution:**
- Use direct access: `api/index.php?endpoint=commissions`
- Or configure URL rewriting properly

### Issue: Database connection failed

**Cause:** Incorrect credentials or MySQL not running.

**Solution:**
1. Verify MySQL is running: `mysql -u root -p`
2. Update credentials in `api/config.php`
3. Ensure database exists: `SHOW DATABASES;`

### Issue: Empty charts

**Cause:** No data in database.

**Solution:**
1. Run migration script: `python3 migrate_to_mysql.py`
2. Verify data: `SELECT COUNT(*) FROM trades;`
3. Check date ranges match your data

## Development vs Production

### Development (Current Setup)
- Error reporting enabled
- CORS set to `*` (allow all)
- Direct file access allowed

### Production Changes Needed
1. **Disable error display:**
   ```php
   error_reporting(0);
   ini_set('display_errors', 0);
   ```

2. **Restrict CORS:**
   ```php
   define('CORS_ORIGIN', 'https://yourdomain.com');
   ```

3. **Use environment variables** for database credentials
4. **Enable HTTPS** for all connections
5. **Restrict file access** in `.htaccess`

## File Structure

```
partner-report/
├── api/
│   ├── index.php           # API router
│   ├── config.php          # Database config
│   └── endpoints/
│       ├── dashboard.php
│       ├── partners.php
│       ├── clients.php
│       ├── trades.php
│       ├── deposits.php
│       ├── metrics.php
│       ├── charts.php
│       ├── commissions.php # Stacked chart data
│       └── badges.php      # Badges data
├── *.html                  # Frontend pages
├── *.js                    # Frontend scripts
├── styles.css              # Styles
├── database_schema.sql     # Main schema
├── badges_table.sql        # Badges schema
├── database_cubes.sql      # Performance optimization
└── migrate_to_mysql.py     # Data migration script
```

## Next Steps

1. Start the PHP server
2. Open `http://localhost:8000` in your browser
3. Select a partner from the dropdown
4. Navigate to different pages to view data
5. Check the Commissions page for the stacked chart
6. Check the Tiers & Badges page for the badge gallery

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check PHP error logs
3. Verify MySQL connection
4. Ensure all files are in place
5. Review the documentation files (*.md)

