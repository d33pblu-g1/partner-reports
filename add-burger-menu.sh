#!/bin/bash
# ============================================================================
# ADD BURGER MENU TO ALL HTML PAGES
# ============================================================================
# This script adds the burger menu script to all HTML pages
# ============================================================================

echo "🍔 Adding burger menu to all HTML pages..."

# Find all HTML files and add burger menu script
find . -name "*.html" -type f -exec grep -L "burger-menu.js" {} \; | while read file; do
    echo "Adding burger menu to: $file"
    
    # Check if the file has theme-toggle.js (to know where to insert)
    if grep -q "theme-toggle.js" "$file"; then
        # Insert after theme-toggle.js
        sed -i.bak '/theme-toggle.js/a\
  <!-- Burger menu with all controls -->\
  <script src="burger-menu.js"></script>' "$file"
    else
        # Insert before closing head tag
        sed -i.bak '/<\/head>/i\
  <!-- Burger menu with all controls -->\
  <script src="burger-menu.js"></script>' "$file"
    fi
    
    # Clean up backup file
    rm -f "$file.bak"
done

echo "✅ Burger menu added to all HTML pages!"
echo "🍔 The burger menu includes:"
echo "   - Language selection (English, Spanish, French, German, Arabic)"
echo "   - Theme toggle (Light/Dark)"
echo "   - Cache refresh button"
echo ""
echo "💡 The burger menu appears as a ☰ button in the top-right corner"
echo "💡 Click it to access all controls in one convenient menu"
