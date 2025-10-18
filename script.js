(function () {
  function setActiveNav() {
    var path = (location.pathname.split('/').pop() || '').toLowerCase();
    var links = document.querySelectorAll('nav.site-nav a, nav.side-nav a');
    links.forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      var isActive = href === path || (href.endsWith('index.html') && (path === '' || path === 'index.html'));
      if (isActive) a.classList.add('active');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setActiveNav);
  } else {
    setActiveNav();
  }
})();

// Update tier tag on all pages
function updatePartnerTier(partnerId) {
  var tierDisplay = document.getElementById('partner-tier-display');
  if (!tierDisplay) return;
  
  if (!partnerId) {
    tierDisplay.textContent = '—';
    tierDisplay.className = 'tier-tag';
    return;
  }
  
  // Fetch partner info from API
  fetch('api/index.php?endpoint=partners')
    .then(function(r) { return r.json(); })
    .then(function(response) {
      if (response.success && response.data) {
        var partner = response.data.find(function(p) { return p.partner_id === partnerId; });
        if (partner) {
          tierDisplay.textContent = partner.tier || '—';
          // Remove existing tier classes
          tierDisplay.className = 'tier-tag';
          // Add appropriate tier class
          if (partner.tier && partner.tier !== '—') {
            tierDisplay.classList.add(partner.tier.toLowerCase());
          }
        } else {
          tierDisplay.textContent = '—';
          tierDisplay.className = 'tier-tag';
        }
      }
    })
    .catch(function(err) {
      console.error('Error loading partner tier:', err);
      tierDisplay.textContent = '—';
      tierDisplay.className = 'tier-tag';
    });
}

  // Load country manager information
  function loadCountryManagerInfo(partnerId) {
    if (!partnerId) return;
    
    fetch('api/index.php?endpoint=partners&partner_id=' + partnerId)
      .then(function(r) { return r.json(); })
      .then(function(response) {
        if (response.success && response.data && response.data.length > 0) {
          var partner = response.data[0];
          var managerNameEl = document.getElementById('country-manager-name');
          var managerTelEl = document.getElementById('country-manager-tel');
          
          if (managerNameEl) {
            managerNameEl.textContent = partner.country_manager || 'Country Manager';
          }
          
          if (managerTelEl) {
            managerTelEl.textContent = partner.country_manager_tel || '+971521462917';
          }
          
          // Update WhatsApp link with actual phone number
          var whatsappLink = document.querySelector('.whatsapp-link');
          if (whatsappLink && partner.country_manager_tel) {
            var phoneNumber = partner.country_manager_tel.replace(/[^\d]/g, '');
            whatsappLink.href = 'https://wa.me/' + phoneNumber;
          }
        }
      })
      .catch(function(err) {
        console.error('Error loading country manager info:', err);
      });
  }

  // Update chart data attributes for lazy loading
  function updateChartDataAttributes(partnerId) {
    var chartElement = document.getElementById('chart-6mo-comm');
    if (chartElement) {
      chartElement.setAttribute('data-partner-id', partnerId);
    }
  }

// Populate country dropdown based on partner selection
function populateCountryDropdown(partnerId) {
  var countrySelect = document.getElementById('countryFilter');
  if (!countrySelect) return;
  
  // Clear existing options except "All countries"
  while (countrySelect.children.length > 1) {
    countrySelect.removeChild(countrySelect.lastChild);
  }
  
  if (!partnerId) {
    console.log('No partner selected for country filter');
    return;
  }
  
  // Fetch countries for this partner from cube
  fetch('api/index.php?endpoint=cubes&cube=partner_countries&partner_id=' + partnerId)
    .then(function(r) { return r.json(); })
    .then(function(response) {
      if (response.success && response.data && response.data.length > 0) {
        response.data.forEach(function(item) {
          var opt = document.createElement('option');
          opt.value = item.country;
          opt.textContent = item.country + ' (' + item.client_count + ' clients)';
          countrySelect.appendChild(opt);
        });
        console.log('✓ Loaded ' + response.data.length + ' countries for partner ' + partnerId);
      } else {
        console.log('No countries found for partner ' + partnerId);
      }
    })
    .catch(function(err) {
      console.error('Error loading countries:', err);
    });
}

// Populate partner select on all pages and remember selection
(function () {
  function populatePartnerSelect() {
    var select = document.getElementById('partnerSelect');
    if (!select) return;
    
    // Show loading state
    var loadingOption = document.createElement('option');
    loadingOption.textContent = 'Loading partners...';
    loadingOption.disabled = true;
    
    // Clear existing options except "All partners"
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }
    select.appendChild(loadingOption);
    
    // Load partners from API
    window.ApiManager.loadPartners()
      .then(function (partners) {
        // Remove loading option
        if (loadingOption.parentNode) {
          loadingOption.parentNode.removeChild(loadingOption);
        }
        
        if (!Array.isArray(partners) || partners.length === 0) {
          var noDataOption = document.createElement('option');
          noDataOption.textContent = 'No partners found';
          noDataOption.disabled = true;
          select.appendChild(noDataOption);
          console.warn('No partners data available');
          return;
        }
        
        // Populate with partners
        partners.forEach(function (p) {
          if (!p || !p.partner_id) return;
          var opt = document.createElement('option');
          opt.value = p.partner_id;
          opt.textContent = p.name + ' (' + p.partner_id + ')';
          select.appendChild(opt);
        });
        
        console.log('✓ Loaded ' + partners.length + ' partners into dropdown');
        
        // Restore saved selection
        var saved = localStorage.getItem('selectedPartnerId') || '';
        if (saved && select.value !== saved) {
          select.value = saved;
          // Trigger change event to update page
          var event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
        }
        
        // Also update tier tag on initial load
        setTimeout(function() {
          updatePartnerTier(select.value);
          loadCountryManagerInfo(select.value);
          updateChartDataAttributes(select.value);
        }, 100);
        
        // Save selection on change and populate country dropdown
        select.addEventListener('change', function () {
          localStorage.setItem('selectedPartnerId', select.value);
          // Update tier tag on all pages
          updatePartnerTier(select.value);
          // Populate country dropdown if it exists on this page
          if (document.getElementById('countryFilter')) {
            populateCountryDropdown(select.value);
          }
          // Load country manager info
          loadCountryManagerInfo(select.value);
          // Update chart data attributes
          updateChartDataAttributes(select.value);
        });
      })
      .catch(function (error) {
        // Remove loading option
        if (loadingOption.parentNode) {
          loadingOption.parentNode.removeChild(loadingOption);
        }
        
        var errorOption = document.createElement('option');
        errorOption.textContent = 'Error loading partners';
        errorOption.disabled = true;
        select.appendChild(errorOption);
        console.error('Failed to load partners:', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populatePartnerSelect);
  } else {
    populatePartnerSelect();
  }
})();

// Home metrics: compute from database.json and partner selection
(function () {
  function fmtCurrency(n) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0); } catch (_) { return '$' + (n||0).toFixed(0); } }
  function fmtNumber(n) { try { return new Intl.NumberFormat().format(n || 0); } catch (_) { return String(n||0); } }

  function computeMetrics(db, partnerId) {
    var clients = Array.isArray(db.clients) ? db.clients : [];
    var trades = Array.isArray(db.trades) ? db.trades : [];
    var deposits = Array.isArray(db.deposits) ? db.deposits : [];
    var partners = Array.isArray(db.partners) ? db.partners : [];

    var selectedPartner = partners.find(function (p) { return p.partnerId === partnerId; });
    var partnerClients = partnerId ? clients.filter(function (c) { return c.partnerId === partnerId; }) : clients;
    var partnerClientIds = new Set(partnerClients.map(function (c) { return c.customerId; }));

    var relatedTrades = trades.filter(function (t) { return partnerClientIds.has(t.customerId); });
    var relatedDeposits = deposits.filter(function (d) { return partnerClientIds.has(d.customerId); });

    // Lifetime metrics
    var ltClients = partnerClients.length;
    var ltDeposits = relatedDeposits.reduce(function (sum, d) { return sum + (d.value || 0); }, 0);
    var ltCommissions = relatedTrades.reduce(function (sum, t) { return sum + (t.commission || 0); }, 0);
    var ltVolume = relatedTrades.length; // Using trade count as proxy for volume

    // Monthly metrics for current calendar month
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    function isThisMonth(dtStr) {
      var dt = new Date(dtStr);
      return dt >= monthStart && dt <= now;
    }
    var mTrades = relatedTrades.filter(function (t) { return isThisMonth(t.dateTime); });
    var mDeposits = relatedDeposits.filter(function (d) { return isThisMonth(d.dateTime); });
    var mClients = partnerClients.filter(function (c) { return isThisMonth(c.joinDate); });

    var mtdComm = mTrades.reduce(function (s, t) { return s + (t.commission || 0); }, 0);
    var mtdVolume = mTrades.length; // proxy
    var mtdDeposits = mDeposits.reduce(function (s, d) { return s + (d.value || 0); }, 0);
    var mtdClients = mClients.length;

    return {
      partnerName: selectedPartner ? selectedPartner.name : 'All partners',
      partnerTier: selectedPartner ? selectedPartner.tier : '—',
      ltClients: ltClients,
      ltDeposits: ltDeposits,
      ltCommissions: ltCommissions,
      ltVolume: ltVolume,
      mtdComm: mtdComm,
      mtdVolume: mtdVolume,
      mtdDeposits: mtdDeposits,
      mtdClients: mtdClients
    };
  }

  function renderMetrics(metrics) {
    var byId = function (id) { return document.getElementById(id); };
    if (!byId('metric-lt-comm')) return; // Not on home
    byId('metric-lt-comm').textContent = fmtCurrency(metrics.ltCommissions);
    byId('metric-lt-volume').textContent = fmtNumber(metrics.ltVolume);
    byId('metric-lt-deposits').textContent = fmtCurrency(metrics.ltDeposits);
    byId('metric-lt-clients').textContent = fmtNumber(metrics.ltClients);
    byId('metric-mtd-comm').textContent = fmtCurrency(metrics.mtdComm);
    byId('metric-mtd-volume').textContent = fmtNumber(metrics.mtdVolume);
    byId('metric-mtd-deposits').textContent = fmtCurrency(metrics.mtdDeposits);
    byId('metric-mtd-clients').textContent = fmtNumber(metrics.mtdClients);
    
    // Update tier tag with proper styling
    var tierDisplay = byId('partner-tier-display');
    if (tierDisplay) {
      tierDisplay.textContent = metrics.partnerTier;
      // Remove existing tier classes
      tierDisplay.className = 'tier-tag';
      // Add appropriate tier class
      if (metrics.partnerTier && metrics.partnerTier !== '—') {
        tierDisplay.classList.add(metrics.partnerTier.toLowerCase());
      }
    }
  }

  function initHomeMetrics() {
    var select = document.getElementById('partnerSelect');
    
    function update() {
      var partnerId = select ? select.value : '';
      
      // Show loading state
      var byId = function (id) { return document.getElementById(id); };
      if (byId('metric-lt-comm')) {
        byId('metric-lt-comm').textContent = '⏳';
        byId('metric-mtd-comm').textContent = '⏳';
      }
      
      // If no partner selected, show placeholder
      if (!partnerId) {
        if (byId('metric-lt-comm')) {
          byId('metric-lt-comm').textContent = '—';
          byId('metric-lt-volume').textContent = '—';
          byId('metric-lt-deposits').textContent = '—';
          byId('metric-lt-clients').textContent = '—';
          byId('metric-mtd-comm').textContent = '—';
          byId('metric-mtd-volume').textContent = '—';
          byId('metric-mtd-deposits').textContent = '—';
          byId('metric-mtd-clients').textContent = '—';
        }
        return;
      }
      
      // Load metrics from API (uses cube for speed)
      window.ApiManager.loadMetrics(partnerId)
        .then(function(metrics) {
          console.log('✓ Loaded metrics for partner ' + partnerId + ':', metrics);
          
          // Transform API response to match expected format
          var transformedMetrics = {
            partnerTier: metrics.partnerTier || '—',
            ltCommissions: metrics.ltCommissions || 0,
            ltVolume: metrics.ltVolume || 0,
            ltDeposits: metrics.ltDeposits || 0,
            ltClients: metrics.ltClients || 0,
            mtdComm: metrics.mtdComm || 0,
            mtdVolume: metrics.mtdVolume || 0,
            mtdDeposits: metrics.mtdDeposits || 0,
            mtdClients: metrics.mtdClients || 0,
            last6Months: metrics.last6Months || [0,0,0,0,0,0]
          };
          
          renderMetrics(transformedMetrics);
          
          // Initialize advanced charts
          if (window.AdvancedCharts) {
            // KPI Scorecard
            if (document.getElementById('kpi-scorecard')) {
              window.AdvancedCharts.renderKPIScorecard('kpi-scorecard', partnerId);
            }
            
            // Performance Radar
            if (document.getElementById('performance-radar')) {
              window.AdvancedCharts.renderPerformanceRadar('performance-radar', partnerId);
            }
            
            // Revenue Attribution
            if (document.getElementById('revenue-attribution')) {
              window.AdvancedCharts.renderRevenueAttribution('revenue-attribution', partnerId);
            }
          }
          
          // Initialize Quick Insights
          if (window.EnhancedUX && document.getElementById('quick-insights')) {
            window.EnhancedUX.showInsights('quick-insights', partnerId);
          }
          
  // Render 6-month chart with data
  if (transformedMetrics.last6Months) {
    renderSixMonthChartFromMetrics(transformedMetrics.last6Months);
  }
  
  // Initialize other home page charts
  initializeHomePageCharts(partnerId);
        })
        .catch(function (error) {
          console.error('Failed to load metrics:', error);
          if (byId('metric-lt-comm')) {
            byId('metric-lt-comm').textContent = '❌ Error';
            byId('metric-mtd-comm').textContent = '❌ Error';
          }
        });
    }
    
    if (select) {
      select.addEventListener('change', update);
    }
    
    // Initial load after a brief delay to ensure partner dropdown is populated
    setTimeout(update, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeMetrics);
  } else {
    initHomeMetrics();
  }
})();

