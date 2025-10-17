// Theme Toggle Functionality
(function() {
  'use strict';
  
  const THEME_KEY = 'partner-report-theme';
  
  /**
   * Get the current theme from localStorage or system preference
   */
  function getCurrentTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    return 'dark';
  }
  
  /**
   * Apply theme to the document
   */
  function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }
  
  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  }
  
  /**
   * Initialize theme toggle
   */
  function initThemeToggle() {
    // Apply saved theme immediately (before page renders)
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
    
    // Wait for DOM to be ready for button
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupToggleButton);
    } else {
      setupToggleButton();
    }
  }
  
  /**
   * Setup toggle button event listener
   */
  function setupToggleButton() {
    const toggleButton = document.getElementById('theme-toggle');
    
    if (toggleButton) {
      toggleButton.addEventListener('click', toggleTheme);
      
      // Add keyboard support
      toggleButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      });
    }
  }
  
  /**
   * Listen for system theme changes
   */
  function watchSystemTheme() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      darkModeQuery.addEventListener('change', (e) => {
        // Only apply system theme if user hasn't manually set one
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
  
  // Expose to window for manual control if needed
  window.ThemeToggle = {
    toggle: toggleTheme,
    set: applyTheme,
    get: getCurrentTheme
  };
  
  // Initialize immediately (run before page load for flash prevention)
  initThemeToggle();
  watchSystemTheme();
})();

