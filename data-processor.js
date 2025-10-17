// Data Processor - Preprocessing and memoization for better performance
(function() {
  'use strict';
  
  const memoCache = new Map();
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  
  // Memoization wrapper
  function memoize(key, fn, expiry = CACHE_EXPIRY) {
    return function(...args) {
      const cacheKey = key + JSON.stringify(args);
      const now = Date.now();
      
      // Check cache
      if (memoCache.has(cacheKey)) {
        const cached = memoCache.get(cacheKey);
        if (now - cached.timestamp < expiry) {
          return cached.value;
        }
        memoCache.delete(cacheKey);
      }
      
      // Compute and cache
      const result = fn.apply(this, args);
      memoCache.set(cacheKey, {
        value: result,
        timestamp: now
      });
      
      return result;
    };
  }
  
  // Preprocess client data for faster lookups
  function preprocessClients(clients) {
    const processed = {
      byId: new Map(),
      byPartner: new Map(),
      byCountry: new Map(),
      byTier: new Map(),
      total: clients.length
    };
    
    clients.forEach(client => {
      // Index by ID
      processed.byId.set(client.customerId, client);
      
      // Index by partner
      const partnerId = client.partnerId;
      if (!processed.byPartner.has(partnerId)) {
        processed.byPartner.set(partnerId, []);
      }
      processed.byPartner.get(partnerId).push(client);
      
      // Index by country
      const country = client.country;
      if (!processed.byCountry.has(country)) {
        processed.byCountry.set(country, []);
      }
      processed.byCountry.get(country).push(client);
      
      // Index by tier
      const tier = client.tier;
      if (!processed.byTier.has(tier)) {
        processed.byTier.set(tier, []);
      }
      processed.byTier.get(tier).push(client);
    });
    
    return processed;
  }
  
  // Preprocess trade data
  function preprocessTrades(trades) {
    const processed = {
      byClientId: new Map(),
      byDate: new Map(),
      total: trades.length,
      totalCommission: 0,
      totalVolume: 0
    };
    
    trades.forEach(trade => {
      const clientId = trade.customerId;
      const date = new Date(trade.dateTime);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      
      // Index by client
      if (!processed.byClientId.has(clientId)) {
        processed.byClientId.set(clientId, []);
      }
      processed.byClientId.get(clientId).push(trade);
      
      // Index by month
      if (!processed.byDate.has(monthKey)) {
        processed.byDate.set(monthKey, []);
      }
      processed.byDate.get(monthKey).push(trade);
      
      // Aggregate totals
      processed.totalCommission += trade.commission || 0;
      processed.totalVolume += trade.volume || 0;
    });
    
    return processed;
  }
  
  // Preprocess deposit data
  function preprocessDeposits(deposits) {
    const processed = {
      byClientId: new Map(),
      byDate: new Map(),
      total: deposits.length,
      totalValue: 0
    };
    
    deposits.forEach(deposit => {
      const clientId = deposit.customerId;
      const date = new Date(deposit.dateTime);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      
      // Index by client
      if (!processed.byClientId.has(clientId)) {
        processed.byClientId.set(clientId, []);
      }
      processed.byClientId.get(clientId).push(deposit);
      
      // Index by month
      if (!processed.byDate.has(monthKey)) {
        processed.byDate.set(monthKey, []);
      }
      processed.byDate.get(monthKey).push(deposit);
      
      // Aggregate total
      processed.totalValue += deposit.value || 0;
    });
    
    return processed;
  }
  
  // Fast partner metrics calculation
  const calculatePartnerMetrics = memoize('partner-metrics', function(db, partnerId) {
    const clients = db.clients || [];
    const trades = db.trades || [];
    const deposits = db.deposits || [];
    const partners = db.partners || [];
    
    // Preprocess data if not already done
    if (!db._processed) {
      db._processed = {
        clients: preprocessClients(clients),
        trades: preprocessTrades(trades),
        deposits: preprocessDeposits(deposits)
      };
    }
    
    const processed = db._processed;
    const selectedPartner = partners.find(p => p.partnerId === partnerId);
    
    // Get partner clients efficiently
    const partnerClients = partnerId 
      ? (processed.clients.byPartner.get(partnerId) || [])
      : clients;
    
    const partnerClientIds = new Set(partnerClients.map(c => c.customerId));
    
    // Calculate metrics efficiently
    let ltCommissions = 0;
    let ltDeposits = 0;
    let ltVolume = 0;
    
    // Use preprocessed data for faster calculations
    partnerClientIds.forEach(clientId => {
      const clientTrades = processed.trades.byClientId.get(clientId) || [];
      const clientDeposits = processed.deposits.byClientId.get(clientId) || [];
      
      ltCommissions += clientTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
      ltDeposits += clientDeposits.reduce((sum, d) => sum + (d.value || 0), 0);
      ltVolume += clientTrades.length;
    });
    
    // Monthly metrics
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    let mtdComm = 0;
    let mtdDeposits = 0;
    let mtdVolume = 0;
    
    // Get current month data efficiently
    const monthTrades = processed.trades.byDate.get(currentMonthKey) || [];
    const monthDeposits = processed.deposits.byDate.get(currentMonthKey) || [];
    
    monthTrades.forEach(trade => {
      if (partnerClientIds.has(trade.customerId)) {
        mtdComm += trade.commission || 0;
        mtdVolume++;
      }
    });
    
    monthDeposits.forEach(deposit => {
      if (partnerClientIds.has(deposit.customerId)) {
        mtdDeposits += deposit.value || 0;
      }
    });
    
    // Count new clients this month
    const mtdClients = partnerClients.filter(c => {
      const joinDate = new Date(c.joinDate);
      return joinDate >= monthStart && joinDate <= now;
    }).length;
    
    return {
      partnerName: selectedPartner ? selectedPartner.name : 'All partners',
      partnerTier: selectedPartner ? selectedPartner.tier : '—',
      ltClients: partnerClients.length,
      ltDeposits: ltDeposits,
      ltCommissions: ltCommissions,
      ltVolume: ltVolume,
      mtdComm: mtdComm,
      mtdVolume: mtdVolume,
      mtdDeposits: mtdDeposits,
      mtdClients: mtdClients
    };
  });
  
  // Fast country analysis
  const calculateCountryMetrics = memoize('country-metrics', function(db, partnerId) {
    const clients = db.clients || [];
    const trades = db.trades || [];
    const deposits = db.deposits || [];
    
    if (!db._processed) {
      db._processed = {
        clients: preprocessClients(clients),
        trades: preprocessTrades(trades),
        deposits: preprocessDeposits(deposits)
      };
    }
    
    const processed = db._processed;
    const partnerClients = partnerId 
      ? (processed.clients.byPartner.get(partnerId) || [])
      : clients;
    
    const partnerClientIds = new Set(partnerClients.map(c => c.customerId));
    const countryStats = {};
    
    // Initialize country stats
    partnerClients.forEach(client => {
      const country = client.country;
      if (!countryStats[country]) {
        countryStats[country] = { clients: 0, commissions: 0, deposits: 0, volume: 0 };
      }
      countryStats[country].clients++;
    });
    
    // Add trade data
    partnerClientIds.forEach(clientId => {
      const client = partnerClients.find(c => c.customerId === clientId);
      if (!client) return;
      
      const country = client.country;
      const clientTrades = processed.trades.byClientId.get(clientId) || [];
      const clientDeposits = processed.deposits.byClientId.get(clientId) || [];
      
      countryStats[country].commissions += clientTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
      countryStats[country].volume += clientTrades.length;
      countryStats[country].deposits += clientDeposits.reduce((sum, d) => sum + (d.value || 0), 0);
    });
    
    return countryStats;
  });
  
  // Fast tier distribution calculation
  const calculateTierDistribution = memoize('tier-distribution', function(db, partnerId) {
    const clients = db.clients || [];
    
    if (!db._processed) {
      db._processed = {
        clients: preprocessClients(clients)
      };
    }
    
    const processed = db._processed;
    const partnerClients = partnerId 
      ? (processed.clients.byPartner.get(partnerId) || [])
      : clients;
    
    const tierCounts = {};
    partnerClients.forEach(client => {
      const tier = client.tier || 'Unknown';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });
    
    return tierCounts;
  });
  
  // Clear cache
  function clearCache() {
    memoCache.clear();
  }
  
  // Get cache stats
  function getCacheStats() {
    return {
      size: memoCache.size,
      keys: Array.from(memoCache.keys())
    };
  }
  
  // Expose data processor
  window.DataProcessor = {
    preprocessClients,
    preprocessTrades,
    preprocessDeposits,
    calculatePartnerMetrics,
    calculateCountryMetrics,
    calculateTierDistribution,
    clearCache,
    getCacheStats,
    memoize
  };
})();
