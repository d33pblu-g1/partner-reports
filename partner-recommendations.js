/**
 * Partner Recommendations Engine
 * Analyzes partner data to provide actionable recommendations
 */

(function() {
  'use strict';
  
  window.PartnerRecommendations = {
    
    /**
     * Generate recommendations for a partner
     */
    generateRecommendations: function(partnerId) {
      return Promise.all([
        this.getPartnerMetrics(partnerId),
        this.getPartnerLinks(partnerId),
        this.getPartnerPerformance(partnerId),
        this.getBenchmarkData()
      ]).then(([metrics, links, performance, benchmarks]) => {
        return this.analyzeAndRecommend(metrics, links, performance, benchmarks);
      });
    },
    
    /**
     * Get partner metrics
     */
    getPartnerMetrics: function(partnerId) {
      return fetch(`api/index.php?endpoint=metrics&partner_id=${partnerId}`)
        .then(response => response.json())
        .then(data => data.success ? data.data : null);
    },
    
    /**
     * Get partner links
     */
    getPartnerLinks: function(partnerId) {
      return fetch(`api/index.php?endpoint=partner_links&partner_id=${partnerId}`)
        .then(response => response.json())
        .then(data => data.success ? data.data : []);
    },
    
    /**
     * Get partner performance data
     */
    getPartnerPerformance: function(partnerId) {
      return fetch(`api/index.php?endpoint=cubes&cube=dashboard&partner_id=${partnerId}`)
        .then(response => response.json())
        .then(data => data.success ? data.data : null);
    },
    
    /**
     * Get benchmark data for comparison
     */
    getBenchmarkData: function() {
      return fetch('api/index.php?endpoint=metrics')
        .then(response => response.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            return this.calculateBenchmarks(data.data);
          }
          return null;
        });
    },
    
    /**
     * Calculate benchmark metrics
     */
    calculateBenchmarks: function(allMetrics) {
      const benchmarks = {
        avgLifetimeDeposits: 0,
        avgLifetimeCommissions: 0,
        avgLifetimeClients: 0,
        avgMtdDeposits: 0,
        avgMtdCommissions: 0,
        avgMtdClients: 0
      };
      
      if (allMetrics.length === 0) return benchmarks;
      
      allMetrics.forEach(metric => {
        benchmarks.avgLifetimeDeposits += metric.ltDeposits || 0;
        benchmarks.avgLifetimeCommissions += metric.ltCommissions || 0;
        benchmarks.avgLifetimeClients += metric.ltClients || 0;
        benchmarks.avgMtdDeposits += metric.mtdDeposits || 0;
        benchmarks.avgMtdCommissions += metric.mtdComm || 0;
        benchmarks.avgMtdClients += metric.mtdClients || 0;
      });
      
      const count = allMetrics.length;
      Object.keys(benchmarks).forEach(key => {
        benchmarks[key] = benchmarks[key] / count;
      });
      
      return benchmarks;
    },
    
    /**
     * Analyze data and generate recommendations
     */
    analyzeAndRecommend: function(metrics, links, performance, benchmarks) {
      const recommendations = [];
      
      if (!metrics) {
        return [{
          type: 'error',
          title: 'No Data Available',
          description: 'Unable to load partner data for analysis.',
          priority: 'low',
          icon: '⚠️'
        }];
      }
      
      // 1. Social Media Presence Analysis
      const socialMediaRec = this.analyzeSocialMediaPresence(links, metrics);
      if (socialMediaRec) recommendations.push(socialMediaRec);
      
      // 2. Performance vs Benchmarks
      const performanceRec = this.analyzePerformance(metrics, benchmarks);
      if (performanceRec) recommendations.push(performanceRec);
      
      // 3. Growth Opportunities
      const growthRec = this.analyzeGrowthOpportunities(metrics, links);
      if (growthRec) recommendations.push(growthRec);
      
      // 4. Client Acquisition Analysis
      const acquisitionRec = this.analyzeClientAcquisition(metrics, benchmarks);
      if (acquisitionRec) recommendations.push(acquisitionRec);
      
      // 5. Revenue Optimization
      const revenueRec = this.analyzeRevenueOptimization(metrics, benchmarks);
      if (revenueRec) recommendations.push(revenueRec);
      
      // Sort by priority and return top 3
      return recommendations
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .slice(0, 3);
    },
    
    /**
     * Analyze social media presence
     */
    analyzeSocialMediaPresence: function(links, metrics) {
      const socialLinks = links.filter(link => 
        ['youtube', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'].includes(link.link_type)
      );
      
      if (socialLinks.length === 0) {
        return {
          type: 'social_media',
          title: 'Expand Social Media Presence',
          description: 'No social media links found. Consider adding YouTube, Instagram, or Facebook channels to reach more potential clients.',
          priority: 'high',
          icon: '📱',
          action: 'Add social media links in Partner Links page',
          impact: 'High - Social media is crucial for client acquisition'
        };
      }
      
      const totalFollowers = socialLinks.reduce((sum, link) => sum + (link.follower_count || 0), 0);
      const avgEngagement = socialLinks.reduce((sum, link) => sum + (link.engagement_rate || 0), 0) / socialLinks.length;
      
      if (totalFollowers < 1000) {
        return {
          type: 'social_media',
          title: 'Grow Social Media Following',
          description: `Current total followers: ${totalFollowers.toLocaleString()}. Focus on creating valuable content to grow your audience.`,
          priority: 'medium',
          icon: '👥',
          action: 'Create consistent, valuable content',
          impact: 'Medium - Larger following = more potential clients'
        };
      }
      
      if (avgEngagement < 2.0) {
        return {
          type: 'social_media',
          title: 'Improve Social Media Engagement',
          description: `Current engagement rate: ${avgEngagement.toFixed(1)}%. Focus on interactive content and community building.`,
          priority: 'medium',
          icon: '💬',
          action: 'Increase interaction with followers',
          impact: 'Medium - Higher engagement = better conversion'
        };
      }
      
      return null;
    },
    
    /**
     * Analyze performance vs benchmarks
     */
    analyzePerformance: function(metrics, benchmarks) {
      if (!benchmarks) return null;
      
      const depositRatio = metrics.ltDeposits / benchmarks.avgLifetimeDeposits;
      const commissionRatio = metrics.ltCommissions / benchmarks.avgLifetimeCommissions;
      const clientRatio = metrics.ltClients / benchmarks.avgLifetimeClients;
      
      // Check for underperformance
      if (depositRatio < 0.5) {
        return {
          type: 'performance',
          title: 'Low Deposit Volume',
          description: `Your lifetime deposits ($${metrics.ltDeposits.toLocaleString()}) are below average. Focus on attracting higher-value clients.`,
          priority: 'high',
          icon: '💰',
          action: 'Target high-net-worth individuals',
          impact: 'High - Deposits directly affect revenue'
        };
      }
      
      if (commissionRatio < 0.5) {
        return {
          type: 'performance',
          title: 'Low Commission Generation',
          description: `Your lifetime commissions ($${metrics.ltCommissions.toLocaleString()}) are below average. Focus on active trading clients.`,
          priority: 'high',
          icon: '📈',
          action: 'Encourage more trading activity',
          impact: 'High - Commissions are primary revenue source'
        };
      }
      
      if (clientRatio < 0.5) {
        return {
          type: 'performance',
          title: 'Low Client Acquisition',
          description: `Your client count (${metrics.ltClients}) is below average. Focus on marketing and referral programs.`,
          priority: 'high',
          icon: '👥',
          action: 'Implement referral incentives',
          impact: 'High - More clients = more revenue potential'
        };
      }
      
      return null;
    },
    
    /**
     * Analyze growth opportunities
     */
    analyzeGrowthOpportunities: function(metrics, links) {
      const mtdGrowthRate = metrics.mtdClients > 0 ? (metrics.mtdClients / metrics.ltClients) * 100 : 0;
      
      if (mtdGrowthRate < 5) {
        return {
          type: 'growth',
          title: 'Accelerate Client Growth',
          description: `Monthly growth rate: ${mtdGrowthRate.toFixed(1)}%. Consider launching targeted marketing campaigns.`,
          priority: 'medium',
          icon: '🚀',
          action: 'Launch targeted marketing campaigns',
          impact: 'Medium - Steady growth is essential'
        };
      }
      
      // Check for YouTube presence (high conversion potential)
      const hasYouTube = links.some(link => link.link_type === 'youtube');
      if (!hasYouTube) {
        return {
          type: 'growth',
          title: 'Start YouTube Channel',
          description: 'YouTube is highly effective for trading education. Consider creating educational content to attract new clients.',
          priority: 'medium',
          icon: '🎥',
          action: 'Create YouTube channel with trading tutorials',
          impact: 'Medium - YouTube has high conversion rates'
        };
      }
      
      return null;
    },
    
    /**
     * Analyze client acquisition
     */
    analyzeClientAcquisition: function(metrics, benchmarks) {
      const clientValue = metrics.ltClients > 0 ? metrics.ltDeposits / metrics.ltClients : 0;
      const avgClientValue = benchmarks.avgLifetimeDeposits / benchmarks.avgLifetimeClients;
      
      if (clientValue < avgClientValue * 0.7) {
        return {
          type: 'acquisition',
          title: 'Improve Client Quality',
          description: `Average client value: $${clientValue.toLocaleString()}. Focus on attracting higher-value clients.`,
          priority: 'medium',
          icon: '⭐',
          action: 'Target premium client segments',
          impact: 'Medium - Quality over quantity'
        };
      }
      
      return null;
    },
    
    /**
     * Analyze revenue optimization
     */
    analyzeRevenueOptimization: function(metrics, benchmarks) {
      const revenuePerClient = metrics.ltClients > 0 ? metrics.ltCommissions / metrics.ltClients : 0;
      const avgRevenuePerClient = benchmarks.avgLifetimeCommissions / benchmarks.avgLifetimeClients;
      
      if (revenuePerClient < avgRevenuePerClient * 0.8) {
        return {
          type: 'revenue',
          title: 'Optimize Revenue Per Client',
          description: `Revenue per client: $${revenuePerClient.toLocaleString()}. Encourage more trading activity from existing clients.`,
          priority: 'medium',
          icon: '💎',
          action: 'Implement trading incentives',
          impact: 'Medium - Maximize existing client value'
        };
      }
      
      return null;
    },
    
    /**
     * Get priority weight for sorting
     */
    getPriorityWeight: function(priority) {
      const weights = { 'high': 3, 'medium': 2, 'low': 1 };
      return weights[priority] || 0;
    },
    
    /**
     * Render recommendations in the UI
     */
    renderRecommendations: function(containerId, recommendations) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      if (recommendations.length === 0) {
        container.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">No recommendations available at this time.</p>';
        return;
      }
      
      const recommendationsHtml = recommendations.map((rec, index) => `
        <div class="recommendation-item" style="
          border: 1px solid var(--border); 
          border-radius: 8px; 
          padding: 16px; 
          margin-bottom: 12px;
          background: var(--panel);
        ">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="font-size: 24px;">${rec.icon}</div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <h4 style="margin: 0; color: var(--text);">${rec.title}</h4>
                <span class="priority-badge priority-${rec.priority}" style="
                  padding: 2px 8px; 
                  border-radius: 4px; 
                  font-size: 12px; 
                  text-transform: uppercase;
                  background: ${rec.priority === 'high' ? 'var(--error)' : rec.priority === 'medium' ? 'var(--warning)' : 'var(--success)'};
                  color: white;
                ">${rec.priority}</span>
              </div>
              <p style="margin: 0 0 8px 0; color: var(--muted); line-height: 1.5;">${rec.description}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: var(--accent);">Action:</strong> ${rec.action}
                </div>
                <div style="font-size: 12px; color: var(--muted);">
                  Impact: ${rec.impact}
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = recommendationsHtml;
    }
  };
  
})();
