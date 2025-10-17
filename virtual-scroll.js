// Virtual Scrolling for Large Client Lists
(function() {
  'use strict';
  
  class VirtualScroll {
    constructor(container, itemHeight = 60, buffer = 5) {
      this.container = container;
      this.itemHeight = itemHeight;
      this.buffer = buffer;
      this.items = [];
      this.visibleItems = [];
      this.scrollTop = 0;
      this.containerHeight = 0;
      
      this.init();
    }
    
    init() {
      // Create virtual scroll container
      this.container.innerHTML = `
        <div class="virtual-scroll-wrapper" style="height: 100%; overflow-y: auto;">
          <div class="virtual-scroll-content" style="position: relative;">
            <div class="virtual-scroll-spacer" style="height: 0;"></div>
            <div class="virtual-scroll-items"></div>
          </div>
        </div>
      `;
      
      this.wrapper = this.container.querySelector('.virtual-scroll-wrapper');
      this.content = this.container.querySelector('.virtual-scroll-content');
      this.spacer = this.container.querySelector('.virtual-scroll-spacer');
      this.itemsContainer = this.container.querySelector('.virtual-scroll-items');
      
      // Bind scroll event
      this.wrapper.addEventListener('scroll', this.handleScroll.bind(this));
      
      // Handle resize
      this.handleResize();
      window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
      this.containerHeight = this.wrapper.clientHeight;
      this.updateVisibleItems();
    }
    
    handleScroll() {
      this.scrollTop = this.wrapper.scrollTop;
      this.updateVisibleItems();
    }
    
    setItems(items) {
      this.items = items;
      this.updateTotalHeight();
      this.updateVisibleItems();
    }
    
    updateTotalHeight() {
      const totalHeight = this.items.length * this.itemHeight;
      this.spacer.style.height = totalHeight + 'px';
    }
    
    updateVisibleItems() {
      if (this.items.length === 0) {
        this.itemsContainer.innerHTML = '';
        return;
      }
      
      const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
      const endIndex = Math.min(
        this.items.length - 1,
        Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.buffer
      );
      
      // Update visible items
      this.visibleItems = this.items.slice(startIndex, endIndex + 1);
      
      // Update DOM
      this.renderVisibleItems(startIndex);
    }
    
    renderVisibleItems(startIndex) {
      let html = '';
      
      this.visibleItems.forEach((item, index) => {
        const actualIndex = startIndex + index;
        const top = actualIndex * this.itemHeight;
        
        html += `
          <div class="virtual-scroll-item" style="position: absolute; top: ${top}px; left: 0; right: 0; height: ${this.itemHeight}px;">
            ${this.renderItem(item, actualIndex)}
          </div>
        `;
      });
      
      this.itemsContainer.innerHTML = html;
    }
    
    renderItem(item, index) {
      // This method should be overridden by the parent component
      return `<div>Item ${index}: ${JSON.stringify(item)}</div>`;
    }
    
    scrollToIndex(index) {
      const targetScrollTop = index * this.itemHeight;
      this.wrapper.scrollTop = targetScrollTop;
    }
    
    destroy() {
      if (this.wrapper) {
        this.wrapper.removeEventListener('scroll', this.handleScroll.bind(this));
      }
      window.removeEventListener('resize', this.handleResize.bind(this));
    }
  }
  
  // Client List Virtual Scroller
  class ClientVirtualScroll extends VirtualScroll {
    constructor(container) {
      super(container, 60, 3); // 60px height, 3 item buffer
    }
    
    renderItem(client, index) {
      const maskedName = this.maskName(client.name);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(148,163,184,0.05); border-radius: 6px; border: 1px solid rgba(148,163,184,0.1); margin: 0 12px;">
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">${maskedName}</div>
            <div style="font-size: 12px; color: var(--muted);">${client.customerId} • ${client.country}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: var(--muted); margin-bottom: 2px;">${client.tier}</div>
            <div style="font-size: 14px; font-weight: 600;">$${(client.lifetimeDeposits || 0).toLocaleString()}</div>
          </div>
        </div>
      `;
    }
    
    maskName(name) {
      if (!name || name.length < 2) return name;
      const parts = name.split(' ');
      if (parts.length !== 2) return name;
      
      const firstName = parts[0];
      const lastName = parts[1];
      
      const maskedFirst = firstName.length > 2 
        ? firstName[0] + '*'.repeat(firstName.length - 2) + firstName[firstName.length - 1]
        : firstName;
      
      const maskedLast = lastName.length > 2
        ? lastName[0] + '*'.repeat(lastName.length - 2) + lastName[lastName.length - 1]
        : lastName;
      
      return maskedFirst + ' ' + maskedLast;
    }
  }
  
  // Initialize virtual scrolling for client lists
  function initVirtualScrolling() {
    const clientListContainers = document.querySelectorAll('[data-virtual-scroll="clients"]');
    
    clientListContainers.forEach(container => {
      const virtualScroll = new ClientVirtualScroll(container);
      container._virtualScroll = virtualScroll;
    });
  }
  
  // Update virtual scroll data
  function updateVirtualScrollData(containerId, data) {
    const container = document.getElementById(containerId);
    if (container && container._virtualScroll) {
      container._virtualScroll.setItems(data);
    }
  }
  
  // Expose virtual scrolling functions
  window.VirtualScroll = {
    init: initVirtualScrolling,
    updateData: updateVirtualScrollData,
    ClientVirtualScroll: ClientVirtualScroll
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVirtualScrolling);
  } else {
    initVirtualScrolling();
  }
})();
