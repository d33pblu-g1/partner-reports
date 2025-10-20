#!/bin/bash
# ============================================================================
# CACHE BUSTING SCRIPT FOR PARTNER REPORT
# ============================================================================
# This script updates version numbers in HTML files to force browser cache refresh
# Run this script whenever you make code updates to ensure browsers load latest version
# ============================================================================

# Get current timestamp for versioning
VERSION=$(date +"%Y%m%d%H%M")

echo "🔄 Updating cache busting versions to: $VERSION"

# Update all HTML files with new version numbers
find . -name "*.html" -type f -exec sed -i.bak "s/styles\.css?v=[0-9]*/styles.css?v=$VERSION/g" {} \;
find . -name "*.html" -type f -exec sed -i.bak "s/script\.js?v=[0-9]*/script.js?v=$VERSION/g" {} \;
find . -name "*.html" -type f -exec sed -i.bak "s/api-manager\.js?v=[0-9]*/api-manager.js?v=$VERSION/g" {} \;
find . -name "*.html" -type f -exec sed -i.bak "s/chartjs-adapter\.js?v=[0-9]*/chartjs-adapter.js?v=$VERSION/g" {} \;

# Clean up backup files
find . -name "*.bak" -type f -delete

echo "✅ Cache busting complete! All HTML files updated with version $VERSION"
echo "🌐 Browsers will now load the latest version of your files"
echo ""
echo "💡 Pro tip: Use Ctrl+Shift+R (Cmd+Shift+R on Mac) for hard refresh"
echo "💡 Or enable 'Disable cache' in Developer Tools Network tab"
