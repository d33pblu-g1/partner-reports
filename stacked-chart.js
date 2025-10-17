// Stacked Bar Chart Renderer
(function() {
  'use strict';
  
  /**
   * Render stacked bar chart
   */
  function renderStackedBarChart(container, data, options = {}) {
    if (!data || !data.dates || !data.series || data.dates.length === 0) {
      container.innerHTML = '<p class="muted">No data available</p>';
      return;
    }
    
    const width = options.width || container.clientWidth || 800;
    const height = options.height || 400;
    const padding = { top: 20, right: 150, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Calculate totals for each date
    const totals = data.dates.map((date, idx) => {
      return data.series.reduce((sum, series) => sum + (series.data[idx] || 0), 0);
    });
    
    const maxTotal = Math.max(...totals, 1);
    const barWidth = Math.max(10, chartWidth / data.dates.length - 8);
    const barGap = 4;
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.background = '#0b1220';
    svg.style.borderRadius = '8px';
    
    // Draw Y-axis
    drawYAxis(svg, padding, chartHeight, maxTotal);
    
    // Draw X-axis
    drawXAxis(svg, padding, chartWidth, chartHeight, data.dates);
    
    // Draw stacked bars
    drawStackedBars(svg, data, padding, chartWidth, chartHeight, barWidth, barGap, maxTotal);
    
    // Draw legend
    drawLegend(svg, data.series, width, padding);
    
    container.innerHTML = '';
    container.appendChild(svg);
  }
  
  /**
   * Draw Y-axis with grid lines
   */
  function drawYAxis(svg, padding, chartHeight, maxTotal) {
    const steps = 5;
    const stepValue = maxTotal / steps;
    
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + chartHeight - (i * chartHeight / steps);
      const value = i * stepValue;
      
      // Grid line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padding.left);
      line.setAttribute('y1', y);
      line.setAttribute('x2', padding.left + chartHeight);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'rgba(148,163,184,0.1)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
      
      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', padding.left - 10);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#94a3b8');
      text.setAttribute('font-size', '11');
      text.textContent = '$' + formatNumber(value);
      svg.appendChild(text);
    }
  }
  
  /**
   * Draw X-axis with labels
   */
  function drawXAxis(svg, padding, chartWidth, chartHeight, dates) {
    const axisY = padding.top + chartHeight;
    
    // Axis line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padding.left);
    line.setAttribute('y1', axisY);
    line.setAttribute('x2', padding.left + chartWidth);
    line.setAttribute('y2', axisY);
    line.setAttribute('stroke', 'rgba(148,163,184,0.4)');
    line.setAttribute('stroke-width', '2');
    svg.appendChild(line);
    
    // Date labels
    const barWidth = chartWidth / dates.length;
    dates.forEach((date, idx) => {
      const x = padding.left + (idx * barWidth) + (barWidth / 2);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', axisY + 15);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#94a3b8');
      text.setAttribute('font-size', '10');
      text.setAttribute('transform', `rotate(45, ${x}, ${axisY + 15})`);
      text.textContent = date;
      svg.appendChild(text);
    });
  }
  
  /**
   * Draw stacked bars
   */
  function drawStackedBars(svg, data, padding, chartWidth, chartHeight, barWidth, barGap, maxTotal) {
    const numBars = data.dates.length;
    const totalWidth = chartWidth;
    const actualBarWidth = Math.min(barWidth, (totalWidth / numBars) - barGap);
    
    data.dates.forEach((date, dateIdx) => {
      let cumulativeHeight = 0;
      const x = padding.left + (dateIdx * (totalWidth / numBars)) + barGap;
      
      // Draw each series segment
      data.series.forEach((series, seriesIdx) => {
        const value = series.data[dateIdx] || 0;
        if (value === 0) return;
        
        const segmentHeight = (value / maxTotal) * chartHeight;
        const y = padding.top + chartHeight - cumulativeHeight - segmentHeight;
        
        // Bar segment
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', actualBarWidth);
        rect.setAttribute('height', segmentHeight);
        rect.setAttribute('fill', series.color);
        rect.setAttribute('rx', seriesIdx === 0 ? '0' : '0'); // Round top corners
        
        // Tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${series.name}\n${date}\n$${value.toLocaleString()}`;
        rect.appendChild(title);
        
        svg.appendChild(rect);
        
        cumulativeHeight += segmentHeight;
      });
      
      // Total label on top of bar if there's enough space
      if (cumulativeHeight > 20) {
        const total = data.series.reduce((sum, s) => sum + (s.data[dateIdx] || 0), 0);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + actualBarWidth / 2);
        text.setAttribute('y', padding.top + chartHeight - cumulativeHeight - 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#e5e7eb');
        text.setAttribute('font-size', '9');
        text.setAttribute('font-weight', '600');
        text.textContent = '$' + formatNumber(total);
        svg.appendChild(text);
      }
    });
  }
  
  /**
   * Draw legend
   */
  function drawLegend(svg, series, width, padding) {
    const legendX = width - padding.right + 10;
    let legendY = padding.top;
    
    series.forEach((s, idx) => {
      const y = legendY + (idx * 25);
      
      // Color box
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', legendX);
      rect.setAttribute('y', y);
      rect.setAttribute('width', 14);
      rect.setAttribute('height', 14);
      rect.setAttribute('fill', s.color);
      rect.setAttribute('rx', '2');
      svg.appendChild(rect);
      
      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', legendX + 20);
      text.setAttribute('y', y + 7);
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#e5e7eb');
      text.setAttribute('font-size', '11');
      text.textContent = s.name;
      svg.appendChild(text);
    });
  }
  
  /**
   * Format number with K/M suffix
   */
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }
  
  /**
   * Load and render commission chart
   */
  async function loadCommissionChart(partnerId, periodType) {
    const container = document.getElementById('commissions-stacked-chart');
    if (!container) return;
    
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px;"><div class="loading-spinner"></div><span style="margin-left: 10px; color: var(--muted);">Loading chart data...</span></div>';
    
    try {
      const params = new URLSearchParams();
      params.append('chart', 'stacked');
      params.append('period_type', periodType);
      params.append('limit', periodType === 'daily' ? '30' : '12');
      if (partnerId) params.append('partner_id', partnerId);
      
      const response = await fetch(`api/index.php?${params.toString()}&endpoint=commissions`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load chart data');
      }
      
      renderStackedBarChart(container, result.data);
    } catch (error) {
      console.error('Failed to load commission chart:', error);
      container.innerHTML = '<div class="chart-error">Failed to load chart data. Please try again.</div>';
    }
  }
  
  /**
   * Initialize commission chart
   */
  function initCommissionChart() {
    const container = document.getElementById('commissions-stacked-chart');
    if (!container) return;
    
    const partnerSelect = document.getElementById('partnerSelect');
    const periodRadios = document.querySelectorAll('input[name="periodType"]');
    
    function updateChart() {
      const partnerId = partnerSelect ? partnerSelect.value : null;
      const periodType = document.querySelector('input[name="periodType"]:checked')?.value || 'daily';
      loadCommissionChart(partnerId, periodType);
    }
    
    // Initial load
    updateChart();
    
    // Listen for changes
    if (partnerSelect) {
      partnerSelect.addEventListener('change', updateChart);
    }
    
    periodRadios.forEach(radio => {
      radio.addEventListener('change', updateChart);
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateChart, 250);
    });
  }
  
  // Expose functions
  window.StackedChart = {
    render: renderStackedBarChart,
    init: initCommissionChart
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommissionChart);
  } else {
    initCommissionChart();
  }
})();
