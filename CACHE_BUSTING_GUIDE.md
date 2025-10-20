# 🚀 Cache Busting Guide for Partner Report

## Quick Solutions (Immediate)

### 1. **Hard Refresh** ⚡
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **Alternative**: `Ctrl + F5` (Windows) or `Cmd + Option + R` (Mac)

### 2. **Developer Tools Cache Disable** 🛠️
1. Open Developer Tools (`F12`)
2. Go to **Network** tab
3. Check **"Disable cache"** checkbox
4. Keep DevTools open while developing

### 3. **Clear Browser Cache** 🧹
- **Chrome**: Settings → Privacy → Clear browsing data → Cached images and files
- **Firefox**: Settings → Privacy → Clear Data → Cached Web Content
- **Safari**: Develop menu → Empty Caches

## Automated Solutions (Code Level)

### 4. **Run Cache Busting Script** 🔄
```bash
./cache-bust.sh
```
This script automatically updates version numbers in all HTML files.

### 5. **Manual Version Updates** 📝
Update version numbers in HTML files:
```html
<!-- Before -->
<link rel="stylesheet" href="styles.css">

<!-- After -->
<link rel="stylesheet" href="styles.css?v=20250120">
```

## Advanced Solutions

### 6. **Server-Side Cache Headers** 🌐
Add to your server configuration:
```apache
# Apache .htaccess
<FilesMatch "\.(css|js|html)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>
```

### 7. **PHP Cache Busting** 🐘
For dynamic content:
```php
<link rel="stylesheet" href="styles.css?v=<?php echo time(); ?>">
```

### 8. **Build Process Integration** 🔧
Add to your development workflow:
```bash
# Add to package.json scripts
"dev": "npm run cache-bust && npm run serve",
"cache-bust": "./cache-bust.sh"
```

## Best Practices

### ✅ **During Development**
- Keep Developer Tools open with "Disable cache" enabled
- Use hard refresh frequently (`Ctrl+Shift+R`)
- Run `./cache-bust.sh` after major changes

### ✅ **For Testing**
- Test in incognito/private browsing mode
- Clear browser cache before testing
- Use different browsers to verify

### ✅ **For Production**
- Use meaningful version numbers (dates, build numbers)
- Implement proper cache headers
- Use CDN with cache invalidation

## Troubleshooting

### 🔍 **Still seeing old content?**
1. Check if you're on the right URL
2. Verify the server is serving updated files
3. Try incognito mode
4. Check browser console for errors

### 🔍 **CSS not updating?**
1. Check if CSS file exists and is accessible
2. Verify version parameter is correct
3. Look for CSS syntax errors in console

### 🔍 **JavaScript not updating?**
1. Check browser console for errors
2. Verify script files are loading
3. Check for JavaScript syntax errors

## Quick Commands

```bash
# Run cache busting script
./cache-bust.sh

# Hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Clear browser cache
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```

---

**💡 Pro Tip**: The most reliable method during development is keeping Developer Tools open with "Disable cache" enabled. This ensures you always see the latest version without manual intervention.