// Render last 6 months commissions as bars
(function () {
  function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
  function labelFor(key) { var p = key.split('-'); return new Date(parseInt(p[0],10), parseInt(p[1],10)-1, 1).toLocaleString(undefined, { month: 'short' }); }
  function sum(arr, f) { var s=0; for (var i=0;i<arr.length;i++) s += f(arr[i])||0; return s; }

  window.renderSixMonthChart = function (db, partnerId) {
    var el = document.getElementById('chart-6mo-comm');
    if (!el) return;
    el.innerHTML = '';
    var trades = Array.isArray(db.trades) ? db.trades : [];
    var clients = Array.isArray(db.clients) ? db.clients : [];
    var partnerClientIds = new Set((partnerId ? clients.filter(function(c){return c.partnerId===partnerId;}) : clients).map(function(c){return c.customerId;}));
    var now = new Date();
    var months = [];
    for (var i=5;i>=0;i--) { var d = new Date(now.getFullYear(), now.getMonth()-i, 1); months.push(monthKey(d)); }
    var groups = {};
    months.forEach(function (k) { groups[k] = []; });
    trades.forEach(function (t) {
      if (!partnerClientIds.has(t.customerId)) return;
      var dt = new Date(t.dateTime);
      var k = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1));
      if (groups[k]) groups[k].push(t);
    });
    var series = months.map(function (k) { return { key: k, label: labelFor(k), value: sum(groups[k]||[], function(t){return t.commission||0;}) }; });
    var maxV = Math.max(1, Math.max.apply(null, series.map(function(s){return s.value;})));

    var width = el.clientWidth || 640; var height = 200; var pad = 24; var barGap = 8;
    var barWidth = Math.max(10, Math.floor((width - pad*2 - (series.length-1)*barGap) / series.length));

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.style.background = '#0b1220';

    // Axes (simple baseline)
    var axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axis.setAttribute('x1', String(pad)); axis.setAttribute('y1', String(height - pad));
    axis.setAttribute('x2', String(width - pad)); axis.setAttribute('y2', String(height - pad));
    axis.setAttribute('stroke', 'rgba(148,163,184,0.4)'); axis.setAttribute('stroke-width', '1');
    svg.appendChild(axis);

    // Bars
    series.forEach(function (s, idx) {
      var x = pad + idx*(barWidth + barGap);
      var h = Math.round((s.value / maxV) * (height - pad*2));
      var y = height - pad - h;
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(barWidth)); rect.setAttribute('height', String(h));
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', 'url(#grad)');
      rect.setAttribute('style', 'fill: url(#grad)');
      rect.setAttribute('data-value', s.value.toFixed(2));
      svg.appendChild(rect);

      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x + barWidth/2));
      label.setAttribute('y', String(height - pad + 14));
      label.setAttribute('fill', '#94a3b8');
      label.setAttribute('font-size', '12');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = s.label;
      svg.appendChild(label);
      
      // Add value label on top of bar
      if (s.value > 0) {
        var valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueLabel.setAttribute('x', String(x + barWidth/2));
        valueLabel.setAttribute('y', String(y - 5));
        valueLabel.setAttribute('fill', '#e5e7eb');
        valueLabel.setAttribute('font-size', '11');
        valueLabel.setAttribute('text-anchor', 'middle');
        valueLabel.setAttribute('font-weight', '600');
        valueLabel.textContent = '$' + s.value.toLocaleString();
        svg.appendChild(valueLabel);
      }
    });

    // Gradient definition
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'grad'); grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0'); grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    var s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop'); s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#38bdf8');
    var s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop'); s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#22c55e');
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);

    // Value tooltips on hover (title)
    Array.prototype.forEach.call(svg.querySelectorAll('rect'), function (rect) {
      var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = 'Commission: ' + rect.getAttribute('data-value');
      rect.appendChild(title);
    });

    el.appendChild(svg);

    // Rerender on resize
    var ro;
    function handleResize() { renderSixMonthChart(db, partnerId); }
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function(){ handleResize(); });
      ro.observe(el);
    } else {
      window.addEventListener('resize', handleResize);
    }
  };
})();

// Render 6-month chart from metrics data
function renderSixMonthChartFromMetrics(last6Months, targetElement) {
  var el = targetElement || document.getElementById('chart-6mo-comm');
  if (!el || !last6Months) return;
  
  el.innerHTML = '';
  
  var width = el.clientWidth || 800;
  var height = 300;
  var margin = {top: 20, right: 40, bottom: 40, left: 60};
  
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.background = 'rgba(148,163,184,0.05)';
  
  // Create chart content
  var chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  chartGroup.setAttribute('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  
  var chartWidth = width - margin.left - margin.right;
  var chartHeight = height - margin.top - margin.bottom;
  
  // Calculate scales
  var maxValue = Math.max.apply(Math, last6Months);
  var yScale = chartHeight / maxValue;
  
  // Generate month labels
  var now = new Date();
  var monthLabels = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(d.toLocaleString(undefined, { month: 'short', year: '2-digit' }));
  }
  
  // Draw bars
  var barWidth = chartWidth / last6Months.length;
  last6Months.forEach(function(value, i) {
    var barHeight = value * yScale;
    var x = i * barWidth;
    var y = chartHeight - barHeight;
    
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x + barWidth * 0.1);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth * 0.8);
    rect.setAttribute('height', barHeight);
    rect.setAttribute('fill', '#3b82f6');
    rect.setAttribute('rx', '4');
    
    chartGroup.appendChild(rect);
    
    // Add value label
    if (value > 0) {
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + barWidth / 2);
      text.setAttribute('y', y - 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#64748b');
      text.textContent = '$' + Math.round(value).toLocaleString();
      chartGroup.appendChild(text);
    }
    
    // Add month label
    var monthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    monthText.setAttribute('x', x + barWidth / 2);
    monthText.setAttribute('y', chartHeight + 20);
    monthText.setAttribute('text-anchor', 'middle');
    monthText.setAttribute('font-size', '12');
    monthText.setAttribute('fill', '#64748b');
    monthText.textContent = monthLabels[i];
    chartGroup.appendChild(monthText);
  });
  
  svg.appendChild(chartGroup);
  el.appendChild(svg);
}

// Initialize all home page charts
function initializeHomePageCharts(partnerId) {
  if (!partnerId) return;
  
  // Initialize KPI Scorecard
  if (window.AdvancedCharts && document.getElementById('kpi-scorecard')) {
    window.AdvancedCharts.renderKPIScorecard('kpi-scorecard', partnerId);
  }
  
  // Initialize Performance Radar
  if (window.AdvancedCharts && document.getElementById('performance-radar')) {
    window.AdvancedCharts.renderPerformanceRadar('performance-radar', partnerId);
  }
  
  // Initialize Revenue Attribution
  if (window.AdvancedCharts && document.getElementById('revenue-attribution')) {
    window.AdvancedCharts.renderRevenueAttribution('revenue-attribution', partnerId);
  }
  
  // Initialize Top Countries Chart
  if (document.getElementById('top-countries-chart')) {
    loadTopCountriesChart(partnerId);
  }
  
  // Initialize Client Growth Trend
  if (document.getElementById('client-growth-chart')) {
    loadClientGrowthChart(partnerId);
  }
  
  // Initialize Revenue by Platform
  if (document.getElementById('revenue-platform-chart')) {
    loadRevenuePlatformChart(partnerId);
  }
  
  // Initialize Deposit Trends
  if (document.getElementById('deposit-trends-chart')) {
    loadDepositTrendsChart(partnerId);
  }
}

