#!/bin/bash
# ============================================================================
# REMOVE STANDALONE EXPORT BUTTONS FROM ALL HTML PAGES
# ============================================================================
# This script removes export-manager.js from all HTML pages since export
# functionality is now available in the burger menu
# ============================================================================

echo "📤 Removing standalone export buttons from all HTML pages..."

# Find all HTML files and remove export-manager.js references
find . -name "*.html" -type f | while read file; do
    echo "Processing: $file"
    
    # Remove export-manager.js script tag if it exists
    if grep -q "export-manager.js" "$file"; then
        echo "  Removing export-manager.js from: $file"
        
        # Create a temporary file
        temp_file=$(mktemp)
        
        # Remove the export-manager.js script line
        sed '/export-manager\.js/d' "$file" > "$temp_file"
        
        # Replace the original file
        mv "$temp_file" "$file"
    fi
done

echo "✅ Standalone export buttons removed from all HTML pages!"
echo "📤 Export functionality is now only available in the burger menu (☰ button)"
echo ""
echo "💡 Users can access export options by:"
echo "   1. Clicking the ☰ burger menu button (top-right corner)"
echo "   2. Selecting the Export section in the menu"
echo "   3. Choosing PDF, Excel, or CSV export format"
