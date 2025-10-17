# PHP Setup Guide for Partner Report

## ⚠️ Current Issue

The **Database Connection Error** you're seeing is because:
1. ✅ API endpoints are now fixed (config.php includes added)
2. ❌ **PHP is not installed** on your system

## 🔧 Solution: Install PHP

### macOS Installation

#### Option 1: Using Homebrew (Recommended)

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PHP
brew install php

# Verify installation
php -v
```

#### Option 2: Use macOS Built-in PHP (if available)

macOS used to ship with PHP, but it was removed in recent versions. Check if you have it:

```bash
/usr/bin/php -v
```

If that works, create a symlink:

```bash
sudo ln -s /usr/bin/php /usr/local/bin/php
```

---

## 🚀 After Installing PHP

### 1. Verify PHP Installation

```bash
php -v
# Should show: PHP 8.x.x (cli) ...
```

### 2. Start MySQL Server

```bash
# Option A: If using Homebrew MySQL
brew services start mysql

# Option B: If using MySQL.app
mysql.server start

# Option C: If using native MySQL
sudo /usr/local/mysql/support-files/mysql.server start
```

### 3. Verify Database is Populated

```bash
mysql -u root -p partner_report
```

Then run:
```sql
SELECT COUNT(*) FROM partners;  -- Should show 1+
SELECT COUNT(*) FROM clients;   -- Should show 428+
SELECT COUNT(*) FROM trades;    -- Should show 100+
SELECT COUNT(*) FROM deposits;  -- Should show 50+
```

### 4. Start PHP Server

```bash
cd /Users/michalisphytides/Desktop/partner-report
php -S localhost:8000
```

You should see:
```
[Fri Oct 17 2025 10:00:00] PHP 8.x.x Development Server (http://localhost:8000) started
```

### 5. Test API Endpoints

Open a new terminal and test:

```bash
# Test partners endpoint
curl 'http://localhost:8000/api/index.php?endpoint=partners' | jq

# Test clients endpoint
curl 'http://localhost:8000/api/index.php?endpoint=clients' | jq

# Test dashboard endpoint
curl 'http://localhost:8000/api/index.php?endpoint=dashboard' | jq
```

All should return JSON (not HTML error pages).

### 6. Open the Application

Open in your browser:
```
http://localhost:8000/database.html
```

You should now see data loading successfully! ✅

---

## 🔍 Troubleshooting

### "Failed to connect to database"

**Check MySQL connection:**
```bash
mysql -u root -p -e "SHOW DATABASES;" | grep partner_report
```

**Check config.php credentials:**
```bash
cat api/config.php
```

Make sure the credentials match your MySQL setup.

### "Unexpected token '<'" Error

This means PHP is returning HTML (error page) instead of JSON.

**Check PHP errors:**
1. Look at terminal where PHP server is running
2. Check for syntax errors or missing includes
3. Verify all endpoints have `require_once __DIR__ . '/../config.php';`

### Port 8000 Already in Use

**Kill existing process:**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill it (replace PID with actual process ID)
kill <PID>

# Then start PHP server
php -S localhost:8000
```

---

## 📋 Quick Reference

### Required Services

| Service | Check | Start |
|---------|-------|-------|
| **PHP** | `php -v` | Built-in server |
| **MySQL** | `mysql -V` | `mysql.server start` |

### API Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| Partners | `/api/index.php?endpoint=partners` | Get all partners |
| Clients | `/api/index.php?endpoint=clients` | Get all clients |
| Dashboard | `/api/index.php?endpoint=dashboard` | Get trades & deposits |
| Metrics | `/api/index.php?endpoint=metrics` | Get calculated metrics |
| Charts | `/api/index.php?endpoint=charts` | Get chart data |
| Commissions | `/api/index.php?endpoint=commissions` | Get commission data |
| Badges | `/api/index.php?endpoint=badges` | Get badge data |

---

## ✅ Success Checklist

- [ ] PHP installed and in PATH
- [ ] MySQL server running
- [ ] Database `partner_report` exists
- [ ] Tables populated with data
- [ ] PHP server running on port 8000
- [ ] API endpoints returning JSON
- [ ] Browser shows database page without errors

---

## 🎯 Next Steps After Setup

Once everything is working:

1. **Test the database page:** http://localhost:8000/database.html
2. **Test CRUD operations:** Add/Edit/Delete records
3. **View other pages:**
   - Home: http://localhost:8000/index.html
   - Clients: http://localhost:8000/clients.html
   - Commissions: http://localhost:8000/commissions.html
   - Badges: http://localhost:8000/tiers-badges.html

All pages now pull data from MySQL in real-time! 🎉

---

## 💡 Alternative: Docker Setup (Advanced)

If you prefer Docker:

```dockerfile
# Create Dockerfile
FROM php:8.2-cli
RUN docker-php-ext-install pdo pdo_mysql mysqli
WORKDIR /app
COPY . .
CMD ["php", "-S", "0.0.0.0:8000"]
```

```bash
# Build and run
docker build -t partner-report .
docker run -p 8000:8000 partner-report
```

---

Need help? Check the browser console (F12) for detailed error messages.

