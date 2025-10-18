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
          
          // Render 6-month chart with data
          if (transformedMetrics.last6Months) {
            renderSixMonthChartFromMetrics(transformedMetrics.last6Months);
          }
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
        }
        select.addEventListener('change', update);
        if (timePeriodSelect) {
          timePeriodSelect.addEventListener('change', update);
        }
        update();
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


