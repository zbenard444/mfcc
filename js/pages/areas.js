// ═══════════════════════════════════════════════════════════════════════════
// AREAS PAGE — Star Wars Event Zone Management
// ═══════════════════════════════════════════════════════════════════════════

export async function renderAreas(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot,
    query, orderBy, doc, serverTimestamp, logActivity, toast, showModal,
    closeModal, formatDate } = window.MFCC;

  const DEFAULT_AREAS = [
    { name: 'Millennium Falcon Ramp', icon: '🚀', description: 'Main entrance ramp structure and theming' },
    { name: 'Millennium Falcon Interior', icon: '🛸', description: 'Interior cockpit and corridor set pieces' },
    { name: 'Photo Booth', icon: '📸', description: 'Themed photo opportunity station' },
    { name: 'Marketplace', icon: '🏪', description: 'Vendor-style display tables and signage' },
    { name: 'Archway', icon: '⚡', description: 'Main event entrance archway structure' },
    { name: 'Endor', icon: '🌲', description: 'Forest moon of Endor themed area' },
    { name: 'Tie Fighter', icon: '✈', description: 'TIE Fighter display structures' },
    { name: 'Food', icon: '🍔', description: 'Food service area and cantina setup' },
    { name: 'Parking', icon: '🅿', description: 'Parking management and guest flow' },
    { name: 'Signage', icon: '🪧', description: 'Directional and decorative signage' },
    { name: 'Storage', icon: '📦', description: 'Equipment and prop storage zones' },
    { name: 'Lighting', icon: '💡', description: 'Event lighting rigs and control' },
    { name: 'Sound', icon: '🔊', description: 'Audio equipment and music stations' }
  ];

  let allAreas = [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">EVENT ZONES</span>
        <h1 class="page-title">AREA MANAGEMENT</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="seed-areas-btn">⊕ SEED DEFAULT AREAS</button>
        <button class="btn btn-primary" id="new-area-btn">+ NEW AREA</button>
      </div>
    </div>
    <div class="grid-auto" id="areas-grid">
      ${[1,2,3,4,5,6].map(() => `<div class="card"><div class="skeleton" style="height:80px"></div></div>`).join('')}
    </div>
  `;

  document.getElementById('new-area-btn').addEventListener('click', () => openAreaModal(null));
  document.getElementById('seed-areas-btn').addEventListener('click', seedDefaultAreas);

  const unsub = onSnapshot(
    query(collection(db, 'areas'), orderBy('name')),
    snap => { allAreas = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderAreaGrid(); },
    err => toast('Error loading areas: ' + err.message, 'error')
  );
  window.MFCC.unsubscribers.push(unsub);

  function renderAreaGrid() {
    const grid = document.getElementById('areas-grid');
    if (!grid) return;
    if (allAreas.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">◈</div><div class="empty-state-title">NO AREAS YET</div><div class="empty-state-text">Click "Seed Default Areas" to populate standard event zones, or add custom areas.</div></div>`;
      return;
    }
    grid.innerHTML = allAreas.map(area => `
      <div class="area-card" data-area-id="${area.id}">
        <div class="area-card-header">
          <div class="area-icon">${area.icon || '◈'}</div>
          <div>
            <div class="area-name">${area.name}</div>
            <div class="area-status">
              ${area.setupComplete ? '<span style="color:var(--accent-green)">✓ Setup Complete</span>' : '<span style="color:var(--text-muted)">Pending Setup</span>'}
            </div>
          </div>
          <div style="margin-left:auto">
            <span class="badge ${area.readiness >= 80 ? 'badge-green' : area.readiness >= 50 ? 'badge-yellow' : 'badge-red'}">${area.readiness || 0}%</span>
          </div>
        </div>
        <div class="area-card-body">
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;min-height:36px">${area.description || 'No description'}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            ${area.requiredLabor ? `<span class="badge badge-cyan">👥 ${area.requiredLabor} people</span>` : ''}
            ${area.estimatedBuildTime ? `<span class="badge badge-gray">⏱ ${area.estimatedBuildTime}h build</span>` : ''}
          </div>
          <div class="readiness-bar-track" style="height:6px">
            <div class="readiness-bar-fill" style="width:${area.readiness||0}%;background:${(area.readiness||0)>=80?'var(--accent-green)':(area.readiness||0)>=50?'var(--accent-amber)':'var(--accent-red)'}"></div>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-area-id]').forEach(card => {
      card.addEventListener('click', () => {
        const area = allAreas.find(a => a.id === card.dataset.areaId);
        if (area) openAreaModal(area);
      });
    });
  }

  async function seedDefaultAreas() {
    const { confirm } = window.MFCC;
    confirm('Add all default Star Wars event areas? Existing areas will not be affected.', async () => {
      let count = 0;
      for (const a of DEFAULT_AREAS) {
        const exists = allAreas.find(existing => existing.name === a.name);
        if (!exists) {
          await addDoc(collection(db, 'areas'), {
            ...a,
            setupInstructions: '',
            teardownInstructions: '',
            requiredProps: '',
            requiredLabor: 0,
            pastProblems: '',
            improvementNotes: '',
            historicalNotes: '',
            readiness: 0,
            setupComplete: false,
            createdAt: serverTimestamp()
          });
          count++;
        }
      }
      toast(`Added ${count} areas!`, 'success');
    });
  }

  function openAreaModal(area) {
    const isEdit = area !== null;
    showModal(isEdit ? `AREA: ${area.name}` : 'NEW AREA', areaForm(area), {
      onOpen: () => {
        document.getElementById('area-save').addEventListener('click', () => saveArea(area?.id));
        if (isEdit) {
          document.getElementById('area-delete').addEventListener('click', () => deleteArea(area.id, area.name));
        }
      }
    });
  }

  function areaForm(area) {
    const a = area || {};
    return `
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="area-info">INFO</button>
        <button class="tab-btn" data-tab="area-setup">SETUP</button>
        <button class="tab-btn" data-tab="area-history">HISTORY</button>
      </div>

      <div class="tab-panel active" id="tab-area-info">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">AREA NAME *</label>
            <input class="form-input" id="af-name" value="${a.name || ''}" placeholder="Area name" />
          </div>
          <div class="form-group">
            <label class="form-label">ICON (emoji)</label>
            <input class="form-input" id="af-icon" value="${a.icon || ''}" placeholder="🚀" style="font-size:1.4rem;text-align:center" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">DESCRIPTION</label>
            <textarea class="form-textarea" id="af-desc">${a.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">REQUIRED LABOR (people)</label>
            <input type="number" class="form-input" id="af-labor" value="${a.requiredLabor || ''}" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">ESTIMATED BUILD TIME (hrs)</label>
            <input type="number" class="form-input" id="af-buildtime" value="${a.estimatedBuildTime || ''}" min="0" step="0.5" />
          </div>
          <div class="form-group">
            <label class="form-label">ESTIMATED TEARDOWN TIME (hrs)</label>
            <input type="number" class="form-input" id="af-teardowntime" value="${a.estimatedTeardownTime || ''}" min="0" step="0.5" />
          </div>
          <div class="form-group">
            <label class="form-label">READINESS % (0-100)</label>
            <input type="number" class="form-input" id="af-readiness" value="${a.readiness || 0}" min="0" max="100" />
          </div>
          <div class="form-group">
            <label class="form-label">SETUP STATUS</label>
            <select class="form-select" id="af-setupstatus">
              <option value="false" ${!a.setupComplete ? 'selected' : ''}>Pending</option>
              <option value="true" ${a.setupComplete ? 'selected' : ''}>Complete</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label class="form-label">REQUIRED PROPS</label>
            <textarea class="form-textarea" id="af-props" rows="3">${a.requiredProps || ''}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">GOOGLE DRIVE REFERENCE PHOTOS LINK</label>
            <input class="form-input" id="af-drive" value="${a.driveLink || ''}" placeholder="https://drive.google.com/..." />
          </div>
        </div>
      </div>

      <div class="tab-panel" id="tab-area-setup">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">SETUP INSTRUCTIONS</label>
            <textarea class="form-textarea" id="af-setup" rows="6">${a.setupInstructions || ''}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">TEARDOWN INSTRUCTIONS</label>
            <textarea class="form-textarea" id="af-teardown" rows="6">${a.teardownInstructions || ''}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">PAST PROBLEMS</label>
            <textarea class="form-textarea" id="af-problems" rows="4">${a.pastProblems || ''}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">IMPROVEMENT NOTES</label>
            <textarea class="form-textarea" id="af-improvements" rows="4">${a.improvementNotes || ''}</textarea>
          </div>
        </div>
      </div>

      <div class="tab-panel" id="tab-area-history">
        <div class="form-group full-width">
          <label class="form-label">HISTORICAL NOTES (year-over-year)</label>
          <textarea class="form-textarea" id="af-history" rows="8">${a.historicalNotes || ''}</textarea>
        </div>
      </div>

      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="area-delete">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="area-save">${isEdit ? 'SAVE CHANGES' : 'CREATE AREA'}</button>
      </div>
    `;
  }

  async function saveArea(areaId) {
    const name = document.getElementById('af-name')?.value?.trim();
    if (!name) { toast('Area name is required', 'warning'); return; }
    const p = window.MFCC.userProfile;
    const data = {
      name,
      icon: document.getElementById('af-icon')?.value || '◈',
      description: document.getElementById('af-desc')?.value || '',
      requiredLabor: parseInt(document.getElementById('af-labor')?.value) || 0,
      estimatedBuildTime: parseFloat(document.getElementById('af-buildtime')?.value) || 0,
      estimatedTeardownTime: parseFloat(document.getElementById('af-teardowntime')?.value) || 0,
      readiness: parseInt(document.getElementById('af-readiness')?.value) || 0,
      setupComplete: document.getElementById('af-setupstatus')?.value === 'true',
      requiredProps: document.getElementById('af-props')?.value || '',
      driveLink: document.getElementById('af-drive')?.value || '',
      setupInstructions: document.getElementById('af-setup')?.value || '',
      teardownInstructions: document.getElementById('af-teardown')?.value || '',
      pastProblems: document.getElementById('af-problems')?.value || '',
      improvementNotes: document.getElementById('af-improvements')?.value || '',
      historicalNotes: document.getElementById('af-history')?.value || '',
      updatedAt: serverTimestamp(),
      updatedBy: p.uid
    };
    try {
      if (areaId) {
        await updateDoc(doc(db, 'areas', areaId), data);
        await logActivity('updated area', { name });
        toast('Area updated!', 'success');
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'areas'), data);
        await logActivity('created area', { name });
        toast('Area created!', 'success');
      }
      closeModal();
    } catch (e) { toast('Error: ' + e.message, 'error'); }
  }

  async function deleteArea(areaId, name) {
    const { confirm } = window.MFCC;
    confirm(`Delete area "${name}"?`, async () => {
      await deleteDoc(doc(db, 'areas', areaId));
      await logActivity('deleted area', { name });
      toast('Area deleted', 'info');
      closeModal();
    });
  }
}
