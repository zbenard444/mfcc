// ═══════════════════════════════════════════════════════════════════════════
// PURCHASES PAGE — Purchase Request System
// ═══════════════════════════════════════════════════════════════════════════
export async function renderPurchases(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
    doc, serverTimestamp, toast, showModal, closeModal, logActivity, formatDate } = window.MFCC;

  let allPurchases = [];
  const STATUSES = ['All','Requested','Approved','Purchased','Delivered','Denied'];
  const CATEGORIES = ['Materials','Food','Tools','Decor','Supplies','Electronics','Lumber','Filament','Paint','Hardware','Other'];
  const USERS = ['Tyson','Brad','Cayla','Liz','Zach'];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">PROCUREMENT</span>
        <h1 class="page-title">PURCHASE REQUESTS</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="new-pr-btn">+ NEW REQUEST</button>
      </div>
    </div>
    <div class="filter-bar" style="margin-bottom:16px">
      ${STATUSES.map(s => `<button class="filter-chip ${s==='All'?'active':''}" data-status="${s}">${s.toUpperCase()}</button>`).join('')}
    </div>
    <div class="grid-4" id="pr-stats" style="margin-bottom:16px"></div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>ITEM</th><th>CATEGORY</th><th>EST. COST</th><th>ACTUAL COST</th><th>REQUESTED BY</th><th>APPROVED BY</th><th>STATUS</th><th>DATE</th><th>ACTIONS</th></tr></thead>
        <tbody id="pr-tbody">
          <tr><td colspan="9" style="text-align:center;padding:40px"><div class="loading-spinner"></div></td></tr>
        </tbody>
      </table>
    </div>
  `;

  let activeStatus = 'All';
  document.querySelectorAll('.filter-chip[data-status]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-status]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStatus = chip.dataset.status;
      renderTable();
    });
  });

  document.getElementById('new-pr-btn').addEventListener('click', () => openModal(null));

  const unsub = onSnapshot(query(collection(db, 'purchases'), orderBy('createdAt', 'desc')), snap => {
    allPurchases = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable();
    renderStats();
  });
  window.MFCC.unsubscribers.push(unsub);

  function renderStats() {
    const el = document.getElementById('pr-stats');
    if (!el) return;
    const requested = allPurchases.filter(p => p.status === 'Requested').length;
    const approved = allPurchases.filter(p => p.status === 'Approved').length;
    const purchased = allPurchases.filter(p => p.status === 'Purchased' || p.status === 'Delivered').length;
    const totalSpend = allPurchases.filter(p => ['Purchased','Delivered'].includes(p.status)).reduce((s, p) => s + (p.actualCost || p.estimatedCost || 0), 0);
    el.innerHTML = `
      <div class="card"><div class="card-title">REQUESTED</div><div class="card-value">${requested}</div></div>
      <div class="card card-accent-top card-accent-amber"><div class="card-title">AWAITING APPROVAL</div><div class="card-value" style="color:var(--accent-amber)">${approved}</div></div>
      <div class="card card-accent-top card-accent-green"><div class="card-title">PURCHASED</div><div class="card-value" style="color:var(--accent-green)">${purchased}</div></div>
      <div class="card card-accent-top card-accent-cyan"><div class="card-title">TOTAL SPENT</div><div class="card-value" style="font-size:1.4rem">$${totalSpend.toFixed(2)}</div></div>
    `;
  }

  function renderTable() {
    const tbody = document.getElementById('pr-tbody');
    if (!tbody) return;
    const filtered = activeStatus === 'All' ? allPurchases : allPurchases.filter(p => p.status === activeStatus);
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted);font-family:var(--font-mono);font-size:0.7rem">No purchase requests found</td></tr>`;
      return;
    }
    const statusBadge = { Requested: 'badge-cyan', Approved: 'badge-yellow', Purchased: 'badge-green', Delivered: 'badge-green', Denied: 'badge-red' };
    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><div style="font-weight:500">${p.item}</div>${p.notes ? `<div style="font-size:0.72rem;color:var(--text-muted)">${p.notes.substring(0,60)}</div>` : ''}</td>
        <td><span class="badge badge-gray">${p.category || '—'}</span></td>
        <td style="font-family:var(--font-mono)">$${(p.estimatedCost || 0).toFixed(2)}</td>
        <td style="font-family:var(--font-mono);color:var(--accent-cyan)">${p.actualCost ? `$${p.actualCost.toFixed(2)}` : '—'}</td>
        <td>${p.requestedBy || '—'}</td>
        <td>${p.approvedBy || '—'}</td>
        <td><span class="badge ${statusBadge[p.status] || 'badge-gray'}">${p.status || 'Requested'}</span></td>
        <td style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-muted)">${p.purchaseDate || p.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
        <td style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm" onclick="window._editPR('${p.id}')">EDIT</button>
          ${window.MFCC.userProfile?.role === 'Administrator' && p.status === 'Requested' ? `<button class="btn btn-success btn-sm" onclick="window._approvePR('${p.id}')">✓</button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  window._editPR = (id) => { const p = allPurchases.find(p => p.id === id); if (p) openModal(p); };
  window._approvePR = async (id) => {
    const p = window.MFCC.userProfile;
    await updateDoc(doc(db, 'purchases', id), { status: 'Approved', approvedBy: p.displayName || p.email, approvedAt: serverTimestamp() });
    toast('Purchase approved!', 'success');
  };

  function openModal(purchase) {
    const isEdit = purchase !== null;
    const p = purchase || {};
    showModal(isEdit ? 'EDIT PURCHASE REQUEST' : 'NEW PURCHASE REQUEST', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">ITEM / DESCRIPTION *</label>
          <input class="form-input" id="prf-item" value="${p.item || ''}" placeholder="What needs to be purchased?" />
        </div>
        <div class="form-group">
          <label class="form-label">CATEGORY</label>
          <select class="form-select" id="prf-cat">
            ${CATEGORIES.map(c => `<option ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ESTIMATED COST ($)</label>
          <input type="number" class="form-input" id="prf-est" value="${p.estimatedCost || ''}" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label">ACTUAL COST ($)</label>
          <input type="number" class="form-input" id="prf-actual" value="${p.actualCost || ''}" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label">REQUESTED BY</label>
          <select class="form-select" id="prf-reqby">
            ${USERS.map(u => `<option ${p.requestedBy === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">STATUS</label>
          <select class="form-select" id="prf-status">
            ${['Requested','Approved','Purchased','Delivered','Denied'].map(s => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">PURCHASE DATE</label>
          <input type="date" class="form-input" id="prf-date" value="${p.purchaseDate || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">WHERE TO BUY</label>
          <input class="form-input" id="prf-store" value="${p.store || ''}" placeholder="e.g. Home Depot, Amazon" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">NOTES / REASON</label>
          <textarea class="form-textarea" id="prf-notes" rows="3">${p.notes || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">RECEIPT / LINK URL</label>
          <input class="form-input" id="prf-receipt" value="${p.receiptUrl || ''}" placeholder="https://..." />
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="prf-del">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="prf-save">${isEdit ? 'SAVE' : 'SUBMIT REQUEST'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('prf-save').addEventListener('click', async () => {
          const item = document.getElementById('prf-item')?.value?.trim();
          if (!item) { toast('Item description required', 'warning'); return; }
          const user = window.MFCC.userProfile;
          const data = {
            item,
            category: document.getElementById('prf-cat')?.value,
            estimatedCost: parseFloat(document.getElementById('prf-est')?.value) || 0,
            actualCost: parseFloat(document.getElementById('prf-actual')?.value) || 0,
            requestedBy: document.getElementById('prf-reqby')?.value,
            status: document.getElementById('prf-status')?.value || 'Requested',
            purchaseDate: document.getElementById('prf-date')?.value || '',
            store: document.getElementById('prf-store')?.value || '',
            notes: document.getElementById('prf-notes')?.value || '',
            receiptUrl: document.getElementById('prf-receipt')?.value || '',
            updatedAt: serverTimestamp(), updatedBy: user.uid
          };
          if (purchase?.id) {
            await updateDoc(doc(db, 'purchases', purchase.id), data);
            await logActivity('updated purchase request', { item });
            toast('Updated!', 'success');
          } else {
            data.createdAt = serverTimestamp(); data.createdBy = user.uid;
            await addDoc(collection(db, 'purchases'), data);
            await logActivity('created purchase request', { item });
            toast('Request submitted!', 'success');
          }
          closeModal();
        });
        if (isEdit) document.getElementById('prf-del').addEventListener('click', () => {
          const { confirm } = window.MFCC;
          confirm(`Delete request for "${purchase.item}"?`, async () => {
            await deleteDoc(doc(db, 'purchases', purchase.id));
            toast('Deleted', 'info'); closeModal();
          });
        });
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QR CODES PAGE — Storage Bin QR System
// ═══════════════════════════════════════════════════════════════════════════
export async function renderQRCodes(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
    doc, serverTimestamp, toast, showModal, closeModal, logActivity } = window.MFCC;

  let allBins = [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">STORAGE MANAGEMENT</span>
        <h1 class="page-title">QR STORAGE SYSTEM</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="print-all-qr">🖨 PRINT ALL</button>
        <button class="btn btn-primary" id="new-bin-btn">+ NEW BIN</button>
      </div>
    </div>
    <p style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);margin-bottom:20px">
      Each bin gets a unique QR code. Print and attach to physical bin. Scan to view contents instantly.
    </p>
    <div class="search-bar" style="margin-bottom:16px;max-width:400px">
      <span class="search-bar-icon">⌕</span>
      <input type="text" id="qr-search" placeholder="Search bins..." />
    </div>
    <div class="grid-auto" id="qr-grid">
      <div style="text-align:center;padding:40px;grid-column:1/-1"><div class="loading-spinner"></div></div>
    </div>
  `;

  document.getElementById('new-bin-btn').addEventListener('click', () => openBinModal(null));
  document.getElementById('qr-search').addEventListener('input', renderGrid);
  document.getElementById('print-all-qr').addEventListener('click', () => window.print());

  const unsub = onSnapshot(query(collection(db, 'storageBins'), orderBy('binId')), snap => {
    allBins = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderGrid();
  });
  window.MFCC.unsubscribers.push(unsub);

  function renderGrid() {
    const grid = document.getElementById('qr-grid');
    if (!grid) return;
    const search = document.getElementById('qr-search')?.value?.toLowerCase() || '';
    const filtered = allBins.filter(b => !search || b.binId?.toLowerCase().includes(search) || b.name?.toLowerCase().includes(search) || b.contents?.toLowerCase().includes(search));
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">▦</div><div class="empty-state-title">NO STORAGE BINS</div><div class="empty-state-text">Create bins and print QR codes to attach to physical storage</div></div>`;
      return;
    }
    grid.innerHTML = filtered.map(bin => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?bin=' + bin.id)}`;
      return `
        <div class="qr-item">
          <div class="qr-code-box">
            <img src="${qrUrl}" width="120" height="120" alt="QR Code for ${bin.binId}" loading="lazy" />
          </div>
          <div style="text-align:center">
            <div style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--accent-cyan)">${bin.binId}</div>
            <div style="font-size:0.85rem;font-weight:600;margin-top:2px">${bin.name}</div>
            <div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);margin-top:2px">${bin.location || 'No location'}</div>
          </div>
          <div style="text-align:center;font-size:0.78rem;color:var(--text-secondary);max-width:160px">
            ${bin.contents ? bin.contents.substring(0, 80) + (bin.contents.length > 80 ? '...' : '') : 'No contents listed'}
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="window._editBin('${bin.id}')">EDIT</button>
            <button class="btn btn-primary btn-sm" onclick="window._viewBin('${bin.id}')">VIEW</button>
            <a href="${qrUrl}" download="QR-${bin.binId}.png" class="btn btn-secondary btn-sm">↓ QR</a>
          </div>
        </div>
      `;
    }).join('');
  }

  window._editBin = (id) => { const b = allBins.find(b => b.id === id); if (b) openBinModal(b); };
  window._viewBin = (id) => {
    const bin = allBins.find(b => b.id === id);
    if (!bin) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + window.location.pathname + '?bin=' + bin.id)}`;
    showModal(`BIN: ${bin.binId} — ${bin.name}`, `
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div class="qr-code-box" style="flex-shrink:0">
          <img src="${qrUrl}" width="180" height="180" alt="QR" />
        </div>
        <div style="flex:1;min-width:200px">
          <div style="margin-bottom:12px">
            <div class="form-label">BIN ID</div>
            <div style="font-family:var(--font-display);font-size:1.2rem;color:var(--accent-cyan)">${bin.binId}</div>
          </div>
          <div style="margin-bottom:12px">
            <div class="form-label">NAME</div>
            <div style="font-size:0.95rem">${bin.name}</div>
          </div>
          <div style="margin-bottom:12px">
            <div class="form-label">LOCATION</div>
            <div style="font-size:0.88rem">${bin.location || '—'}</div>
          </div>
          <div style="margin-bottom:12px">
            <div class="form-label">SETUP INSTRUCTIONS</div>
            <div style="font-size:0.85rem;color:var(--text-secondary)">${bin.setupInstructions || '—'}</div>
          </div>
        </div>
      </div>
      <div style="margin-top:16px">
        <div class="form-label">CONTENTS</div>
        <div style="background:var(--bg-base);border:1px solid var(--border-soft);border-radius:4px;padding:12px;margin-top:6px;font-size:0.85rem;white-space:pre-line;line-height:1.6">${bin.contents || 'No contents listed'}</div>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="window.print()">🖨 PRINT</button>
        <button class="btn btn-primary" onclick="window.MFCC.closeModal()">CLOSE</button>
      </div>
    `);
  };

  function openBinModal(bin) {
    const isEdit = bin !== null;
    const b = bin || {};
    showModal(isEdit ? `EDIT BIN: ${bin.binId}` : 'NEW STORAGE BIN', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">BIN ID * (e.g. A1, B3)</label>
          <input class="form-input" id="bf-binid" value="${b.binId || ''}" placeholder="A1" style="font-family:var(--font-display);font-size:1.1rem;text-align:center;letter-spacing:0.1em" />
        </div>
        <div class="form-group">
          <label class="form-label">BIN NAME</label>
          <input class="form-input" id="bf-name" value="${b.name || ''}" placeholder="e.g. Falcon Lights" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">STORAGE LOCATION</label>
          <input class="form-input" id="bf-location" value="${b.location || ''}" placeholder="e.g. Garage shelf 2, right side" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">CONTENTS (one item per line)</label>
          <textarea class="form-textarea" id="bf-contents" rows="8" placeholder="Extension cord x4&#10;LED strip lights&#10;Power splitter">${b.contents || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">SETUP INSTRUCTIONS</label>
          <textarea class="form-textarea" id="bf-setup" rows="3">${b.setupInstructions || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">NOTES</label>
          <textarea class="form-textarea" id="bf-notes" rows="2">${b.notes || ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="bfmod-del">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="bfmod-save">${isEdit ? 'SAVE' : 'CREATE BIN'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('bfmod-save').addEventListener('click', async () => {
          const binId = document.getElementById('bf-binid')?.value?.trim().toUpperCase();
          if (!binId) { toast('Bin ID required', 'warning'); return; }
          const user = window.MFCC.userProfile;
          const data = {
            binId, name: document.getElementById('bf-name')?.value || '',
            location: document.getElementById('bf-location')?.value || '',
            contents: document.getElementById('bf-contents')?.value || '',
            setupInstructions: document.getElementById('bf-setup')?.value || '',
            notes: document.getElementById('bf-notes')?.value || '',
            updatedAt: serverTimestamp(), updatedBy: user.uid
          };
          if (bin?.id) {
            await updateDoc(doc(db, 'storageBins', bin.id), data);
            await logActivity('updated storage bin', { binId });
            toast('Bin updated!', 'success');
          } else {
            data.createdAt = serverTimestamp(); data.createdBy = user.uid;
            await addDoc(collection(db, 'storageBins'), data);
            await logActivity('created storage bin', { binId });
            toast('Bin created!', 'success');
          }
          closeModal();
        });
        if (isEdit) document.getElementById('bfmod-del').addEventListener('click', () => {
          const { confirm } = window.MFCC;
          confirm(`Delete bin "${bin.binId}"?`, async () => {
            await deleteDoc(doc(db, 'storageBins', bin.id));
            toast('Bin deleted', 'info'); closeModal();
          });
        });
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderKnowledge(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
    doc, serverTimestamp, toast, showModal, closeModal, logActivity } = window.MFCC;

  let allArticles = [];
  const CATEGORIES = ['Build Instructions','Lessons Learned','Material Sources','Troubleshooting','FAQ','Historical Notes','Safety','Contact Info'];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">DOCUMENTATION</span>
        <h1 class="page-title">KNOWLEDGE BASE</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="new-kb-btn">+ NEW ARTICLE</button>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="search-bar" style="flex:1;min-width:250px">
        <span class="search-bar-icon">⌕</span>
        <input type="text" id="kb-search" placeholder="Search knowledge base..." />
      </div>
      <select class="form-select" id="kb-cat-filter" style="width:200px">
        <option value="All">All Categories</option>
        ${CATEGORIES.map(c => `<option>${c}</option>`).join('')}
      </select>
    </div>
    <div id="kb-list">
      <div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>
    </div>
  `;

  document.getElementById('new-kb-btn').addEventListener('click', () => openArticleModal(null));
  ['kb-search','kb-cat-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderList);
    document.getElementById(id)?.addEventListener('change', renderList);
  });

  const unsub = onSnapshot(query(collection(db, 'knowledge'), orderBy('category'), orderBy('title')), snap => {
    allArticles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderList();
  });
  window.MFCC.unsubscribers.push(unsub);

  function renderList() {
    const listEl = document.getElementById('kb-list');
    if (!listEl) return;
    const search = document.getElementById('kb-search')?.value?.toLowerCase() || '';
    const catFilter = document.getElementById('kb-cat-filter')?.value || 'All';
    const filtered = allArticles.filter(a => {
      if (catFilter !== 'All' && a.category !== catFilter) return false;
      if (search && !a.title?.toLowerCase().includes(search) && !a.content?.toLowerCase().includes(search)) return false;
      return true;
    });
    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◍</div><div class="empty-state-title">NO ARTICLES FOUND</div><div class="empty-state-text">Build your knowledge base by adding articles, guides, and FAQs</div></div>`;
      return;
    }
    // Group by category
    const byCat = {};
    filtered.forEach(a => { if (!byCat[a.category]) byCat[a.category] = []; byCat[a.category].push(a); });
    listEl.innerHTML = Object.entries(byCat).map(([cat, articles]) => `
      <div class="section-divider"><span class="section-divider-label">${cat.toUpperCase()}</span><div class="section-divider-line"></div></div>
      ${articles.map(a => `
        <div class="kb-article" data-id="${a.id}">
          <div class="kb-article-category">${a.category}</div>
          <div class="kb-article-title">${a.title}</div>
          <div class="kb-article-preview">${(a.content || '').substring(0, 160)}${(a.content || '').length > 160 ? '...' : ''}</div>
          ${a.tags?.length ? `<div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap">${a.tags.map(t => `<span class="badge badge-gray">${t}</span>`).join('')}</div>` : ''}
        </div>
      `).join('')}
    `).join('');
    listEl.querySelectorAll('[data-id]').forEach(card => {
      card.addEventListener('click', () => { const a = allArticles.find(a => a.id === card.dataset.id); if (a) openArticleModal(a); });
    });
  }

  function openArticleModal(article) {
    const isEdit = article !== null;
    const a = article || {};
    showModal(isEdit ? a.title : 'NEW KNOWLEDGE ARTICLE', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">TITLE *</label>
          <input class="form-input" id="kaf-title" value="${a.title || ''}" placeholder="Article title" />
        </div>
        <div class="form-group">
          <label class="form-label">CATEGORY</label>
          <select class="form-select" id="kaf-cat">
            ${CATEGORIES.map(c => `<option ${a.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">TAGS (comma separated)</label>
          <input class="form-input" id="kaf-tags" value="${(a.tags || []).join(', ')}" placeholder="falcon, lights, setup" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">CONTENT *</label>
          <textarea class="form-textarea" id="kaf-content" rows="12">${a.content || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">RELATED LINKS (Google Drive, etc.)</label>
          <input class="form-input" id="kaf-link" value="${a.link || ''}" placeholder="https://..." />
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="kaf-del">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="kaf-save">${isEdit ? 'SAVE' : 'PUBLISH'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('kaf-save').addEventListener('click', async () => {
          const title = document.getElementById('kaf-title')?.value?.trim();
          const content = document.getElementById('kaf-content')?.value?.trim();
          if (!title || !content) { toast('Title and content required', 'warning'); return; }
          const user = window.MFCC.userProfile;
          const data = {
            title, content,
            category: document.getElementById('kaf-cat')?.value,
            tags: document.getElementById('kaf-tags')?.value.split(',').map(s => s.trim()).filter(Boolean),
            link: document.getElementById('kaf-link')?.value || '',
            updatedAt: serverTimestamp(), updatedBy: user.uid
          };
          if (article?.id) {
            await updateDoc(doc(db, 'knowledge', article.id), data);
            await logActivity('updated knowledge article', { title });
            toast('Article updated!', 'success');
          } else {
            data.createdAt = serverTimestamp(); data.createdBy = user.uid;
            await addDoc(collection(db, 'knowledge'), data);
            await logActivity('created knowledge article', { title });
            toast('Article published!', 'success');
          }
          closeModal();
        });
        if (isEdit) document.getElementById('kaf-del').addEventListener('click', () => {
          const { confirm } = window.MFCC;
          confirm(`Delete "${article.title}"?`, async () => {
            await deleteDoc(doc(db, 'knowledge', article.id));
            toast('Deleted', 'info'); closeModal();
          });
        });
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderReports(el) {
  const { db, collection, getDocs, query, orderBy, toast, calcReadiness } = window.MFCC;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">DATA & ANALYTICS</span>
        <h1 class="page-title">REPORTS</h1>
      </div>
    </div>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:24px">Generate printable reports. Use your browser's Print function (Ctrl+P / Cmd+P) to save as PDF.</p>
    <div class="grid-3" style="margin-bottom:24px">
      ${[
        { title: 'READINESS REPORT', icon: '◉', desc: 'Overall event readiness with category breakdowns', id: 'rpt-readiness' },
        { title: 'TASK ASSIGNMENTS', icon: '✓', desc: 'All tasks grouped by owner with status and due dates', id: 'rpt-tasks' },
        { title: 'SETUP CHECKLIST', icon: '☑', desc: 'Printable setup checklist for all areas', id: 'rpt-checklist' },
        { title: 'INVENTORY LIST', icon: '◻', desc: 'Complete inventory with conditions and locations', id: 'rpt-inventory' },
        { title: 'BUDGET REPORT', icon: '◈', desc: 'Budget vs actual spend by category', id: 'rpt-budget' },
        { title: 'POST-EVENT REVIEW', icon: '◉', desc: 'Lessons learned and improvement recommendations', id: 'rpt-postevent' },
        { title: 'BUILD MANUAL PDF', icon: '📋', desc: 'All build instructions in one document', id: 'rpt-builds' },
        { title: 'TIMELINE REPORT', icon: '◆', desc: 'All milestones and upcoming deadlines', id: 'rpt-timeline' },
        { title: 'RISK REGISTER', icon: '⚠', desc: 'All risks with likelihoods and mitigations', id: 'rpt-risks' }
      ].map(r => `
        <div class="card card-accent-top" style="cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor='var(--border-active)'" onmouseout="this.style.borderColor=''" onclick="window._genReport('${r.id}')">
          <div style="font-size:1.8rem;margin-bottom:12px">${r.icon}</div>
          <div class="card-title" style="margin-bottom:6px">${r.title}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${r.desc}</div>
          <div style="margin-top:14px">
            <button class="btn btn-primary btn-sm">GENERATE</button>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Data Export -->
    <div class="section-divider"><span class="section-divider-label">DATA EXPORT & BACKUP</span><div class="section-divider-line"></div></div>
    <div class="card card-accent-top">
      <div class="card-title" style="margin-bottom:12px">EXPORT OPTIONS</div>
      <div class="export-options">
        <button class="btn btn-secondary" onclick="window._exportJSON()">↓ EXPORT JSON BACKUP</button>
        <button class="btn btn-secondary" onclick="window._exportCSV('tasks')">↓ TASKS CSV</button>
        <button class="btn btn-secondary" onclick="window._exportCSV('inventory')">↓ INVENTORY CSV</button>
        <button class="btn btn-secondary" onclick="window._exportCSV('expenses')">↓ EXPENSES CSV</button>
      </div>
      <div style="margin-top:12px;font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">
        JSON backup contains all data. Store in Google Drive for safekeeping. The application never depends on a single device.
      </div>
    </div>

    <!-- Report Preview Area -->
    <div id="report-preview" style="display:none;margin-top:24px">
      <div class="section-divider"><span class="section-divider-label">REPORT PREVIEW</span><div class="section-divider-line"></div></div>
      <div style="display:flex;gap:10px;margin-bottom:16px;align-items:center">
        <button class="btn btn-primary" onclick="window.print()">🖨 PRINT / SAVE PDF</button>
        <button class="btn btn-secondary" onclick="document.getElementById('report-preview').style.display='none'">CLOSE</button>
      </div>
      <div class="card" id="report-content" style="padding:32px;font-family:var(--font-body)"></div>
    </div>
  `;

  window._genReport = async (reportId) => {
    const preview = document.getElementById('report-preview');
    const content = document.getElementById('report-content');
    if (!preview || !content) return;
    content.innerHTML = `<div style="text-align:center;padding:40px"><div class="loading-spinner"></div><div style="margin-top:12px;font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted)">GENERATING REPORT...</div></div>`;
    preview.style.display = 'block';
    preview.scrollIntoView({ behavior: 'smooth' });

    try {
      const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const header = `<div style="border-bottom:2px solid var(--border-soft);padding-bottom:16px;margin-bottom:24px"><div style="font-family:var(--font-display);font-size:0.6rem;letter-spacing:0.2em;color:var(--text-muted);margin-bottom:4px">MILLENNIUM FALCON COMMAND CENTER</div><h2 style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary)">${getReportTitle(reportId)}</h2><div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);margin-top:4px">Generated: ${now} · PRIVATE — FAMILY USE ONLY</div></div>`;

      let body = '';
      switch (reportId) {
        case 'rpt-readiness': body = await genReadinessReport(); break;
        case 'rpt-tasks': body = await genTasksReport(); break;
        case 'rpt-checklist': body = await genChecklistReport(); break;
        case 'rpt-inventory': body = await genInventoryReport(); break;
        case 'rpt-budget': body = await genBudgetReport(); break;
        case 'rpt-postevent': body = await genPostEventReport(); break;
        case 'rpt-builds': body = await genBuildsReport(); break;
        case 'rpt-timeline': body = await genTimelineReport(); break;
        case 'rpt-risks': body = await genRisksReport(); break;
        default: body = '<p>Report not found</p>';
      }
      content.innerHTML = header + body;
    } catch (e) {
      content.innerHTML = `<div style="color:var(--accent-red)">Error generating report: ${e.message}</div>`;
    }
  };

  function getReportTitle(id) {
    const titles = { 'rpt-readiness': 'EVENT READINESS REPORT', 'rpt-tasks': 'TASK ASSIGNMENT REPORT', 'rpt-checklist': 'SETUP CHECKLIST', 'rpt-inventory': 'INVENTORY REPORT', 'rpt-budget': 'BUDGET REPORT', 'rpt-postevent': 'POST-EVENT REVIEW', 'rpt-builds': 'BUILD MANUAL', 'rpt-timeline': 'MILESTONE TIMELINE', 'rpt-risks': 'RISK REGISTER' };
    return titles[id] || 'REPORT';
  }

  async function genReadinessReport() {
    const r = await calcReadiness();
    const cats = Object.entries(r.categories || {});
    return `
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:4rem;font-weight:900;color:${r.overall >= 80 ? 'var(--accent-green)' : r.overall >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'}">${r.overall}%</div>
        <div style="font-family:var(--font-mono);color:var(--text-muted)">OVERALL READINESS</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="border-bottom:1px solid var(--border-soft)"><th style="text-align:left;padding:8px;font-family:var(--font-mono);font-size:0.65rem">CATEGORY</th><th style="text-align:right;padding:8px;font-family:var(--font-mono);font-size:0.65rem">SCORE</th><th style="text-align:right;padding:8px;font-family:var(--font-mono);font-size:0.65rem">STATUS</th></tr></thead>
        <tbody>
          ${cats.map(([k, v]) => {
            const score = Math.round(v.score || 0);
            return `<tr style="border-bottom:1px solid var(--border-dim)"><td style="padding:8px">${k.toUpperCase()}</td><td style="text-align:right;padding:8px;font-weight:700">${score}%</td><td style="text-align:right;padding:8px;color:${score>=80?'var(--accent-green)':score>=50?'var(--accent-amber)':'var(--accent-red)'}">${score>=80?'GREEN':score>=50?'YELLOW':'RED'}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  async function genTasksReport() {
    const snap = await getDocs(collection(db, 'tasks'));
    const tasks = snap.docs.map(d => d.data());
    const byOwner = {};
    tasks.forEach(t => { const o = t.owner || 'Unassigned'; if (!byOwner[o]) byOwner[o] = []; byOwner[o].push(t); });
    return Object.entries(byOwner).map(([owner, ownTasks]) => `
      <h3 style="font-family:var(--font-display);font-size:0.85rem;color:var(--accent-cyan);margin:16px 0 8px">${owner.toUpperCase()}</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead><tr style="border-bottom:1px solid var(--border-soft)"><th style="text-align:left;padding:6px;font-family:var(--font-mono);font-size:0.6rem">TASK</th><th style="padding:6px;font-family:var(--font-mono);font-size:0.6rem">PRIORITY</th><th style="padding:6px;font-family:var(--font-mono);font-size:0.6rem">STATUS</th><th style="padding:6px;font-family:var(--font-mono);font-size:0.6rem">DUE</th></tr></thead>
        <tbody>${ownTasks.map(t => `<tr style="border-bottom:1px solid var(--border-dim)"><td style="padding:6px;font-size:0.85rem">${t.title}</td><td style="padding:6px;text-align:center;font-size:0.75rem">${t.priority}</td><td style="padding:6px;text-align:center;font-size:0.75rem">${t.status}</td><td style="padding:6px;text-align:center;font-family:var(--font-mono);font-size:0.7rem">${t.dueDate || '—'}</td></tr>`).join('')}</tbody>
      </table>
    `).join('');
  }

  async function genChecklistReport() {
    const areasSnap = await getDocs(collection(db, 'areas'));
    const areas = areasSnap.docs.map(d => d.data());
    return areas.map(a => `
      <h3 style="font-family:var(--font-display);font-size:0.85rem;color:var(--accent-cyan);margin:16px 0 8px">${a.icon || '◈'} ${a.name}</h3>
      <div style="padding:8px;border:1px solid var(--border-dim);border-radius:4px;margin-bottom:12px">
        <div style="display:flex;gap:12px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem"><input type="checkbox" /> Setup Complete</label>
          <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem"><input type="checkbox" /> Props In Place</label>
          <label style="display:flex;align-items:center;gap=6px;font-size:0.85rem"><input type="checkbox" /> Safety Check Done</label>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted)">Notes: _____________________________________________</div>
      </div>
    `).join('');
  }

  async function genInventoryReport() {
    const snap = await getDocs(query(collection(db, 'inventory'), orderBy('category'), orderBy('name')));
    const items = snap.docs.map(d => d.data());
    return `
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border-soft)">${['ITEM','CATEGORY','QTY','LOCATION','CONDITION','STATUS'].map(h => `<th style="text-align:left;padding:6px;font-family:var(--font-mono);font-size:0.6rem">${h}</th>`).join('')}</tr></thead>
        <tbody>${items.map(i => `<tr style="border-bottom:1px solid var(--border-dim)"><td style="padding:6px;font-size:0.82rem">${i.name}</td><td style="padding:6px;font-size:0.75rem">${i.category}</td><td style="padding:6px;text-align:center">${i.quantity||1}</td><td style="padding:6px;font-size:0.75rem">${i.location||'—'}</td><td style="padding:6px;font-size:0.75rem">${i.condition||'—'}</td><td style="padding:6px;font-size:0.75rem">${i.status||'—'}</td></tr>`).join('')}</tbody>
      </table>
    `;
  }

  async function genBudgetReport() {
    const snap = await getDocs(collection(db, 'expenses'));
    const items = snap.docs.map(d => d.data());
    const total = items.reduce((s, e) => s + (e.amount || 0), 0);
    const byCat = {};
    items.forEach(e => { if (!byCat[e.category]) byCat[e.category] = 0; byCat[e.category] += e.amount || 0; });
    return `
      <div style="margin-bottom:20px"><strong>Total Expenses: $${total.toFixed(2)}</strong></div>
      <h3 style="font-size:0.85rem;margin-bottom:8px">BY CATEGORY</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr>${['CATEGORY','AMOUNT'].map(h => `<th style="text-align:left;padding:6px;font-family:var(--font-mono);font-size:0.6rem">${h}</th>`).join('')}</tr></thead>
        <tbody>${Object.entries(byCat).sort(([,a],[,b])=>b-a).map(([cat,amt]) => `<tr style="border-bottom:1px solid var(--border-dim)"><td style="padding:6px">${cat}</td><td style="padding:6px">$${amt.toFixed(2)}</td></tr>`).join('')}</tbody>
      </table>
    `;
  }

  async function genPostEventReport() {
    const snap = await getDocs(query(collection(db, 'lessons'), orderBy('year', 'desc')));
    const lessons = snap.docs.map(d => d.data());
    const byYear = {};
    lessons.forEach(l => { if (!byYear[l.year]) byYear[l.year] = []; byYear[l.year].push(l); });
    return Object.entries(byYear).map(([year, items]) => `
      <h3 style="font-family:var(--font-display);color:var(--accent-cyan);margin:16px 0 8px">EVENT ${year}</h3>
      ${items.map(l => `<div style="margin-bottom:12px;padding:10px;border-left:3px solid ${l.type==='Success'?'var(--accent-green)':l.type==='Failure'?'var(--accent-red)':'var(--accent-amber)'}"><div style="font-weight:600;margin-bottom:4px">${l.title}</div><div style="font-size:0.82rem;color:var(--text-secondary)">${l.description||''}</div>${l.improvement?`<div style="margin-top:6px;font-size:0.8rem;color:var(--accent-amber)">💡 ${l.improvement}</div>`:''}</div>`).join('')}
    `).join('');
  }

  async function genBuildsReport() {
    const snap = await getDocs(query(collection(db, 'buildManual'), orderBy('name')));
    const builds = snap.docs.map(d => d.data());
    return builds.map(b => `
      <div style="page-break-inside:avoid;margin-bottom:24px;padding:16px;border:1px solid var(--border-dim);border-radius:4px">
        <h3 style="font-family:var(--font-display);font-size:0.9rem;margin-bottom:8px">${b.name}</h3>
        <div style="display:flex;gap:20px;margin-bottom:8px;font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted)">
          <span>Difficulty: ${b.difficulty}</span>
          <span>Build: ${b.estimatedBuildTime}h</span>
          <span>Teardown: ${b.estimatedTeardownTime}h</span>
          <span>Owner: ${b.owner||'—'}</span>
        </div>
        ${b.toolsRequired ? `<div style="margin-bottom:8px;font-size:0.8rem"><strong>Tools:</strong> ${b.toolsRequired}</div>` : ''}
        ${b.steps?.length ? `<div><strong style="font-size:0.8rem">Steps:</strong><ol style="margin:8px 0;padding-left:20px">${b.steps.map(s => `<li style="font-size:0.82rem;margin-bottom:4px">${s}</li>`).join('')}</ol></div>` : ''}
        ${b.storageLocation ? `<div style="font-size:0.78rem;color:var(--text-muted)">Storage: ${b.storageLocation}</div>` : ''}
      </div>
    `).join('');
  }

  async function genTimelineReport() {
    const snap = await getDocs(query(collection(db, 'milestones'), orderBy('dueDate')));
    const ms = snap.docs.map(d => d.data());
    return `
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>${['MILESTONE','DUE DATE','STATUS'].map(h => `<th style="text-align:left;padding:8px;font-family:var(--font-mono);font-size:0.6rem;border-bottom:1px solid var(--border-soft)">${h}</th>`).join('')}</tr></thead>
        <tbody>${ms.map(m => `<tr style="border-bottom:1px solid var(--border-dim)"><td style="padding:8px;font-size:0.85rem">${m.title}</td><td style="padding:8px;font-family:var(--font-mono);font-size:0.75rem">${m.dueDate||'—'}</td><td style="padding:8px;font-size:0.75rem">${m.status||'Pending'}</td></tr>`).join('')}</tbody>
      </table>
    `;
  }

  async function genRisksReport() {
    const snap = await getDocs(query(collection(db, 'risks'), orderBy('createdAt', 'desc')));
    const risks = snap.docs.map(d => d.data());
    return `
      ${risks.map(r => `
        <div style="margin-bottom:16px;padding:12px;border-left:4px solid ${r.impact==='Critical'?'var(--accent-red)':r.impact==='High'?'var(--priority-high)':'var(--accent-amber)'}">
          <div style="font-weight:600;margin-bottom:4px">${r.title}</div>
          <div style="display:flex;gap:16px;font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);margin-bottom:6px"><span>Likelihood: ${r.likelihood}</span><span>Impact: ${r.impact}</span><span>Owner: ${r.owner||'—'}</span><span>Status: ${r.status||'Open'}</span></div>
          ${r.description ? `<div style="font-size:0.82rem;margin-bottom:4px">${r.description}</div>` : ''}
          ${r.mitigation ? `<div style="font-size:0.8rem;color:var(--accent-cyan)">Mitigation: ${r.mitigation}</div>` : ''}
        </div>
      `).join('')}
    `;
  }

  window._exportJSON = async () => {
    toast('Collecting data for export...', 'info');
    const colls = ['tasks','areas','inventory','expenses','buildManual','meetings','milestones','risks','lessons','knowledge','purchases','storageBins','timingRecords'];
    const data = {};
    for (const c of colls) {
      try {
        const snap = await getDocs(collection(db, c));
        data[c] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) { data[c] = []; }
    }
    data._exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `MFCC-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('JSON backup downloaded!', 'success');
  };

  window._exportCSV = async (collName) => {
    const snap = await getDocs(collection(db, collName));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (items.length === 0) { toast('No data to export', 'warning'); return; }
    const keys = Object.keys(items[0]).filter(k => typeof items[0][k] !== 'object');
    const csv = [keys.join(','), ...items.map(i => keys.map(k => JSON.stringify(String(i[k] || ''))).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `MFCC-${collName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast(`${collName} CSV exported!`, 'success');
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS PAGE — Admin Only
// ═══════════════════════════════════════════════════════════════════════════
export async function renderUsers(el) {
  const { db, collection, getDocs, updateDoc, setDoc, doc, serverTimestamp, toast, showModal, closeModal } = window.MFCC;

  if (window.MFCC.userProfile?.role !== 'Administrator') {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">ACCESS DENIED</div><div class="empty-state-text">Administrator access required</div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">ACCESS CONTROL</span>
        <h1 class="page-title">USER MANAGEMENT</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="add-user-btn">+ ADD USER</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;padding:14px;background:var(--accent-amber-dim);border-color:rgba(255,165,0,0.3)">
      <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--accent-amber)">⚠ To add a new user: First create their Firebase Auth account in the Firebase Console, then use "Add User" to create their profile here with their UID.</div>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th><th>LAST LOGIN</th><th>ACTIONS</th></tr></thead>
        <tbody id="users-tbody"><tr><td colspan="6" style="text-align:center;padding:40px"><div class="loading-spinner"></div></td></tr></tbody>
      </table>
    </div>
  `;

  document.getElementById('add-user-btn').addEventListener('click', () => openUserModal(null));

  async function loadUsers() {
    const snap = await getDocs(collection(db, 'users'));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent-cyan),var(--accent-purple));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;color:var(--bg-void)">${(u.displayName||u.email||'?')[0].toUpperCase()}</div>${u.displayName || '—'}</div></td>
        <td style="font-family:var(--font-mono);font-size:0.75rem">${u.email || '—'}</td>
        <td><span class="badge ${u.role==='Administrator'?'badge-red':'badge-cyan'}">${u.role || 'Member'}</span></td>
        <td><span class="badge ${u.status==='active'?'badge-green':u.status==='pending'?'badge-yellow':'badge-red'}">${u.status || 'active'}</span></td>
        <td style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-muted)">${u.lastLogin?.toDate?.()?.toLocaleDateString?.() || '—'}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="window._editUser('${u.id}')">EDIT</button></td>
      </tr>
    `).join('');
    window._editUser = (id) => { const u = users.find(u => u.id === id); if (u) openUserModal(u); };
  }

  function openUserModal(user) {
    const isEdit = user !== null;
    const u = user || {};
    showModal(isEdit ? `EDIT USER: ${u.displayName}` : 'ADD USER', `
      ${!isEdit ? `<div class="card" style="margin-bottom:16px;padding:12px;background:var(--accent-cyan-dim);border-color:var(--border-soft)"><div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--accent-cyan)">Enter the Firebase Auth UID from the Firebase Console. The user must already exist in Firebase Authentication.</div></div>` : ''}
      <div class="form-grid">
        ${!isEdit ? `<div class="form-group full-width"><label class="form-label">FIREBASE UID *</label><input class="form-input" id="uf-uid" placeholder="Paste Firebase Auth UID here" style="font-family:var(--font-mono);font-size:0.8rem" /></div>` : ''}
        <div class="form-group">
          <label class="form-label">DISPLAY NAME</label>
          <input class="form-input" id="uf-name" value="${u.displayName || ''}" placeholder="First name" />
        </div>
        <div class="form-group">
          <label class="form-label">EMAIL</label>
          <input class="form-input" id="uf-email" value="${u.email || ''}" placeholder="user@email.com" />
        </div>
        <div class="form-group">
          <label class="form-label">ROLE</label>
          <select class="form-select" id="uf-role">
            <option ${u.role==='Administrator'?'selected':''}>Administrator</option>
            <option ${(!u.role||u.role==='Lead Builder')?'selected':''}>Lead Builder</option>
            <option ${u.role==='Member'?'selected':''}>Member</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">STATUS</label>
          <select class="form-select" id="uf-status">
            <option value="active" ${u.status==='active'||!u.status?'selected':''}>Active</option>
            <option value="pending" ${u.status==='pending'?'selected':''}>Pending</option>
            <option value="disabled" ${u.status==='disabled'?'selected':''}>Disabled</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="uf-save">${isEdit ? 'SAVE CHANGES' : 'CREATE USER'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('uf-save').addEventListener('click', async () => {
          const data = {
            displayName: document.getElementById('uf-name')?.value?.trim() || '',
            email: document.getElementById('uf-email')?.value?.trim() || '',
            role: document.getElementById('uf-role')?.value || 'Member',
            status: document.getElementById('uf-status')?.value || 'active',
            updatedAt: serverTimestamp()
          };
          if (isEdit) {
            await updateDoc(doc(db, 'users', user.id), data);
            toast('User updated!', 'success');
          } else {
            const uid = document.getElementById('uf-uid')?.value?.trim();
            if (!uid) { toast('Firebase UID required', 'warning'); return; }
            data.createdAt = serverTimestamp();
            await setDoc(doc(db, 'users', uid), data);
            toast('User created!', 'success');
          }
          closeModal();
          loadUsers();
        });
      }
    });
  }

  loadUsers();
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderSettings(el) {
  const { db, doc, getDoc, setDoc, serverTimestamp, toast } = window.MFCC;

  if (window.MFCC.userProfile?.role !== 'Administrator') {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">ACCESS DENIED</div></div>`;
    return;
  }

  let settings = {};
  try {
    const snap = await getDoc(doc(db, 'settings', 'app'));
    if (snap.exists()) settings = snap.data();
  } catch (e) {}

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">SYSTEM CONFIGURATION</span>
        <h1 class="page-title">SETTINGS</h1>
      </div>
    </div>

    <div class="grid-2" style="gap:24px">
      <div>
        <div class="section-divider"><span class="section-divider-label">EVENT CONFIGURATION</span><div class="section-divider-line"></div></div>
        <div class="card card-accent-top" style="margin-bottom:16px">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">EVENT NAME</label>
              <input class="form-input" id="st-eventname" value="${settings.eventName || 'Star Wars Day'}" />
            </div>
            <div class="form-group">
              <label class="form-label">EVENT DATE (May 4)</label>
              <input class="form-input" id="st-eventdate" value="${settings.eventDate || 'May 4'}" />
            </div>
            <div class="form-group">
              <label class="form-label">EVENT START YEAR</label>
              <input type="number" class="form-input" id="st-startyear" value="${settings.startYear || 2015}" />
            </div>
            <div class="form-group">
              <label class="form-label">EXPECTED GUESTS</label>
              <input type="number" class="form-input" id="st-guests" value="${settings.expectedGuests || 100}" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">EVENT ADDRESS / LOCATION</label>
              <input class="form-input" id="st-location" value="${settings.location || ''}" placeholder="Event address" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">PARKING NOTES</label>
              <textarea class="form-textarea" id="st-parking">${settings.parkingNotes || ''}</textarea>
            </div>
          </div>
          <div style="margin-top:12px"><button class="btn btn-primary" id="save-event-settings">SAVE EVENT SETTINGS</button></div>
        </div>

        <div class="section-divider"><span class="section-divider-label">EMERGENCY CONTACTS</span><div class="section-divider-line"></div></div>
        <div class="card card-accent-top" style="margin-bottom:16px">
          <div class="form-grid">
            ${['Zach','Tyson','Brad','Cayla','Liz'].map(name => `
              <div class="form-group">
                <label class="form-label">${name.toUpperCase()} PHONE</label>
                <input class="form-input" id="ec-${name.toLowerCase()}" value="${settings[`contact_${name}`] || ''}" placeholder="555-555-5555" />
              </div>
            `).join('')}
          </div>
          <div style="margin-top:12px"><button class="btn btn-primary" id="save-contacts">SAVE CONTACTS</button></div>
        </div>
      </div>

      <div>
        <div class="section-divider"><span class="section-divider-label">SYSTEM INFO</span><div class="section-divider-line"></div></div>
        <div class="card card-accent-top" style="margin-bottom:16px">
          <div style="font-family:var(--font-mono);font-size:0.7rem;line-height:2;color:var(--text-secondary)">
            <div>APPLICATION: <span style="color:var(--accent-cyan)">Millennium Falcon Command Center</span></div>
            <div>VERSION: <span style="color:var(--accent-cyan)">1.0.0</span></div>
            <div>HOSTING: <span style="color:var(--accent-cyan)">GitHub Pages</span></div>
            <div>DATABASE: <span style="color:var(--accent-cyan)">Firebase Firestore</span></div>
            <div>AUTH: <span style="color:var(--accent-cyan)">Firebase Authentication</span></div>
            <div>FIRST EVENT: <span style="color:var(--accent-cyan)">2015</span></div>
            <div>STATUS: <span style="color:var(--accent-green)">● OPERATIONAL</span></div>
          </div>
        </div>

        <div class="section-divider"><span class="section-divider-label">FIREBASE CONFIG</span><div class="section-divider-line"></div></div>
        <div class="card card-accent-top" style="margin-bottom:16px">
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);line-height:1.8">
            <p>To update Firebase configuration, edit the <code style="color:var(--accent-cyan)">firebaseConfig</code> object in <code style="color:var(--accent-cyan)">index.html</code>.</p>
            <p style="margin-top:8px">Firebase Console: <a href="https://console.firebase.google.com" target="_blank" style="color:var(--accent-cyan)">console.firebase.google.com ↗</a></p>
          </div>
        </div>

        <div class="section-divider"><span class="section-divider-label">SETUP GUIDE</span><div class="section-divider-line"></div></div>
        <div class="card card-accent-top">
          <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);line-height:2">
            <div style="color:var(--accent-cyan);margin-bottom:4px">INITIAL SETUP CHECKLIST</div>
            <div>☐ 1. Create Firebase project</div>
            <div>☐ 2. Enable Firestore + Authentication</div>
            <div>☐ 3. Apply security rules (see README)</div>
            <div>☐ 4. Create user accounts in Firebase Auth</div>
            <div>☐ 5. Add user profiles via User Management</div>
            <div>☐ 6. Deploy to GitHub Pages</div>
            <div>☐ 7. Seed default areas and builds</div>
            <div>☐ 8. Add event milestones</div>
            <div>☐ 9. Import inventory</div>
            <div>☐ 10. Test on mobile</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('save-event-settings').addEventListener('click', async () => {
    const data = {
      eventName: document.getElementById('st-eventname')?.value || 'Star Wars Day',
      eventDate: document.getElementById('st-eventdate')?.value || 'May 4',
      startYear: parseInt(document.getElementById('st-startyear')?.value) || 2015,
      expectedGuests: parseInt(document.getElementById('st-guests')?.value) || 100,
      location: document.getElementById('st-location')?.value || '',
      parkingNotes: document.getElementById('st-parking')?.value || '',
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'settings', 'app'), data, { merge: true });
    toast('Event settings saved!', 'success');
  });

  document.getElementById('save-contacts').addEventListener('click', async () => {
    const contacts = {};
    ['Zach','Tyson','Brad','Cayla','Liz'].forEach(name => {
      contacts[`contact_${name}`] = document.getElementById(`ec-${name.toLowerCase()}`)?.value || '';
    });
    await setDoc(doc(db, 'settings', 'app'), { ...contacts, updatedAt: serverTimestamp() }, { merge: true });
    toast('Emergency contacts saved!', 'success');
  });
}
