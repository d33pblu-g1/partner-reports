/**
 * Cache Refresh Button Functionality
 * Provides both browser cache clearing and code-level cache busting
 */

(function() {
  'use strict';
  
  // Create cache refresh button
  function createCacheRefreshButton() {
    const button = document.createElement('button');
    button.className = 'cache-refresh-btn';
    button.setAttribute('aria-label', 'Clear cache and refresh');
    button.innerHTML = '🔄';
    button.title = 'Clear cache and refresh (Ctrl+Shift+R)';
    
    // Add click handler
    button.addEventListener('click', handleCacheRefresh);
    
    // Add keyboard shortcut handler
    document.addEventListener('keydown', function(e) {
      // Ctrl+Shift+R or Cmd+Shift+R
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handleCacheRefresh();
      }
    });
    
    // Add to page
    document.body.appendChild(button);
    
    return button;
  }
  
  // Handle cache refresh
  function handleCacheRefresh() {
    const button = document.querySelector('.cache-refresh-btn');
    if (!button) return;
    
    // Add loading state
    button.classList.add('loading');
    button.innerHTML = '⏳';
    
    // Show notification
    showNotification('🔄 Clearing cache and refreshing...', 'info');
    
    // Clear browser cache programmatically
    clearBrowserCache();
    
    // Update version numbers for cache busting
    updateVersionNumbers();
    
    // Force reload after a short delay
    setTimeout(() => {
      // Try multiple methods to force cache clear
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Force reload with cache bypass
      window.location.reload(true);
    }, 1000);
  }
  
  // Clear browser cache programmatically
  function clearBrowserCache() {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB (if available)
      if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            indexedDB.deleteDatabase(db.name);
          });
        });
      }
      
      // Clear Cache API (if available)
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
  }
  
  // Update version numbers for cache busting
  function updateVersionNumbers() {
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
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.cache-notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `cache-notification cache-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--panel);
      color: var(--text);
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      font-size: 14px;
      border-left: 4px solid var(--accent);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Add animation keyframes
    if (!document.querySelector('#cache-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'cache-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createCacheRefreshButton);
    } else {
      createCacheRefreshButton();
    }
  }
  
  // Start initialization
  init();
  
  // Export for manual triggering
  window.CacheRefresh = {
    refresh: handleCacheRefresh,
    clearCache: clearBrowserCache,
    updateVersions: updateVersionNumbers
  };
  
})();
