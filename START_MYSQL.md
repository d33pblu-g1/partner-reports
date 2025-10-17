# How to Start MySQL Server

## ✅ Good News!
- ✅ PHP is now installed and working!
- ✅ PHP server is running on port 8000
- ⚠️ MySQL server needs to be started

## 🔍 What We Found

You have MySQL installed via Anaconda/Conda at: `/opt/anaconda3/bin/mysql`

## 🚀 Quick Start (Try These in Order)

### Option 1: Start MySQL Server (if installed via Conda)

```bash
# Try to start MySQL daemon
mysqld_safe &
```

Or if that doesn't work:

```bash
# Start MySQL server directly
mysqld --datadir=/opt/anaconda3/var/mysql &
```

### Option 2: Install MySQL via Homebrew (Recommended)

If the above doesn't work, it's easier to use Homebrew MySQL:

```bash
# Install MySQL
brew install mysql

# Start MySQL server
brew services start mysql

# Or start it manually for this session only
mysql.server start
```

### Option 3: Check if MySQL is Already Running

```bash
# Check for MySQL process
ps aux | grep mysql

# Check which port MySQL is using
lsof -i :3306
```

## 🧪 Test MySQL Connection

Once MySQL is running, test it:

```bash
# Connect to MySQL
mysql -u root

# Inside MySQL, check databases
SHOW DATABASES;

# Check if partner_report exists
USE partner_report;
SHOW TABLES;
```

If `partner_report` database doesn't exist, you need to create and populate it:

```bash
# Run the migration scripts
mysql -u root < database_schema.sql
python3 migrate_to_mysql.py
```

## ✅ Verify Everything is Working

After MySQL is running:

### 1. Test the API

```bash
# Should return JSON (not an error)
curl 'http://localhost:8000/api/index.php?endpoint=partners'
```

Expected: JSON data with partners

### 2. Open the Application

```
http://localhost:8000/database.html
```

You should see data loading successfully! ✅

## 🔧 Troubleshooting

### "Can't connect to MySQL server through socket"

This means MySQL server is not running. Try:

```bash
# Find where MySQL socket should be
mysql_config --socket

# Or specify host/port explicitly in config.php
# Change: $host = "localhost";
# To: $host = "127.0.0.1";
```

### "Access denied for user 'root'"

MySQL might need a password. Update `api/config.php`:

```php
define('DB_PASSWORD', 'your_mysql_password');
```

### "Database 'partner_report' doesn't exist"

Create and populate the database:

```bash
mysql -u root -e "CREATE DATABASE partner_report;"
mysql -u root partner_report < database_schema.sql
python3 migrate_to_mysql.py
```

## 📋 Current Status

✅ **PHP Installed:** 8.4.13  
✅ **PHP Server Running:** localhost:8000  
✅ **API Endpoints Fixed:** All have config.php includes  
⏳ **MySQL Server:** Needs to be started  
⏳ **Database:** Needs to be verified/populated  

## 🎯 Next Steps

1. **Start MySQL** (use one of the options above)
2. **Verify database exists** (or create it)
3. **Test API** (`curl` command above)
4. **Open browser** (http://localhost:8000/database.html)

---

## 💡 Quick Commands Reference

```bash
# Start MySQL (Homebrew)
brew services start mysql

# Start MySQL (Manual)
mysql.server start

# Test MySQL
mysql -u root -e "SELECT VERSION();"

# Test API
curl 'http://localhost:8000/api/index.php?endpoint=partners'

# View PHP server log
tail -f /tmp/php_server.log
```

Once MySQL is running, refresh your browser and the database page should load! 🎉

