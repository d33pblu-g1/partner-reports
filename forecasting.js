// Forecasting functionality for charts
(function() {
  'use strict';
  
  // Forecasting state management
  const forecastingState = new Map();
  
  /**
   * Generate forecast data for the next 3 months
   */
  function generateForecastData(historicalData, months = 3) {
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length < 2) {
      return [];
    }
    
    // Simple linear regression for forecasting
    const n = historicalData.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = historicalData;
    
    // Calculate slope and intercept
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate forecast for next months
    const forecast = [];
    for (let i = 0; i < months; i++) {
      const futureX = n + i;
      const predicted = slope * futureX + intercept;
      // Add some randomness to make it more realistic
      const variance = Math.abs(predicted) * 0.1; // 10% variance
      const randomFactor = (Math.random() - 0.5) * 2 * variance;
      forecast.push(Math.max(0, predicted + randomFactor));
    }
    
    return forecast;
  }
  
  /**
   * Generate forecast dates for the next 3 months
   */
  function generateForecastDates(months = 3) {
    const dates = [];
    const now = new Date();
    
    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      dates.push(futureDate.toISOString().substring(0, 7)); // YYYY-MM format
    }
    
    return dates;
  }
  
  /**
   * Extend chart with forecast data
   */
  function extendChartWithForecast(chartId, historicalData, chartType = 'line') {
    const container = document.getElementById(chartId);
    if (!container) return;
    
    // Generate forecast data
    const forecastData = generateForecastData(historicalData);
    const forecastDates = generateForecastDates();
    
    if (forecastData.length === 0) {
      console.warn('Unable to generate forecast data');
      return;
    }
    
    // Create extended chart with forecast
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 400;
    const padding = { top: 20, right: 50, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Calculate data ranges
    const allData = [...historicalData, ...forecastData];
    const minValue = Math.min(...allData);
    const maxValue = Math.max(...allData);
    const valueRange = maxValue - minValue;
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.background = '#0b1220';
    svg.style.borderRadius = '8px';
    
    // Draw historical data
    const historicalPoints = historicalData.map((value, index) => {
      const x = padding.left + (index / (historicalData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return { x, y, value };
    });
    
    // Draw forecast data
    const forecastPoints = forecastData.map((value, index) => {
      const x = padding.left + ((historicalData.length + index) / (allData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return { x, y, value };
    });
    
    // Draw historical line
    if (historicalPoints.length > 1) {
      const historicalPath = historicalPoints.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ');
      
      const historicalLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      historicalLine.setAttribute('d', historicalPath);
      historicalLine.setAttribute('stroke', '#38bdf8');
      historicalLine.setAttribute('stroke-width', '3');
      historicalLine.setAttribute('fill', 'none');
      svg.appendChild(historicalLine);
    }
    
    // Draw forecast line (dashed)
    if (forecastPoints.length > 1) {
      const forecastPath = [
        `M ${historicalPoints[historicalPoints.length - 1].x} ${historicalPoints[historicalPoints.length - 1].y}`,
        ...forecastPoints.map(point => `L ${point.x} ${point.y}`)
      ].join(' ');
      
      const forecastLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      forecastLine.setAttribute('d', forecastPath);
      forecastLine.setAttribute('stroke', '#f59e0b');
      forecastLine.setAttribute('stroke-width', '3');
      forecastLine.setAttribute('stroke-dasharray', '5,5');
      forecastLine.setAttribute('fill', 'none');
      svg.appendChild(forecastLine);
    }
    
    // Draw data points
    [...historicalPoints, ...forecastPoints].forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', index < historicalPoints.length ? '#38bdf8' : '#f59e0b');
      svg.appendChild(circle);
      
      // Add tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Value: $${point.value.toLocaleString()}`;
      circle.appendChild(title);
    });
    
    // Draw axes
    drawForecastAxes(svg, padding, chartWidth, chartHeight, minValue, maxValue, historicalData.length);
    
    // Add legend
    const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legend.setAttribute('transform', `translate(${width - 120}, 20)`);
    
    // Historical legend
    const historicalLegend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const histLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    histLine.setAttribute('x1', '0');
    histLine.setAttribute('y1', '0');
    histLine.setAttribute('x2', '20');
    histLine.setAttribute('y2', '0');
    histLine.setAttribute('stroke', '#38bdf8');
    histLine.setAttribute('stroke-width', '3');
    historicalLegend.appendChild(histLine);
    
    const histText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    histText.setAttribute('x', '25');
    histText.setAttribute('y', '0');
    histText.setAttribute('fill', '#e5e7eb');
    histText.setAttribute('font-size', '12');
    histText.textContent = 'Historical';
    historicalLegend.appendChild(histText);
    legend.appendChild(historicalLegend);
    
    // Forecast legend
    const forecastLegend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    forecastLegend.setAttribute('transform', 'translate(0, 20)');
    const foreLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    foreLine.setAttribute('x1', '0');
    foreLine.setAttribute('y1', '0');
    foreLine.setAttribute('x2', '20');
    foreLine.setAttribute('y2', '0');
    foreLine.setAttribute('stroke', '#f59e0b');
    foreLine.setAttribute('stroke-width', '3');
    foreLine.setAttribute('stroke-dasharray', '5,5');
    forecastLegend.appendChild(foreLine);
    
    const foreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    foreText.setAttribute('x', '25');
    foreText.setAttribute('y', '0');
    foreText.setAttribute('fill', '#e5e7eb');
    foreText.setAttribute('font-size', '12');
    foreText.textContent = 'Forecast (3 months)';
    forecastLegend.appendChild(foreText);
    legend.appendChild(forecastLegend);
    
    svg.appendChild(legend);
    
    container.innerHTML = '';
    container.appendChild(svg);
  }
  
  /**
   * Draw axes for forecast chart
   */
  function drawForecastAxes(svg, padding, chartWidth, chartHeight, minValue, maxValue, historicalLength) {
    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', padding.left);
    yAxis.setAttribute('y1', padding.top);
    yAxis.setAttribute('x2', padding.left);
    yAxis.setAttribute('y2', padding.top + chartHeight);
    yAxis.setAttribute('stroke', 'rgba(148,163,184,0.4)');
    yAxis.setAttribute('stroke-width', '2');
    svg.appendChild(yAxis);
    
    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', padding.left);
    xAxis.setAttribute('y1', padding.top + chartHeight);
    xAxis.setAttribute('x2', padding.left + chartWidth);
    xAxis.setAttribute('y2', padding.top + chartHeight);
    xAxis.setAttribute('stroke', 'rgba(148,163,184,0.4)');
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);
    
    // Forecast separator line
    const separatorX = padding.left + (historicalLength / (historicalLength + 3)) * chartWidth;
    const separator = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    separator.setAttribute('x1', separatorX);
    separator.setAttribute('y1', padding.top);
    separator.setAttribute('x2', separatorX);
    separator.setAttribute('y2', padding.top + chartHeight);
    separator.setAttribute('stroke', 'rgba(148,163,184,0.2)');
    separator.setAttribute('stroke-width', '1');
    separator.setAttribute('stroke-dasharray', '2,2');
    svg.appendChild(separator);
  }
  
  /**
   * Initialize forecasting for a chart
   */
  function initForecasting(chartId, dataProvider) {
    const button = document.getElementById(`forecast-${chartId}`);
    if (!button) return;
    
    let isForecasting = false;
    
    button.addEventListener('click', function() {
      if (!isForecasting) {
        // Enable forecasting
        const historicalData = dataProvider();
        if (historicalData && historicalData.length > 0) {
          extendChartWithForecast(chartId, historicalData);
          button.textContent = '📊 Disable Forecasting';
          button.classList.remove('btn-secondary');
          button.classList.add('btn-primary');
          isForecasting = true;
          forecastingState.set(chartId, true);
        }
      } else {
        // Disable forecasting - reload original chart
        button.textContent = '📈 Enable Forecasting';
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');
        isForecasting = false;
        forecastingState.set(chartId, false);
        
        // Trigger chart reload
        const event = new Event('chartReload');
        document.dispatchEvent(event);
      }
    });
  }
  
  /**
   * Sample data providers for different charts
   */
  function getSampleData() {
    // Generate sample historical data (last 6 months)
    const data = [];
    const baseValue = 1000;
    for (let i = 0; i < 6; i++) {
      const trend = Math.sin(i * 0.5) * 200;
      const random = (Math.random() - 0.5) * 100;
      data.push(Math.max(0, baseValue + trend + random));
    }
    return data;
  }
  
  // Initialize forecasting for all charts
  function initAllForecasting() {
    // Home page charts
    initForecasting('6mo-comm', () => {
      // This would normally get data from the actual chart
      return getSampleData();
    });
    
    initForecasting('client-growth', () => {
      return getSampleData().map(x => x * 0.3); // Client growth is typically smaller
    });
    
    initForecasting('deposit-trends', () => {
      return getSampleData().map(x => x * 1.5); // Deposits are typically larger
    });
    
    // Commissions page charts
    initForecasting('commissions-stacked', () => {
      return getSampleData();
    });
    
    initForecasting('monthly-trends', () => {
      return getSampleData();
    });
  }
  
  // Expose functions
  window.Forecasting = {
    init: initAllForecasting,
    extendChart: extendChartWithForecast,
    generateForecast: generateForecastData
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllForecasting);
  } else {
    initAllForecasting();
  }
})();
