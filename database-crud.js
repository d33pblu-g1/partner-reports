// Database CRUD Operations
(function() {
  'use strict';
  
  let currentTable = '';
  let currentData = {};
  let tableSchemas = {};
  
  /**
   * Initialize table schemas (define which fields are editable, required, etc.)
   */
  function initSchemas() {
    tableSchemas = {
      partners: {
        primaryKey: 'partner_id',
        fields: [
          { name: 'partner_id', type: 'text', required: true, editable: false, label: 'Partner ID' },
          { name: 'name', type: 'text', required: true, editable: true, label: 'Name' },
          { name: 'tier', type: 'select', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], editable: true, label: 'Tier' }
        ]
      },
      clients: {
        primaryKey: 'customer_id',
        fields: [
          { name: 'customer_id', type: 'text', required: true, editable: false, label: 'Customer ID' },
          { name: 'name', type: 'text', required: true, editable: true, label: 'Name' },
          { name: 'email', type: 'email', required: false, editable: true, label: 'Email' },
          { name: 'country', type: 'text', required: false, editable: true, label: 'Country' },
          { name: 'join_date', type: 'date', required: false, editable: true, label: 'Join Date' },
          { name: 'partner_id', type: 'text', required: false, editable: true, label: 'Partner ID' },
          { name: 'tier', type: 'select', options: ['Bronze', 'Silver', 'Gold', 'Platinum'], editable: true, label: 'Tier' },
          { name: 'gender', type: 'select', options: ['male', 'female', 'other'], editable: true, label: 'Gender' },
          { name: 'age', type: 'number', required: false, editable: true, label: 'Age' }
        ]
      },
      trades: {
        primaryKey: 'id',
        fields: [
          { name: 'id', type: 'number', required: true, editable: false, label: 'ID' },
          { name: 'customer_id', type: 'text', required: true, editable: true, label: 'Customer ID' },
          { name: 'date_time', type: 'datetime-local', required: true, editable: true, label: 'Date/Time' },
          { name: 'commission', type: 'number', required: false, editable: true, label: 'Commission' },
          { name: 'volume', type: 'number', required: false, editable: true, label: 'Volume' }
        ]
      },
      deposits: {
        primaryKey: 'id',
        fields: [
          { name: 'id', type: 'number', required: true, editable: false, label: 'ID' },
          { name: 'customer_id', type: 'text', required: true, editable: true, label: 'Customer ID' },
          { name: 'date_time', type: 'datetime-local', required: true, editable: true, label: 'Date/Time' },
          { name: 'value', type: 'number', required: false, editable: true, label: 'Value' },
          { name: 'method', type: 'text', required: false, editable: true, label: 'Method' }
        ]
      }
    };
  }
  
  /**
   * Create action buttons for a row
   */
  function createActionButtons(row, tableName) {
    const schema = tableSchemas[tableName];
    if (!schema) return document.createDocumentFragment();
    
    const fragment = document.createDocumentFragment();
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-action btn-edit';
    editBtn.innerHTML = '✏️ Edit';
    editBtn.title = 'Edit record';
    editBtn.onclick = () => openEditModal(row, tableName);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-action btn-delete';
    deleteBtn.innerHTML = '🗑️ Delete';
    deleteBtn.title = 'Delete record';
    deleteBtn.onclick = () => confirmDelete(row, tableName);
    
    fragment.appendChild(editBtn);
    fragment.appendChild(deleteBtn);
    
    return fragment;
  }
  
  /**
   * Create enhanced table with action buttons
   */
  function createTableWithActions(arr, tableName) {
    if (!Array.isArray(arr) || arr.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <p>No records found</p>
        <button class="btn-primary" onclick="window.DatabaseCRUD.openAddModal('${tableName}')">
          ➕ Add ${tableName.slice(0, -1)}
        </button>
      `;
      return empty;
    }
    
    const columns = Array.from(new Set(arr.flatMap(row => Object.keys(row))));
    
    const wrap = document.createElement('div');
    wrap.className = 'table-container';
    
    // Add "Add New" button at top
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.innerHTML = `➕ Add ${tableName.slice(0, -1)}`;
    addBtn.style.marginBottom = '12px';
    addBtn.onclick = () => openAddModal(tableName);
    wrap.appendChild(addBtn);
    
    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrap';
    
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    
    // Add column headers
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      trHead.appendChild(th);
    });
    
    // Add Actions column
    if (tableSchemas[tableName]) {
      const thActions = document.createElement('th');
      thActions.textContent = 'Actions';
      thActions.style.textAlign = 'center';
      thActions.style.minWidth = '150px';
      trHead.appendChild(thActions);
    }
    
    thead.appendChild(trHead);
    
    const tbody = document.createElement('tbody');
    arr.forEach(row => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        const v = row[col];
        td.textContent = (v == null) ? '' : (typeof v === 'object' ? JSON.stringify(v) : v);
        tr.appendChild(td);
      });
      
      // Add action buttons
      if (tableSchemas[tableName]) {
        const tdActions = document.createElement('td');
        tdActions.style.textAlign = 'center';
        tdActions.appendChild(createActionButtons(row, tableName));
        tr.appendChild(tdActions);
      }
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
    
    return wrap;
  }
  
  /**
   * Open modal to add new record
   */
  function openAddModal(tableName) {
    const schema = tableSchemas[tableName];
    if (!schema) {
      alert('Cannot add records to this table');
      return;
    }
    
    const modal = createFormModal(tableName, 'Add New', {}, (formData) => {
      // Save new record
      saveNewRecord(tableName, formData);
    });
    
    document.body.appendChild(modal);
  }
  
  /**
   * Open modal to edit record
   */
  function openEditModal(row, tableName) {
    const schema = tableSchemas[tableName];
    if (!schema) return;
    
    const modal = createFormModal(tableName, 'Edit', row, (formData) => {
      // Update record
      updateRecord(tableName, row, formData);
    });
    
    document.body.appendChild(modal);
  }
  
  /**
   * Create form modal
   */
  function createFormModal(tableName, title, initialData, onSave) {
    const schema = tableSchemas[tableName];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `<h3>${title} ${tableName.slice(0, -1)}</h3>`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    const form = document.createElement('form');
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = {};
      schema.fields.forEach(field => {
        const input = form.elements[field.name];
        if (input) {
          formData[field.name] = input.value;
        }
      });
      onSave(formData);
      overlay.remove();
    };
    
    // Create form fields
    schema.fields.forEach(field => {
      if (title === 'Edit' && !field.editable) {
        // Show non-editable fields as readonly
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
          <label>${field.label}</label>
          <input type="text" value="${initialData[field.name] || ''}" readonly style="background: rgba(148,163,184,0.1);">
        `;
        form.appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        if (field.required) label.innerHTML += ' <span style="color: #ef4444;">*</span>';
        div.appendChild(label);
        
        let input;
        if (field.type === 'select') {
          input = document.createElement('select');
          input.name = field.name;
          input.required = field.required;
          
          const emptyOption = document.createElement('option');
          emptyOption.value = '';
          emptyOption.textContent = '-- Select --';
          input.appendChild(emptyOption);
          
          field.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (initialData[field.name] === opt) option.selected = true;
            input.appendChild(option);
          });
        } else {
          input = document.createElement('input');
          input.type = field.type;
          input.name = field.name;
          input.required = field.required;
          input.value = initialData[field.name] || '';
          
          if (field.type === 'datetime-local' && initialData[field.name]) {
            // Convert datetime to local format
            const date = new Date(initialData[field.name]);
            input.value = date.toISOString().slice(0, 16);
          }
        }
        
        div.appendChild(input);
        form.appendChild(div);
      }
    });
    
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => overlay.remove();
    
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = 'Save';
    
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    form.appendChild(footer);
    
    body.appendChild(form);
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };
    
    return overlay;
  }
  
  /**
   * Confirm delete
   */
  function confirmDelete(row, tableName) {
    const schema = tableSchemas[tableName];
    const primaryKey = schema.primaryKey;
    const idValue = row[primaryKey];
    
    if (confirm(`Are you sure you want to delete this ${tableName.slice(0, -1)}?\n\nID: ${idValue}\n\nThis action cannot be undone.`)) {
      deleteRecord(tableName, row);
    }
  }
  
  /**
   * Save new record (placeholder - would call API)
   */
  function saveNewRecord(tableName, formData) {
    console.log('Save new record:', tableName, formData);
    alert(`✓ New ${tableName.slice(0, -1)} would be created!\n\n(API integration needed)\n\nData:\n${JSON.stringify(formData, null, 2)}`);
    // TODO: Call API to save
    // window.ApiManager.createClient(formData).then(() => { location.reload(); });
  }
  
  /**
   * Update record (placeholder - would call API)
   */
  function updateRecord(tableName, originalRow, formData) {
    const schema = tableSchemas[tableName];
    const primaryKey = schema.primaryKey;
    const idValue = originalRow[primaryKey];
    
    console.log('Update record:', tableName, idValue, formData);
    alert(`✓ ${tableName.slice(0, -1)} would be updated!\n\nID: ${idValue}\n\n(API integration needed)\n\nNew Data:\n${JSON.stringify(formData, null, 2)}`);
    // TODO: Call API to update
    // window.ApiManager.updateClient(idValue, formData).then(() => { location.reload(); });
  }
  
  /**
   * Delete record (placeholder - would call API)
   */
  function deleteRecord(tableName, row) {
    const schema = tableSchemas[tableName];
    const primaryKey = schema.primaryKey;
    const idValue = row[primaryKey];
    
    console.log('Delete record:', tableName, idValue);
    alert(`✓ ${tableName.slice(0, -1)} would be deleted!\n\nID: ${idValue}\n\n(API integration needed)`);
    // TODO: Call API to delete
    // window.ApiManager.deleteClient(idValue).then(() => { location.reload(); });
  }
  
  // Expose public API
  window.DatabaseCRUD = {
    init: initSchemas,
    createTable: createTableWithActions,
    openAddModal: openAddModal,
    openEditModal: openEditModal
  };
  
  // Initialize on load
  initSchemas();
})();

