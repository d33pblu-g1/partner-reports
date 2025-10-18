/**
 * Enhanced User Experience Module
 * Interactive elements and best practices for partner reporting
 */

(function() {
  'use strict';
  
  window.EnhancedUX = {
    
    // ========================================================================
    // 1. INTERACTIVE TOOLTIPS & HELP SYSTEM
    // ========================================================================
    
    /**
     * Initialize contextual help tooltips
     */
    initTooltips: function() {
      const tooltipElements = document.querySelectorAll('[data-tooltip]');
      
      tooltipElements.forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        const tooltip = this.createTooltip(tooltipText);
        
        element.addEventListener('mouseenter', (e) => {
          this.showTooltip(tooltip, e.target);
        });
        
        element.addEventListener('mouseleave', () => {
          this.hideTooltip(tooltip);
        });
      });
    },
    
    createTooltip: function(text) {
      const tooltip = document.createElement('div');
      tooltip.className = 'enhanced-tooltip';
      tooltip.textContent = text;
      tooltip.style.cssText = `
        position: absolute;
        background: var(--panel);
        color: var(--text);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 1px solid rgba(148,163,184,0.2);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        max-width: 200px;
        word-wrap: break-word;
      `;
      document.body.appendChild(tooltip);
      return tooltip;
    },
    
    showTooltip: function(tooltip, target) {
      const rect = target.getBoundingClientRect();
      tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
      tooltip.style.opacity = '1';
    },
    
    hideTooltip: function(tooltip) {
      tooltip.style.opacity = '0';
    },
    
    // ========================================================================
    // 2. SMART FILTERING & SEARCH
    // ========================================================================
    
    /**
     * Initialize smart search with suggestions
     */
    initSmartSearch: function() {
      const searchInputs = document.querySelectorAll('.smart-search');
      
      searchInputs.forEach(input => {
        const suggestionsContainer = this.createSuggestionsContainer(input);
        
        input.addEventListener('input', (e) => {
          const query = e.target.value;
          if (query.length > 2) {
            this.showSuggestions(suggestionsContainer, query);
          } else {
            this.hideSuggestions(suggestionsContainer);
          }
        });
        
        input.addEventListener('blur', () => {
          setTimeout(() => this.hideSuggestions(suggestionsContainer), 200);
        });
      });
    },
    
    createSuggestionsContainer: function(input) {
      const container = document.createElement('div');
      container.className = 'suggestions-container';
      container.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--panel);
        border: 1px solid rgba(148,163,184,0.2);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 100;
        display: none;
        max-height: 200px;
        overflow-y: auto;
      `;
      
      input.parentElement.style.position = 'relative';
      input.parentElement.appendChild(container);
      return container;
    },
    
    showSuggestions: function(container, query) {
      // Mock suggestions - in real implementation, fetch from API
      const suggestions = [
        'High-value clients',
        'Recent signups',
        'Active traders',
        'Deposit trends',
        'Commission analysis'
      ].filter(s => s.toLowerCase().includes(query.toLowerCase()));
      
      container.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(148,163,184,0.1);">${suggestion}</div>`
      ).join('');
      
      container.style.display = 'block';
      
      // Add click handlers
      container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          // Handle suggestion selection
          console.log('Selected suggestion:', item.textContent);
          container.style.display = 'none';
        });
      });
    },
    
    hideSuggestions: function(container) {
      container.style.display = 'none';
    },
    
    // ========================================================================
    // 3. QUICK ACTIONS & SHORTCUTS
    // ========================================================================
    
    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts: function() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          this.focusSearch();
        }
        
        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
          e.preventDefault();
          this.quickExport();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
          this.closeModals();
        }
      });
    },
    
    focusSearch: function() {
      const searchInput = document.querySelector('.smart-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    
    quickExport: function() {
      // Quick export functionality
      console.log('Quick export triggered');
      this.showNotification('Export started...', 'info');
    },
    
    closeModals: function() {
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => {
        if (modal.style.display !== 'none') {
          modal.style.display = 'none';
        }
      });
    },
    
    // ========================================================================
    // 4. NOTIFICATION SYSTEM
    // ========================================================================
    
    /**
     * Show notification to user
     */
    showNotification: function(message, type = 'info', duration = 3000) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#38bdf8'
      };
      
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--panel);
        color: var(--text);
        padding: 12px 16px;
        border-radius: 8px;
        border-left: 4px solid ${colors[type] || colors.info};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      }, 100);
      
      // Auto remove
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, duration);
    },
    
    // ========================================================================
    // 5. LOADING STATES & SKELETON SCREENS
    // ========================================================================
    
    /**
     * Enhanced loading states
     */
    showLoadingState: function(element, message = 'Loading...') {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
      `;
      
      loadingOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 100;
        color: var(--text);
      `;
      
      const spinner = loadingOverlay.querySelector('.loading-spinner');
      spinner.style.cssText = `
        width: 32px;
        height: 32px;
        border: 3px solid rgba(148,163,184,0.3);
        border-top: 3px solid var(--accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 12px;
      `;
      
      const messageEl = loadingOverlay.querySelector('.loading-message');
      messageEl.style.cssText = `
        font-size: 14px;
        color: var(--muted);
      `;
      
      element.style.position = 'relative';
      element.appendChild(loadingOverlay);
      
      return loadingOverlay;
    },
    
    hideLoadingState: function(loadingOverlay) {
      if (loadingOverlay && loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
    },
    
    // ========================================================================
    // 6. QUICK INSIGHTS & RECOMMENDATIONS
    // ========================================================================
    
    /**
     * Show contextual insights
     */
    showInsights: function(containerId, partnerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      // Mock insights - in real implementation, fetch from AI/analytics
      const insights = [
        {
          type: 'success',
          title: 'High Performance',
          message: 'Your conversion rate is 15% above average this month',
          action: 'View details'
        },
        {
          type: 'warning',
          title: 'Opportunity',
          message: 'Client retention could be improved in Q4',
          action: 'See recommendations'
        },
        {
          type: 'info',
          title: 'Trend Alert',
          message: 'Mobile trading increased 23% this week',
          action: 'Analyze mobile data'
        }
      ];
      
      let html = '<div class="insights-container" style="display: grid; gap: 12px;">';
      
      insights.forEach(insight => {
        const colors = {
          success: '#10b981',
          warning: '#f59e0b',
          info: '#38bdf8'
        };
        
        html += `
          <div class="insight-card" style="
            background: var(--panel);
            border: 1px solid rgba(148,163,184,0.2);
            border-left: 4px solid ${colors[insight.type]};
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <h4 style="margin: 0; color: var(--text); font-size: 14px;">${insight.title}</h4>
              <span style="font-size: 12px; color: var(--muted);">${insight.action}</span>
            </div>
            <p style="margin: 0; color: var(--muted); font-size: 13px;">${insight.message}</p>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
      
      // Add hover effects
      container.querySelectorAll('.insight-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
        });
      });
    },
    
    // ========================================================================
    // 7. INITIALIZATION
    // ========================================================================
    
    /**
     * Initialize all UX enhancements
     */
    init: function() {
      this.initTooltips();
      this.initSmartSearch();
      this.initKeyboardShortcuts();
      
      // Add CSS animations
      this.addAnimations();
      
      console.log('✓ Enhanced UX initialized');
    },
    
    addAnimations: function() {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .enhanced-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: var(--panel) transparent transparent transparent;
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.EnhancedUX.init());
  } else {
    window.EnhancedUX.init();
  }
  
})();
