# MySQL Database Setup for Partner Report

## Prerequisites

1. **MySQL Server** (version 5.7 or higher)
2. **PHP** (version 7.4 or higher) with PDO MySQL extension
3. **Web Server** (Apache/Nginx) with PHP support

## Installation Steps

### 1. Install MySQL

**macOS (using Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
Download and install from [MySQL Official Website](https://dev.mysql.com/downloads/mysql/)

### 2. Configure MySQL

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database user (optional, or use root)
mysql -u root -p
```

```sql
CREATE USER 'partner_report'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON partner_report.* TO 'partner_report'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Create Database Schema

```bash
# Run the schema creation script
mysql -u root -p < database_schema.sql
```

Or manually:
```sql
mysql -u root -p
CREATE DATABASE partner_report;
USE partner_report;
SOURCE database_schema.sql;
```

### 4. Migrate Data from JSON

**Update the database configuration in `migrate_to_mysql.py`:**
```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'partner_report',
    'user': 'root',  # or 'partner_report'
    'password': 'your_password',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}
```

**Install Python MySQL connector:**
```bash
pip install mysql-connector-python
```

**Run the migration:**
```bash
python3 migrate_to_mysql.py
```

### 5. Configure PHP API

**Update `api/config.php` with your database credentials:**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'partner_report');
define('DB_USER', 'root');  // or 'partner_report'
define('DB_PASS', 'your_password');
```

### 6. Set Up Web Server

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]
```

**Nginx:**
```nginx
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
}
```

### 7. Test the Setup

1. **Start your web server**
2. **Visit:** `http://localhost:8001/api/partners`
3. **Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "partner_id": "P-0001",
      "name": "Partner Name",
      "tier": "Gold"
    }
  ]
}
```

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Get all dashboard data
- `GET /api/dashboard?partner_id=P-0001` - Get filtered dashboard data

### Partners
- `GET /api/partners` - Get all partners
- `GET /api/partners?id=P-0001` - Get specific partner
- `POST /api/partners` - Create new partner
- `PUT /api/partners?id=P-0001` - Update partner
- `DELETE /api/partners?id=P-0001` - Delete partner

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients?partner_id=P-0001` - Get clients by partner
- `GET /api/clients?country=United Kingdom` - Filter by country
- `POST /api/clients` - Create new client
- `PUT /api/clients?id=C-100000` - Update client
- `DELETE /api/clients?id=C-100000` - Delete client

### Metrics
- `GET /api/metrics` - Get all metrics
- `GET /api/metrics?partner_id=P-0001` - Get partner-specific metrics

### Charts
- `GET /api/charts?type=six-month-commissions` - 6-month commission chart
- `GET /api/charts?type=tier-distribution` - Tier distribution chart
- `GET /api/charts?type=population` - Population distribution chart
- `GET /api/charts?type=country-analysis` - Country analysis chart

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if MySQL service is running
   - Verify database credentials in config.php

2. **Permission Denied**
   - Ensure database user has proper privileges
   - Check file permissions on API directory

3. **PHP Errors**
   - Enable error reporting in config.php
   - Check PHP error logs

4. **CORS Issues**
   - Update CORS_ORIGIN in config.php
   - Ensure proper headers are set

### Performance Optimization

1. **Database Indexing**
   - Indexes are already created in the schema
   - Monitor query performance with EXPLAIN

2. **Caching**
   - API responses are cached for 2 minutes
   - Consider implementing Redis for production

3. **Connection Pooling**
   - Use persistent connections for high traffic
   - Configure MySQL connection limits

## Production Deployment

1. **Security**
   - Use strong database passwords
   - Restrict database user privileges
   - Enable SSL/TLS for database connections
   - Implement API authentication

2. **Performance**
   - Use a production web server (Apache/Nginx)
   - Enable PHP OPcache
   - Configure MySQL for production workload
   - Implement proper caching strategy

3. **Monitoring**
   - Set up database monitoring
   - Monitor API response times
   - Implement error logging and alerting

## Backup and Recovery

```bash
# Create backup
mysqldump -u root -p partner_report > backup.sql

# Restore backup
mysql -u root -p partner_report < backup.sql
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review MySQL and PHP error logs
3. Verify all configuration files
4. Test API endpoints individually
