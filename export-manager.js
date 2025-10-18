/**
 * Export Functionality Module
 * Comprehensive export capabilities for reports and data
 */

(function() {
  'use strict';
  
  window.ExportManager = {
    
    // ========================================================================
    // 1. PDF EXPORT
    // ========================================================================
    
    /**
     * Export dashboard as PDF
     */
    exportToPDF: function(partnerId, options = {}) {
      const loadingOverlay = window.EnhancedUX ? 
        window.EnhancedUX.showLoadingState(document.body, 'Generating PDF report...') : null;
      
      // Collect all chart data
      const chartData = this.collectChartData();
      const metrics = this.collectMetrics(partnerId);
      
      // Generate PDF content
      const pdfContent = this.generatePDFContent(partnerId, metrics, chartData, options);
      
      // Create and download PDF
      this.downloadPDF(pdfContent, `partner-report-${partnerId || 'all'}-${this.getDateString()}.pdf`)
        .then(() => {
          if (loadingOverlay) {
            window.EnhancedUX.hideLoadingState(loadingOverlay);
          }
          if (window.EnhancedUX) {
            window.EnhancedUX.showNotification('PDF report generated successfully!', 'success');
          }
        })
        .catch(err => {
          console.error('PDF export failed:', err);
          if (loadingOverlay) {
            window.EnhancedUX.hideLoadingState(loadingOverlay);
          }
          if (window.EnhancedUX) {
            window.EnhancedUX.showNotification('PDF export failed. Please try again.', 'error');
          }
        });
    },
    
    collectChartData: function() {
      const charts = {};
      
      // Collect SVG charts
      document.querySelectorAll('svg').forEach((svg, index) => {
        charts[`chart_${index}`] = {
          type: 'svg',
          content: new XMLSerializer().serializeToString(svg),
          title: this.getChartTitle(svg)
        };
      });
      
      // Collect canvas charts
      document.querySelectorAll('canvas').forEach((canvas, index) => {
        charts[`canvas_${index}`] = {
          type: 'canvas',
          content: canvas.toDataURL('image/png'),
          title: this.getChartTitle(canvas)
        };
      });
      
      return charts;
    },
    
    collectMetrics: function(partnerId) {
      const metrics = {};
      
      // Collect KPI metrics
      const kpiElements = document.querySelectorAll('[id^="metric-"]');
      kpiElements.forEach(el => {
        metrics[el.id] = el.textContent;
      });
      
      // Collect partner info
      const partnerTier = document.getElementById('partner-tier-display');
      if (partnerTier) {
        metrics.partnerTier = partnerTier.textContent;
      }
      
      return metrics;
    },
    
    generatePDFContent: function(partnerId, metrics, chartData, options) {
      const date = new Date().toLocaleDateString();
      const partnerName = partnerId ? `Partner ${partnerId}` : 'All Partners';
      
      let content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Partner Report - ${partnerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; color: black; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; font-size: 28px; }
            .header p { margin: 5px 0; color: #666; }
            .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .metric-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px; }
            .metric-label { font-size: 14px; color: #666; }
            .chart-section { margin: 30px 0; page-break-inside: avoid; }
            .chart-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
            .chart-container { text-align: center; margin: 20px 0; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #dee2e6; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Partner Report</h1>
            <p>${partnerName} • Generated on ${date}</p>
            <p>Partner Tier: ${metrics.partnerTier || 'N/A'}</p>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${metrics['metric-lt-comm'] || 'N/A'}</div>
              <div class="metric-label">Lifetime Commissions</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics['metric-lt-clients'] || 'N/A'}</div>
              <div class="metric-label">Total Clients</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics['metric-mtd-comm'] || 'N/A'}</div>
              <div class="metric-label">Month-to-Date</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics['metric-mtd-clients'] || 'N/A'}</div>
              <div class="metric-label">New Clients (MTD)</div>
            </div>
          </div>
      `;
      
      // Add charts
      Object.entries(chartData).forEach(([key, chart]) => {
        content += `
          <div class="chart-section">
            <div class="chart-title">${chart.title || 'Chart'}</div>
            <div class="chart-container">
              ${chart.type === 'svg' ? chart.content : `<img src="${chart.content}" style="max-width: 100%; height: auto;">`}
            </div>
          </div>
        `;
      });
      
      content += `
          <div class="footer">
            <p>Generated by Partner Report System • ${date}</p>
            <p>For internal use only</p>
          </div>
        </body>
        </html>
      `;
      
      return content;
    },
    
    downloadPDF: function(content, filename) {
      return new Promise((resolve, reject) => {
        // Create a new window for PDF generation
        const printWindow = window.open('', '_blank');
        printWindow.document.write(content);
        printWindow.document.close();
        
        // Wait for content to load
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            resolve();
          }, 1000);
        };
        
        printWindow.onerror = () => {
          reject(new Error('Failed to open print window'));
        };
      });
    },
    
    // ========================================================================
    // 2. EXCEL EXPORT
    // ========================================================================
    
    /**
     * Export data to Excel
     */
    exportToExcel: function(partnerId, dataType = 'all') {
      const loadingOverlay = window.EnhancedUX ? 
        window.EnhancedUX.showLoadingState(document.body, 'Preparing Excel export...') : null;
      
      this.fetchDataForExport(partnerId, dataType)
        .then(data => {
          const workbook = this.createExcelWorkbook(data);
          this.downloadExcel(workbook, `partner-data-${partnerId || 'all'}-${this.getDateString()}.xlsx`);
          
          if (loadingOverlay) {
            window.EnhancedUX.hideLoadingState(loadingOverlay);
          }
          if (window.EnhancedUX) {
            window.EnhancedUX.showNotification('Excel file exported successfully!', 'success');
          }
        })
        .catch(err => {
          console.error('Excel export failed:', err);
          if (loadingOverlay) {
            window.EnhancedUX.hideLoadingState(loadingOverlay);
          }
          if (window.EnhancedUX) {
            window.EnhancedUX.showNotification('Excel export failed. Please try again.', 'error');
          }
        });
    },
    
    fetchDataForExport: function(partnerId, dataType) {
      const endpoints = {
        all: ['partners', 'clients', 'trades', 'deposits'],
        clients: ['clients'],
        trades: ['trades'],
        commissions: ['commissions']
      };
      
      const requests = (endpoints[dataType] || endpoints.all).map(endpoint => 
        fetch(`api/index.php?endpoint=${endpoint}${partnerId ? `&partner_id=${partnerId}` : ''}`)
          .then(r => r.json())
          .then(response => ({ endpoint, data: response.data || [] }))
      );
      
      return Promise.all(requests);
    },
    
    createExcelWorkbook: function(data) {
      // Simple CSV format for Excel compatibility
      let csvContent = '';
      
      data.forEach(({ endpoint, data: sheetData }) => {
        if (sheetData.length === 0) return;
        
        csvContent += `\n\n=== ${endpoint.toUpperCase()} ===\n`;
        
        // Headers
        const headers = Object.keys(sheetData[0]);
        csvContent += headers.join(',') + '\n';
        
        // Data rows
        sheetData.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          });
          csvContent += values.join(',') + '\n';
        });
      });
      
      return csvContent;
    },
    
    downloadExcel: function(content, filename) {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    },
    
    // ========================================================================
    // 3. CHART EXPORT
    // ========================================================================
    
    /**
     * Export individual chart as image
     */
    exportChart: function(chartElement, format = 'png', filename = null) {
      if (!chartElement) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = chartElement.clientWidth || 800;
      canvas.height = chartElement.clientHeight || 600;
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Handle SVG charts
      const svg = chartElement.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          this.downloadImage(canvas, format, filename);
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      } else {
        // Handle canvas charts
        const existingCanvas = chartElement.querySelector('canvas');
        if (existingCanvas) {
          ctx.drawImage(existingCanvas, 0, 0, canvas.width, canvas.height);
          this.downloadImage(canvas, format, filename);
        }
      }
    },
    
    downloadImage: function(canvas, format, filename) {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataURL = canvas.toDataURL(mimeType);
      
      const link = document.createElement('a');
      link.download = filename || `chart-${this.getDateString()}.${format}`;
      link.href = dataURL;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    // ========================================================================
    // 4. UTILITY FUNCTIONS
    // ========================================================================
    
    getChartTitle: function(element) {
      const titleElement = element.closest('.card').querySelector('h3');
      return titleElement ? titleElement.textContent : 'Chart';
    },
    
    getDateString: function() {
      return new Date().toISOString().split('T')[0];
    },
    
    // ========================================================================
    // 5. INITIALIZATION
    // ========================================================================
    
    /**
     * Initialize export functionality
     */
    init: function() {
      // Add export buttons to charts
      this.addExportButtons();
      
      // Add global export shortcuts
      this.addExportShortcuts();
      
      console.log('✓ Export Manager initialized');
    },
    
    addExportButtons: function() {
      const charts = document.querySelectorAll('.card[id$="-chart"], .card:has(svg), .card:has(canvas)');
      
      charts.forEach(chart => {
        const exportBtn = document.createElement('button');
        exportBtn.innerHTML = '📊 Export';
        exportBtn.className = 'export-btn';
        exportBtn.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: var(--accent);
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        `;
        
        exportBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.exportChart(chart);
        });
        
        exportBtn.addEventListener('mouseenter', () => {
          exportBtn.style.opacity = '1';
        });
        
        exportBtn.addEventListener('mouseleave', () => {
          exportBtn.style.opacity = '0.8';
        });
        
        chart.style.position = 'relative';
        chart.appendChild(exportBtn);
      });
    },
    
    addExportShortcuts: function() {
      // Add export menu to page
      const exportMenu = document.createElement('div');
      exportMenu.id = 'export-menu';
      exportMenu.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: none;
      `;
      
      exportMenu.innerHTML = `
        <div style="background: var(--panel); border: 1px solid rgba(148,163,184,0.2); border-radius: 8px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <h4 style="margin: 0 0 12px; color: var(--text); font-size: 14px;">Export Options</h4>
          <button onclick="window.ExportManager.exportToPDF()" style="display: block; width: 100%; margin-bottom: 8px; padding: 8px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">📄 Export PDF</button>
          <button onclick="window.ExportManager.exportToExcel()" style="display: block; width: 100%; margin-bottom: 8px; padding: 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">📊 Export Excel</button>
          <button onclick="document.getElementById('export-menu').style.display='none'" style="display: block; width: 100%; padding: 8px; background: var(--muted); color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
        </div>
      `;
      
      document.body.appendChild(exportMenu);
      
      // Add export trigger button
      const exportTrigger = document.createElement('button');
      exportTrigger.innerHTML = '📤 Export';
      exportTrigger.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        z-index: 999;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      
      exportTrigger.addEventListener('click', () => {
        exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
      });
      
      document.body.appendChild(exportTrigger);
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ExportManager.init());
  } else {
    window.ExportManager.init();
  }
  
})();
