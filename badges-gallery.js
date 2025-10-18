// Badges Gallery - Display partner badge achievements
(function() {
  'use strict';
  
  /**
   * Render badges gallery
   */
  function renderBadgesGallery(container, badgeProgress) {
    if (!badgeProgress || !badgeProgress.badges) {
      container.innerHTML = '<p class="muted">No badge data available</p>';
      return;
    }
    
    const badges = badgeProgress.badges;
    const totalCommissions = badgeProgress.total_commissions || 0;
    const totalDeposits = badgeProgress.total_deposits || 0;
    
    // Group badges by criteria
    const commissionBadges = badges.filter(b => b.badge_criteria === 'commissions');
    const depositBadges = badges.filter(b => b.badge_criteria === 'deposits');
    
    let html = '<div style="margin-bottom: 24px;">';
    
    // Commission Badges Section
    html += '<div style="margin-bottom: 32px;">';
    html += '<h4 style="margin: 0 0 16px 0; color: var(--accent);">💰 Commission Badges</h4>';
    html += '<div style="font-size: 14px; color: var(--muted); margin-bottom: 12px;">';
    html += 'Total Commissions: <strong style="color: var(--text);">$' + totalCommissions.toLocaleString() + '</strong>';
    html += '</div>';
    html += '<div class="badges-grid">';
    commissionBadges.forEach(badge => {
      html += renderBadgeCard(badge);
    });
    html += '</div>';
    html += '</div>';
    
    // Deposit Badges Section
    html += '<div>';
    html += '<h4 style="margin: 0 0 16px 0; color: var(--accent-2);">💎 Deposit Badges</h4>';
    html += '<div style="font-size: 14px; color: var(--muted); margin-bottom: 12px;">';
    html += 'Total Deposits: <strong style="color: var(--text);">$' + totalDeposits.toLocaleString() + '</strong>';
    html += '</div>';
    html += '<div class="badges-grid">';
    depositBadges.forEach(badge => {
      html += renderBadgeCard(badge);
    });
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    // Add summary stats
    const earnedCount = badges.filter(b => b.earned).length;
    const totalBadges = badges.length;
    html += '<div style="text-align: center; padding: 16px; background: rgba(56, 189, 248, 0.1); border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.2);">';
    html += '<div style="font-size: 14px; color: var(--muted); margin-bottom: 4px;">Badges Earned</div>';
    html += '<div style="font-size: 24px; font-weight: 600; color: var(--accent);">' + earnedCount + ' / ' + totalBadges + '</div>';
    html += '<div style="font-size: 12px; color: var(--muted); margin-top: 4px;">' + Math.round((earnedCount / totalBadges) * 100) + '% Complete</div>';
    html += '</div>';
    
    container.innerHTML = html;
  }
  
  /**
   * Render individual badge card
   */
  function renderBadgeCard(badge) {
    const earned = badge.earned;
    const progress = badge.progress_percent;
    const badgeColor = getBadgeColor(badge.badge_name);
    const badgeIcon = getBadgeIcon(badge.badge_criteria);
    
    // Determine opacity based on earned status
    const opacity = earned ? '1' : '0.3';
    const cardBg = earned ? 'rgba(56, 189, 248, 0.08)' : 'rgba(148, 163, 184, 0.05)';
    const borderColor = earned ? badgeColor : 'rgba(148, 163, 184, 0.1)';
    
    let html = '<div class="badge-card" style="';
    html += 'opacity: ' + opacity + '; ';
    html += 'background: ' + cardBg + '; ';
    html += 'border: 2px solid ' + borderColor + '; ';
    html += 'border-radius: 12px; ';
    html += 'padding: 16px; ';
    html += 'text-align: center; ';
    html += 'transition: all 0.3s ease; ';
    html += 'position: relative;';
    html += '">';
    
    // Badge icon with color
    html += '<div style="';
    html += 'font-size: 48px; ';
    html += 'margin-bottom: 8px; ';
    html += 'filter: ' + (earned ? 'none' : 'grayscale(100%)') + ';';
    html += '">';
    html += badgeIcon;
    html += '</div>';
    
    // Badge name
    html += '<div style="font-weight: 600; font-size: 16px; color: ' + (earned ? badgeColor : 'var(--muted)') + '; margin-bottom: 4px; text-transform: uppercase;">';
    html += badge.badge_name;
    html += '</div>';
    
    // Badge trigger amount
    html += '<div style="font-size: 14px; color: var(--muted); margin-bottom: 8px;">';
    html += badge.badge_trigger;
    html += '</div>';
    
    // Progress bar (only for incomplete badges)
    if (!earned) {
      html += '<div style="margin-top: 12px;">';
      html += '<div style="height: 6px; background: rgba(148, 163, 184, 0.2); border-radius: 3px; overflow: hidden;">';
      html += '<div style="height: 100%; width: ' + progress + '%; background: ' + badgeColor + '; transition: width 0.5s ease;"></div>';
      html += '</div>';
      html += '<div style="font-size: 11px; color: var(--muted); margin-top: 4px;">' + progress.toFixed(0) + '% Complete</div>';
      
      // Show remaining amount
      if (badge.remaining > 0) {
        html += '<div style="font-size: 11px; color: var(--muted); margin-top: 2px;">$' + badge.remaining.toLocaleString() + ' to go</div>';
      }
      html += '</div>';
    } else {
      // Earned checkmark
      html += '<div style="margin-top: 8px; color: ' + badgeColor + '; font-size: 20px;">✓</div>';
      html += '<div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Earned!</div>';
    }
    
    html += '</div>';
    
    return html;
  }
  
  /**
   * Get badge color based on badge name
   */
  function getBadgeColor(badgeName) {
    if (badgeName.startsWith('com')) {
      // Commission badges - shades of blue/cyan
      if (badgeName === 'com1') return '#38bdf8';
      if (badgeName === 'com10') return '#0ea5e9';
      if (badgeName === 'com100') return '#0284c7';
      if (badgeName === 'com1k') return '#0369a1';
      if (badgeName === 'com10k') return '#075985';
      if (badgeName === 'com100k') return '#0c4a6e';
    } else if (badgeName.startsWith('dep')) {
      // Deposit badges - shades of green
      if (badgeName === 'dep1') return '#22c55e';
      if (badgeName === 'dep10') return '#16a34a';
      if (badgeName === 'dep100') return '#15803d';
      if (badgeName === 'dep1k') return '#166534';
      if (badgeName === 'dep10k') return '#14532d';
      if (badgeName === 'dep100k') return '#052e16';
    }
    return '#94a3b8';
  }
  
  /**
   * Get badge icon based on criteria
   */
  function getBadgeIcon(criteria) {
    if (criteria === 'commissions') {
      return '🏆'; // Trophy for commissions
    } else if (criteria === 'deposits') {
      return '💎'; // Diamond for deposits
    }
    return '⭐';
  }
  
  /**
   * Load and render badge gallery
   */
  async function loadBadgeGallery(partnerId) {
    const container = document.getElementById('badges-gallery');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; padding: 40px;"><div class="loading-spinner"></div><span style="margin-left: 10px; color: var(--muted);">Loading badges...</span></div>';
    
    try {
      // If no partner selected, show message
      if (!partnerId) {
        container.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">Select a partner to view their badges</p>';
        return;
      }
      
      // Fetch badge progress from API
      const params = new URLSearchParams();
      params.append('action', 'progress');
      params.append('partner_id', partnerId);
      
      const response = await fetch(`api/index.php?${params.toString()}&endpoint=badges`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load badges');
      }
      
      renderBadgesGallery(container, result.data);
    } catch (error) {
      console.error('Failed to load badge gallery:', error);
      container.innerHTML = '<div class="chart-error">Failed to load badges. Please ensure the badges table is set up.</div>';
    }
  }
  
  /**
   * Initialize badge gallery
   */
  function initBadgeGallery() {
    const container = document.getElementById('badges-gallery');
    if (!container) return;
    
    const partnerSelect = document.getElementById('partnerSelect');
    
    function updateGallery() {
      const partnerId = partnerSelect ? partnerSelect.value : null;
      loadBadgeGallery(partnerId);
    }
    
    // Listen for partner selection changes
    if (partnerSelect) {
      partnerSelect.addEventListener('change', updateGallery);
    }
    
    // Initial load after a delay to allow partner dropdown to be populated
    // This gives time for the partner dropdown to restore saved selection
    setTimeout(function() {
      const partnerId = partnerSelect ? partnerSelect.value : null;
      
      // If no partner is selected, try to get from localStorage
      if (!partnerId) {
        const savedPartnerId = localStorage.getItem('selectedPartnerId');
        if (savedPartnerId && partnerSelect) {
          partnerSelect.value = savedPartnerId;
        }
      }
      
      updateGallery();
    }, 600); // Wait 600ms for partner dropdown population
  }
  
  // Expose functions
  window.BadgeGallery = {
    init: initBadgeGallery,
    load: loadBadgeGallery
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBadgeGallery);
  } else {
    initBadgeGallery();
  }
})();
