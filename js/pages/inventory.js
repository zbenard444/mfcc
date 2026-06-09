// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY PAGE — Complete Item Tracking System
// ═══════════════════════════════════════════════════════════════════════════

export async function renderInventory(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot,
    query, orderBy, doc, serverTimestamp, logActivity, toast, showModal, closeModal } = window.MFCC;

  const CATEGORIES = ['All','Helmets','Busts','Lightsabers','Lightsaber Hilts','Costumes','Props',
    'Tables','Chairs','Extension Cords','Power Strips','Lighting Equipment','Sound Equipment',
    'Falcon Components','Tie Fighter Components','Storage Bins','Tools','Decorations','Food Equipment','Other'];
  const CONDITIONS = ['Excellent','Good','Fair','Poor'];
  const STATUSES = ['Available','Needs Repair','Missing','Retired'];
  const OWNERS = ['Tyson','Brad','Cayla','Liz','Zach','Shared'];

  let allItems = [];
  let activeCategory = 'All';

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">PROPERTY TRACKING</span>
        <h1 class="page-title">INVENTORY</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="inv-checklist-btn">☑ CHECKLIST MODE</button>
        <button class="btn btn-primary" id="new-item-btn">+ ADD ITEM</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-4" id="inv-stats" style="margin-bottom:16px">
      <div class="card"><div class="card-title">TOTAL ITEMS</div><div class="card-value" id="inv-total">—</div></div>
      <div class="card card-accent-top card-accent-green"><div class="card-title">AVAILABLE</div><div class="card-value" style="color:var(--accent-green)" id="inv-ok">—</div></div>
      <div class="card card-accent-top card-accent-amber"><div class="card-title">NEEDS REPAIR</div><div class="card-value" style="color:var(--accent-amber)" id="inv-repair">—</div></div>
      <div class="card card-accent-top card-accent-red"><div class="card-title">MISSING</div><div class="card-value" style="color:var(--accent-red)" id="inv-missing">—</div></div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:16px;padding:12px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="search-bar" style="flex:1;min-width:200px">
          <span class="search-bar-icon">⌕</span>
          <input type="text" id="inv-search" placeholder="Search inventory..." />
        </div>
        <select class="form-select" id="inv-status-filter" style="width:160px">
          <option value="All">All Statuses</option>
          ${STATUSES.map(s => `<option>${s}</option>`).join('')}
        </select>
        <select class="form-select" id="inv-owner-filter" style="width:140px">
          <option value="All">All Owners</option>
          ${OWNERS.map(o => `<option>${o}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="tab-bar" style="margin-bottom:16px;overflow-x:auto">
      ${CATEGORIES.map(c => `<button class="tab-btn ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
    </div>

    <!-- Item List -->
    <div class="card" style="padding:0;overflow:hidden">
      <div id="inv-table-header" style="display:grid;grid-template-columns:14px 1fr 80px 120px 120px 120px 100px 60px;gap:0;padding:10px 16px;background:var(--bg-deep);border-bottom:1px solid var(--border-dim)">
        <span></span>
        <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);letter-spacing:0.1em">ITEM NAME</span>
        <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);letter-spacing:0.1em">QTY</span>
        <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);letter-spacing:0.1em">CATEGORY</span>
        <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);letter-spacing:0.1em">LOCATION</span>
        <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);letter-spacing:0.1em">OWNER</span>
        <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);letter-spacing:0.1em">STATUS</span>
        <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);letter-spacing:0.1em">EDIT</span>
      </div>
      <div id="inv-list">
        <div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>
      </div>
    </div>
  `;

  document.getElementById('new-item-btn').addEventListener('click', () => openItemModal(null));
  document.getElementById('inv-checklist-btn').addEventListener('click', openChecklistMode);

  document.querySelectorAll('.tab-btn[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn[data-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderList();
    });
  });

  ['inv-search','inv-status-filter','inv-owner-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderList);
    document.getElementById(id)?.addEventListener('change', renderList);
  });

  const unsub = onSnapshot(
    query(collection(db, 'inventory'), orderBy('category'), orderBy('name')),
    snap => {
      allItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderList();
      renderStats();
    },
    err => toast('Error loading inventory: ' + err.message, 'error')
  );
  window.MFCC.unsubscribers.push(unsub);

  function renderStats() {
    const total = allItems.length;
    const ok = allItems.filter(i => i.status === 'Available').length;
    const repair = allItems.filter(i => i.status === 'Needs Repair').length;
    const missing = allItems.filter(i => i.status === 'Missing').length;
    const els = { 'inv-total': total, 'inv-ok': ok, 'inv-repair': repair, 'inv-missing': missing };
    Object.entries(els).forEach(([id, val]) => {
      const e = document.getElementById(id);
      if (e) e.textContent = val;
    });
  }

  function renderList() {
    const listEl = document.getElementById('inv-list');
    if (!listEl) return;
    const search = document.getElementById('inv-search')?.value?.toLowerCase() || '';
    const statusF = document.getElementById('inv-status-filter')?.value || 'All';
    const ownerF = document.getElementById('inv-owner-filter')?.value || 'All';

    let filtered = allItems.filter(i => {
      if (activeCategory !== 'All' && i.category !== activeCategory) return false;
      if (statusF !== 'All' && i.status !== statusF) return false;
      if (ownerF !== 'All' && i.owner !== ownerF) return false;
      if (search && !i.name?.toLowerCase().includes(search) && !i.location?.toLowerCase().includes(search)) return false;
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◻</div><div class="empty-state-title">NO ITEMS FOUND</div></div>`;
      return;
    }

    const condColor = { Excellent: 'var(--accent-green)', Good: 'var(--accent-green)', Fair: 'var(--accent-amber)', Poor: 'var(--accent-red)' };
    listEl.innerHTML = filtered.map(item => `
      <div style="display:grid;grid-template-columns:14px 1fr 80px 120px 120px 120px 100px 60px;gap:0;padding:12px 16px;border-bottom:1px solid var(--border-dim);align-items:center;transition:background 0.15s" class="inv-row" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
        <div class="inv-condition ${condClass(item.condition)}" style="width:10px;height:10px;border-radius:50%;background:${condColor[item.condition]||'var(--text-muted)'}"></div>
        <div>
          <div style="font-size:0.88rem;font-weight:500">${item.name}</div>
          ${item.notes ? `<div style="font-size:0.7rem;color:var(--text-muted)">${item.notes.substring(0,60)}${item.notes.length>60?'...':''}</div>` : ''}
          ${item.replacementCost ? `<div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted)">$${item.replacementCost} replacement</div>` : ''}
        </div>
        <div style="font-family:var(--font-display);font-weight:700;color:var(--accent-cyan)">${item.quantity || 1}</div>
        <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted)">${item.category || '—'}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary)">${item.location || '—'}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary)">${item.owner || '—'}</div>
        <div><span class="badge ${statusBadge(item.status)}">${item.status || 'Available'}</span></div>
        <div>
          <button class="btn btn-secondary btn-sm" onclick="window._editItem('${item.id}')">EDIT</button>
        </div>
      </div>
    `).join('');
  }

  window._editItem = (itemId) => {
    const item = allItems.find(i => i.id === itemId);
    if (item) openItemModal(item);
  };

  function openItemModal(item) {
    const isEdit = item !== null;
    showModal(isEdit ? `EDIT: ${item.name}` : 'ADD INVENTORY ITEM', itemForm(item), {
      onOpen: () => {
        document.getElementById('if-save').addEventListener('click', () => saveItem(item?.id));
        if (isEdit) document.getElementById('if-delete').addEventListener('click', () => deleteItem(item.id, item.name));
      }
    });
  }

  function itemForm(item) {
    const i = item || {};
    return `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">ITEM NAME *</label>
          <input class="form-input" id="if-name" value="${i.name || ''}" placeholder="Item name" />
        </div>
        <div class="form-group">
          <label class="form-label">CATEGORY</label>
          <select class="form-select" id="if-category">
            ${CATEGORIES.filter(c => c !== 'All').map(c => `<option ${i.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">QUANTITY</label>
          <input type="number" class="form-input" id="if-qty" value="${i.quantity || 1}" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">STORAGE LOCATION</label>
          <input class="form-input" id="if-location" value="${i.location || ''}" placeholder="e.g. Bin A3, Garage" />
        </div>
        <div class="form-group">
          <label class="form-label">OWNER</label>
          <select class="form-select" id="if-owner">
            <option value="">—</option>
            ${OWNERS.map(o => `<option ${i.owner === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">CONDITION</label>
          <select class="form-select" id="if-condition">
            ${CONDITIONS.map(c => `<option ${i.condition === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">STATUS</label>
          <select class="form-select" id="if-status">
            ${STATUSES.map(s => `<option ${i.status === s ? 'selected' : ((!i.status && s === 'Available') ? 'selected' : '')}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">REPLACEMENT COST ($)</label>
          <input type="number" class="form-input" id="if-cost" value="${i.replacementCost || ''}" min="0" step="0.01" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">NOTES</label>
          <textarea class="form-textarea" id="if-notes" rows="3">${i.notes || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">PHOTO URL (direct image link or Drive URL)</label>
          <input class="form-input" id="if-photo" value="${i.photoUrl || ''}" placeholder="https://..." />
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="if-delete">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="if-save">${isEdit ? 'SAVE' : 'ADD ITEM'}</button>
      </div>
    `;
  }

  async function saveItem(itemId) {
    const name = document.getElementById('if-name')?.value?.trim();
    if (!name) { toast('Item name is required', 'warning'); return; }
    const p = window.MFCC.userProfile;
    const data = {
      name,
      category: document.getElementById('if-category')?.value || 'Other',
      quantity: parseInt(document.getElementById('if-qty')?.value) || 1,
      location: document.getElementById('if-location')?.value || '',
      owner: document.getElementById('if-owner')?.value || '',
      condition: document.getElementById('if-condition')?.value || 'Good',
      status: document.getElementById('if-status')?.value || 'Available',
      replacementCost: parseFloat(document.getElementById('if-cost')?.value) || 0,
      notes: document.getElementById('if-notes')?.value || '',
      photoUrl: document.getElementById('if-photo')?.value || '',
      updatedAt: serverTimestamp(),
      updatedBy: p.uid
    };
    try {
      if (itemId) {
        await updateDoc(doc(db, 'inventory', itemId), data);
        await logActivity('updated inventory item', { name });
        toast('Item updated!', 'success');
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'inventory'), data);
        await logActivity('added inventory item', { name });
        toast('Item added!', 'success');
      }
      closeModal();
    } catch (e) { toast('Error: ' + e.message, 'error'); }
  }

  async function deleteItem(itemId, name) {
    const { confirm } = window.MFCC;
    confirm(`Delete "${name}" from inventory?`, async () => {
      await deleteDoc(doc(db, 'inventory', itemId));
      await logActivity('deleted inventory item', { name });
      toast('Item deleted', 'info');
      closeModal();
    });
  }

  function openChecklistMode() {
    const checkItems = allItems.filter(i => i.status !== 'Retired');
    showModal('INVENTORY CHECKLIST', `
      <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);margin-bottom:16px">CHECK OFF ITEMS AS VERIFIED</div>
      <div id="checklist-body">
        ${checkItems.map(item => `
          <div class="checklist-item">
            <div class="checklist-check" id="chk-${item.id}" onclick="window._toggleCheck('${item.id}')"></div>
            <div style="flex:1">
              <div class="checklist-label" id="chklbl-${item.id}">${item.name} (${item.quantity || 1})</div>
              <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted)">${item.location || 'No location'} · ${item.category}</div>
            </div>
            <span class="badge ${statusBadge(item.status)}">${item.status}</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-dim);display:flex;justify-content:space-between;align-items:center">
        <span id="check-count" style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted)">0 / ${checkItems.length} checked</span>
        <button class="btn btn-secondary btn-sm" onclick="window._resetChecklist()">RESET</button>
      </div>
    `);

    let checked = new Set();
    window._toggleCheck = (id) => {
      const el = document.getElementById(`chk-${id}`);
      const lbl = document.getElementById(`chklbl-${id}`);
      if (checked.has(id)) { checked.delete(id); el.classList.remove('checked'); el.textContent = ''; lbl.classList.remove('done'); }
      else { checked.add(id); el.classList.add('checked'); el.textContent = '✓'; lbl.classList.add('done'); }
      const countEl = document.getElementById('check-count');
      if (countEl) countEl.textContent = `${checked.size} / ${checkItems.length} checked`;
    };
    window._resetChecklist = () => {
      checked.clear();
      document.querySelectorAll('.checklist-check').forEach(c => { c.classList.remove('checked'); c.textContent = ''; });
      document.querySelectorAll('.checklist-label').forEach(l => l.classList.remove('done'));
      const countEl = document.getElementById('check-count');
      if (countEl) countEl.textContent = `0 / ${checkItems.length} checked`;
    };
  }
}

function condClass(cond) {
  return { Excellent: 'good', Good: 'good', Fair: 'fair', Poor: 'poor' }[cond] || 'good';
}

function statusBadge(status) {
  return { Available: 'badge-green', 'Needs Repair': 'badge-yellow', Missing: 'badge-red', Retired: 'badge-gray' }[status] || 'badge-gray';
}
