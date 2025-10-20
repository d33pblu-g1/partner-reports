/**
 * Chart.js Adapter for Partner Report Dashboard
 * Replaces custom SVG/Canvas charts with Chart.js implementations
 */

(function() {
  'use strict';
  
  // Chart.js configuration for dark theme
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.2)';
  Chart.defaults.backgroundColor = 'rgba(56, 189, 248, 0.1)';
  
  // Default responsive configuration
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  
  // Color palette matching the existing theme
  const chartColors = {
    primary: '#38bdf8',      // Sky blue
    secondary: '#10b981',    // Emerald
    accent: '#f59e0b',       // Amber
    danger: '#ef4444',       // Red
    purple: '#8b5cf6',      // Violet
    pink: '#ec4899',         // Pink
    indigo: '#6366f1',       // Indigo
    teal: '#14b8a6'          // Teal
  };
  
  // Chart.js wrapper for Partner Report
  window.PartnerCharts = {
    
    // ========================================================================
    // 1. HOME PAGE CHARTS
    // ========================================================================
    
    /**
     * Render 6-month commission chart
     */
    renderSixMonthCommissions: function(containerId, data) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      // Clear existing content
      container.innerHTML = '<canvas></canvas>';
      const canvas = container.querySelector('canvas');
      
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: data.map(item => item.month),
          datasets: [{
            label: 'Commission ($)',
            data: data.map(item => item.commission),
            backgroundColor: chartColors.primary,
            borderColor: chartColors.primary,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f1f5f9',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `Commission: $${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
      
      return chart;
    },
    
    /**
     * Render tier distribution pie chart
     */
    renderTierDistribution: function(containerId, data) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = '<canvas></canvas>';
      const canvas = container.querySelector('canvas');
      
      const tierColors = {
        'Bronze': '#cd7f32',
        'Silver': '#c0c0c0', 
        'Gold': '#ffd700',
        'Platinum': '#e5e4e2'
      };
      
      const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: data.map(item => item.tier),
          datasets: [{
            data: data.map(item => item.count),
            backgroundColor: data.map(item => tierColors[item.tier] || chartColors.primary),
            borderColor: '#1e293b',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#94a3b8',
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f1f5f9',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
      
      return chart;
    },
    
    /**
     * Render client growth trend line chart
     */
    renderClientGrowthTrend: function(containerId, data) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = '<canvas></canvas>';
      const canvas = container.querySelector('canvas');
      
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.map(item => item.date),
          datasets: [{
            label: 'New Clients',
            data: data.map(item => item.new_clients),
            borderColor: chartColors.secondary,
            backgroundColor: chartColors.secondary + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartColors.secondary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f1f5f9',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8'
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
      
      return chart;
    },
    
    // ========================================================================
    // 2. COMMISSIONS PAGE CHARTS
    // ========================================================================
    
    /**
     * Render stacked commission chart
     */
    renderStackedCommissions: function(containerId, data) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = '<canvas></canvas>';
      const canvas = container.querySelector('canvas');
      
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: data.dates,
          datasets: data.series.map((series, index) => ({
            label: series.name,
            data: series.data,
            backgroundColor: Object.values(chartColors)[index % Object.keys(chartColors).length] + '80',
            borderColor: Object.values(chartColors)[index % Object.keys(chartColors).length],
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#94a3b8',
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f1f5f9',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8'
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
      
      return chart;
    },
    
    // ========================================================================
    // 3. COUNTRY ANALYSIS CHARTS
    // ========================================================================
    
    /**
     * Render country performance horizontal bar chart
     */
    renderCountryPerformance: function(containerId, data) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = '<canvas></canvas>';
      const canvas = container.querySelector('canvas');
      
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: data.map(item => item.country),
          datasets: [{
            label: 'Client Count',
            data: data.map(item => item.client_count),
            backgroundColor: chartColors.primary,
            borderColor: chartColors.primary,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f1f5f9',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8'
              }
            },
            y: {
              grid: {
                display: false,
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8'
              }
            }
          }
        }
      });
      
      return chart;
    },
    
    /**
     * Render deposit trends chart
     */
    renderDepositTrends: function(containerId, data) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = '<canvas></canvas>';
      const canvas = container.querySelector('canvas');
      
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: data.map(item => item.month),
          datasets: [{
            label: 'Deposits',
            data: data.map(item => item.total_deposits),
            borderColor: chartColors.secondary,
            backgroundColor: chartColors.secondary + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartColors.secondary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }, {
            label: 'Withdrawals',
            data: data.map(item => item.total_withdrawals || 0),
            borderColor: chartColors.danger,
            backgroundColor: chartColors.danger + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartColors.danger,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#94a3b8',
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#f1f5f9',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(148, 163, 184, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
      
      return chart;
    },
    
    // ========================================================================
    // 4. UTILITY FUNCTIONS
    // ========================================================================
    
    /**
     * Destroy existing chart in container
     */
    destroyChart: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const canvas = container.querySelector('canvas');
      if (canvas && canvas.chart) {
        canvas.chart.destroy();
      }
    },
    
    /**
     * Resize chart to fit container
     */
    resizeChart: function(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const canvas = container.querySelector('canvas');
      if (canvas && canvas.chart) {
        canvas.chart.resize();
      }
    },
    
    /**
     * Update chart data
     */
    updateChart: function(containerId, newData) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const canvas = container.querySelector('canvas');
      if (canvas && canvas.chart) {
        canvas.chart.data = newData;
        canvas.chart.update();
      }
    }
  };
  
  // Auto-resize charts on window resize
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // Find all Chart.js instances and resize them
      Chart.helpers.each(Chart.instances, function(chart) {
        chart.resize();
      });
    }, 100);
  });
  
})();
