# Theme Toggle Guide

## How It Works

The theme toggle button in the top-right corner switches between dark and light themes.

### Expected Behavior

1. **Click the button** in the top-right corner
2. **Theme switches immediately** with smooth transitions
3. **Icon changes**:
   - 🌙 Moon icon = Dark theme (current)
   - ☀️ Sun icon = Light theme (current)
4. **Preference saved** to browser localStorage
5. **Persists across pages** - your choice is remembered

## Visual Changes

### Dark Theme (Default)
- **Background**: Dark slate (#0f172a)
- **Panels**: Dark gray (#111827)
- **Text**: Light gray (#e5e7eb)
- **Cards**: Dark blue-black (#0b1220)
- **Best for**: Low-light environments

### Light Theme
- **Background**: Light slate (#f8fafc)
- **Panels**: White (#ffffff)
- **Text**: Dark slate (#0f172a)
- **Cards**: White with shadows
- **Best for**: Bright environments

## Testing the Theme Toggle

### Option 1: Use Test Page
Open `test-theme.html` in your browser:
```bash
# Start server
php -S localhost:8000

# Then visit:
http://localhost:8000/test-theme.html
```

The test page shows:
- ✓ Current theme status
- ✓ Debug information
- ✓ Click counter
- ✓ Color variables
- ✓ Visual confirmation

### Option 2: Check Browser Console
Open any page and check the browser console (F12):

You should see:
```
✓ Theme toggle initialized
🎨 Applying theme: dark
✓ Dark theme applied
```

When you click the button:
```
🔄 Toggling theme: dark → light
🎨 Applying theme: light
✓ Light theme applied
```

## Troubleshooting

### Button Doesn't Respond

**Check 1: Is the button visible?**
- Look in the top-right corner
- Should be a circular button with moon/sun icon

**Check 2: Check browser console**
```javascript
// Open console (F12) and type:
document.getElementById('theme-toggle')
// Should return: <button id="theme-toggle" ...>

// Check if initialized:
document.getElementById('theme-toggle').hasAttribute('data-theme-initialized')
// Should return: true
```

**Check 3: Manual toggle**
```javascript
// In console, try:
window.ThemeToggle.toggle()
// Should switch the theme
```

### Theme Doesn't Change Visually

**Check 1: Verify data attribute**
```javascript
// In console:
document.documentElement.getAttribute('data-theme')
// Returns: "light" (light theme) or null (dark theme)
```

**Check 2: Check CSS is loaded**
```javascript
// In console:
getComputedStyle(document.body).backgroundColor
// Dark: rgb(15, 23, 42)
// Light: rgb(248, 250, 252)
```

**Check 3: Clear localStorage and refresh**
```javascript
// In console:
localStorage.removeItem('partner-report-theme')
location.reload()
```

### Theme Doesn't Persist

**Check localStorage:**
```javascript
// In console:
localStorage.getItem('partner-report-theme')
// Should return: "light" or "dark"
```

If it returns `null`, check if localStorage is enabled in your browser.

## Manual Theme Control

You can manually control the theme via JavaScript console:

```javascript
// Get current theme
window.ThemeToggle.get()

// Set to light theme
window.ThemeToggle.set('light')

// Set to dark theme
window.ThemeToggle.set('dark')

// Toggle
window.ThemeToggle.toggle()
```

## Files Involved

- **`theme-toggle.js`** - Core functionality
- **`styles.css`** - Theme styles and colors
- **All HTML pages** - Include the toggle button

## Browser Compatibility

Tested and working on:
- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Mobile browsers

Requires:
- CSS Custom Properties support
- localStorage support
- ES6 JavaScript support

## Keyboard Accessibility

The theme toggle is keyboard accessible:
- **Tab** to focus the button
- **Enter** or **Space** to toggle
- Screen reader announces: "Toggle theme"

## Common Issues

### Issue: "Button clicked but nothing happens"

**Solution 1: Check event listeners**
```javascript
// Get event listeners
getEventListeners(document.getElementById('theme-toggle'))
```

**Solution 2: Reinitialize**
```javascript
// Force re-initialization
document.getElementById('theme-toggle').removeAttribute('data-theme-initialized');
location.reload();
```

### Issue: "Theme flashes on page load"

This shouldn't happen because `theme-toggle.js` loads early. If it does:
- Ensure `theme-toggle.js` is loaded BEFORE other scripts
- Check that it's not being loaded with `defer` attribute

### Issue: "Different theme on different pages"

This indicates localStorage isn't working. Check:
```javascript
// Test localStorage
localStorage.setItem('test', 'value')
localStorage.getItem('test') // Should return 'value'
```

## Customization

### Change Default Theme

Edit `theme-toggle.js`, line 22:
```javascript
// Change from 'dark' to 'light'
return 'light';
```

### Change Theme Colors

Edit `styles.css`:
```css
/* Dark theme colors */
:root {
  --bg: #0f172a;
  --panel: #111827;
  /* ... etc */
}

/* Light theme colors */
:root[data-theme="light"] {
  --bg: #f8fafc;
  --panel: #ffffff;
  /* ... etc */
}
```

### Change Button Position

Edit `styles.css`:
```css
.theme-toggle-container {
  position: fixed;
  top: 20px;    /* Distance from top */
  right: 0;     /* Distance from right */
  padding-right: 20px;
}
```

## Need Help?

1. Open `test-theme.html` to see if toggle works there
2. Check browser console for error messages
3. Verify all files are loaded (check Network tab)
4. Try clearing browser cache and localStorage
5. Test in incognito/private browsing mode

## Quick Test

Run this in your browser console:
```javascript
// Complete test sequence
console.log('1. Current theme:', window.ThemeToggle.get());
console.log('2. Button exists:', !!document.getElementById('theme-toggle'));
console.log('3. Button initialized:', document.getElementById('theme-toggle')?.hasAttribute('data-theme-initialized'));
console.log('4. Data attribute:', document.documentElement.getAttribute('data-theme') || 'none (dark)');
console.log('5. Now toggling...');
window.ThemeToggle.toggle();
setTimeout(() => {
  console.log('6. New theme:', window.ThemeToggle.get());
}, 500);
```

Expected output:
```
1. Current theme: dark
2. Button exists: true
3. Button initialized: true
4. Data attribute: none (dark)
5. Now toggling...
🔄 Toggling theme: dark → light
🎨 Applying theme: light
✓ Light theme applied
6. New theme: light
```

