// ═══════════════════════════════════════════════════════════════════════════
// BUILD MANUAL PAGE — Digital Assembly Guide
// ═══════════════════════════════════════════════════════════════════════════

export async function renderBuildManual(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot,
    query, orderBy, doc, serverTimestamp, logActivity, toast, showModal, closeModal } = window.MFCC;

  const DIFFICULTY = ['Easy', 'Medium', 'Hard', 'Expert'];
  const CATEGORIES = ['Structure', 'Lighting', 'Sound', 'Decor', 'Prop', 'Fabric', 'Electronics', 'Other'];
  const OWNERS = ['Tyson', 'Brad', 'Cayla', 'Liz', 'Zach'];

  const DEFAULT_BUILDS = [
    { name: 'Falcon Ramp Entrance', category: 'Structure', difficulty: 'Hard' },
    { name: 'Falcon Interior', category: 'Structure', difficulty: 'Expert' },
    { name: 'Death Star Night Screen', category: 'Electronics', difficulty: 'Medium' },
    { name: 'Large Tie Fighter', category: 'Structure', difficulty: 'Hard' },
    { name: 'Small Tie Fighters', category: 'Structure', difficulty: 'Medium' },
    { name: 'Marketplace Flags', category: 'Fabric', difficulty: 'Easy' },
    { name: 'Marketplace Displays', category: 'Decor', difficulty: 'Easy' },
    { name: 'Paracord Rigging', category: 'Structure', difficulty: 'Medium' },
    { name: 'Endor Forest Setup', category: 'Decor', difficulty: 'Medium' },
    { name: 'Photo Booth Structure', category: 'Structure', difficulty: 'Medium' },
    { name: 'Lighting Systems', category: 'Lighting', difficulty: 'Medium' },
    { name: 'Sound Systems', category: 'Sound', difficulty: 'Medium' },
    { name: 'Archway Structure', category: 'Structure', difficulty: 'Hard' },
    { name: 'Decorative Props', category: 'Prop', difficulty: 'Easy' }
  ];

  let allBuilds = [];
  let activeFilter = 'All';

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">ASSEMBLY DOCUMENTATION</span>
        <h1 class="page-title">BUILD MANUAL</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="seed-builds-btn">⊕ SEED DEFAULTS</button>
        <button class="btn btn-primary" id="new-build-btn">+ NEW ENTRY</button>
      </div>
    </div>

    <div class="filter-bar" id="build-filter-bar">
      <button class="filter-chip active" data-filter="All">ALL</button>
      ${CATEGORIES.map(c => `<button class="filter-chip" data-filter="${c}">${c.toUpperCase()}</button>`).join('')}
    </div>

    <div class="search-bar" style="margin-bottom:16px;max-width:400px">
      <span class="search-bar-icon">⌕</span>
      <input type="text" id="build-search" placeholder="Search build manual..." />
    </div>

    <div class="grid-auto" id="builds-grid">
      ${[1,2,3].map(() => `<div class="card"><div class="skeleton" style="height:100px"></div></div>`).join('')}
    </div>
  `;

  document.getElementById('new-build-btn').addEventListener('click', () => openBuildModal(null));
  document.getElementById('seed-builds-btn').addEventListener('click', seedDefaults);

  document.getElementById('build-filter-bar').addEventListener('click', e => {
    if (!e.target.classList.contains('filter-chip')) return;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    activeFilter = e.target.dataset.filter;
    renderBuildsGrid();
  });

  document.getElementById('build-search').addEventListener('input', renderBuildsGrid);

  const unsub = onSnapshot(
    query(collection(db, 'buildManual'), orderBy('name')),
    snap => { allBuilds = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderBuildsGrid(); },
    err => toast('Error loading build manual: ' + err.message, 'error')
  );
  window.MFCC.unsubscribers.push(unsub);

  function renderBuildsGrid() {
    const grid = document.getElementById('builds-grid');
    if (!grid) return;
    const search = document.getElementById('build-search')?.value?.toLowerCase() || '';
    let filtered = allBuilds.filter(b => {
      if (activeFilter !== 'All' && b.category !== activeFilter) return false;
      if (search && !b.name?.toLowerCase().includes(search)) return false;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📋</div><div class="empty-state-title">NO BUILD ENTRIES</div><div class="empty-state-text">Seed defaults or create a new build entry</div></div>`;
      return;
    }

    grid.innerHTML = filtered.map(b => {
      const diffColor = { Easy: 'var(--accent-green)', Medium: 'var(--accent-amber)', Hard: 'var(--priority-high)', Expert: 'var(--accent-red)' }[b.difficulty] || 'var(--text-muted)';
      const hasSteps = b.steps && b.steps.length > 0;
      return `
        <div class="card card-accent-top" style="cursor:pointer" data-build-id="${b.id}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div class="card-title" style="margin-bottom:0">${b.name}</div>
            <span class="badge badge-gray">${b.category || 'Other'}</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <span style="font-family:var(--font-mono);font-size:0.62rem;color:${diffColor}">◆ ${b.difficulty || 'Medium'}</span>
            ${b.estimatedBuildTime ? `<span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">⏱ ${b.estimatedBuildTime}h build</span>` : ''}
            ${b.estimatedTeardownTime ? `<span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">◁ ${b.estimatedTeardownTime}h teardown</span>` : ''}
          </div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:10px;min-height:32px">${b.description || 'No description'}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            ${b.owner ? `<span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">👤 ${b.owner}</span>` : '<span></span>'}
            <span class="badge ${hasSteps ? 'badge-green' : 'badge-gray'}">${hasSteps ? `${b.steps.length} STEPS` : 'NO STEPS'}</span>
          </div>
          ${b.storageLocation ? `<div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border-dim)">📦 ${b.storageLocation}</div>` : ''}
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-build-id]').forEach(card => {
      card.addEventListener('click', () => {
        const build = allBuilds.find(b => b.id === card.dataset.buildId);
        if (build) openBuildModal(build);
      });
    });
  }

  async function seedDefaults() {
    const { confirm } = window.MFCC;
    confirm('Add default build manual entries?', async () => {
      let count = 0;
      for (const b of DEFAULT_BUILDS) {
        if (!allBuilds.find(e => e.name === b.name)) {
          await addDoc(collection(db, 'buildManual'), {
            ...b, description: '', steps: [], disassemblySteps: [], toolsRequired: '',
            storageLocation: '', estimatedBuildTime: 0, estimatedTeardownTime: 0,
            historicalNotes: '', driveLink: '', owner: '',
            createdAt: serverTimestamp()
          });
          count++;
        }
      }
      toast(`Added ${count} build entries`, 'success');
    });
  }

  function openBuildModal(build) {
    const isEdit = build !== null;
    showModal(isEdit ? `BUILD: ${build.name}` : 'NEW BUILD ENTRY', buildForm(build), {
      onOpen: () => {
        document.getElementById('bf-save').addEventListener('click', () => saveBuild(build?.id));
        if (isEdit) document.getElementById('bf-delete').addEventListener('click', () => deleteBuild(build.id, build.name));
        document.getElementById('bf-add-step').addEventListener('click', addBuildStep);
        renderStepList();
      }
    });
  }

  let editingSteps = [];

  function buildForm(build) {
    const b = build || {};
    editingSteps = b.steps ? [...b.steps] : [];
    return `
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="binfo">INFO</button>
        <button class="tab-btn" data-tab="bsteps">ASSEMBLY STEPS</button>
        <button class="tab-btn" data-tab="bdisassembly">TEARDOWN STEPS</button>
        <button class="tab-btn" data-tab="bnotes">NOTES</button>
      </div>

      <div class="tab-panel active" id="tab-binfo">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">BUILD NAME *</label>
            <input class="form-input" id="bf-name" value="${b.name || ''}" placeholder="Name of this build item" />
          </div>
          <div class="form-group">
            <label class="form-label">CATEGORY</label>
            <select class="form-select" id="bf-category">
              ${CATEGORIES.map(c => `<option ${b.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">DIFFICULTY</label>
            <select class="form-select" id="bf-difficulty">
              ${DIFFICULTY.map(d => `<option ${b.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">OWNER</label>
            <select class="form-select" id="bf-owner">
              <option value="">Unassigned</option>
              ${OWNERS.map(u => `<option ${b.owner === u ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">EST. BUILD TIME (hrs)</label>
            <input type="number" class="form-input" id="bf-buildtime" value="${b.estimatedBuildTime || ''}" min="0" step="0.5" />
          </div>
          <div class="form-group">
            <label class="form-label">EST. TEARDOWN TIME (hrs)</label>
            <input type="number" class="form-input" id="bf-teardowntime" value="${b.estimatedTeardownTime || ''}" min="0" step="0.5" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">DESCRIPTION</label>
            <textarea class="form-textarea" id="bf-desc">${b.description || ''}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">TOOLS REQUIRED</label>
            <textarea class="form-textarea" id="bf-tools" rows="3">${b.toolsRequired || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">STORAGE LOCATION</label>
            <input class="form-input" id="bf-storage" value="${b.storageLocation || ''}" placeholder="e.g. Bin A3, Garage shelf 2" />
          </div>
          <div class="form-group">
            <label class="form-label">GOOGLE DRIVE LINK</label>
            <input class="form-input" id="bf-drive" value="${b.driveLink || ''}" placeholder="https://drive.google.com/..." />
          </div>
        </div>
      </div>

      <div class="tab-panel" id="tab-bsteps">
        <div style="margin-bottom:12px;display:flex;gap:10px;align-items:center">
          <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted)">ASSEMBLY STEPS</span>
          <button class="btn btn-primary btn-sm" id="bf-add-step">+ ADD STEP</button>
        </div>
        <div id="build-steps-list"></div>
      </div>

      <div class="tab-panel" id="tab-bdisassembly">
        <div class="form-group">
          <label class="form-label">TEARDOWN / DISASSEMBLY STEPS</label>
          <textarea class="form-textarea" id="bf-disassembly" rows="12" placeholder="Step 1: ...\nStep 2: ...\nStep 3: ...">${(b.disassemblySteps || []).join('\n')}</textarea>
        </div>
      </div>

      <div class="tab-panel" id="tab-bnotes">
        <div class="form-group">
          <label class="form-label">HISTORICAL NOTES (lessons learned, year changes)</label>
          <textarea class="form-textarea" id="bf-history" rows="10">${b.historicalNotes || ''}</textarea>
        </div>
      </div>

      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="bf-delete">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="bf-save">${isEdit ? 'SAVE CHANGES' : 'CREATE ENTRY'}</button>
      </div>
    `;
  }

  function renderStepList() {
    const el = document.getElementById('build-steps-list');
    if (!el) return;
    if (editingSteps.length === 0) {
      el.innerHTML = `<div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);padding:20px;text-align:center">No steps added yet. Click "+ ADD STEP" to begin.</div>`;
      return;
    }
    el.innerHTML = editingSteps.map((step, i) => `
      <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;padding:10px;background:var(--bg-base);border:1px solid var(--border-dim);border-radius:4px">
        <span style="font-family:var(--font-display);font-size:0.75rem;color:var(--accent-cyan);min-width:24px;padding-top:2px">${i+1}.</span>
        <textarea style="flex:1;background:transparent;border:none;color:var(--text-primary);font-family:var(--font-body);font-size:0.87rem;resize:none;outline:none;line-height:1.5" rows="2" data-step-idx="${i}" onchange="window._updateStep(${i}, this.value)">${step}</textarea>
        <button onclick="window._removeStep(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;padding:2px" title="Remove step">✕</button>
      </div>
    `).join('');
  }

  window._updateStep = (i, val) => { editingSteps[i] = val; };
  window._removeStep = (i) => { editingSteps.splice(i, 1); renderStepList(); };

  function addBuildStep() {
    editingSteps.push('');
    renderStepList();
    // Focus last textarea
    const textareas = document.querySelectorAll('[data-step-idx]');
    if (textareas.length) textareas[textareas.length - 1].focus();
  }

  async function saveBuild(buildId) {
    const name = document.getElementById('bf-name')?.value?.trim();
    if (!name) { toast('Build name is required', 'warning'); return; }
    const p = window.MFCC.userProfile;
    const disassemblyRaw = document.getElementById('bf-disassembly')?.value || '';
    const data = {
      name,
      category: document.getElementById('bf-category')?.value || 'Other',
      difficulty: document.getElementById('bf-difficulty')?.value || 'Medium',
      owner: document.getElementById('bf-owner')?.value || '',
      estimatedBuildTime: parseFloat(document.getElementById('bf-buildtime')?.value) || 0,
      estimatedTeardownTime: parseFloat(document.getElementById('bf-teardowntime')?.value) || 0,
      description: document.getElementById('bf-desc')?.value || '',
      toolsRequired: document.getElementById('bf-tools')?.value || '',
      storageLocation: document.getElementById('bf-storage')?.value || '',
      driveLink: document.getElementById('bf-drive')?.value || '',
      steps: editingSteps.filter(s => s.trim()),
      disassemblySteps: disassemblyRaw.split('\n').filter(s => s.trim()),
      historicalNotes: document.getElementById('bf-history')?.value || '',
      updatedAt: serverTimestamp(),
      updatedBy: p.uid
    };
    try {
      if (buildId) {
        await updateDoc(doc(db, 'buildManual', buildId), data);
        await logActivity('updated build manual entry', { name });
        toast('Build entry updated!', 'success');
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'buildManual'), data);
        await logActivity('created build manual entry', { name });
        toast('Build entry created!', 'success');
      }
      closeModal();
    } catch (e) { toast('Error: ' + e.message, 'error'); }
  }

  async function deleteBuild(buildId, name) {
    const { confirm } = window.MFCC;
    confirm(`Delete build entry "${name}"?`, async () => {
      await deleteDoc(doc(db, 'buildManual', buildId));
      await logActivity('deleted build manual entry', { name });
      toast('Entry deleted', 'info');
      closeModal();
    });
  }
}
