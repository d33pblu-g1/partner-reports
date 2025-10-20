/**
 * Advanced Charts Library for Partner Reporting
 * Interactive visualizations with drill-down capabilities
 */

(function() {
  'use strict';
  
  window.AdvancedCharts = {
    
    // ========================================================================
    // 1. PARTNER PERFORMANCE SCORECARD
    // ========================================================================
    
    /**
     * Render KPI Scorecard with trend indicators
     */
    renderKPIScorecard: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=partner_scorecard&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) {
            // Fallback to metrics API
            return fetch(`api/index.php?endpoint=metrics&partner_id=${partnerId}`)
              .then(r => r.json())
              .then(metricsResponse => {
                if (metricsResponse.success && metricsResponse.data) {
                  this.renderScorecardFromMetrics(containerId, metricsResponse.data);
                } else {
                  const container = document.getElementById(containerId);
                  if (container) {
                    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">No data available for partner scorecard</div>';
                  }
                }
              })
              .catch(() => {
                const container = document.getElementById(containerId);
                if (container) {
                  container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">No data available for partner scorecard</div>';
                }
              });
          }
          
          const data = response.data[0];
          const container = document.getElementById(containerId);
          if (!container) return;
          
          const kpis = [
            {
              title: 'Total Revenue',
              value: data.total_commissions || 0,
              format: 'currency',
              trend: this.calculateTrend(data.month_1_commissions, data.month_2_commissions),
              icon: '💰',
              color: '#10b981'
            },
            {
              title: 'Active Clients',
              value: data.total_clients || 0,
              format: 'number',
              trend: this.calculateTrend(data.mtd_clients, data.total_clients),
              icon: '👥',
              color: '#38bdf8'
            },
            {
              title: 'Total Trades',
              value: data.total_trades || 0,
              format: 'number',
              trend: this.calculateTrend(data.mtd_trades, data.total_trades),
              icon: '📈',
              color: '#f59e0b'
            },
            {
              title: 'Avg. Trade Size',
              value: data.total_trades > 0 ? (data.total_commissions / data.total_trades) : 0,
              format: 'currency',
              trend: 0,
              icon: '📊',
              color: '#8b5cf6'
            }
          ];
          
          let html = '<div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">';
          
          kpis.forEach(kpi => {
            const formattedValue = this.formatValue(kpi.value, kpi.format);
            const trendIcon = kpi.trend > 0 ? '↗️' : kpi.trend < 0 ? '↘️' : '→';
            const trendColor = kpi.trend > 0 ? '#10b981' : kpi.trend < 0 ? '#ef4444' : '#94a3b8';
            
            html += `
              <div class="kpi-card" style="background: var(--panel); border: 1px solid rgba(148,163,184,0.2); border-radius: 12px; padding: 20px; text-align: center; transition: transform 0.2s ease;">
                <div style="font-size: 32px; margin-bottom: 8px;">${kpi.icon}</div>
                <div style="font-size: 24px; font-weight: 700; color: ${kpi.color}; margin-bottom: 4px;">${formattedValue}</div>
                <div style="font-size: 14px; color: var(--muted); margin-bottom: 8px;">${kpi.title}</div>
                <div style="font-size: 12px; color: ${trendColor}; display: flex; align-items: center; justify-content: center; gap: 4px;">
                  <span>${trendIcon}</span>
                  <span>${Math.abs(kpi.trend).toFixed(1)}%</span>
                </div>
              </div>
            `;
          });
          
          html += '</div>';
          container.innerHTML = html;
          
          // Add hover effects
          container.querySelectorAll('.kpi-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
              card.style.transform = 'translateY(-2px)';
              card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            });
            card.addEventListener('mouseleave', () => {
              card.style.transform = 'translateY(0)';
              card.style.boxShadow = 'none';
            });
          });
        })
        .catch(err => {
          console.error('Error loading KPI scorecard:', err);
          const container = document.getElementById(containerId);
          if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">Failed to load scorecard data</div>';
          }
        });
    },
    
    /**
     * Render scorecard from metrics data (fallback)
     */
    renderScorecardFromMetrics: function(containerId, metricsData) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const kpis = [
        {
          title: 'Total Revenue',
          value: metricsData.total_commissions || 0,
          format: 'currency',
          trend: this.calculateTrend(metricsData.month_commissions, metricsData.total_commissions),
          icon: '💰',
          color: '#10b981'
        },
        {
          title: 'Active Clients',
          value: metricsData.total_clients || 0,
          format: 'number',
          trend: this.calculateTrend(metricsData.mtd_clients, metricsData.total_clients),
          icon: '👥',
          color: '#38bdf8'
        },
        {
          title: 'Total Trades',
          value: metricsData.total_trades || 0,
          format: 'number',
          trend: this.calculateTrend(metricsData.mtd_trades, metricsData.total_trades),
          icon: '📈',
          color: '#f59e0b'
        },
        {
          title: 'Avg. Trade Size',
          value: metricsData.total_trades > 0 ? (metricsData.total_commissions / metricsData.total_trades) : 0,
          format: 'currency',
          trend: 0,
          icon: '📊',
          color: '#8b5cf6'
        }
      ];
      
      let html = '<div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">';
      
      kpis.forEach(kpi => {
        const formattedValue = this.formatValue(kpi.value, kpi.format);
        const trendIcon = kpi.trend > 0 ? '↗️' : kpi.trend < 0 ? '↘️' : '→';
        const trendColor = kpi.trend > 0 ? '#10b981' : kpi.trend < 0 ? '#ef4444' : '#94a3b8';
        
        html += `
          <div class="kpi-card" style="background: var(--panel); border: 1px solid rgba(148,163,184,0.2); border-radius: 12px; padding: 20px; text-align: center; transition: transform 0.2s ease;">
            <div style="font-size: 32px; margin-bottom: 8px;">${kpi.icon}</div>
            <div style="font-size: 24px; font-weight: 700; color: ${kpi.color}; margin-bottom: 4px;">${formattedValue}</div>
            <div style="font-size: 14px; color: var(--muted); margin-bottom: 8px;">${kpi.title}</div>
            <div style="font-size: 12px; color: ${trendColor}; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>${trendIcon}</span>
              <span>${Math.abs(kpi.trend).toFixed(1)}%</span>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
      
      // Add hover effects
      container.querySelectorAll('.kpi-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = 'none';
        });
      });
    },
    
    /**
     * Render Performance Radar Chart
     */
    renderPerformanceRadar: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=cube_partner_dashboard&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data[0];
          const container = document.getElementById(containerId);
          if (!container) return;
          
          // Calculate normalized scores (0-100)
          const metrics = {
            'Revenue': Math.min(100, (data.total_commissions / 10000) * 100),
            'Clients': Math.min(100, (data.total_clients / 100) * 100),
            'Activity': Math.min(100, (data.total_trades / 1000) * 100),
            'Growth': Math.min(100, Math.max(0, data.mtd_commissions / data.total_commissions * 100)),
            'Efficiency': Math.min(100, data.total_clients > 0 ? (data.total_commissions / data.total_clients) * 10 : 0)
          };
          
          const width = container.clientWidth || 400;
          const height = 300;
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) / 2 - 40;
          
          let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05); border-radius: 8px;">`;
          
          // Draw grid circles
          for (let i = 1; i <= 5; i++) {
            const r = (radius / 5) * i;
            svg += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="rgba(148,163,184,0.2)" stroke-width="1"/>`;
          }
          
          // Draw axis lines
          const axes = Object.keys(metrics);
          axes.forEach((axis, i) => {
            const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            svg += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="rgba(148,163,184,0.3)" stroke-width="1"/>`;
            
            // Axis labels
            const labelX = centerX + Math.cos(angle) * (radius + 20);
            const labelY = centerY + Math.sin(angle) * (radius + 20);
            svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="var(--text)" font-size="12" font-weight="600">${axis}</text>`;
          });
          
          // Draw data polygon
          let polygonPoints = '';
          axes.forEach((axis, i) => {
            const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
            const value = metrics[axis] / 100;
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            polygonPoints += `${x},${y} `;
          });
          
          svg += `<polygon points="${polygonPoints}" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" stroke-width="2"/>`;
          
          // Draw data points
          axes.forEach((axis, i) => {
            const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
            const value = metrics[axis] / 100;
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            svg += `<circle cx="${x}" cy="${y}" r="4" fill="#38bdf8"/>`;
            svg += `<text x="${x}" y="${y - 15}" text-anchor="middle" fill="var(--text)" font-size="10" font-weight="600">${Math.round(metrics[axis])}</text>`;
          });
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading radar chart:', err));
    },
    
    // ========================================================================
    // 2. CLIENT LIFECYCLE ANALYTICS
    // ========================================================================
    
    /**
     * Render Acquisition Funnel
     */
    renderAcquisitionFunnel: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=cube_client_funnel&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data;
          const container = document.getElementById(containerId);
          if (!container) return;
          
          const stages = [
            { name: 'Visitors', count: data.find(d => d.stage === 'visitors')?.client_count || 0 },
            { name: 'Signups', count: data.find(d => d.stage === 'signups')?.client_count || 0 },
            { name: 'Deposited', count: data.find(d => d.stage === 'deposited')?.client_count || 0 },
            { name: 'First Trade', count: data.find(d => d.stage === 'first_trade')?.client_count || 0 },
            { name: 'Active', count: data.find(d => d.stage === 'active')?.client_count || 0 }
          ];
          
          const width = container.clientWidth || 600;
          const height = 400;
          const maxWidth = width * 0.8;
          const stageHeight = height / stages.length;
          
          let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05); border-radius: 8px;">`;
          
          const maxCount = Math.max(...stages.map(s => s.count));
          
          stages.forEach((stage, i) => {
            const barWidth = (stage.count / maxCount) * maxWidth;
            const x = (width - barWidth) / 2;
            const y = i * stageHeight + stageHeight * 0.1;
            const barHeight = stageHeight * 0.8;
            
            // Calculate conversion rate
            const prevCount = i > 0 ? stages[i-1].count : stage.count;
            const conversionRate = prevCount > 0 ? (stage.count / prevCount * 100) : 100;
            
            // Color based on conversion rate
            let color = '#38bdf8';
            if (conversionRate < 50) color = '#ef4444';
            else if (conversionRate < 75) color = '#f59e0b';
            else if (conversionRate >= 90) color = '#10b981';
            
            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>`;
            svg += `<text x="${width/2}" y="${y + barHeight/2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="14" font-weight="600">${stage.name}</text>`;
            svg += `<text x="${width/2}" y="${y + barHeight/2 + 20}" text-anchor="middle" dominant-baseline="middle" fill="var(--text)" font-size="12">${stage.count.toLocaleString()}</text>`;
            
            if (i > 0) {
              svg += `<text x="${width/2}" y="${y - 10}" text-anchor="middle" dominant-baseline="middle" fill="var(--muted)" font-size="10">${conversionRate.toFixed(1)}% conversion</text>`;
            }
          });
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading funnel:', err));
    },
    
    // ========================================================================
    // 3. REVENUE INTELLIGENCE
    // ========================================================================
    
    /**
     * Render Revenue Attribution Chart
     */
    renderRevenueAttribution: function(containerId, partnerId) {
      Promise.all([
        fetch(`api/index.php?endpoint=cubes&cube=cube_commissions_product&partner_id=${partnerId}`).then(r => r.json()),
        fetch(`api/index.php?endpoint=cubes&cube=cube_country_performance&partner_id=${partnerId}`).then(r => r.json())
      ]).then(([productResponse, countryResponse]) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const productData = productResponse.success ? productResponse.data : [];
        const countryData = countryResponse.success ? countryResponse.data : [];
        
        const width = container.clientWidth || 800;
        const height = 400;
        
        // Create treemap-style visualization
        let html = '<div class="revenue-attribution" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        // Product attribution
        html += '<div class="attribution-section">';
        html += '<h4 style="margin: 0 0 16px; color: var(--text);">By Product</h4>';
        
        const totalProductRevenue = productData.reduce((sum, item) => sum + parseFloat(item.total_commissions || 0), 0);
        productData.forEach(item => {
          const percentage = totalProductRevenue > 0 ? (item.total_commissions / totalProductRevenue * 100) : 0;
          const width = Math.max(20, percentage * 2);
          
          html += `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 12px; color: var(--text);">${item.asset_type || 'Unknown'}</span>
                <span style="font-size: 12px; color: var(--muted);">${percentage.toFixed(1)}%</span>
              </div>
              <div style="background: rgba(148,163,184,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #38bdf8, #10b981); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
              </div>
            </div>
          `;
        });
        html += '</div>';
        
        // Country attribution
        html += '<div class="attribution-section">';
        html += '<h4 style="margin: 0 0 16px; color: var(--text);">By Country</h4>';
        
        const totalCountryRevenue = countryData.reduce((sum, item) => sum + parseFloat(item.total_commissions || 0), 0);
        countryData.slice(0, 10).forEach(item => {
          const percentage = totalCountryRevenue > 0 ? (item.total_commissions / totalCountryRevenue * 100) : 0;
          
          html += `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 12px; color: var(--text);">${item.country || 'Unknown'}</span>
                <span style="font-size: 12px; color: var(--muted);">${percentage.toFixed(1)}%</span>
              </div>
              <div style="background: rgba(148,163,184,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #f59e0b, #ef4444); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
              </div>
            </div>
          `;
        });
        html += '</div>';
        
        html += '</div>';
        container.innerHTML = html;
      }).catch(err => console.error('Error loading revenue attribution:', err));
    },
    
    // ========================================================================
    // 4. UTILITY FUNCTIONS
    // ========================================================================
    
    calculateTrend: function(current, previous) {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    },
    
    formatValue: function(value, format) {
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
        case 'number':
          return new Intl.NumberFormat('en-US').format(value);
        case 'percentage':
          return `${value.toFixed(1)}%`;
        default:
          return value.toString();
      }
    },
    
    // ========================================================================
    // 5. INTERACTIVE FEATURES
    // ========================================================================
    
    /**
     * Add drill-down functionality to charts
     */
    addDrillDown: function(containerId, callback) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.addEventListener('click', (e) => {
        const target = e.target.closest('[data-drill-down]');
        if (target) {
          const data = JSON.parse(target.dataset.drillDown);
          callback(data);
        }
      });
    },
    
    /**
     * Add export functionality
     */
    addExportButton: function(containerId, chartType) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const exportBtn = document.createElement('button');
      exportBtn.innerHTML = '📊 Export';
      exportBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--accent);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s ease;
      `;
      
      exportBtn.addEventListener('click', () => {
        this.exportChart(containerId, chartType);
      });
      
      container.style.position = 'relative';
      container.appendChild(exportBtn);
    },
    
    exportChart: function(containerId, chartType) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      // Create canvas for export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Convert SVG to canvas (simplified)
      const svg = container.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          const link = document.createElement('a');
          link.download = `${chartType}_${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL();
          link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };
  
})();
