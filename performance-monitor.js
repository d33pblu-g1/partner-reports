// Performance Monitoring for Partner Report
(function() {
  'use strict';
  
  const metrics = {
    loadTime: 0,
    renderTime: 0,
    dataLoadTime: 0,
    chartRenderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  };
  
  let startTime = performance.now();
  let dataLoadStart = 0;
  let chartRenderStart = 0;
  
  // Monitor page load performance
  function monitorPageLoad() {
    window.addEventListener('load', () => {
      metrics.loadTime = performance.now() - startTime;
      console.log(`Page load time: ${metrics.loadTime.toFixed(2)}ms`);
      
      // Monitor memory usage if available
      if (performance.memory) {
        metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        console.log(`Memory usage: ${metrics.memoryUsage.toFixed(2)}MB`);
      }
    });
  }
  
  // Monitor data loading performance
  function monitorDataLoading() {
    const originalLoad = window.DataManager?.load;
    if (originalLoad) {
      window.DataManager.load = function() {
        dataLoadStart = performance.now();
        return originalLoad.apply(this, arguments)
          .then(data => {
            metrics.dataLoadTime = performance.now() - dataLoadStart;
            console.log(`Data load time: ${metrics.dataLoadTime.toFixed(2)}ms`);
            return data;
          });
      };
    }
  }
  
  // Monitor chart rendering performance
  function monitorChartRendering() {
    const originalRender = window.renderSixMonthChart;
    if (originalRender) {
      window.renderSixMonthChart = function(db, partnerId) {
        chartRenderStart = performance.now();
        const result = originalRender.apply(this, arguments);
        metrics.chartRenderTime = performance.now() - chartRenderStart;
        console.log(`Chart render time: ${metrics.chartRenderTime.toFixed(2)}ms`);
        return result;
      };
    }
  }
  
  // Monitor cache performance
  function monitorCachePerformance() {
    let cacheHits = 0;
    let cacheMisses = 0;
    
    const originalGet = Map.prototype.get;
    Map.prototype.get = function(key) {
      const result = originalGet.call(this, key);
      if (result !== undefined) {
        cacheHits++;
      } else {
        cacheMisses++;
      }
      
      // Update cache hit rate
      const total = cacheHits + cacheMisses;
      if (total > 0) {
        metrics.cacheHitRate = (cacheHits / total) * 100;
      }
      
      return result;
    };
  }
  
  // Monitor DOM performance
  function monitorDOMPerformance() {
    let domOperations = 0;
    let domTime = 0;
    
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child) {
      const start = performance.now();
      const result = originalAppendChild.call(this, child);
      domTime += performance.now() - start;
      domOperations++;
      return result;
    };
    
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        const start = performance.now();
        originalInnerHTML.set.call(this, value);
        domTime += performance.now() - start;
        domOperations++;
      },
      get: originalInnerHTML.get
    });
    
    // Report DOM performance periodically
    setInterval(() => {
      if (domOperations > 0) {
        console.log(`DOM operations: ${domOperations}, Total time: ${domTime.toFixed(2)}ms, Avg: ${(domTime/domOperations).toFixed(2)}ms`);
        domOperations = 0;
        domTime = 0;
      }
    }, 10000);
  }
  
  // Monitor network performance
  function monitorNetworkPerformance() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const start = performance.now();
      return originalFetch.apply(this, args)
        .then(response => {
          const duration = performance.now() - start;
          console.log(`Network request: ${args[0]} - ${duration.toFixed(2)}ms`);
          return response;
        });
    };
  }
  
  // Performance report
  function generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: { ...metrics },
      recommendations: []
    };
    
    // Generate recommendations
    if (metrics.loadTime > 3000) {
      report.recommendations.push('Consider lazy loading more components');
    }
    
    if (metrics.dataLoadTime > 1000) {
      report.recommendations.push('Consider data compression or pagination');
    }
    
    if (metrics.chartRenderTime > 500) {
      report.recommendations.push('Consider using canvas rendering for charts');
    }
    
    if (metrics.memoryUsage > 50) {
      report.recommendations.push('Consider implementing virtual scrolling for large lists');
    }
    
    if (metrics.cacheHitRate < 50) {
      report.recommendations.push('Consider improving caching strategy');
    }
    
    return report;
  }
  
  // Expose performance monitoring
  window.PerformanceMonitor = {
    metrics,
    generateReport: generatePerformanceReport,
    start: () => {
      monitorPageLoad();
      monitorDataLoading();
      monitorChartRendering();
      monitorCachePerformance();
      monitorDOMPerformance();
      monitorNetworkPerformance();
    }
  };
  
  // Auto-start monitoring
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.PerformanceMonitor.start();
    });
  } else {
    window.PerformanceMonitor.start();
  }
  
  // Generate report every 30 seconds
  setInterval(() => {
    const report = generatePerformanceReport();
    console.log('Performance Report:', report);
  }, 30000);
})();
