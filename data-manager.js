// Data Manager - Centralized data loading and caching
(function() {
  'use strict';
  
  let cachedData = null;
  let loadingPromise = null;
  let lastFetchTime = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Compress data by removing unnecessary fields and using shorter property names
  function compressData(data) {
    if (!data) return null;
    
    const compressed = {
      p: data.partners || [], // partners
      c: data.clients || [],  // clients
      t: data.trades || [],   // trades
      d: data.deposits || [], // deposits
      pt: data.partnerTiers || [] // partnerTiers
    };
    
    // Compress client data - remove email, preferredLanguage, accountNumber
    compressed.c = compressed.c.map(client => ({
      id: client.customerId,
      n: client.name,
      j: client.joinDate,
      at: client.accountType,
      co: client.country,
      ld: client.lifetimeDeposits,
      cp: client.commissionPlan,
      tl: client.trackingLinkUsed,
      ti: client.tier,
      sp: client.subPartner,
      pid: client.partnerId
    }));
    
    // Compress trade data
    compressed.t = compressed.t.map(trade => ({
      id: trade.customerId,
      dt: trade.dateTime,
      c: trade.commission,
      v: trade.volume
    }));
    
    // Compress deposit data
    compressed.d = compressed.d.map(deposit => ({
      id: deposit.customerId,
      dt: deposit.dateTime,
      v: deposit.value
    }));
    
    return compressed;
  }
  
  // Decompress data back to original format
  function decompressData(compressed) {
    if (!compressed) return null;
    
    const data = {
      partners: compressed.p || [],
      clients: compressed.c || [],
      trades: compressed.t || [],
      deposits: compressed.d || [],
      partnerTiers: compressed.pt || []
    };
    
    // Decompress client data
    data.clients = data.clients.map(client => ({
      customerId: client.id,
      name: client.n,
      joinDate: client.j,
      accountType: client.at,
      country: client.co,
      lifetimeDeposits: client.ld,
      commissionPlan: client.cp,
      trackingLinkUsed: client.tl,
      tier: client.ti,
      subPartner: client.sp,
      partnerId: client.pid
    }));
    
    // Decompress trade data
    data.trades = data.trades.map(trade => ({
      customerId: trade.id,
      dateTime: trade.dt,
      commission: trade.c,
      volume: trade.v
    }));
    
    // Decompress deposit data
    data.deposits = data.deposits.map(deposit => ({
      customerId: deposit.id,
      dateTime: deposit.dt,
      value: deposit.v
    }));
    
    return data;
  }
  
  // Load data with caching
  function loadData() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      return Promise.resolve(cachedData);
    }
    
    // Return existing loading promise if already loading
    if (loadingPromise) {
      return loadingPromise;
    }
    
    // Start new loading
    loadingPromise = fetch('database.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load data');
        return response.json();
      })
      .then(data => {
        // Compress and cache the data
        const compressed = compressData(data);
        localStorage.setItem('partnerReportData', JSON.stringify(compressed));
        localStorage.setItem('partnerReportDataTime', now.toString());
        
        cachedData = data;
        lastFetchTime = now;
        loadingPromise = null;
        
        return data;
      })
      .catch(error => {
        loadingPromise = null;
        
        // Try to load from localStorage as fallback
        const stored = localStorage.getItem('partnerReportData');
        const storedTime = localStorage.getItem('partnerReportDataTime');
        
        if (stored && storedTime && (now - parseInt(storedTime)) < CACHE_DURATION * 2) {
          console.warn('Using cached data due to network error:', error);
          cachedData = decompressData(JSON.parse(stored));
          lastFetchTime = parseInt(storedTime);
          return cachedData;
        }
        
        throw error;
      });
    
    return loadingPromise;
  }
  
  // Preload data from localStorage on page load
  function preloadFromCache() {
    try {
      const stored = localStorage.getItem('partnerReportData');
      const storedTime = localStorage.getItem('partnerReportDataTime');
      
      if (stored && storedTime) {
        const age = Date.now() - parseInt(storedTime);
        if (age < CACHE_DURATION * 2) { // Use cache up to 10 minutes old
          cachedData = decompressData(JSON.parse(stored));
          lastFetchTime = parseInt(storedTime);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
  }
  
  // Initialize cache on load
  preloadFromCache();
  
  // Expose the data manager
  window.DataManager = {
    load: loadData,
    getCached: () => cachedData,
    clearCache: () => {
      cachedData = null;
      lastFetchTime = 0;
      localStorage.removeItem('partnerReportData');
      localStorage.removeItem('partnerReportDataTime');
    }
  };
})();
