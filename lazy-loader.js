// Lazy Loading Manager - Load components only when visible
(function() {
  'use strict';
  
  const observers = new Map();
  const loadedComponents = new Set();
  
  // Create intersection observer for lazy loading
  function createObserver(callback, options = {}) {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
        }
      });
    }, defaultOptions);
  }
  
  // Lazy load charts
  function lazyLoadChart(element) {
    if (loadedComponents.has(element.id)) return;
    
    const chartType = element.dataset.chartType;
    const partnerId = element.dataset.partnerId || '';
    
    // Show loading state
    element.innerHTML = '<div class="chart-loading">Loading chart...</div>';
    
    // Load data and render chart
    window.DataManager.load().then(db => {
      switch (chartType) {
        case 'six-month-commissions':
          renderSixMonthChartLazy(db, partnerId, element);
          break;
        case 'tier-distribution':
          renderTierChartLazy(db, partnerId, element);
          break;
        case 'country-analysis':
          renderCountryChartLazy(db, partnerId, element);
          break;
      }
      loadedComponents.add(element.id);
    }).catch(error => {
      element.innerHTML = '<div class="chart-error">Failed to load chart</div>';
      console.error('Chart loading error:', error);
    });
  }
  
  // Lazy load client lists
  function lazyLoadClientList(element) {
    if (loadedComponents.has(element.id)) return;
    
    const partnerId = element.dataset.partnerId || '';
    
    // Show loading state
    element.innerHTML = '<div class="list-loading">Loading clients...</div>';
    
    window.DataManager.load().then(db => {
      renderClientListLazy(db, partnerId, element);
      loadedComponents.add(element.id);
    }).catch(error => {
      element.innerHTML = '<div class="list-error">Failed to load clients</div>';
      console.error('Client list loading error:', error);
    });
  }
  
  // Initialize lazy loading for all lazy elements
  function initLazyLoading() {
    // Lazy load charts
    const chartElements = document.querySelectorAll('[data-lazy="chart"]');
    if (chartElements.length > 0) {
      const chartObserver = createObserver(lazyLoadChart);
      chartElements.forEach(element => {
        chartObserver.observe(element);
      });
      observers.set('charts', chartObserver);
    }
    
    // Lazy load client lists
    const listElements = document.querySelectorAll('[data-lazy="list"]');
    if (listElements.length > 0) {
      const listObserver = createObserver(lazyLoadClientList);
      listElements.forEach(element => {
        listObserver.observe(element);
      });
      observers.set('lists', listObserver);
    }
  }
  
  // Clean up observers
  function cleanup() {
    observers.forEach(observer => observer.disconnect());
    observers.clear();
    loadedComponents.clear();
  }
  
  // Expose lazy loading functions
  window.LazyLoader = {
    init: initLazyLoading,
    cleanup: cleanup,
    reload: (elementId) => {
      loadedComponents.delete(elementId);
      const element = document.getElementById(elementId);
      if (element) {
        if (element.dataset.lazy === 'chart') {
          lazyLoadChart(element);
        } else if (element.dataset.lazy === 'list') {
          lazyLoadClientList(element);
        }
      }
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyLoading);
  } else {
    initLazyLoading();
  }
})();
