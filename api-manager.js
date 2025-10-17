// API Manager - Handle all API calls to MySQL backend
(function() {
  'use strict';
  
  const API_BASE_URL = '/api';
  let cachedData = null;
  let lastFetchTime = 0;
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  
  // API request helper
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Load dashboard data
  async function loadDashboardData(partnerId = null) {
    const now = Date.now();
    
    // Check cache
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedData;
    }
    
    try {
      const endpoint = partnerId ? `/dashboard?partner_id=${partnerId}` : '/dashboard';
      const data = await apiRequest(endpoint);
      
      // Transform data to match original JSON structure
      const transformedData = {
        partners: data.partners || [],
        clients: data.clients || [],
        trades: data.trades || [],
        deposits: data.deposits || [],
        partnerTiers: data.partnerTiers || []
      };
      
      cachedData = transformedData;
      lastFetchTime = now;
      
      return transformedData;
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      
      // Try to load from localStorage as fallback
      const stored = localStorage.getItem('partnerReportData');
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          console.warn('Using cached data due to API error');
          return parsedData;
        } catch (e) {
          console.error('Failed to parse cached data:', e);
        }
      }
      
      throw error;
    }
  }
  
  // Load metrics
  async function loadMetrics(partnerId = null) {
    try {
      const endpoint = partnerId ? `/metrics?partner_id=${partnerId}` : '/metrics';
      return await apiRequest(endpoint);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      throw error;
    }
  }
  
  // Load chart data
  async function loadChartData(chartType, partnerId = null) {
    try {
      const params = new URLSearchParams();
      params.append('type', chartType);
      if (partnerId) {
        params.append('partner_id', partnerId);
      }
      
      const endpoint = `/charts?${params.toString()}`;
      return await apiRequest(endpoint);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      throw error;
    }
  }
  
  // Load clients
  async function loadClients(partnerId = null, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (partnerId) params.append('partner_id', partnerId);
      if (filters.country) params.append('country', filters.country);
      if (filters.tier) params.append('tier', filters.tier);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      const endpoint = `/clients?${params.toString()}`;
      return await apiRequest(endpoint);
    } catch (error) {
      console.error('Failed to load clients:', error);
      throw error;
    }
  }
  
  // Load partners
  async function loadPartners() {
    try {
      return await apiRequest('/partners');
    } catch (error) {
      console.error('Failed to load partners:', error);
      throw error;
    }
  }
  
  // Create client
  async function createClient(clientData) {
    try {
      return await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(clientData)
      });
    } catch (error) {
      console.error('Failed to create client:', error);
      throw error;
    }
  }
  
  // Update client
  async function updateClient(clientId, clientData) {
    try {
      return await apiRequest(`/clients?id=${clientId}`, {
        method: 'PUT',
        body: JSON.stringify(clientData)
      });
    } catch (error) {
      console.error('Failed to update client:', error);
      throw error;
    }
  }
  
  // Delete client
  async function deleteClient(clientId) {
    try {
      return await apiRequest(`/clients?id=${clientId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete client:', error);
      throw error;
    }
  }
  
  // Clear cache
  function clearCache() {
    cachedData = null;
    lastFetchTime = 0;
    localStorage.removeItem('partnerReportData');
  }
  
  // Check API health
  async function checkApiHealth() {
    try {
      await apiRequest('/partners');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Expose API manager
  window.ApiManager = {
    loadDashboardData,
    loadMetrics,
    loadChartData,
    loadClients,
    loadPartners,
    createClient,
    updateClient,
    deleteClient,
    clearCache,
    checkApiHealth
  };
})();
