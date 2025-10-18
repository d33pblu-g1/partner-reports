/**
 * Enhanced Charts Library for Partner Reporting
 * Comprehensive visualization suite for all partner metrics
 */

(function() {
  'use strict';
  
  window.EnhancedCharts = {
    
    // ========================================================================
    // 1. EARNINGS & COMMISSIONS CHARTS
    // ========================================================================
    
    /**
     * Daily commission payouts by plan - Line/Area chart
     */
    renderDailyCommissionsByPlan: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=daily_commissions_plan&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data;
          const container = document.getElementById(containerId);
          if (!container) return;
          
          // Group by commission plan
          const planData = {};
          data.forEach(row => {
            if (!planData[row.commission_plan]) {
              planData[row.commission_plan] = [];
            }
            planData[row.commission_plan].push({
              date: row.trade_date,
              commission: parseFloat(row.total_commissions),
              trades: parseInt(row.trade_count)
            });
          });
          
          // Render SVG chart
          const width = container.clientWidth || 800;
          const height = 300;
          const margin = {top: 20, right: 120, bottom: 40, left: 60};
          
          let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
          
          const plans = Object.keys(planData);
          const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
          
          plans.forEach((plan, idx) => {
            const color = colors[idx % colors.length];
            const points = planData[plan];
            
            if (points.length === 0) return;
            
            // Calculate scales
            const maxCommission = Math.max(...points.map(p => p.commission));
            const minDate = new Date(Math.min(...points.map(p => new Date(p.date))));
            const maxDate = new Date(Math.max(...points.map(p => new Date(p.date))));
            
            // Draw line
            let path = '';
            points.forEach((point, i) => {
              const x = margin.left + ((new Date(point.date) - minDate) / (maxDate - minDate)) * (width - margin.left - margin.right);
              const y = margin.top + (1 - point.commission / maxCommission) * (height - margin.top - margin.bottom);
              path += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
              
              // Draw point
              svg += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" opacity="0.8">
                <title>${plan}: $${point.commission.toLocaleString()} (${point.trades} trades) on ${point.date}</title>
              </circle>`;
            });
            
            svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>`;
            
            // Legend
            svg += `<rect x="${width - margin.right + 10}" y="${margin.top + idx * 25}" width="15" height="15" fill="${color}"/>`;
            svg += `<text x="${width - margin.right + 30}" y="${margin.top + idx * 25 + 12}" fill="var(--text)" font-size="12">${plan}</text>`;
          });
          
          // Axis labels
          svg += `<text x="${margin.left}" y="${height - 5}" fill="var(--muted)" font-size="12">Date</text>`;
          svg += `<text x="10" y="${margin.top}" fill="var(--muted)" font-size="12" transform="rotate(-90 10 ${margin.top})">Commissions ($)</text>`;
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading daily commissions by plan:', err));
    },
    
    /**
     * Daily commission payouts by platform - Stacked bar chart
     */
    renderDailyCommissionsByPlatform: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=daily_commissions_platform&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data;
          const container = document.getElementById(containerId);
          if (!container) return;
          
          // Group by date, then by platform
          const dateMap = {};
          data.forEach(row => {
            if (!dateMap[row.trade_date]) {
              dateMap[row.trade_date] = {};
            }
            dateMap[row.trade_date][row.platform] = parseFloat(row.total_commissions);
          });
          
          const dates = Object.keys(dateMap).sort().slice(-30); // Last 30 days
          const platforms = [...new Set(data.map(r => r.platform))];
          const colors = {'MT5': '#38bdf8', 'WebTrader': '#10b981', 'Mobile': '#f59e0b', 'DerivX': '#ef4444', 'Unknown': '#6b7280'};
          
          const width = container.clientWidth || 800;
          const height = 300;
          const margin = {top: 20, right: 120, bottom: 60, left: 60};
          const barWidth = (width - margin.left - margin.right) / dates.length - 2;
          
          let svg = `<svg width="${width}" height="${height}">`;
          
          // Find max total per date
          const maxTotal = Math.max(...dates.map(date => {
            return platforms.reduce((sum, platform) => sum + (dateMap[date][platform] || 0), 0);
          }));
          
          // Draw stacked bars
          dates.forEach((date, idx) => {
            const x = margin.left + idx * (barWidth + 2);
            let yOffset = height - margin.bottom;
            
            platforms.forEach(platform => {
              const value = dateMap[date][platform] || 0;
              if (value === 0) return;
              
              const barHeight = (value / maxTotal) * (height - margin.top - margin.bottom);
              yOffset -= barHeight;
              
              svg += `<rect x="${x}" y="${yOffset}" width="${barWidth}" height="${barHeight}" 
                fill="${colors[platform] || '#6b7280'}" opacity="0.8">
                <title>${platform}: $${value.toLocaleString()} on ${date}</title>
              </rect>`;
            });
            
            // Date label (every 5th)
            if (idx % 5 === 0) {
              svg += `<text x="${x + barWidth/2}" y="${height - margin.bottom + 15}" 
                fill="var(--muted)" font-size="10" text-anchor="middle" transform="rotate(-45 ${x + barWidth/2} ${height - margin.bottom + 15})">
                ${new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
              </text>`;
            }
          });
          
          // Legend
          platforms.forEach((platform, idx) => {
            svg += `<rect x="${width - margin.right + 10}" y="${margin.top + idx * 20}" width="12" height="12" fill="${colors[platform] || '#6b7280'}"/>`;
            svg += `<text x="${width - margin.right + 25}" y="${margin.top + idx * 20 + 10}" fill="var(--text)" font-size="11">${platform}</text>`;
          });
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading daily commissions by platform:', err));
    },
    
    /**
     * Commission by product group - Pie/Donut chart
     */
    renderCommissionsByProduct: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=commissions_product&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data;
          const container = document.getElementById(containerId);
          if (!container) return;
          
          // Aggregate by asset_type
          const productTotals = {};
          data.forEach(row => {
            const key = row.asset_type || 'Unknown';
            productTotals[key] = (productTotals[key] || 0) + parseFloat(row.total_commissions);
          });
          
          const total = Object.values(productTotals).reduce((a, b) => a + b, 0);
          const products = Object.keys(productTotals).sort((a, b) => productTotals[b] - productTotals[a]);
          
          const width = container.clientWidth || 400;
          const height = 300;
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) / 2 - 40;
          const innerRadius = radius * 0.6; // Donut chart
          
          const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
          
          let svg = `<svg width="${width}" height="${height}">`;
          
          let startAngle = 0;
          products.forEach((product, idx) => {
            const value = productTotals[product];
            const percentage = (value / total) * 100;
            const angle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;
            
            // Draw arc
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const x3 = centerX + innerRadius * Math.cos(endAngle);
            const y3 = centerY + innerRadius * Math.sin(endAngle);
            const x4 = centerX + innerRadius * Math.cos(startAngle);
            const y4 = centerY + innerRadius * Math.sin(startAngle);
            
            const largeArc = angle > Math.PI ? 1 : 0;
            
            const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} 
              L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
            
            svg += `<path d="${path}" fill="${colors[idx % colors.length]}" opacity="0.85" stroke="#0f172a" stroke-width="2">
              <title>${product}: $${value.toLocaleString()} (${percentage.toFixed(1)}%)</title>
            </path>`;
            
            // Label
            const labelAngle = startAngle + angle / 2;
            const labelRadius = radius + 25;
            const labelX = centerX + labelRadius * Math.cos(labelAngle);
            const labelY = centerY + labelRadius * Math.sin(labelAngle);
            
            if (percentage > 5) { // Only show label if slice is big enough
              svg += `<text x="${labelX}" y="${labelY}" fill="var(--text)" font-size="11" text-anchor="middle">
                ${product}<tspan x="${labelX}" dy="12" font-size="10" fill="var(--muted)">${percentage.toFixed(1)}%</tspan>
              </text>`;
            }
            
            startAngle = endAngle;
          });
          
          // Center text
          svg += `<text x="${centerX}" y="${centerY - 10}" fill="var(--text)" font-size="16" font-weight="bold" text-anchor="middle">
            $${(total / 1000).toFixed(1)}K
          </text>`;
          svg += `<text x="${centerX}" y="${centerY + 10}" fill="var(--muted)" font-size="12" text-anchor="middle">
            Total Commissions
          </text>`;
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading commissions by product:', err));
    },
    
    /**
     * Top symbols by commission - Bar chart
     */
    renderTopSymbols: function(containerId, partnerId, limit = 10) {
      fetch(`api/index.php?endpoint=cubes&cube=commissions_symbol&partner_id=${partnerId}&limit=${limit}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data.slice(0, limit);
          const container = document.getElementById(containerId);
          if (!container) return;
          
          const width = container.clientWidth || 600;
          const height = data.length * 35 + 60;
          const margin = {top: 20, right: 100, bottom: 40, left: 120};
          
          const maxCommission = Math.max(...data.map(d => parseFloat(d.total_commissions)));
          const barHeight = 25;
          
          let svg = `<svg width="${width}" height="${height}">`;
          
          data.forEach((row, idx) => {
            const commission = parseFloat(row.total_commissions);
            const barWidth = ((commission / maxCommission) * (width - margin.left - margin.right));
            const y = margin.top + idx * 35;
            
            // Bar
            svg += `<rect x="${margin.left}" y="${y}" width="${barWidth}" height="${barHeight}" 
              fill="#38bdf8" opacity="0.8">
              <title>${row.asset}: $${commission.toLocaleString()} (${row.trade_count} trades)</title>
            </rect>`;
            
            // Symbol label
            svg += `<text x="${margin.left - 10}" y="${y + barHeight/2 + 5}" 
              fill="var(--text)" font-size="12" text-anchor="end">${row.asset}</text>`;
            
            // Value label
            svg += `<text x="${margin.left + barWidth + 5}" y="${y + barHeight/2 + 5}" 
              fill="var(--text)" font-size="11">$${(commission / 1000).toFixed(1)}K</text>`;
          });
          
          svg += `<text x="${width/2}" y="${height - 10}" fill="var(--muted)" font-size="12" text-anchor="middle">
            Commissions by Symbol (Top ${limit})
          </text>`;
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading top symbols:', err));
    },
    
    // ========================================================================
    // 2. CLIENT ACQUISITION & LIFECYCLE CHARTS
    // ========================================================================
    
    /**
     * Daily client signups - Line chart with breakdown
     */
    renderDailySignups: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=daily_signups&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data.slice(0, 60); // Last 60 days
          const container = document.getElementById(containerId);
          if (!container) return;
          
          // Group by date
          const dateMap = {};
          data.forEach(row => {
            if (!dateMap[row.signup_date]) {
              dateMap[row.signup_date] = 0;
            }
            dateMap[row.signup_date] += parseInt(row.signup_count);
          });
          
          const dates = Object.keys(dateMap).sort();
          const values = dates.map(d => dateMap[d]);
          
          const width = container.clientWidth || 800;
          const height = 250;
          const margin = {top: 20, right: 20, bottom: 40, left: 50};
          
          const maxValue = Math.max(...values, 1);
          
          let svg = `<svg width="${width}" height="${height}">`;
          
          // Draw area fill
          let areaPath = `M ${margin.left} ${height - margin.bottom}`;
          dates.forEach((date, idx) => {
            const x = margin.left + (idx / (dates.length - 1)) * (width - margin.left - margin.right);
            const y = margin.top + (1 - values[idx] / maxValue) * (height - margin.top - margin.bottom);
            areaPath += ` L ${x} ${y}`;
          });
          areaPath += ` L ${width - margin.right} ${height - margin.bottom} Z`;
          svg += `<path d="${areaPath}" fill="#38bdf8" opacity="0.2"/>`;
          
          // Draw line
          let linePath = '';
          dates.forEach((date, idx) => {
            const x = margin.left + (idx / (dates.length - 1)) * (width - margin.left - margin.right);
            const y = margin.top + (1 - values[idx] / maxValue) * (height - margin.top - margin.bottom);
            linePath += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
            
            // Points
            if (idx % 5 === 0) {
              svg += `<circle cx="${x}" cy="${y}" r="3" fill="#38bdf8">
                <title>${date}: ${values[idx]} signups</title>
              </circle>`;
            }
          });
          svg += `<path d="${linePath}" fill="none" stroke="#38bdf8" stroke-width="2"/>`;
          
          // Axes
          svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="var(--muted)" opacity="0.3"/>`;
          svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="var(--muted)" opacity="0.3"/>`;
          
          // Labels
          svg += `<text x="${width/2}" y="${height - 5}" fill="var(--muted)" font-size="12" text-anchor="middle">Last ${dates.length} Days</text>`;
          svg += `<text x="10" y="${margin.top}" fill="var(--muted)" font-size="12" transform="rotate(-90 10 ${margin.top})">Daily Signups</text>`;
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading daily signups:', err));
    },
    
    /**
     * Deposits vs Withdrawals - Dual-axis chart
     */
    renderDepositWithdrawalTrends: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=daily_funding&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data;
          const container = document.getElementById(containerId);
          if (!container) return;
          
          // Separate deposits and withdrawals
          const dateMap = {};
          data.forEach(row => {
            if (!dateMap[row.funding_date]) {
              dateMap[row.funding_date] = {deposits: 0, withdrawals: 0};
            }
            const amount = parseFloat(row.total_amount);
            if (row.category && row.category.toLowerCase().includes('deposit')) {
              dateMap[row.funding_date].deposits += amount;
            } else if (row.category && row.category.toLowerCase().includes('withdraw')) {
              dateMap[row.funding_date].withdrawals += Math.abs(amount);
            }
          });
          
          const dates = Object.keys(dateMap).sort().slice(-30);
          
          const width = container.clientWidth || 800;
          const height = 300;
          const margin = {top: 20, right: 20, bottom: 40, left: 60};
          const barWidth = (width - margin.left - margin.right) / dates.length - 4;
          
          const maxValue = Math.max(...dates.map(d => Math.max(dateMap[d].deposits, dateMap[d].withdrawals)));
          
          let svg = `<svg width="${width}" height="${height}">`;
          
          dates.forEach((date, idx) => {
            const x = margin.left + idx * (barWidth * 2 + 4);
            
            // Deposit bar
            const depositHeight = (dateMap[date].deposits / maxValue) * (height - margin.top - margin.bottom);
            svg += `<rect x="${x}" y="${height - margin.bottom - depositHeight}" 
              width="${barWidth}" height="${depositHeight}" fill="#10b981" opacity="0.8">
              <title>Deposits ${date}: $${dateMap[date].deposits.toLocaleString()}</title>
            </rect>`;
            
            // Withdrawal bar
            const withdrawalHeight = (dateMap[date].withdrawals / maxValue) * (height - margin.top - margin.bottom);
            svg += `<rect x="${x + barWidth + 2}" y="${height - margin.bottom - withdrawalHeight}" 
              width="${barWidth}" height="${withdrawalHeight}" fill="#ef4444" opacity="0.8">
              <title>Withdrawals ${date}: $${dateMap[date].withdrawals.toLocaleString()}</title>
            </rect>`;
            
            // Date label (every 5th)
            if (idx % 5 === 0) {
              svg += `<text x="${x + barWidth}" y="${height - margin.bottom + 15}" 
                fill="var(--muted)" font-size="10" text-anchor="middle" transform="rotate(-45 ${x + barWidth} ${height - margin.bottom + 15})">
                ${new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
              </text>`;
            }
          });
          
          // Legend
          svg += `<rect x="${width - 150}" y="20" width="15" height="15" fill="#10b981"/>`;
          svg += `<text x="${width - 130}" y="32" fill="var(--text)" font-size="12">Deposits</text>`;
          svg += `<rect x="${width - 150}" y="40" width="15" height="15" fill="#ef4444"/>`;
          svg += `<text x="${width - 130}" y="52" fill="var(--text)" font-size="12">Withdrawals</text>`;
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading deposit/withdrawal trends:', err));
    },
    
    // ========================================================================
    // 3. PRODUCT & TRADING INSIGHTS
    // ========================================================================
    
    /**
     * Product volume breakdown - Horizontal bar chart
     */
    renderProductVolume: function(containerId, partnerId) {
      fetch(`api/index.php?endpoint=cubes&cube=product_volume&partner_id=${partnerId}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data.sort((a, b) => parseFloat(b.total_volume) - parseFloat(a.total_volume)).slice(0, 8);
          const container = document.getElementById(containerId);
          if (!container) return;
          
          const width = container.clientWidth || 600;
          const height = data.length * 50 + 60;
          const margin = {top: 20, right: 120, bottom: 40, left: 150};
          
          const maxVolume = Math.max(...data.map(d => parseFloat(d.total_volume)));
          
          let svg = `<svg width="${width}" height="${height}">`;
          
          data.forEach((row, idx) => {
            const volume = parseFloat(row.total_volume);
            const barWidth = (volume / maxVolume) * (width - margin.left - margin.right);
            const y = margin.top + idx * 50;
            
            // Bar
            svg += `<rect x="${margin.left}" y="${y}" width="${barWidth}" height="35" 
              fill="#8b5cf6" opacity="0.8">
              <title>${row.asset_type}: $${volume.toLocaleString()} (${row.trade_count} trades, ${row.client_count} clients)</title>
            </rect>`;
            
            // Asset type label
            svg += `<text x="${margin.left - 10}" y="${y + 22}" 
              fill="var(--text)" font-size="13" text-anchor="end">${row.asset_type}</text>`;
            
            // Volume label
            svg += `<text x="${margin.left + barWidth + 5}" y="${y + 22}" 
              fill="var(--text)" font-size="12">$${(volume / 1000000).toFixed(1)}M</text>`;
            
            // Trade count
            svg += `<text x="${margin.left + barWidth + 5}" y="${y + 35}" 
              fill="var(--muted)" font-size="10">${row.trade_count} trades</text>`;
          });
          
          svg += `<text x="${width/2}" y="${height - 10}" fill="var(--muted)" font-size="13" text-anchor="middle" font-weight="600">
            Trading Volume by Product
          </text>`;
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading product volume:', err));
    },
    
    // ========================================================================
    // 4. PERFORMANCE TRENDS
    // ========================================================================
    
    /**
     * Daily performance trends - Multi-line chart
     */
    renderDailyTrends: function(containerId, partnerId, days = 30) {
      fetch(`api/index.php?endpoint=cubes&cube=daily_trends&partner_id=${partnerId}&days=${days}`)
        .then(r => r.json())
        .then(response => {
          if (!response.success || !response.data) return;
          
          const data = response.data.reverse(); // Oldest first
          const container = document.getElementById(containerId);
          if (!container) return;
          
          const width = container.clientWidth || 900;
          const height = 350;
          const margin = {top: 40, right: 120, bottom: 50, left: 70};
          
          let svg = `<svg width="${width}" height="${height}">`;
          
          // Metrics to plot
          const metrics = [
            {key: 'signups', label: 'Signups', color: '#38bdf8', scale: 1},
            {key: 'deposits', label: 'Deposits ($K)', color: '#10b981', scale: 1000},
            {key: 'commissions', label: 'Commissions ($K)', color: '#f59e0b', scale: 1000},
            {key: 'trades', label: 'Trades', color: '#ef4444', scale: 1}
          ];
          
          metrics.forEach((metric, metricIdx) => {
            const values = data.map(d => parseFloat(d[metric.key]) / metric.scale);
            const maxValue = Math.max(...values, 1);
            
            // Draw line
            let path = '';
            data.forEach((row, idx) => {
              const x = margin.left + (idx / (data.length - 1)) * (width - margin.left - margin.right);
              const y = margin.top + (1 - values[idx] / maxValue) * (height - margin.top - margin.bottom);
              path += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
              
              // Points every 5 days
              if (idx % 5 === 0) {
                svg += `<circle cx="${x}" cy="${y}" r="3" fill="${metric.color}">
                  <title>${row.trend_date}: ${metric.label} = ${values[idx].toFixed(2)}</title>
                </circle>`;
              }
            });
            
            svg += `<path d="${path}" fill="none" stroke="${metric.color}" stroke-width="2" opacity="0.8"/>`;
            
            // Legend
            svg += `<rect x="${width - margin.right + 10}" y="${margin.top + metricIdx * 20}" width="12" height="12" fill="${metric.color}"/>`;
            svg += `<text x="${width - margin.right + 25}" y="${margin.top + metricIdx * 20 + 10}" fill="var(--text)" font-size="11">${metric.label}</text>`;
          });
          
          // Axes
          svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="var(--muted)" opacity="0.3"/>`;
          svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="var(--muted)" opacity="0.3"/>`;
          
          // Title
          svg += `<text x="${width/2}" y="20" fill="var(--text)" font-size="16" font-weight="600" text-anchor="middle">
            Daily Performance Trends (Last ${days} Days)
          </text>`;
          
          svg += '</svg>';
          container.innerHTML = svg;
        })
        .catch(err => console.error('Error loading daily trends:', err));
    }
    
  };
})();

