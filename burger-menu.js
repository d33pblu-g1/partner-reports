/**
 * Burger Menu with Language, Theme, and Cache Refresh Controls
 * Provides a unified menu system for all pages
 */

(function() {
  'use strict';
  
  // Available languages
  const languages = {
    'en': { name: 'English', flag: '🇺🇸' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'fr': { name: 'Français', flag: '🇫🇷' },
    'de': { name: 'Deutsch', flag: '🇩🇪' },
    'ar': { name: 'العربية', flag: '🇸🇦' }
  };
  
  // Current language
  let currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
  
  // Burger Menu Manager
  window.BurgerMenu = {
    
    // Create burger menu
    createBurgerMenu: function() {
      // Remove existing burger menu if any
      const existing = document.querySelector('.burger-menu');
      if (existing) {
        existing.remove();
      }
      
      const menu = document.createElement('div');
      menu.className = 'burger-menu';
      
      // Burger button
      const button = document.createElement('button');
      button.className = 'burger-menu-btn';
      button.innerHTML = '☰';
      button.setAttribute('aria-label', 'Open menu');
      
      // Menu content
      const content = document.createElement('div');
      content.className = 'burger-menu-content';
      
      // Language Section
      const languageSection = this.createLanguageSection();
      content.appendChild(languageSection);
      
      // Divider
      const divider1 = document.createElement('div');
      divider1.className = 'burger-menu-divider';
      content.appendChild(divider1);
      
      // Theme Section
      const themeSection = this.createThemeSection();
      content.appendChild(themeSection);
      
      // Divider
      const divider2 = document.createElement('div');
      divider2.className = 'burger-menu-divider';
      content.appendChild(divider2);
      
      // Cache Refresh Section
      const cacheSection = this.createCacheSection();
      content.appendChild(cacheSection);
      
      // Divider
      const divider3 = document.createElement('div');
      divider3.className = 'burger-menu-divider';
      content.appendChild(divider3);
      
      // Export Section
      const exportSection = this.createExportSection();
      content.appendChild(exportSection);
      
      // Toggle menu
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu(content, button);
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) {
          this.closeMenu(content, button);
        }
      });
      
      menu.appendChild(button);
      menu.appendChild(content);
      document.body.appendChild(menu);
      
      return menu;
    },
    
    // Create language section
    createLanguageSection: function() {
      const section = document.createElement('div');
      
      const title = document.createElement('div');
      title.className = 'burger-menu-section-title';
      title.textContent = 'Language';
      section.appendChild(title);
      
      const dropdown = document.createElement('div');
      dropdown.className = 'language-dropdown';
      
      const button = document.createElement('button');
      button.className = 'language-btn';
      const currentLang = languages[currentLanguage];
      button.innerHTML = `${currentLang.flag} ${currentLang.name} ▼`;
      
      const menu = document.createElement('div');
      menu.className = 'language-dropdown-menu';
      
      Object.keys(languages).forEach(langCode => {
        const lang = languages[langCode];
        const option = document.createElement('div');
        option.className = 'language-option';
        if (langCode === currentLanguage) {
          option.classList.add('active');
        }
        option.innerHTML = `${lang.flag} ${lang.name}`;
        
        option.addEventListener('click', () => {
          this.setLanguage(langCode);
          this.updateLanguageButton(button, langCode);
          menu.style.display = 'none';
        });
        
        menu.appendChild(option);
      });
      
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
      
      dropdown.appendChild(button);
      dropdown.appendChild(menu);
      section.appendChild(dropdown);
      
      return section;
    },
    
    // Create theme section
    createThemeSection: function() {
      const section = document.createElement('div');
      
      const title = document.createElement('div');
      title.className = 'burger-menu-section-title';
      title.textContent = 'Theme';
      section.appendChild(title);
      
      const button = document.createElement('button');
      button.className = 'theme-toggle burger-menu-item';
      
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      this.updateThemeButton(button, currentTheme);
      
      button.addEventListener('click', () => {
        this.toggleTheme();
        this.updateThemeButton(button, document.documentElement.getAttribute('data-theme'));
      });
      
      section.appendChild(button);
      return section;
    },
    
    // Create cache refresh section
    createCacheSection: function() {
      const section = document.createElement('div');
      
      const title = document.createElement('div');
      title.className = 'burger-menu-section-title';
      title.textContent = 'Cache';
      section.appendChild(title);
      
      const button = document.createElement('button');
      button.className = 'cache-refresh-btn burger-menu-item';
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
        Clear Cache & Refresh
      `;
      
      button.addEventListener('click', () => {
        this.handleCacheRefresh(button);
      });
      
      section.appendChild(button);
      return section;
    },
    
    // Create export section
    createExportSection: function() {
      const section = document.createElement('div');
      
      const title = document.createElement('div');
      title.className = 'burger-menu-section-title';
      title.textContent = 'Export';
      section.appendChild(title);
      
      // Export as PDF button
      const pdfButton = document.createElement('button');
      pdfButton.className = 'export-btn burger-menu-item';
      pdfButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        Export as PDF
      `;
      
      pdfButton.addEventListener('click', () => {
        this.exportAsPDF();
      });
      
      // Export as Excel button
      const excelButton = document.createElement('button');
      excelButton.className = 'export-btn burger-menu-item';
      excelButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <path d="M16 13H8"/>
          <path d="M16 17H8"/>
          <path d="M10 9H8"/>
        </svg>
        Export as Excel
      `;
      
      excelButton.addEventListener('click', () => {
        this.exportAsExcel();
      });
      
      // Export as CSV button
      const csvButton = document.createElement('button');
      csvButton.className = 'export-btn burger-menu-item';
      csvButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        Export as CSV
      `;
      
      csvButton.addEventListener('click', () => {
        this.exportAsCSV();
      });
      
      section.appendChild(pdfButton);
      section.appendChild(excelButton);
      section.appendChild(csvButton);
      
      return section;
    },
    
    // Toggle menu visibility
    toggleMenu: function(content, button) {
      const isOpen = content.classList.contains('show');
      if (isOpen) {
        this.closeMenu(content, button);
      } else {
        this.openMenu(content, button);
      }
    },
    
    // Open menu
    openMenu: function(content, button) {
      content.classList.add('show');
      button.classList.add('active');
      button.innerHTML = '✕';
    },
    
    // Close menu
    closeMenu: function(content, button) {
      content.classList.remove('show');
      button.classList.remove('active');
      button.innerHTML = '☰';
    },
    
    // Set language
    setLanguage: function(langCode) {
      currentLanguage = langCode;
      localStorage.setItem('selectedLanguage', langCode);
      this.showNotification(`Language changed to ${languages[langCode].name}`, 'success');
    },
    
    // Update language button
    updateLanguageButton: function(button, langCode) {
      const lang = languages[langCode];
      button.innerHTML = `${lang.flag} ${lang.name} ▼`;
    },
    
    // Toggle theme
    toggleTheme: function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('selectedTheme', newTheme);
      
      this.showNotification(`Theme changed to ${newTheme}`, 'success');
    },
    
    // Export as PDF
    exportAsPDF: function() {
      this.showNotification('📄 Generating PDF export...', 'info');
      
      // Get current page data
      const pageTitle = document.title.replace(' • Partner Report', '');
      const currentDate = new Date().toLocaleDateString();
      
      // Create a simple PDF export using browser's print functionality
      const printWindow = window.open('', '_blank');
      const content = document.querySelector('.content').innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${pageTitle} - Partner Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .page-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .export-info { font-size: 12px; color: #666; margin-bottom: 20px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="page-title">${pageTitle}</div>
          <div class="export-info">Exported on: ${currentDate}</div>
          ${content}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        this.showNotification('📄 PDF export ready for printing', 'success');
      }, 1000);
    },
    
    // Export as Excel
    exportAsExcel: function() {
      this.showNotification('📊 Generating Excel export...', 'info');
      
      // Get current page data
      const pageTitle = document.title.replace(' • Partner Report', '');
      const currentDate = new Date().toLocaleDateString();
      
      // Create CSV data (Excel can open CSV files)
      let csvData = `Partner Report - ${pageTitle}\n`;
      csvData += `Exported on: ${currentDate}\n\n`;
      
      // Add table data if available
      const tables = document.querySelectorAll('table');
      if (tables.length > 0) {
        tables.forEach((table, index) => {
          csvData += `Table ${index + 1}:\n`;
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            const rowData = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`).join(',');
            csvData += rowData + '\n';
          });
          csvData += '\n';
        });
      } else {
        csvData += 'No table data available for export.\n';
      }
      
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partner-report-${pageTitle.toLowerCase().replace(/\s+/g, '-')}-${currentDate.replace(/\//g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.showNotification('📊 Excel export downloaded', 'success');
    },
    
    // Export as CSV
    exportAsCSV: function() {
      this.showNotification('📋 Generating CSV export...', 'info');
      
      // Get current page data
      const pageTitle = document.title.replace(' • Partner Report', '');
      const currentDate = new Date().toLocaleDateString();
      
      // Create CSV data
      let csvData = `Partner Report - ${pageTitle}\n`;
      csvData += `Exported on: ${currentDate}\n\n`;
      
      // Add table data if available
      const tables = document.querySelectorAll('table');
      if (tables.length > 0) {
        tables.forEach((table, index) => {
          csvData += `Table ${index + 1}:\n`;
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            const rowData = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`).join(',');
            csvData += rowData + '\n';
          });
          csvData += '\n';
        });
      } else {
        csvData += 'No table data available for export.\n';
      }
      
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partner-report-${pageTitle.toLowerCase().replace(/\s+/g, '-')}-${currentDate.replace(/\//g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.showNotification('📋 CSV export downloaded', 'success');
    },
    
    // Update theme button
    updateThemeButton: function(button, theme) {
      if (theme === 'dark') {
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          Dark Theme
        `;
      } else {
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          Light Theme
        `;
      }
    },
    
    // Handle cache refresh
    handleCacheRefresh: function(button) {
      // Add loading state
      button.classList.add('loading');
      button.innerHTML = '⏳ Clearing cache...';
      
      // Show notification
      this.showNotification('🔄 Clearing cache and refreshing...', 'info');
      
      // Clear browser cache
      this.clearBrowserCache();
      
      // Update version numbers
      this.updateVersionNumbers();
      
      // Force reload after delay
      setTimeout(() => {
        window.location.reload(true);
      }, 1500);
    },
    
    // Clear browser cache
    clearBrowserCache: function() {
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        if ('indexedDB' in window) {
          indexedDB.databases().then(databases => {
            databases.forEach(db => {
              indexedDB.deleteDatabase(db.name);
            });
          });
        }
        
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        console.log('✅ Browser cache cleared');
      } catch (error) {
        console.warn('⚠️ Could not clear all browser cache:', error);
      }
    },
    
    // Update version numbers
    updateVersionNumbers: function() {
      const timestamp = Date.now();
      const version = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      // Update CSS links
      const cssLinks = document.querySelectorAll('link[href*="styles.css"]');
      cssLinks.forEach(link => {
        const href = link.href.split('?')[0];
        link.href = `${href}?v=${version}`;
      });
      
      // Update JS script sources
      const jsScripts = document.querySelectorAll('script[src*=".js"]');
      jsScripts.forEach(script => {
        if (script.src && !script.src.includes('cdn.jsdelivr.net')) {
          const src = script.src.split('?')[0];
          script.src = `${src}?v=${version}`;
        }
      });
      
      console.log('✅ Version numbers updated for cache busting');
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
      // Remove existing notification
      const existing = document.querySelector('.burger-notification');
      if (existing) {
        existing.remove();
      }
      
      const notification = document.createElement('div');
      notification.className = `burger-notification burger-notification-${type}`;
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--panel);
        color: var(--text);
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1002;
        font-size: 14px;
        border-left: 4px solid var(--accent);
        animation: slideIn 0.3s ease;
        max-width: 300px;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },
    
    // Initialize burger menu
    init: function() {
      this.createBurgerMenu();
      
      // Load saved theme
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    }
  };
  
  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.BurgerMenu.init();
      });
    } else {
      window.BurgerMenu.init();
    }
  }
  
  // Start initialization
  init();
  
})();