// Load Top Countries Chart
function loadTopCountriesChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=country_performance&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('top-countries-chart');
      if (!container) return;
      
      const data = response.data.slice(0, 10); // Top 10 countries
      const width = container.clientWidth || 400;
      const height = 300;
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      const maxValue = Math.max(...data.map(d => parseFloat(d.total_commissions)));
      const barHeight = 20;
      const spacing = 25;
      
      data.forEach((country, i) => {
        const barWidth = (parseFloat(country.total_commissions) / maxValue) * (width - 100);
        const y = i * spacing + 20;
        
        svg += `<rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
        svg += `<text x="75" y="${y + 15}" text-anchor="end" font-size="12" fill="#64748b">${country.country}</text>`;
        svg += `<text x="${barWidth + 85}" y="${y + 15}" font-size="12" fill="#64748b">$${parseFloat(country.total_commissions).toLocaleString()}</text>`;
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading top countries chart:', err));
}

// Load Client Growth Chart
function loadClientGrowthChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=daily_signups&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('client-growth-chart');
      if (!container) return;
      
      const data = response.data.slice(-30); // Last 30 days
      const width = container.clientWidth || 400;
      const height = 300;
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      const maxValue = Math.max(...data.map(d => parseInt(d.signup_count)));
      const barWidth = width / data.length;
      
      data.forEach((day, i) => {
        const barHeight = (parseInt(day.signup_count) / maxValue) * (height - 40);
        const x = i * barWidth;
        const y = height - barHeight - 20;
        
        svg += `<rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="#10b981" rx="2"/>`;
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading client growth chart:', err));
}

// Load Revenue by Platform Chart
function loadRevenuePlatformChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=daily_commissions_platform&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('revenue-platform-chart');
      if (!container) return;
      
      // Group by platform
      const platformData = {};
      response.data.forEach(row => {
        if (!platformData[row.platform]) {
          platformData[row.platform] = 0;
        }
        platformData[row.platform] += parseFloat(row.total_commissions);
      });
      
      const platforms = Object.keys(platformData);
      const width = container.clientWidth || 400;
      const height = 300;
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      const maxValue = Math.max(...Object.values(platformData));
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      
      platforms.forEach((platform, i) => {
        const value = platformData[platform];
        const percentage = (value / maxValue) * 100;
        const color = colors[i % colors.length];
        
        svg += `<circle cx="${width/2}" cy="${height/2}" r="${percentage}" fill="${color}" opacity="0.7"/>`;
        svg += `<text x="${width/2}" y="${height/2 + i * 20}" text-anchor="middle" font-size="12" fill="#64748b">${platform}: $${value.toLocaleString()}</text>`;
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading revenue platform chart:', err));
}

// Load Deposit Trends Chart
function loadDepositTrendsChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=daily_funding&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('deposit-trends-chart');
      if (!container) return;
      
      const data = response.data.slice(-30); // Last 30 days
      const width = container.clientWidth || 400;
      const height = 300;
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      const maxDeposits = Math.max(...data.map(d => parseFloat(d.total_deposits)));
      const maxWithdrawals = Math.max(...data.map(d => parseFloat(d.total_withdrawals)));
      const maxValue = Math.max(maxDeposits, maxWithdrawals);
      
      const barWidth = width / data.length;
      
      data.forEach((day, i) => {
        const depositHeight = (parseFloat(day.total_deposits) / maxValue) * (height - 40);
        const withdrawalHeight = (parseFloat(day.total_withdrawals) / maxValue) * (height - 40);
        const x = i * barWidth;
        
        svg += `<rect x="${x}" y="${height - depositHeight - 20}" width="${barWidth * 0.4}" height="${depositHeight}" fill="#10b981" rx="2"/>`;
        svg += `<rect x="${x + barWidth * 0.5}" y="${height - withdrawalHeight - 20}" width="${barWidth * 0.4}" height="${withdrawalHeight}" fill="#ef4444" rx="2"/>`;
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading deposit trends chart:', err));
}

// Country Analysis page: show country metrics
(function () {
  function renderCountryAnalysis(db, partnerId) {
    var clients = Array.isArray(db.clients) ? db.clients : [];
    var trades = Array.isArray(db.trades) ? db.trades : [];
    var deposits = Array.isArray(db.deposits) ? db.deposits : [];
    
    // Filter by partner if selected
    var partnerClients = partnerId ? clients.filter(function(c) { return c.partnerId === partnerId; }) : clients;
    var partnerClientIds = new Set(partnerClients.map(function(c) { return c.customerId; }));
    
    var partnerTrades = trades.filter(function(t) { return partnerClientIds.has(t.customerId); });
    var partnerDeposits = deposits.filter(function(d) { return partnerClientIds.has(d.customerId); });
    
    // Count by country
    var countryStats = {};
    
    partnerClients.forEach(function(client) {
      var country = client.country;
      if (!countryStats[country]) {
        countryStats[country] = { clients: 0, commissions: 0, deposits: 0, volume: 0 };
      }
      countryStats[country].clients++;
    });
    
    partnerTrades.forEach(function(trade) {
      var client = partnerClients.find(function(c) { return c.customerId === trade.customerId; });
      if (client) {
        var country = client.country;
        countryStats[country].commissions += trade.commission || 0;
        countryStats[country].volume += 1; // Using trade count as volume proxy
      }
    });
    
    partnerDeposits.forEach(function(deposit) {
      var client = partnerClients.find(function(c) { return c.customerId === deposit.customerId; });
      if (client) {
        var country = client.country;
        countryStats[country].deposits += deposit.value || 0;
      }
    });
    
    // Find top countries
    var countries = Object.keys(countryStats);
    if (countries.length === 0) {
      document.getElementById('most-clients-country').textContent = 'No data';
      document.getElementById('most-commissions-country').textContent = 'No data';
      document.getElementById('most-deposits-country').textContent = 'No data';
      document.getElementById('most-volume-country').textContent = 'No data';
      return;
    }
    
    var mostClients = countries.reduce(function(a, b) { 
      return countryStats[a].clients > countryStats[b].clients ? a : b; 
    });
    
    var mostCommissions = countries.reduce(function(a, b) { 
      return countryStats[a].commissions > countryStats[b].commissions ? a : b; 
    });
    
    var mostDeposits = countries.reduce(function(a, b) { 
      return countryStats[a].deposits > countryStats[b].deposits ? a : b; 
    });
    
    var mostVolume = countries.reduce(function(a, b) { 
      return countryStats[a].volume > countryStats[b].volume ? a : b; 
    });
    
    document.getElementById('most-clients-country').textContent = mostClients + ' (' + countryStats[mostClients].clients + ' clients)';
    document.getElementById('most-commissions-country').textContent = mostCommissions + ' ($' + countryStats[mostCommissions].commissions.toLocaleString() + ')';
    document.getElementById('most-deposits-country').textContent = mostDeposits + ' ($' + countryStats[mostDeposits].deposits.toLocaleString() + ')';
    document.getElementById('most-volume-country').textContent = mostVolume + ' (' + countryStats[mostVolume].volume + ' trades)';
  }

  function initCountryAnalysis() {
    var select = document.getElementById('partnerSelect');
    if (!select) return;
    
    fetch('database.json')
      .then(function(r) { return r.json(); })
      .then(function(db) {
        function update() {
          var partnerId = select.value;
          
          // If no partner selected, try to get from localStorage
          if (!partnerId) {
            var savedPartnerId = localStorage.getItem('selectedPartnerId');
            if (savedPartnerId) {
              partnerId = savedPartnerId;
              select.value = savedPartnerId;
            }
          }
          
          renderCountryAnalysis(db, partnerId);
        }
        
        select.addEventListener('change', update);
        
        // Delay initial update to allow partner dropdown to be populated with persisted value
        setTimeout(update, 600);
      })
      .catch(function() {
        document.getElementById('most-clients-country').textContent = 'Error loading data';
        document.getElementById('most-commissions-country').textContent = 'Error loading data';
        document.getElementById('most-deposits-country').textContent = 'Error loading data';
        document.getElementById('most-volume-country').textContent = 'Error loading data';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountryAnalysis);
  } else {
    initCountryAnalysis();
  }
})();

// Tiers & Badges page: show tier progress bars
(function () {
  function parseTierRange(range) {
    if (!range) return { min: 0, max: 0 };
    
    // Handle different range formats
    if (range.includes('+')) {
      // "$5,000+" format
      var min = parseFloat(range.replace(/[$,+]/g, ''));
      return { min: min, max: Infinity };
    } else if (range.includes('-')) {
      // "$500-$999.99" format
      var parts = range.split('-');
      var min = parseFloat(parts[0].replace(/[$,]/g, ''));
      var max = parseFloat(parts[1].replace(/[$,]/g, ''));
      return { min: min, max: max };
    }
    return { min: 0, max: 0 };
  }

  function renderTiersProgress(db, partnerId) {
    var container = document.getElementById('tiers-progress');
    if (!container) return;
    
    var partners = Array.isArray(db.partners) ? db.partners : [];
    var partnerTiers = Array.isArray(db.partnerTiers) ? db.partnerTiers : [];
    var trades = Array.isArray(db.trades) ? db.trades : [];
    var clients = Array.isArray(db.clients) ? db.clients : [];
    
    // Get selected partner or all partners
    var selectedPartner = partnerId ? partners.find(function(p) { return p.partnerId === partnerId; }) : null;
    var partnerClients = partnerId ? clients.filter(function(c) { return c.partnerId === partnerId; }) : clients;
    var partnerClientIds = new Set(partnerClients.map(function(c) { return c.customerId; }));
    
    // Calculate total commissions for selected partner(s)
    var totalCommissions = trades
      .filter(function(t) { return partnerClientIds.has(t.customerId); })
      .reduce(function(sum, t) { return sum + (t.commission || 0); }, 0);
    
    var html = '<div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 16px;">';
    
    var tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    var tierColors = {
      'Bronze': '#CD7F32',
      'Silver': '#C0C0C0',
      'Gold': '#FFD700',
      'Platinum': '#E5E4E2'
    };
    
    tierOrder.forEach(function(tierName) {
      var tierInfo = partnerTiers.find(function(t) { return t.tier === tierName; });
      if (!tierInfo) return;
      
      var range = parseTierRange(tierInfo.range);
      var reward = tierInfo.reward || 'No reward';
      
      // Calculate progress percentage
      var progress = 0;
      if (range.max === Infinity) {
        // Platinum tier - show progress toward minimum
        progress = Math.min(100, (totalCommissions / range.min) * 100);
      } else {
        // Other tiers - show progress within range
        if (totalCommissions >= range.max) {
          progress = 100;
        } else if (totalCommissions >= range.min) {
          progress = ((totalCommissions - range.min) / (range.max - range.min)) * 100;
        } else {
          progress = (totalCommissions / range.min) * 100;
        }
      }
      
      html += '<div style="text-align: center; padding: 16px; background: rgba(148,163,184,0.05); border-radius: 8px; border: 1px solid rgba(148,163,184,0.1);">';
      html += '<div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: ' + tierColors[tierName] + ';">' + tierName + '</div>';
      html += '<div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">' + tierInfo.range + '</div>';
      html += '<div style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Reward: ' + reward + '</div>';
      
      // Progress bar
      html += '<div style="width: 100%; height: 8px; background: rgba(148,163,184,0.2); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">';
      html += '<div style="width: ' + Math.min(100, Math.max(0, progress)) + '%; height: 100%; background: ' + tierColors[tierName] + '; transition: width 0.3s ease;"></div>';
      html += '</div>';
      
      html += '<div style="font-size: 11px; color: var(--muted);">';
      html += '$' + totalCommissions.toLocaleString() + ' / ';
      if (range.max === Infinity) {
        html += '$' + range.min.toLocaleString() + '+';
      } else {
        html += '$' + range.max.toLocaleString();
      }
      html += '</div>';
      
      html += '</div>';
    });
    
    html += '</div>';
    
    // Add summary
    html += '<div style="margin-top: 16px; padding: 12px; background: rgba(56,189,248,0.1); border-radius: 6px; border: 1px solid rgba(56,189,248,0.2);">';
    html += '<div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">Current Status</div>';
    html += '<div style="font-size: 12px; color: var(--muted);">';
    if (selectedPartner) {
      html += 'Partner: ' + selectedPartner.name + ' • ';
    }
    html += 'Total Commissions: $' + totalCommissions.toLocaleString();
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
  }

  function initTiersPage() {
    var select = document.getElementById('partnerSelect');
    if (!select) return;
    
    fetch('database.json')
      .then(function(r) { return r.json(); })
      .then(function(db) {
        function update() {
          var partnerId = select.value;
          
          // If no partner selected, try to get from localStorage
          if (!partnerId) {
            var savedPartnerId = localStorage.getItem('selectedPartnerId');
            if (savedPartnerId) {
              partnerId = savedPartnerId;
              select.value = savedPartnerId;
            }
          }
          
          renderTiersProgress(db, partnerId);
        }
        
        select.addEventListener('change', update);
        
        // Delay initial update to allow partner dropdown to be populated
        setTimeout(update, 600);
      })
      .catch(function() {
        var container = document.getElementById('tiers-progress');
        if (container) container.innerHTML = '<p class="muted">Failed to load tiers data.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTiersPage);
  } else {
    initTiersPage();
  }
})();

// Clients page: show filtered list with masked names
(function () {
  function maskName(name) {
    if (!name || name.length < 2) return name;
    var parts = name.split(' ');
    if (parts.length !== 2) return name;
    
    var firstName = parts[0];
    var lastName = parts[1];
    
    var maskedFirst = firstName.length > 2 
      ? firstName[0] + '*'.repeat(firstName.length - 2) + firstName[firstName.length - 1]
      : firstName;
    
    var maskedLast = lastName.length > 2
      ? lastName[0] + '*'.repeat(lastName.length - 2) + lastName[lastName.length - 1]
      : lastName;
    
    return maskedFirst + ' ' + maskedLast;
  }

  function renderTierChart(db, partnerId, timePeriod) {
    var container = document.getElementById('tier-chart');
    if (!container) return;
    
    var clients = Array.isArray(db.clients) ? db.clients : [];
    var filteredClients = clients;
    
    // Filter by partner
    if (partnerId) {
      filteredClients = filteredClients.filter(function(c) { return c.partnerId === partnerId; });
    }
    
    // Filter by time period (joinDate)
    if (timePeriod) {
      filteredClients = filteredClients.filter(function(c) {
        if (!c.joinDate) return false;
        var joinDate = c.joinDate;
        var clientMonth = joinDate.substring(0, 7);
        return clientMonth === timePeriod;
      });
    }
    
    if (filteredClients.length === 0) {
      container.innerHTML = '<p class="muted">No clients found for selected partner.</p>';
      return;
    }
    
    // Count clients by tier
    var tierCounts = {};
    filteredClients.forEach(function(client) {
      var tier = client.tier || 'Unknown';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });
    
    var tiers = Object.keys(tierCounts);
    if (tiers.length === 0) {
      container.innerHTML = '<p class="muted">No tier data available.</p>';
      return;
    }
    
    // Create pie chart
    var total = filteredClients.length;
    var colors = {
      'Bronze': '#CD7F32',
      'Silver': '#C0C0C0', 
      'Gold': '#FFD700',
      'Platinum': '#E5E4E2',
      'Unknown': '#94a3b8'
    };
    
    var width = 200;
    var height = 200;
    var radius = Math.min(width, height) / 2 - 10;
    var centerX = width / 2;
    var centerY = height / 2;
    
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    
    var currentAngle = -Math.PI / 2; // Start at top
    
    tiers.forEach(function(tier) {
      var count = tierCounts[tier];
      var percentage = (count / total) * 100;
      var angle = (count / total) * 2 * Math.PI;
      
      var x1 = centerX + radius * Math.cos(currentAngle);
      var y1 = centerY + radius * Math.sin(currentAngle);
      var x2 = centerX + radius * Math.cos(currentAngle + angle);
      var y2 = centerY + radius * Math.sin(currentAngle + angle);
      
      var largeArc = angle > Math.PI ? 1 : 0;
      
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M ' + centerX + ' ' + centerY + 
                       ' L ' + x1 + ' ' + y1 + 
                       ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + 
                       ' Z');
      path.setAttribute('fill', colors[tier] || colors['Unknown']);
      path.setAttribute('stroke', '#0b1220');
      path.setAttribute('stroke-width', '2');
      
      // Add tooltip
      var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = tier + ': ' + count + ' clients (' + percentage.toFixed(1) + '%)';
      path.appendChild(title);
      
      // Add data label in the center of each slice
      if (percentage > 5) { // Only show labels for slices > 5%
        var labelAngle = currentAngle + angle / 2;
        var labelRadius = radius * 0.7;
        var labelX = centerX + labelRadius * Math.cos(labelAngle);
        var labelY = centerY + labelRadius * Math.sin(labelAngle);
        
        var dataLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dataLabel.setAttribute('x', labelX);
        dataLabel.setAttribute('y', labelY);
        dataLabel.setAttribute('fill', '#0b1220');
        dataLabel.setAttribute('font-size', '12');
        dataLabel.setAttribute('text-anchor', 'middle');
        dataLabel.setAttribute('font-weight', '600');
        dataLabel.textContent = percentage.toFixed(1) + '%';
        svg.appendChild(dataLabel);
      }
      
      svg.appendChild(path);
      currentAngle += angle;
    });
    
    // Add legend
    var legendY = height + 20;
    tiers.forEach(function(tier, index) {
      var legendX = 20 + (index % 2) * 100;
      var legendRow = Math.floor(index / 2);
      
      // Color box
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', legendX);
      rect.setAttribute('y', legendY + legendRow * 20);
      rect.setAttribute('width', 12);
      rect.setAttribute('height', 12);
      rect.setAttribute('fill', colors[tier] || colors['Unknown']);
      svg.appendChild(rect);
      
      // Label
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', legendX + 18);
      text.setAttribute('y', legendY + legendRow * 20 + 9);
      text.setAttribute('fill', 'var(--text)');
      text.setAttribute('font-size', '12');
      text.textContent = tier + ' (' + tierCounts[tier] + ')';
      svg.appendChild(text);
    });
    
    container.innerHTML = '';
    container.appendChild(svg);
  }

  function renderClientsList(db, partnerId, timePeriod) {
    var container = document.getElementById('clients-list');
    if (!container) return;
    
    var clients = Array.isArray(db.clients) ? db.clients : [];
    var filteredClients = clients;
    
    // Filter by partner
    if (partnerId) {
      filteredClients = filteredClients.filter(function(c) { return c.partnerId === partnerId; });
    }
    
    // Filter by time period (joinDate)
    if (timePeriod) {
      filteredClients = filteredClients.filter(function(c) {
        if (!c.joinDate) return false;
        var joinDate = c.joinDate;
        // Extract year-month from joinDate (format: YYYY-MM-DD or YYYY-MM)
        var clientMonth = joinDate.substring(0, 7); // Gets YYYY-MM
        return clientMonth === timePeriod;
      });
    }
    
    // Filter by search query
    var searchQuery = container.getAttribute('data-search-query') || '';
    if (searchQuery) {
      var query = searchQuery.toLowerCase();
      filteredClients = filteredClients.filter(function(c) {
        return (c.name && c.name.toLowerCase().includes(query)) ||
               (c.email && c.email.toLowerCase().includes(query)) ||
               (c.binary_user_id && c.binary_user_id.toLowerCase().includes(query)) ||
               (c.customerId && c.customerId.toLowerCase().includes(query)) ||
               (c.country && c.country.toLowerCase().includes(query)) ||
               (c.tier && c.tier.toLowerCase().includes(query)) ||
               (c.accountNumber && c.accountNumber.toLowerCase().includes(query)) ||
               (c.client_loginid && c.client_loginid.toLowerCase().includes(query));
      });
    }
    
    if (filteredClients.length === 0) {
      container.innerHTML = '<p class="muted">No clients found' + (searchQuery ? ' matching "' + searchQuery + '"' : ' for selected partner') + '.</p>';
      return;
    }
    
    // Get or create the records per page selection
    var recordsPerPage = parseInt(container.getAttribute('data-records-per-page') || '25');
    
    // Search bar and controls
    var html = '<div style="margin-bottom: 16px;">';
    html += '<input type="text" id="client-search-input" placeholder="🔍 Search clients by name, email, ID, country..." ';
    html += 'value="' + (searchQuery || '') + '" ';
    html += 'style="width: 100%; padding: 10px 16px; background: rgba(148,163,184,0.05); color: var(--text); border: 1px solid rgba(148,163,184,0.2); border-radius: 8px; font-size: 14px; margin-bottom: 8px;">';
    html += '</div>';
    
    // Dropdown for records per page
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';
    html += '<div style="font-size: 14px; color: var(--muted);">';
    if (searchQuery) {
      html += 'Search results for "<strong style="color: var(--text);">' + searchQuery + '</strong>"';
    }
    html += '</div>';
    html += '<div style="display: flex; align-items: center; gap: 8px;">';
    html += '<label style="font-size: 14px; color: var(--muted);">Show:</label>';
    html += '<select id="records-per-page-select" style="padding: 6px 12px; background: rgba(148,163,184,0.05); color: var(--text); border: 1px solid rgba(148,163,184,0.2); border-radius: 6px; cursor: pointer;">';
    html += '<option value="25"' + (recordsPerPage === 25 ? ' selected' : '') + '>25</option>';
    html += '<option value="50"' + (recordsPerPage === 50 ? ' selected' : '') + '>50</option>';
    html += '<option value="75"' + (recordsPerPage === 75 ? ' selected' : '') + '>75</option>';
    html += '<option value="100"' + (recordsPerPage === 100 ? ' selected' : '') + '>100</option>';
    html += '<option value="all"' + (recordsPerPage === -1 ? ' selected' : '') + '>All</option>';
    html += '</select>';
    html += '</div>';
    html += '</div>';
    
    // Display clients (limited or all)
    html += '<div style="display: grid; gap: 12px;">';
    var displayClients = recordsPerPage === -1 ? filteredClients : filteredClients.slice(0, recordsPerPage);
    displayClients.forEach(function(client) {
      html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(148,163,184,0.05); border-radius: 6px; border: 1px solid rgba(148,163,184,0.1);">';
      html += '<div>';
      html += '<div style="font-weight: 600; margin-bottom: 4px;">' + maskName(client.name) + '</div>';
      if (client.email) {
        html += '<div style="font-size: 12px; color: var(--accent); margin-bottom: 2px;">📧 ' + client.email + '</div>';
      }
      html += '<div style="font-size: 12px; color: var(--muted);">' + (client.binary_user_id || client.customerId) + ' • ' + client.country + ' • ' + (client.gender || 'N/A') + ', ' + (client.age || 'N/A') + ' years</div>';
      html += '</div>';
      html += '<div style="text-align: right;">';
      html += '<div style="font-size: 12px; color: var(--muted); margin-bottom: 2px;">' + (client.tier || 'N/A') + '</div>';
      html += '<div style="font-size: 14px; font-weight: 600;">$' + ((client.lifetimeDeposits || 0)).toLocaleString() + '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // Add count at the end
    html += '<div style="margin-top: 16px; padding: 12px; text-align: center; background: rgba(148,163,184,0.05); border-radius: 6px; border: 1px solid rgba(148,163,184,0.1);">';
    html += '<div style="font-size: 14px; color: var(--muted);">';
    if (recordsPerPage === -1 || filteredClients.length <= recordsPerPage) {
      html += 'Showing all <strong style="color: var(--text);">' + filteredClients.length + '</strong> clients';
    } else {
      html += 'Showing <strong style="color: var(--text);">' + displayClients.length + '</strong> of <strong style="color: var(--text);">' + filteredClients.length + '</strong> clients';
    }
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
    
    // Add event listener for search
    var searchInput = document.getElementById('client-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        container.setAttribute('data-search-query', this.value);
        renderClientsList(db, partnerId, timePeriod);
      });
      // Focus on search input if there was a query
      if (searchQuery) {
        setTimeout(function() { searchInput.focus(); }, 100);
      }
    }
    
    // Add event listener for dropdown
    var select = document.getElementById('records-per-page-select');
    if (select) {
      select.addEventListener('change', function() {
        var value = this.value === 'all' ? -1 : parseInt(this.value);
        container.setAttribute('data-records-per-page', value);
        renderClientsList(db, partnerId, timePeriod);
      });
    }
  }

  function renderPopulationChart(db, partnerId, timePeriod) {
    var container = document.getElementById('population-chart');
    if (!container) return;
    
    var clients = Array.isArray(db.clients) ? db.clients : [];
    var filteredClients = clients;
    
    // Filter by partner
    if (partnerId) {
      filteredClients = filteredClients.filter(function(c) { return c.partnerId === partnerId; });
    }
    
    // Filter by time period (joinDate)
    if (timePeriod) {
      filteredClients = filteredClients.filter(function(c) {
        if (!c.joinDate) return false;
        var joinDate = c.joinDate;
        var clientMonth = joinDate.substring(0, 7);
        return clientMonth === timePeriod;
      });
    }
    
    if (filteredClients.length === 0) {
      container.innerHTML = '<p class="muted">No clients found for selected partner.</p>';
      return;
    }
    
    // Count by age groups
    var ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };
    
    filteredClients.forEach(function(client) {
      var age = client.age || 0;
      if (age >= 18 && age <= 25) ageGroups['18-25']++;
      else if (age >= 26 && age <= 35) ageGroups['26-35']++;
      else if (age >= 36 && age <= 45) ageGroups['36-45']++;
      else if (age >= 46 && age <= 55) ageGroups['46-55']++;
      else if (age >= 56 && age <= 65) ageGroups['56-65']++;
      else if (age > 65) ageGroups['65+']++;
    });
    
    // Create bar chart
    var width = 300;
    var height = 200;
    var padding = 40;
    var barGap = 8;
    var maxValue = Math.max.apply(null, Object.values(ageGroups));
    
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    
    var barWidth = (width - padding * 2 - (Object.keys(ageGroups).length - 1) * barGap) / Object.keys(ageGroups).length;
    var chartHeight = height - padding * 2;
    
    // Draw bars
    Object.entries(ageGroups).forEach(function([ageGroup, count], index) {
      var x = padding + index * (barWidth + barGap);
      var barHeight = (count / maxValue) * chartHeight;
      var y = height - padding - barHeight;
      
      // Bar
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', '#38bdf8');
      rect.setAttribute('rx', '4');
      svg.appendChild(rect);
      
      // Value label on top
      if (count > 0) {
        var valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueLabel.setAttribute('x', x + barWidth / 2);
        valueLabel.setAttribute('y', y - 5);
        valueLabel.setAttribute('fill', '#e5e7eb');
        valueLabel.setAttribute('font-size', '11');
        valueLabel.setAttribute('text-anchor', 'middle');
        valueLabel.setAttribute('font-weight', '600');
        valueLabel.textContent = count;
        svg.appendChild(valueLabel);
      }
      
      // Age group label
      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + barWidth / 2);
      label.setAttribute('y', height - padding + 14);
      label.setAttribute('fill', '#94a3b8');
      label.setAttribute('font-size', '10');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = ageGroup;
      svg.appendChild(label);
    });
    
    // Draw axis
    var axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    axis.setAttribute('x1', padding);
    axis.setAttribute('y1', height - padding);
    axis.setAttribute('x2', width - padding);
    axis.setAttribute('y2', height - padding);
    axis.setAttribute('stroke', 'rgba(148,163,184,0.4)');
    axis.setAttribute('stroke-width', '1');
    svg.insertBefore(axis, svg.firstChild);
    
    container.innerHTML = '';
    container.appendChild(svg);
  }

  function initClientsPage() {
    var select = document.getElementById('partnerSelect');
    var timePeriodSelect = document.getElementById('timePeriod');
    if (!select) return;
    
    window.ApiManager.loadDashboardData()
      .then(function(db) {
        function update() {
          var partnerId = select.value;
          var timePeriod = timePeriodSelect ? timePeriodSelect.value : '';
          renderTierChart(db, partnerId, timePeriod);
          renderClientsList(db, partnerId, timePeriod);
          renderPopulationChart(db, partnerId, timePeriod);
          
          // Populate country dropdown for the selected partner
          if (document.getElementById('countryFilter')) {
            populateCountryDropdown(partnerId);
          }
          
          // Initialize additional charts
          initializeClientsPageCharts(partnerId);
        }
        select.addEventListener('change', update);
        if (timePeriodSelect) {
          timePeriodSelect.addEventListener('change', update);
        }
        
        // Initial load after a brief delay to ensure partner dropdown is populated
        setTimeout(update, 600);
      })
      .catch(function() {
        var container = document.getElementById('clients-list');
        if (container) container.innerHTML = '<p class="muted">Failed to load clients.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientsPage);
  } else {
    initClientsPage();
  }
})();

// Initialize all clients page charts
function initializeClientsPageCharts(partnerId) {
  if (!partnerId) return;
  
  // Initialize Age Distribution Chart
  if (document.getElementById('age-distribution-chart')) {
    loadAgeDistributionChart(partnerId);
  }
  
  // Initialize Gender Breakdown Chart
  if (document.getElementById('gender-breakdown-chart')) {
    loadGenderBreakdownChart(partnerId);
  }
  
  // Initialize Registration Trends Chart
  if (document.getElementById('registration-trends-chart')) {
    loadRegistrationTrendsChart(partnerId);
  }
  
  // Initialize Commission Plans Chart
  if (document.getElementById('commission-plans-chart')) {
    loadCommissionPlansChart(partnerId);
  }
}

// Load Age Distribution Chart
function loadAgeDistributionChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=client_demographics&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('age-distribution-chart');
      if (!container) return;
      
      const data = response.data;
      const width = container.clientWidth || 400;
      const height = 300;
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      // Group by age ranges
      const ageGroups = {
        '18-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46-55': 0,
        '56-65': 0,
        '65+': 0
      };
      
      data.forEach(client => {
        const age = parseInt(client.age);
        if (age >= 18 && age <= 25) ageGroups['18-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 45) ageGroups['36-45']++;
        else if (age >= 46 && age <= 55) ageGroups['46-55']++;
        else if (age >= 56 && age <= 65) ageGroups['56-65']++;
        else if (age > 65) ageGroups['65+']++;
      });
      
      const maxValue = Math.max(...Object.values(ageGroups));
      const barWidth = width / Object.keys(ageGroups).length;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#8b5cf6'];
      
      Object.entries(ageGroups).forEach(([ageGroup, count], i) => {
        const barHeight = (count / maxValue) * (height - 40);
        const x = i * barWidth;
        const y = height - barHeight - 20;
        
        svg += `<rect x="${x + barWidth * 0.1}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${colors[i]}" rx="4"/>`;
        svg += `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#64748b">${ageGroup}</text>`;
        svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#64748b">${count}</text>`;
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading age distribution chart:', err));
}

// Load Gender Breakdown Chart
function loadGenderBreakdownChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=client_demographics&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('gender-breakdown-chart');
      if (!container) return;
      
      const data = response.data;
      const width = container.clientWidth || 400;
      const height = 300;
      
      // Count genders
      const genderCounts = { 'Male': 0, 'Female': 0, 'Other': 0 };
      data.forEach(client => {
        const gender = client.gender || 'Other';
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      });
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      const total = Object.values(genderCounts).reduce((sum, count) => sum + count, 0);
      const colors = ['#3b82f6', '#ec4899', '#10b981'];
      let currentAngle = 0;
      
      Object.entries(genderCounts).forEach(([gender, count], i) => {
        if (count > 0) {
          const percentage = (count / total) * 100;
          const angle = (count / total) * 360;
          
          const x1 = width / 2 + Math.cos(currentAngle * Math.PI / 180) * 80;
          const y1 = height / 2 + Math.sin(currentAngle * Math.PI / 180) * 80;
          const x2 = width / 2 + Math.cos((currentAngle + angle) * Math.PI / 180) * 80;
          const y2 = height / 2 + Math.sin((currentAngle + angle) * Math.PI / 180) * 80;
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          svg += `<path d="M ${width/2} ${height/2} L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${colors[i]}"/>`;
          svg += `<text x="${width/2}" y="${height/2 + i * 20 - 20}" text-anchor="middle" font-size="12" fill="#64748b">${gender}: ${count} (${percentage.toFixed(1)}%)</text>`;
          
          currentAngle += angle;
        }
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading gender breakdown chart:', err));
}

// Load Registration Trends Chart
function loadRegistrationTrendsChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=daily_signups&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('registration-trends-chart');
      if (!container) return;
      
      const data = response.data.slice(-30); // Last 30 days
      const width = container.clientWidth || 400;
      const height = 300;
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      const maxValue = Math.max(...data.map(d => parseInt(d.signup_count)));
      const barWidth = width / data.length;
      
      data.forEach((day, i) => {
        const barHeight = (parseInt(day.signup_count) / maxValue) * (height - 40);
        const x = i * barWidth;
        const y = height - barHeight - 20;
        
        svg += `<rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="#10b981" rx="2"/>`;
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading registration trends chart:', err));
}

// Load Commission Plans Chart
function loadCommissionPlansChart(partnerId) {
  fetch(`api/index.php?endpoint=cubes&cube=daily_commissions_plan&partner_id=${partnerId}`)
    .then(r => r.json())
    .then(response => {
      if (!response.success || !response.data) return;
      
      const container = document.getElementById('commission-plans-chart');
      if (!container) return;
      
      // Group by commission plan
      const planData = {};
      response.data.forEach(row => {
        if (!planData[row.commission_plan]) {
          planData[row.commission_plan] = 0;
        }
        planData[row.commission_plan] += parseFloat(row.total_commissions);
      });
      
      const width = container.clientWidth || 400;
      const height = 300;
      
      let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
      
      const plans = Object.keys(planData);
      const maxValue = Math.max(...Object.values(planData));
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      
      plans.forEach((plan, i) => {
        const value = planData[plan];
        const barHeight = (value / maxValue) * (height - 40);
        const barWidth = width / plans.length;
        const x = i * barWidth;
        const y = height - barHeight - 20;
        
        svg += `<rect x="${x + barWidth * 0.1}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${colors[i % colors.length]}" rx="4"/>`;
        svg += `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#64748b">${plan}</text>`;
        svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#64748b">$${value.toLocaleString()}</text>`;
      });
      
      svg += '</svg>';
      container.innerHTML = svg;
    })
    .catch(err => console.error('Error loading commission plans chart:', err));
}

// Commissions page initialization
(function() {
  function initCommissionsPage() {
    const partnerSelect = document.getElementById('partnerSelect');
    const timePeriodSelect = document.getElementById('timePeriod');
    const groupTypeSelect = document.getElementById('groupType');
    
    if (!partnerSelect) return;
    
    function update() {
      const partnerId = partnerSelect.value;
      const timePeriod = timePeriodSelect ? timePeriodSelect.value : 'last_30_days';
      const groupType = groupTypeSelect ? groupTypeSelect.value : 'commission_plan';
      
      // Load main stacked chart
      loadCommissionsStackedChart(partnerId, timePeriod, groupType);
      
      // Initialize additional charts
      initializeCommissionsPageCharts(partnerId);
    }
    
    partnerSelect.addEventListener('change', update);
    if (timePeriodSelect) timePeriodSelect.addEventListener('change', update);
    if (groupTypeSelect) groupTypeSelect.addEventListener('change', update);
    
    // Initial load
    setTimeout(update, 600);
  }
  
  // Load main commissions stacked chart
  function loadCommissionsStackedChart(partnerId, timePeriod, groupType) {
    if (!partnerId) return;
    
    const params = new URLSearchParams({
      partner_id: partnerId,
      timePeriod: timePeriod,
      groupType: groupType
    });
    
    fetch(`api/index.php?${params.toString()}&endpoint=commissions`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('commissions-stacked-chart');
        if (!container) return;
        
        // Transform data for stacked chart
        const chartData = transformCommissionsData(response.data, groupType);
        
        // Render chart using stacked-chart.js
        if (window.renderStackedBarChart) {
          window.renderStackedBarChart(container, chartData);
        } else {
          container.innerHTML = '<p class="muted">Chart library not loaded</p>';
        }
      })
      .catch(err => {
        console.error('Error loading commissions chart:', err);
        const container = document.getElementById('commissions-stacked-chart');
        if (container) container.innerHTML = '<p class="muted">Failed to load chart data</p>';
      });
  }
  
  // Transform commissions data for stacked chart
  function transformCommissionsData(data, groupType) {
    // Group data by date and category
    const groupedData = {};
    const categories = new Set();
    
    data.forEach(row => {
      const date = row.trade_date || row.date;
      const category = row[groupType] || 'Unknown';
      
      if (!groupedData[date]) {
        groupedData[date] = {};
      }
      
      groupedData[date][category] = (groupedData[date][category] || 0) + parseFloat(row.total_commissions || row.commission || 0);
      categories.add(category);
    });
    
    // Convert to chart format
    const dates = Object.keys(groupedData).sort();
    const series = Array.from(categories).map(category => ({
      name: category,
      data: dates.map(date => groupedData[date][category] || 0)
    }));
    
    return {
      dates: dates,
      series: series
    };
  }
  
  // Initialize all commissions page charts
  function initializeCommissionsPageCharts(partnerId) {
    if (!partnerId) return;
    
    // Initialize Commission Plans Breakdown Chart
    if (document.getElementById('commission-plans-breakdown-chart')) {
      loadCommissionPlansBreakdownChart(partnerId);
    }
    
    // Initialize Monthly Trends Chart
    if (document.getElementById('monthly-trends-chart')) {
      loadMonthlyTrendsChart(partnerId);
    }
    
    // Initialize Top Assets Chart
    if (document.getElementById('top-assets-chart')) {
      loadTopAssetsChart(partnerId);
    }
    
    // Initialize Contract Type Chart
    if (document.getElementById('contract-type-chart')) {
      loadContractTypeChart(partnerId);
    }
  }
  
  // Load Commission Plans Breakdown Chart
  function loadCommissionPlansBreakdownChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=daily_commissions_plan&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('commission-plans-breakdown-chart');
        if (!container) return;
        
        // Group by commission plan
        const planData = {};
        response.data.forEach(row => {
          if (!planData[row.commission_plan]) {
            planData[row.commission_plan] = 0;
          }
          planData[row.commission_plan] += parseFloat(row.total_commissions);
        });
        
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        const plans = Object.keys(planData);
        const maxValue = Math.max(...Object.values(planData));
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        plans.forEach((plan, i) => {
          const value = planData[plan];
          const barHeight = (value / maxValue) * (height - 40);
          const barWidth = width / plans.length;
          const x = i * barWidth;
          const y = height - barHeight - 20;
          
          svg += `<rect x="${x + barWidth * 0.1}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${colors[i % colors.length]}" rx="4"/>`;
          svg += `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#64748b">${plan}</text>`;
          svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#64748b">$${value.toLocaleString()}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading commission plans breakdown chart:', err));
  }
  
  // Load Monthly Trends Chart
  function loadMonthlyTrendsChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=daily_commissions_plan&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('monthly-trends-chart');
        if (!container) return;
        
        // Group by month
        const monthlyData = {};
        response.data.forEach(row => {
          const month = row.trade_date.substring(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = 0;
          }
          monthlyData[month] += parseFloat(row.total_commissions);
        });
        
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        const months = Object.keys(monthlyData).sort();
        const maxValue = Math.max(...Object.values(monthlyData));
        const barWidth = width / months.length;
        
        months.forEach((month, i) => {
          const value = monthlyData[month];
          const barHeight = (value / maxValue) * (height - 40);
          const x = i * barWidth;
          const y = height - barHeight - 20;
          
          svg += `<rect x="${x + barWidth * 0.1}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
          svg += `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#64748b">${month}</text>`;
          svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#64748b">$${value.toLocaleString()}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading monthly trends chart:', err));
  }
  
  // Load Top Assets Chart
  function loadTopAssetsChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=commissions_symbol&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data || response.data.length === 0) {
          const container = document.getElementById('top-assets-chart');
          if (container) {
            container.innerHTML = '<p class="muted">No asset data available</p>';
          }
          return;
        }
        
        const container = document.getElementById('top-assets-chart');
        if (!container) return;
        
        const data = response.data.slice(0, 10); // Top 10 assets
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        const maxValue = Math.max(...data.map(d => parseFloat(d.total_commissions)));
        const barHeight = 20;
        const spacing = 25;
        
        data.forEach((asset, i) => {
          const barWidth = (parseFloat(asset.total_commissions) / maxValue) * (width - 100);
          const y = i * spacing + 20;
          
          svg += `<rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
          svg += `<text x="75" y="${y + 15}" text-anchor="end" font-size="12" fill="#64748b">${asset.asset || 'Unknown'}</text>`;
          svg += `<text x="${barWidth + 85}" y="${y + 15}" font-size="12" fill="#64748b">$${parseFloat(asset.total_commissions).toLocaleString()}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => {
        console.error('Error loading top assets chart:', err);
        const container = document.getElementById('top-assets-chart');
        if (container) {
          container.innerHTML = '<p class="muted">Failed to load asset data</p>';
        }
      });
  }
  
  // Load Contract Type Chart
  function loadContractTypeChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=commissions_product&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('contract-type-chart');
        if (!container) return;
        
        // Group by contract type
        const contractData = {};
        response.data.forEach(row => {
          if (!contractData[row.contract_type]) {
            contractData[row.contract_type] = 0;
          }
          contractData[row.contract_type] += parseFloat(row.total_commissions);
        });
        
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        const contracts = Object.keys(contractData);
        const maxValue = Math.max(...Object.values(contractData));
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        contracts.forEach((contract, i) => {
          const value = contractData[contract];
          const barHeight = (value / maxValue) * (height - 40);
          const barWidth = width / contracts.length;
          const x = i * barWidth;
          const y = height - barHeight - 20;
          
          svg += `<rect x="${x + barWidth * 0.1}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${colors[i % colors.length]}" rx="4"/>`;
          svg += `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#64748b">${contract}</text>`;
          svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#64748b">$${value.toLocaleString()}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading contract type chart:', err));
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommissionsPage);
  } else {
    initCommissionsPage();
  }
})();

// Tiers & Badges page initialization
(function() {
  function initTiersBadgesPage() {
    const partnerSelect = document.getElementById('partnerSelect');
    
    if (!partnerSelect) return;
    
    function update() {
      const partnerId = partnerSelect.value;
      
      // Initialize badges gallery
      if (window.BadgesGallery) {
        window.BadgesGallery.init('badges-gallery', partnerId);
      }
      
      // Initialize additional charts
      initializeTiersBadgesPageCharts(partnerId);
    }
    
    partnerSelect.addEventListener('change', update);
    
    // Initial load
    setTimeout(update, 600);
  }
  
  // Initialize all tiers & badges page charts
  function initializeTiersBadgesPageCharts(partnerId) {
    if (!partnerId) return;
    
    // Initialize Tier Progression Chart
    if (document.getElementById('tier-progression-chart')) {
      loadTierProgressionChart(partnerId);
    }
    
    // Initialize Badge Timeline Chart
    if (document.getElementById('badge-timeline-chart')) {
      loadBadgeTimelineChart(partnerId);
    }
    
    // Initialize Partner Tier Distribution Chart
    if (document.getElementById('partner-tier-distribution-chart')) {
      loadPartnerTierDistributionChart(partnerId);
    }
    
    // Initialize Badge Progress Overview Chart
    if (document.getElementById('badge-progress-overview-chart')) {
      loadBadgeProgressOverviewChart(partnerId);
    }
  }
  
  // Load Tier Progression Chart
  function loadTierProgressionChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=badge_progress&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('tier-progression-chart');
        if (!container) return;
        
        const data = response.data;
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        // Create a simple progression chart
        const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
        const colors = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2'];
        
        tiers.forEach((tier, i) => {
          const x = (i * width) / tiers.length;
          const y = height / 2;
          const tierWidth = width / tiers.length;
          
          svg += `<rect x="${x + tierWidth * 0.1}" y="${y - 20}" width="${tierWidth * 0.8}" height="40" fill="${colors[i]}" rx="8"/>`;
          svg += `<text x="${x + tierWidth / 2}" y="${y + 5}" text-anchor="middle" font-size="12" fill="#64748b">${tier}</text>`;
          
          if (i < tiers.length - 1) {
            svg += `<path d="M ${x + tierWidth} ${y} L ${x + tierWidth + 10} ${y}" stroke="#64748b" stroke-width="2"/>`;
          }
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading tier progression chart:', err));
  }
  
  // Load Badge Timeline Chart
  function loadBadgeTimelineChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=badge_progress&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('badge-timeline-chart');
        if (!container) return;
        
        const data = response.data;
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        // Create timeline chart
        const maxValue = Math.max(...data.map(d => parseInt(d.badges_earned || 0)));
        const barWidth = width / data.length;
        
        data.forEach((row, i) => {
          const value = parseInt(row.badges_earned || 0);
          const barHeight = (value / maxValue) * (height - 40);
          const x = i * barWidth;
          const y = height - barHeight - 20;
          
          svg += `<rect x="${x + barWidth * 0.1}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
          svg += `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#64748b">${row.date || i}</text>`;
          svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#64748b">${value}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading badge timeline chart:', err));
  }
  
  // Load Partner Tier Distribution Chart
  function loadPartnerTierDistributionChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=client_tiers&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('partner-tier-distribution-chart');
        if (!container) return;
        
        const data = response.data;
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        // Group by tier
        const tierData = {};
        data.forEach(row => {
          const tier = row.tier || 'Unknown';
          tierData[tier] = (tierData[tier] || 0) + parseInt(row.client_count || 0);
        });
        
        const total = Object.values(tierData).reduce((sum, count) => sum + count, 0);
        const colors = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2'];
        let currentAngle = 0;
        
        Object.entries(tierData).forEach(([tier, count], i) => {
          if (count > 0) {
            const percentage = (count / total) * 100;
            const angle = (count / total) * 360;
            
            const x1 = width / 2 + Math.cos(currentAngle * Math.PI / 180) * 80;
            const y1 = height / 2 + Math.sin(currentAngle * Math.PI / 180) * 80;
            const x2 = width / 2 + Math.cos((currentAngle + angle) * Math.PI / 180) * 80;
            const y2 = height / 2 + Math.sin((currentAngle + angle) * Math.PI / 180) * 80;
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            svg += `<path d="M ${width/2} ${height/2} L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"/>`;
            svg += `<text x="${width/2}" y="${height/2 + i * 20 - 20}" text-anchor="middle" font-size="12" fill="#64748b">${tier}: ${count} (${percentage.toFixed(1)}%)</text>`;
            
            currentAngle += angle;
          }
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading partner tier distribution chart:', err));
  }
  
  // Load Badge Progress Overview Chart
  function loadBadgeProgressOverviewChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=badge_progress&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('badge-progress-overview-chart');
        if (!container) return;
        
        const data = response.data;
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        // Create progress overview
        const totalBadges = data.reduce((sum, row) => sum + parseInt(row.badges_earned || 0), 0);
        const maxBadges = Math.max(...data.map(d => parseInt(d.badges_earned || 0)));
        
        const barHeight = 20;
        const spacing = 30;
        
        data.forEach((row, i) => {
          const badges = parseInt(row.badges_earned || 0);
          const barWidth = (badges / maxBadges) * (width - 100);
          const y = i * spacing + 20;
          
          svg += `<rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
          svg += `<text x="75" y="${y + 15}" text-anchor="end" font-size="12" fill="#64748b">${row.badge_name || 'Badge ' + (i + 1)}</text>`;
          svg += `<text x="${barWidth + 85}" y="${y + 15}" font-size="12" fill="#64748b">${badges}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading badge progress overview chart:', err));
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTiersBadgesPage);
  } else {
    initTiersBadgesPage();
  }
})();

// Country Analysis page initialization
(function() {
  function initCountryAnalysisPage() {
    const partnerSelect = document.getElementById('partnerSelect');
    
    if (!partnerSelect) return;
    
    function update() {
      const partnerId = partnerSelect.value;
      
      // Initialize additional charts
      initializeCountryAnalysisPageCharts(partnerId);
    }
    
    partnerSelect.addEventListener('change', update);
    
    // Initial load
    setTimeout(update, 600);
  }
  
  // Initialize all country analysis page charts
  function initializeCountryAnalysisPageCharts(partnerId) {
    if (!partnerId) return;
    
    // Initialize Country Heatmap Chart
    if (document.getElementById('country-heatmap-chart')) {
      loadCountryHeatmapChart(partnerId);
    }
    
    // Initialize Regional Analysis Chart
    if (document.getElementById('regional-analysis-chart')) {
      loadRegionalAnalysisChart(partnerId);
    }
    
    // Initialize Top Countries Revenue Chart
    if (document.getElementById('top-countries-revenue-chart')) {
      loadTopCountriesRevenueChart(partnerId);
    }
    
    // Initialize Client Region Distribution Chart
    if (document.getElementById('client-region-distribution-chart')) {
      loadClientRegionDistributionChart(partnerId);
    }
  }
  
  // Load Country Heatmap Chart
  function loadCountryHeatmapChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=country_performance&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('country-heatmap-chart');
        if (!container) return;
        
        const data = response.data.slice(0, 20); // Top 20 countries
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        const maxValue = Math.max(...data.map(d => parseFloat(d.total_commissions)));
        const cellSize = Math.min(width / 5, height / 4);
        
        data.forEach((country, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          const x = col * cellSize;
          const y = row * cellSize;
          
          const intensity = parseFloat(country.total_commissions) / maxValue;
          const color = `rgba(59, 130, 246, ${intensity})`;
          
          svg += `<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" fill="${color}" rx="4"/>`;
          svg += `<text x="${x + cellSize/2}" y="${y + cellSize/2}" text-anchor="middle" font-size="10" fill="#64748b">${country.country}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading country heatmap chart:', err));
  }
  
  // Load Regional Analysis Chart
  function loadRegionalAnalysisChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=country_performance&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('regional-analysis-chart');
        if (!container) return;
        
        const data = response.data;
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        // Group by region (simplified)
        const regionData = {
          'Europe': 0,
          'Asia': 0,
          'Americas': 0,
          'Africa': 0,
          'Oceania': 0
        };
        
        data.forEach(row => {
          const country = row.country.toLowerCase();
          if (country.includes('europe') || country.includes('germany') || country.includes('france')) {
            regionData['Europe'] += parseFloat(row.total_commissions);
          } else if (country.includes('asia') || country.includes('china') || country.includes('japan')) {
            regionData['Asia'] += parseFloat(row.total_commissions);
          } else if (country.includes('america') || country.includes('usa') || country.includes('canada')) {
            regionData['Americas'] += parseFloat(row.total_commissions);
          } else if (country.includes('africa') || country.includes('south africa')) {
            regionData['Africa'] += parseFloat(row.total_commissions);
          } else {
            regionData['Oceania'] += parseFloat(row.total_commissions);
          }
        });
        
        const maxValue = Math.max(...Object.values(regionData));
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        Object.entries(regionData).forEach(([region, value], i) => {
          const barHeight = (value / maxValue) * (height - 40);
          const barWidth = width / Object.keys(regionData).length;
          const x = i * barWidth;
          const y = height - barHeight - 20;
          
          svg += `<rect x="${x + barWidth * 0.1}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${colors[i]}" rx="4"/>`;
          svg += `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#64748b">${region}</text>`;
          svg += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#64748b">$${value.toLocaleString()}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading regional analysis chart:', err));
  }
  
  // Load Top Countries Revenue Chart
  function loadTopCountriesRevenueChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=country_performance&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('top-countries-revenue-chart');
        if (!container) return;
        
        const data = response.data.slice(0, 10); // Top 10 countries
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        const maxValue = Math.max(...data.map(d => parseFloat(d.total_commissions)));
        const barHeight = 20;
        const spacing = 25;
        
        data.forEach((country, i) => {
          const barWidth = (parseFloat(country.total_commissions) / maxValue) * (width - 100);
          const y = i * spacing + 20;
          
          svg += `<rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
          svg += `<text x="75" y="${y + 15}" text-anchor="end" font-size="12" fill="#64748b">${country.country}</text>`;
          svg += `<text x="${barWidth + 85}" y="${y + 15}" font-size="12" fill="#64748b">$${parseFloat(country.total_commissions).toLocaleString()}</text>`;
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading top countries revenue chart:', err));
  }
  
  // Load Client Region Distribution Chart
  function loadClientRegionDistributionChart(partnerId) {
    fetch(`api/index.php?endpoint=cubes&cube=country_performance&partner_id=${partnerId}`)
      .then(r => r.json())
      .then(response => {
        if (!response.success || !response.data) return;
        
        const container = document.getElementById('client-region-distribution-chart');
        if (!container) return;
        
        const data = response.data;
        const width = container.clientWidth || 400;
        const height = 300;
        
        let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
        
        // Group by region
        const regionData = {
          'Europe': 0,
          'Asia': 0,
          'Americas': 0,
          'Africa': 0,
          'Oceania': 0
        };
        
        data.forEach(row => {
          const country = row.country.toLowerCase();
          if (country.includes('europe') || country.includes('germany') || country.includes('france')) {
            regionData['Europe'] += parseInt(row.client_count || 0);
          } else if (country.includes('asia') || country.includes('china') || country.includes('japan')) {
            regionData['Asia'] += parseInt(row.client_count || 0);
          } else if (country.includes('america') || country.includes('usa') || country.includes('canada')) {
            regionData['Americas'] += parseInt(row.client_count || 0);
          } else if (country.includes('africa') || country.includes('south africa')) {
            regionData['Africa'] += parseInt(row.client_count || 0);
          } else {
            regionData['Oceania'] += parseInt(row.client_count || 0);
          }
        });
        
        const total = Object.values(regionData).reduce((sum, count) => sum + count, 0);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        let currentAngle = 0;
        
        Object.entries(regionData).forEach(([region, count], i) => {
          if (count > 0) {
            const percentage = (count / total) * 100;
            const angle = (count / total) * 360;
            
            const x1 = width / 2 + Math.cos(currentAngle * Math.PI / 180) * 80;
            const y1 = height / 2 + Math.sin(currentAngle * Math.PI / 180) * 80;
            const x2 = width / 2 + Math.cos((currentAngle + angle) * Math.PI / 180) * 80;
            const y2 = height / 2 + Math.sin((currentAngle + angle) * Math.PI / 180) * 80;
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            svg += `<path d="M ${width/2} ${height/2} L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${colors[i]}"/>`;
            svg += `<text x="${width/2}" y="${height/2 + i * 20 - 20}" text-anchor="middle" font-size="12" fill="#64748b">${region}: ${count} (${percentage.toFixed(1)}%)</text>`;
            
            currentAngle += angle;
          }
        });
        
        svg += '</svg>';
        container.innerHTML = svg;
      })
      .catch(err => console.error('Error loading client region distribution chart:', err));
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountryAnalysisPage);
  } else {
    initCountryAnalysisPage();
  }
})();

// Chart Performance Optimizations
(function() {
  'use strict';
  
  // Chart cache to avoid re-rendering
  const chartCache = new Map();
  
  // Debounce function for chart updates
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Optimized chart rendering with caching
  function renderChartWithCache(containerId, chartType, partnerId, renderFunction) {
    const cacheKey = `${chartType}_${partnerId}`;
    
    // Check cache first
    if (chartCache.has(cacheKey)) {
      const cachedData = chartCache.get(cacheKey);
      const container = document.getElementById(containerId);
      if (container && cachedData.timestamp > Date.now() - 300000) { // 5 minute cache
        container.innerHTML = cachedData.html;
        return Promise.resolve(cachedData.data);
      }
    }
    
    // Render new chart
    return renderFunction().then(data => {
      const container = document.getElementById(containerId);
      if (container) {
        const html = container.innerHTML;
        chartCache.set(cacheKey, {
          html: html,
          data: data,
          timestamp: Date.now()
        });
      }
      return data;
    });
  }
  
  // Optimized API calls with request deduplication
  const pendingRequests = new Map();
  
  function fetchWithDeduplication(url) {
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url);
    }
    
    const promise = fetch(url)
      .then(response => response.json())
      .finally(() => {
        pendingRequests.delete(url);
      });
    
    pendingRequests.set(url, promise);
    return promise;
  }
  
  // Intersection Observer for lazy loading charts
  function setupLazyChartLoading() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const chartType = element.dataset.chartType;
          const partnerId = element.dataset.partnerId;
          
          if (chartType && partnerId) {
            // Load chart when it becomes visible
            loadLazyChart(element, chartType, partnerId);
            observer.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    // Observe all chart containers
    document.querySelectorAll('[data-lazy="chart"]').forEach(element => {
      observer.observe(element);
    });
  }
  
  function loadLazyChart(element, chartType, partnerId) {
    // Show loading state
    element.innerHTML = '<div class="chart-loading">Loading chart...</div>';
    
    // Load appropriate chart based on type
    switch (chartType) {
      case 'six-month-commissions':
        loadSixMonthChartLazy(partnerId, element);
        break;
      case 'tier-distribution':
        loadTierChartLazy(partnerId, element);
        break;
      case 'country-analysis':
        loadCountryChartLazy(partnerId, element);
        break;
      default:
        element.innerHTML = '<p class="muted">Chart type not supported</p>';
    }
  }
  
  function loadSixMonthChartLazy(partnerId, element) {
    fetchWithDeduplication(`api/index.php?endpoint=metrics&partner_id=${partnerId}`)
      .then(response => {
        if (response.success && response.data.last6Months) {
          renderSixMonthChartFromMetrics(response.data.last6Months, element);
        } else {
          element.innerHTML = '<p class="muted">No data available</p>';
        }
      })
      .catch(err => {
        element.innerHTML = '<p class="muted">Failed to load chart</p>';
        console.error('Chart loading error:', err);
      });
  }
  
  function loadTierChartLazy(partnerId, element) {
    fetchWithDeduplication(`api/index.php?endpoint=cubes&cube=client_tiers&partner_id=${partnerId}`)
      .then(response => {
        if (response.success && response.data) {
          // Render tier chart
          const data = response.data;
          const width = element.clientWidth || 400;
          const height = 300;
          
          let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
          
          const tierData = {};
          data.forEach(row => {
            const tier = row.tier || 'Unknown';
            tierData[tier] = (tierData[tier] || 0) + parseInt(row.client_count || 0);
          });
          
          const total = Object.values(tierData).reduce((sum, count) => sum + count, 0);
          const colors = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2'];
          let currentAngle = 0;
          
          Object.entries(tierData).forEach(([tier, count], i) => {
            if (count > 0) {
              const percentage = (count / total) * 100;
              const angle = (count / total) * 360;
              
              const x1 = width / 2 + Math.cos(currentAngle * Math.PI / 180) * 80;
              const y1 = height / 2 + Math.sin(currentAngle * Math.PI / 180) * 80;
              const x2 = width / 2 + Math.cos((currentAngle + angle) * Math.PI / 180) * 80;
              const y2 = height / 2 + Math.sin((currentAngle + angle) * Math.PI / 180) * 80;
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              svg += `<path d="M ${width/2} ${height/2} L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"/>`;
              svg += `<text x="${width/2}" y="${height/2 + i * 20 - 20}" text-anchor="middle" font-size="12" fill="#64748b">${tier}: ${count} (${percentage.toFixed(1)}%)</text>`;
              
              currentAngle += angle;
            }
          });
          
          svg += '</svg>';
          element.innerHTML = svg;
        } else {
          element.innerHTML = '<p class="muted">No data available</p>';
        }
      })
      .catch(err => {
        element.innerHTML = '<p class="muted">Failed to load chart</p>';
        console.error('Chart loading error:', err);
      });
  }
  
  function loadCountryChartLazy(partnerId, element) {
    fetchWithDeduplication(`api/index.php?endpoint=cubes&cube=country_performance&partner_id=${partnerId}`)
      .then(response => {
        if (response.success && response.data) {
          const data = response.data.slice(0, 10);
          const width = element.clientWidth || 400;
          const height = 300;
          
          let svg = `<svg width="${width}" height="${height}" style="background: rgba(148,163,184,0.05);">`;
          
          const maxValue = Math.max(...data.map(d => parseFloat(d.total_commissions)));
          const barHeight = 20;
          const spacing = 25;
          
          data.forEach((country, i) => {
            const barWidth = (parseFloat(country.total_commissions) / maxValue) * (width - 100);
            const y = i * spacing + 20;
            
            svg += `<rect x="80" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
            svg += `<text x="75" y="${y + 15}" text-anchor="end" font-size="12" fill="#64748b">${country.country}</text>`;
            svg += `<text x="${barWidth + 85}" y="${y + 15}" font-size="12" fill="#64748b">$${parseFloat(country.total_commissions).toLocaleString()}</text>`;
          });
          
          svg += '</svg>';
          element.innerHTML = svg;
        } else {
          element.innerHTML = '<p class="muted">No data available</p>';
        }
      })
      .catch(err => {
        element.innerHTML = '<p class="muted">Failed to load chart</p>';
        console.error('Chart loading error:', err);
      });
  }
  
  // Performance monitoring
  function monitorChartPerformance() {
    const startTime = performance.now();
    
    // Monitor chart rendering time
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('chart')) {
          console.log(`Chart ${entry.name} took ${entry.duration}ms to render`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
          console.warn('High memory usage detected:', memory.usedJSHeapSize / 1024 / 1024, 'MB');
          // Clear chart cache if memory usage is high
          chartCache.clear();
        }
      }, 30000); // Check every 30 seconds
    }
  }
  
  // Initialize performance optimizations
  function initPerformanceOptimizations() {
    setupLazyChartLoading();
    monitorChartPerformance();
    
    // Clear cache periodically
    setInterval(() => {
      chartCache.clear();
    }, 300000); // Clear every 5 minutes
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformanceOptimizations);
  } else {
    initPerformanceOptimizations();
  }
  
  // Export optimization functions
  window.ChartOptimizations = {
    renderChartWithCache,
    fetchWithDeduplication,
    debounce
  };
})();


