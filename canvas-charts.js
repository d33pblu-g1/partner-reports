// Canvas-based Chart Rendering for Better Performance
(function() {
  'use strict';
  
  // Canvas Chart Renderer
  class CanvasChart {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = {
        width: options.width || 800,
        height: options.height || 200,
        padding: options.padding || 24,
        colors: options.colors || ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444'],
        ...options
      };
      
      this.setupCanvas();
      this.bindEvents();
    }
    
    setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      
      this.ctx.scale(dpr, dpr);
      this.ctx.textBaseline = 'middle';
    }
    
    bindEvents() {
      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        this.setupCanvas();
        if (this.data) {
          this.render();
        }
      });
      resizeObserver.observe(this.canvas);
    }
    
    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    render() {
      this.clear();
      // Override in subclasses
    }
  }
  
  // Bar Chart Implementation
  class BarChart extends CanvasChart {
    render() {
      if (!this.data || this.data.length === 0) return;
      
      super.render();
      
      const { width, height, padding } = this.options;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      const maxValue = Math.max(...this.data.map(d => d.value));
      const barWidth = Math.max(10, (chartWidth - (this.data.length - 1) * 8) / this.data.length);
      
      // Draw bars
      this.data.forEach((item, index) => {
        const x = padding + index * (barWidth + 8);
        const barHeight = (item.value / maxValue) * chartHeight;
        const y = height - padding - barHeight;
        
        // Bar
        this.ctx.fillStyle = this.options.colors[index % this.options.colors.length];
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Rounded corners effect
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, barWidth, barHeight, 4);
        this.ctx.clip();
        this.ctx.fillRect(x, y, barWidth, barHeight);
        this.ctx.restore();
        
        // Label
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.label, x + barWidth / 2, height - padding + 14);
      });
      
      // Draw axis
      this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, height - padding);
      this.ctx.lineTo(width - padding, height - padding);
      this.ctx.stroke();
    }
    
    setData(data) {
      this.data = data;
      this.render();
    }
  }
  
  // Pie Chart Implementation
  class PieChart extends CanvasChart {
    render() {
      if (!this.data || this.data.length === 0) return;
      
      super.render();
      
      const { width, height } = this.options;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 20;
      
      const total = this.data.reduce((sum, item) => sum + item.value, 0);
      let currentAngle = -Math.PI / 2;
      
      // Draw pie slices
      this.data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        this.ctx.fillStyle = this.options.colors[index % this.options.colors.length];
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add stroke for separation
        this.ctx.strokeStyle = '#0b1220';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        currentAngle += sliceAngle;
      });
      
      // Draw legend
      this.drawLegend();
    }
    
    drawLegend() {
      const { width, height } = this.options;
      let legendY = height + 20;
      
      this.data.forEach((item, index) => {
        const legendX = 20 + (index % 2) * 100;
        const legendRow = Math.floor(index / 2);
        
        // Color box
        this.ctx.fillStyle = this.options.colors[index % this.options.colors.length];
        this.ctx.fillRect(legendX, legendY + legendRow * 20, 12, 12);
        
        // Label
        this.ctx.fillStyle = '#e5e7eb';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${item.label} (${item.value})`, legendX + 18, legendY + legendRow * 20 + 6);
      });
    }
    
    setData(data) {
      this.data = data;
      this.render();
    }
  }
  
  // Line Chart Implementation
  class LineChart extends CanvasChart {
    render() {
      if (!this.data || this.data.length === 0) return;
      
      super.render();
      
      const { width, height, padding } = this.options;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      const maxValue = Math.max(...this.data.map(d => d.value));
      const minValue = Math.min(...this.data.map(d => d.value));
      const valueRange = maxValue - minValue || 1;
      
      // Draw grid lines
      this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      this.ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, y);
        this.ctx.lineTo(width - padding, y);
        this.ctx.stroke();
      }
      
      // Draw line
      this.ctx.strokeStyle = this.options.colors[0];
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      this.data.forEach((item, index) => {
        const x = padding + (chartWidth / (this.data.length - 1)) * index;
        const y = height - padding - ((item.value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      
      this.ctx.stroke();
      
      // Draw points
      this.data.forEach((item, index) => {
        const x = padding + (chartWidth / (this.data.length - 1)) * index;
        const y = height - padding - ((item.value - minValue) / valueRange) * chartHeight;
        
        this.ctx.fillStyle = this.options.colors[0];
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Labels
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.label, x, height - padding + 14);
      });
    }
    
    setData(data) {
      this.data = data;
      this.render();
    }
  }
  
  // Chart Factory
  class ChartFactory {
    static create(type, canvas, options = {}) {
      switch (type) {
        case 'bar':
          return new BarChart(canvas, options);
        case 'pie':
          return new PieChart(canvas, options);
        case 'line':
          return new LineChart(canvas, options);
        default:
          throw new Error(`Unknown chart type: ${type}`);
      }
    }
  }
  
  // High-performance chart rendering functions
  function renderSixMonthChartCanvas(db, partnerId, container) {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '200px';
    canvas.style.background = '#0b1220';
    canvas.style.borderRadius = '8px';
    
    container.innerHTML = '';
    container.appendChild(canvas);
    
    const chart = ChartFactory.create('bar', canvas, {
      width: container.clientWidth || 640,
      height: 200,
      colors: ['#38bdf8', '#22c55e']
    });
    
    // Process data
    const trades = Array.isArray(db.trades) ? db.trades : [];
    const clients = Array.isArray(db.clients) ? db.clients : [];
    const partnerClientIds = new Set((partnerId ? clients.filter(c => c.partnerId === partnerId) : clients).map(c => c.customerId));
    
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    
    const groups = {};
    months.forEach(k => { groups[k] = []; });
    
    trades.forEach(trade => {
      if (!partnerClientIds.has(trade.customerId)) return;
      const dt = new Date(trade.dateTime);
      const k = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
      if (groups[k]) groups[k].push(trade);
    });
    
    const series = months.map(k => ({
      key: k,
      label: new Date(k + '-01').toLocaleString(undefined, { month: 'short' }),
      value: (groups[k] || []).reduce((sum, t) => sum + (t.commission || 0), 0)
    }));
    
    chart.setData(series);
  }
  
  function renderTierChartCanvas(db, partnerId, container) {
    const canvas = document.createElement('canvas');
    canvas.style.width = '200px';
    canvas.style.height = '200px';
    
    container.innerHTML = '';
    container.appendChild(canvas);
    
    const chart = ChartFactory.create('pie', canvas, {
      width: 200,
      height: 200,
      colors: ['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2', '#94a3b8']
    });
    
    // Process data
    const clients = Array.isArray(db.clients) ? db.clients : [];
    const filteredClients = partnerId ? clients.filter(c => c.partnerId === partnerId) : clients;
    
    const tierCounts = {};
    filteredClients.forEach(client => {
      const tier = client.tier || 'Unknown';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });
    
    const data = Object.entries(tierCounts).map(([tier, count]) => ({
      label: tier,
      value: count
    }));
    
    chart.setData(data);
  }
  
  // Expose canvas chart functions
  window.CanvasCharts = {
    ChartFactory,
    BarChart,
    PieChart,
    LineChart,
    renderSixMonthChartCanvas,
    renderTierChartCanvas
  };
})();
