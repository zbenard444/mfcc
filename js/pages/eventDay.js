// ═══════════════════════════════════════════════════════════════════════════
// EVENT DAY OPERATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderEventDay(el) {
  const { toast } = window.MFCC;
  let clockInt;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">MAY 4TH OPERATIONS</span>
        <h1 class="page-title">EVENT DAY MODE</h1>
      </div>
      <div class="page-actions">
        <span class="badge badge-green" style="font-size:0.8rem;padding:6px 16px">⚡ LIVE</span>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card card-accent-top card-accent-cyan" style="text-align:center">
        <div class="command-clock" id="ed-clock">00:00:00</div>
        <div class="command-date" id="ed-date">MAY THE FOURTH BE WITH YOU</div>
      </div>
      <div class="card card-accent-top card-accent-green">
        <div class="card-title">⚡ QUICK ANNOUNCEMENTS</div>
        <textarea class="form-textarea" id="ed-announcements" rows="4" placeholder="Type announcements here — visible to all operators..."></textarea>
        <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="window._saveAnnouncement()">POST ANNOUNCEMENT</button>
      </div>
    </div>

    <div class="grid-3" style="margin-bottom:20px">
      <div class="card card-accent-top">
        <div class="card-title">📅 EVENT SCHEDULE</div>
        ${[
          { time: '2:00 PM', event: 'Doors Open' },
          { time: '2:30 PM', event: 'Photo Booth Opens' },
          { time: '3:00 PM', event: 'Activities Begin' },
          { time: '4:00 PM', event: 'Food Service' },
          { time: '5:30 PM', event: 'Special Programs' },
          { time: '7:00 PM', event: 'Wind Down' },
          { time: '8:00 PM', event: 'Cleanup Begins' }
        ].map(s => `
          <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-dim)">
            <span style="font-family:var(--font-display);font-size:0.8rem;color:var(--accent-cyan);min-width:70px">${s.time}</span>
            <span style="font-size:0.85rem">${s.event}</span>
          </div>
        `).join('')}
      </div>

      <div class="card card-accent-top">
        <div class="card-title">🚗 PARKING & FLOW</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7">
          <div>• Park in designated front lot</div>
          <div>• Overflow: side street parking</div>
          <div>• Handicap: marked spaces near entrance</div>
          <div>• No parking on lawn</div>
          <div>• Carpool encouraged</div>
          <div style="margin-top:10px;padding:10px;background:var(--bg-elevated);border-radius:4px;font-family:var(--font-mono);font-size:0.7rem;color:var(--accent-amber)">Edit parking notes in Settings</div>
        </div>
      </div>

      <div class="card card-accent-top card-accent-red">
        <div class="card-title">🆘 EMERGENCY CONTACTS</div>
        <div id="ed-contacts" style="font-size:0.85rem;line-height:2">
          <div>🚑 Emergency: <strong>911</strong></div>
          <div>👤 Zach: <strong id="ec-zach">—</strong></div>
          <div>👤 Tyson: <strong id="ec-tyson">—</strong></div>
          <div>👤 Brad: <strong id="ec-brad">—</strong></div>
          <div style="margin-top:8px;font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted)">Update in Settings → Emergency Contacts</div>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card card-accent-top">
        <div class="card-title">🍔 FOOD SCHEDULE</div>
        ${[
          { time: '12:00 PM', item: 'Food prep begins' },
          { time: '4:00 PM', item: 'Food service opens' },
          { time: '5:30 PM', item: 'Second service' },
          { time: '7:00 PM', item: 'Food service closes' }
        ].map(f => `
          <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-dim)">
            <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-amber);min-width:70px">${f.time}</span>
            <span style="font-size:0.83rem">${f.item}</span>
          </div>
        `).join('')}
      </div>

      <div class="card card-accent-top">
        <div class="card-title">📸 PHOTO BOOTH SCHEDULE</div>
        ${[
          { time: '2:30 PM', item: 'Booth opens' },
          { time: 'On Demand', item: 'Continuous operation' },
          { time: '30 min slots', item: 'Photography sessions' },
          { time: '7:00 PM', item: 'Final session' }
        ].map(f => `
          <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-dim)">
            <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-purple);min-width:80px">${f.time}</span>
            <span style="font-size:0.83rem">${f.item}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card card-accent-top">
      <div class="card-title">📝 QUICK NOTES (Event Day Log)</div>
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <input class="form-input" id="ed-quick-note" placeholder="Log something that happened..." style="flex:1" />
        <button class="btn btn-primary" onclick="window._addEventNote()">LOG IT</button>
      </div>
      <div id="ed-notes-list" style="max-height:200px;overflow-y:auto"></div>
    </div>
  `;

  const notes = [];
  window._addEventNote = () => {
    const text = document.getElementById('ed-quick-note')?.value?.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    notes.unshift({ time, text, user: window.MFCC.userProfile?.displayName || 'Unknown' });
    document.getElementById('ed-quick-note').value = '';
    const list = document.getElementById('ed-notes-list');
    if (list) list.innerHTML = notes.map(n => `
      <div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--border-dim)">
        <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--accent-cyan);min-width:70px">${n.time}</span>
        <span style="font-size:0.82rem;color:var(--text-secondary)"><strong>${n.user}:</strong> ${n.text}</span>
      </div>
    `).join('');
  };
  window._saveAnnouncement = () => toast('Announcement posted!', 'success');

  const updateClock = () => {
    const now = new Date();
    const c = document.getElementById('ed-clock');
    if (c) c.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  };
  updateClock();
  clockInt = setInterval(updateClock, 1000);
  window.MFCC.unsubscribers.push(() => clearInterval(clockInt));
}

// ═══════════════════════════════════════════════════════════════════════════
// MEETINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderMeetings(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot,
    query, orderBy, doc, serverTimestamp, logActivity, toast, showModal, closeModal, formatDate } = window.MFCC;

  let allMeetings = [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">PLANNING RECORDS</span>
        <h1 class="page-title">MEETINGS</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="gen-agenda-btn">⊕ GENERATE AGENDA</button>
        <button class="btn btn-primary" id="new-meeting-btn">+ NEW MEETING</button>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:16px;max-width:400px">
      <span class="search-bar-icon">⌕</span>
      <input type="text" id="meeting-search" placeholder="Search meetings..." />
    </div>
    <div id="meetings-list">
      <div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>
    </div>
  `;

  document.getElementById('new-meeting-btn').addEventListener('click', () => openMeetingModal(null));
  document.getElementById('gen-agenda-btn').addEventListener('click', generateAgenda);
  document.getElementById('meeting-search').addEventListener('input', renderList);

  const unsub = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc')), snap => {
    allMeetings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderList();
  });
  window.MFCC.unsubscribers.push(unsub);

  function renderList() {
    const listEl = document.getElementById('meetings-list');
    const search = document.getElementById('meeting-search')?.value?.toLowerCase() || '';
    const filtered = allMeetings.filter(m => !search || m.title?.toLowerCase().includes(search) || m.notes?.toLowerCase().includes(search));
    if (!listEl) return;
    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◎</div><div class="empty-state-title">NO MEETINGS YET</div></div>`;
      return;
    }
    listEl.innerHTML = filtered.map(m => `
      <div class="meeting-card" data-id="${m.id}">
        <div class="meeting-date">${m.date} · ${m.type || 'Planning Meeting'}</div>
        <div class="meeting-title">${m.title}</div>
        <div class="meeting-preview">${(m.notes || '').substring(0, 120)}${m.notes?.length > 120 ? '...' : ''}</div>
        ${m.actionItems?.length ? `<div style="margin-top:8px;font-family:var(--font-mono);font-size:0.62rem;color:var(--accent-cyan)">${m.actionItems.length} ACTION ITEMS</div>` : ''}
      </div>
    `).join('');
    listEl.querySelectorAll('[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        const m = allMeetings.find(m => m.id === card.dataset.id);
        if (m) openMeetingModal(m);
      });
    });
  }

  function openMeetingModal(meeting) {
    const isEdit = meeting !== null;
    const m = meeting || {};
    showModal(isEdit ? meeting.title : 'NEW MEETING', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">MEETING TITLE *</label>
          <input class="form-input" id="mf-title" value="${m.title || ''}" placeholder="e.g. 2026 Planning Session #1" />
        </div>
        <div class="form-group">
          <label class="form-label">DATE</label>
          <input type="date" class="form-input" id="mf-date" value="${m.date || new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">MEETING TYPE</label>
          <select class="form-select" id="mf-type">
            ${['Planning','Review','Setup Debrief','Post-Event','Emergency'].map(t => `<option ${m.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label">ATTENDEES</label>
          <input class="form-input" id="mf-attendees" value="${(m.attendees || []).join(', ')}" placeholder="Tyson, Brad, Cayla, Liz, Zach" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">MEETING NOTES</label>
          <textarea class="form-textarea" id="mf-notes" rows="6">${m.notes || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">DECISIONS MADE</label>
          <textarea class="form-textarea" id="mf-decisions" rows="4">${m.decisions || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">ACTION ITEMS (one per line: "Owner: Task")</label>
          <textarea class="form-textarea" id="mf-actions" rows="4">${(m.actionItems || []).join('\n')}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">IDEAS & SUGGESTIONS</label>
          <textarea class="form-textarea" id="mf-ideas" rows="3">${m.ideas || ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="mf-delete">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="mf-save">${isEdit ? 'SAVE' : 'CREATE'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('mf-save').addEventListener('click', async () => {
          const title = document.getElementById('mf-title')?.value?.trim();
          if (!title) { toast('Title required', 'warning'); return; }
          const p = window.MFCC.userProfile;
          const data = {
            title,
            date: document.getElementById('mf-date')?.value,
            type: document.getElementById('mf-type')?.value,
            attendees: document.getElementById('mf-attendees')?.value.split(',').map(s => s.trim()).filter(Boolean),
            notes: document.getElementById('mf-notes')?.value || '',
            decisions: document.getElementById('mf-decisions')?.value || '',
            actionItems: document.getElementById('mf-actions')?.value.split('\n').filter(s => s.trim()),
            ideas: document.getElementById('mf-ideas')?.value || '',
            updatedAt: serverTimestamp(), updatedBy: p.uid
          };
          if (meeting?.id) {
            await updateDoc(doc(db, 'meetings', meeting.id), data);
            toast('Meeting updated!', 'success');
          } else {
            data.createdAt = serverTimestamp(); data.createdBy = p.uid;
            await addDoc(collection(db, 'meetings'), data);
            toast('Meeting saved!', 'success');
          }
          await logActivity('saved meeting notes', { title });
          closeModal();
        });
        if (isEdit) document.getElementById('mf-delete').addEventListener('click', async () => {
          const { confirm } = window.MFCC;
          confirm(`Delete meeting "${meeting.title}"?`, async () => {
            await deleteDoc(doc(db, 'meetings', meeting.id));
            toast('Meeting deleted', 'info');
            closeModal();
          });
        });
      }
    });
  }

  async function generateAgenda() {
    const { getDocs, collection } = window.MFCC;
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    const tasks = tasksSnap.docs.map(d => d.data());
    const now = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'Completed');
    const critical = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed');

    showModal('AUTO-GENERATED AGENDA', `
      <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);margin-bottom:16px">Generated ${now}</div>
      <div style="background:var(--bg-base);border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:20px;font-family:var(--font-body);line-height:1.8">
        <h3 style="font-size:1rem;margin-bottom:16px">STAR WARS EVENT PLANNING MEETING AGENDA</h3>
        <div style="margin-bottom:12px"><strong>1. Readiness Review</strong><br><span style="color:var(--text-muted);font-size:0.85rem">Review overall readiness percentage and category breakdowns</span></div>
        ${overdue.length > 0 ? `<div style="margin-bottom:12px"><strong>2. Overdue Items (${overdue.length})</strong><br>${overdue.slice(0,5).map(t => `<div style="color:var(--accent-red);font-size:0.82rem">• ${t.title} (${t.owner || 'Unassigned'})</div>`).join('')}</div>` : ''}
        ${critical.length > 0 ? `<div style="margin-bottom:12px"><strong>3. Critical Tasks (${critical.length})</strong><br>${critical.slice(0,5).map(t => `<div style="color:var(--accent-amber);font-size:0.82rem">• ${t.title} (${t.owner || 'Unassigned'})</div>`).join('')}</div>` : ''}
        <div style="margin-bottom:12px"><strong>4. Area Updates</strong><br><span style="color:var(--text-muted);font-size:0.85rem">Quick status from each area lead</span></div>
        <div style="margin-bottom:12px"><strong>5. Budget Review</strong><br><span style="color:var(--text-muted);font-size:0.85rem">Current spend vs. budget</span></div>
        <div style="margin-bottom:12px"><strong>6. Inventory Concerns</strong><br><span style="color:var(--text-muted);font-size:0.85rem">Missing or damaged items</span></div>
        <div><strong>7. Action Items & Next Meeting</strong></div>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="window.print()">PRINT</button>
        <button class="btn btn-primary" onclick="window.MFCC.closeModal()">CLOSE</button>
      </div>
    `);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MILESTONES PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderMilestones(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
    doc, serverTimestamp, logActivity, toast, showModal, closeModal } = window.MFCC;

  let allMs = [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">PROJECT TIMELINE</span>
        <h1 class="page-title">MILESTONES</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="new-ms-btn">+ NEW MILESTONE</button>
      </div>
    </div>
    <div class="timeline" id="ms-timeline">
      <div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>
    </div>
  `;

  document.getElementById('new-ms-btn').addEventListener('click', () => openMsModal(null));

  const unsub = onSnapshot(query(collection(db, 'milestones'), orderBy('dueDate')), snap => {
    allMs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTimeline();
  });
  window.MFCC.unsubscribers.push(unsub);

  function renderTimeline() {
    const tl = document.getElementById('ms-timeline');
    if (!tl) return;
    const now = new Date().toISOString().split('T')[0];
    if (allMs.length === 0) {
      tl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◆</div><div class="empty-state-title">NO MILESTONES</div><div class="empty-state-text">Add milestones to track your planning timeline</div></div>`;
      return;
    }
    tl.innerHTML = allMs.map(m => {
      const overdue = m.dueDate < now && m.status !== 'Completed';
      const complete = m.status === 'Completed';
      const dotClass = complete ? 'complete' : overdue ? 'overdue' : 'upcoming';
      const diff = Math.ceil((new Date(m.dueDate) - new Date()) / 86400000);
      return `
        <div class="timeline-item" data-id="${m.id}">
          <div class="timeline-dot ${dotClass}"></div>
          <div class="timeline-content" style="cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
              <div>
                <div style="font-size:0.9rem;font-weight:600;${complete ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${m.title}</div>
                <div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted);margin-top:2px">${m.dueDate}${complete ? ' — COMPLETED' : overdue ? ` — ${Math.abs(diff)}d OVERDUE` : ` — ${diff}d to go`}</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <span class="badge ${complete ? 'badge-green' : overdue ? 'badge-red' : 'badge-cyan'}">${m.status || 'Pending'}</span>
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();window._editMs('${m.id}')">EDIT</button>
                ${!complete ? `<button class="btn btn-success btn-sm" onclick="event.stopPropagation();window._completeMs('${m.id}')">✓</button>` : ''}
              </div>
            </div>
            ${m.description ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:8px">${m.description}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window._editMs = (id) => { const m = allMs.find(m => m.id === id); if (m) openMsModal(m); };
  window._completeMs = async (id) => {
    const m = allMs.find(m => m.id === id);
    await updateDoc(doc(db, 'milestones', id), { status: 'Completed', completedAt: serverTimestamp() });
    await logActivity('completed milestone', { title: m?.title });
    toast('Milestone complete! 🎉', 'success');
  };

  function openMsModal(ms) {
    const isEdit = ms !== null;
    const m = ms || {};
    showModal(isEdit ? 'EDIT MILESTONE' : 'NEW MILESTONE', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">MILESTONE TITLE *</label>
          <input class="form-input" id="msf-title" value="${m.title || ''}" placeholder="e.g. All builds complete" />
        </div>
        <div class="form-group">
          <label class="form-label">DUE DATE</label>
          <input type="date" class="form-input" id="msf-date" value="${m.dueDate || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">STATUS</label>
          <select class="form-select" id="msf-status">
            ${['Pending','In Progress','Completed','At Risk'].map(s => `<option ${m.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label">DESCRIPTION</label>
          <textarea class="form-textarea" id="msf-desc">${m.description || ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="msf-del">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="msf-save">${isEdit ? 'SAVE' : 'CREATE'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('msf-save').addEventListener('click', async () => {
          const title = document.getElementById('msf-title')?.value?.trim();
          if (!title) { toast('Title required', 'warning'); return; }
          const p = window.MFCC.userProfile;
          const data = { title, dueDate: document.getElementById('msf-date')?.value, status: document.getElementById('msf-status')?.value, description: document.getElementById('msf-desc')?.value || '', updatedAt: serverTimestamp(), updatedBy: p.uid };
          if (ms?.id) { await updateDoc(doc(db, 'milestones', ms.id), data); toast('Updated!', 'success'); }
          else { data.createdAt = serverTimestamp(); data.createdBy = p.uid; await addDoc(collection(db, 'milestones'), data); toast('Milestone created!', 'success'); }
          await logActivity('saved milestone', { title });
          closeModal();
        });
        if (isEdit) document.getElementById('msf-del').addEventListener('click', () => {
          const { confirm } = window.MFCC;
          confirm(`Delete "${ms.title}"?`, async () => { await deleteDoc(doc(db, 'milestones', ms.id)); toast('Deleted', 'info'); closeModal(); });
        });
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RISKS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderRisks(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
    doc, serverTimestamp, toast, showModal, closeModal, logActivity } = window.MFCC;

  let allRisks = [];
  const LIKELIHOODS = ['Low', 'Medium', 'High'];
  const IMPACTS = ['Low', 'Medium', 'High', 'Critical'];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">CONTINGENCY PLANNING</span>
        <h1 class="page-title">RISK REGISTER</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="new-risk-btn">+ NEW RISK</button>
      </div>
    </div>
    <div id="risks-list">
      <div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>
    </div>
  `;

  document.getElementById('new-risk-btn').addEventListener('click', () => openRiskModal(null));

  const unsub = onSnapshot(query(collection(db, 'risks'), orderBy('createdAt', 'desc')), snap => {
    allRisks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderRisks_list();
  });
  window.MFCC.unsubscribers.push(unsub);

  function riskLevel(likelihood, impact) {
    const score = (['Low','Medium','High'].indexOf(likelihood) + 1) * (['Low','Medium','High','Critical'].indexOf(impact) + 1);
    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  function renderRisks_list() {
    const listEl = document.getElementById('risks-list');
    if (!listEl) return;
    if (allRisks.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">NO RISKS LOGGED</div><div class="empty-state-text">Add risks to track potential issues and mitigation plans</div></div>`;
      return;
    }
    const sorted = [...allRisks].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[riskLevel(a.likelihood, a.impact)] || 2) - (order[riskLevel(b.likelihood, b.impact)] || 2);
    });
    listEl.innerHTML = sorted.map(r => {
      const level = riskLevel(r.likelihood, r.impact);
      return `
        <div class="risk-item risk-${level}" style="margin-bottom:10px;cursor:pointer" data-id="${r.id}">
          <div class="risk-level"></div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:6px">
              <div style="font-size:0.9rem;font-weight:600">${r.title}</div>
              <div style="display:flex;gap:6px">
                <span class="badge ${level === 'high' ? 'badge-red' : level === 'medium' ? 'badge-yellow' : 'badge-green'}">${level.toUpperCase()} RISK</span>
                <span class="badge badge-gray">${r.status || 'Open'}</span>
              </div>
            </div>
            <div style="display:flex;gap:16px;margin-bottom:6px;flex-wrap:wrap">
              <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">LIKELIHOOD: ${r.likelihood || '—'}</span>
              <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">IMPACT: ${r.impact || '—'}</span>
              ${r.owner ? `<span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">OWNER: ${r.owner}</span>` : ''}
            </div>
            ${r.description ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:4px">${r.description}</div>` : ''}
            ${r.mitigation ? `<div style="font-size:0.8rem;color:var(--accent-cyan);font-style:italic">Mitigation: ${r.mitigation}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    listEl.querySelectorAll('[data-id]').forEach(item => {
      item.addEventListener('click', () => { const r = allRisks.find(r => r.id === item.dataset.id); if (r) openRiskModal(r); });
    });
  }

  function openRiskModal(risk) {
    const isEdit = risk !== null;
    const r = risk || {};
    const users = ['Tyson','Brad','Cayla','Liz','Zach'];
    showModal(isEdit ? 'EDIT RISK' : 'NEW RISK', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">RISK TITLE *</label>
          <input class="form-input" id="rf-title" value="${r.title || ''}" placeholder="e.g. Power failure during event" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">DESCRIPTION</label>
          <textarea class="form-textarea" id="rf-desc">${r.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">LIKELIHOOD</label>
          <select class="form-select" id="rf-likelihood">
            ${LIKELIHOODS.map(l => `<option ${r.likelihood === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">IMPACT</label>
          <select class="form-select" id="rf-impact">
            ${IMPACTS.map(i => `<option ${r.impact === i ? 'selected' : ''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">OWNER</label>
          <select class="form-select" id="rf-owner">
            <option value="">—</option>
            ${users.map(u => `<option ${r.owner === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">STATUS</label>
          <select class="form-select" id="rf-status">
            ${['Open','Monitoring','Mitigated','Closed'].map(s => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label">MITIGATION PLAN</label>
          <textarea class="form-textarea" id="rf-mitigation" rows="4">${r.mitigation || ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="rf-del">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="rf-save">${isEdit ? 'SAVE' : 'CREATE'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('rf-save').addEventListener('click', async () => {
          const title = document.getElementById('rf-title')?.value?.trim();
          if (!title) { toast('Title required', 'warning'); return; }
          const p = window.MFCC.userProfile;
          const data = { title, description: document.getElementById('rf-desc')?.value || '', likelihood: document.getElementById('rf-likelihood')?.value, impact: document.getElementById('rf-impact')?.value, owner: document.getElementById('rf-owner')?.value || '', status: document.getElementById('rf-status')?.value, mitigation: document.getElementById('rf-mitigation')?.value || '', updatedAt: serverTimestamp(), updatedBy: p.uid };
          if (risk?.id) { await updateDoc(doc(db, 'risks', risk.id), data); toast('Risk updated!', 'success'); }
          else { data.createdAt = serverTimestamp(); data.createdBy = p.uid; await addDoc(collection(db, 'risks'), data); toast('Risk logged!', 'success'); }
          await logActivity('saved risk', { title });
          closeModal();
        });
        if (isEdit) document.getElementById('rf-del').addEventListener('click', () => {
          const { confirm } = window.MFCC;
          confirm(`Delete risk "${risk.title}"?`, async () => { await deleteDoc(doc(db, 'risks', risk.id)); toast('Deleted', 'info'); closeModal(); });
        });
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSONS LEARNED PAGE
// ═══════════════════════════════════════════════════════════════════════════
export async function renderLessons(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
    doc, serverTimestamp, toast, showModal, closeModal, logActivity } = window.MFCC;

  let allLessons = [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">INSTITUTIONAL KNOWLEDGE</span>
        <h1 class="page-title">LESSONS LEARNED</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="new-lesson-btn">+ NEW ENTRY</button>
      </div>
    </div>
    <div class="filter-bar" id="lesson-year-filter"></div>
    <div id="lessons-list">
      <div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>
    </div>
  `;

  document.getElementById('new-lesson-btn').addEventListener('click', () => openLessonModal(null));

  const unsub = onSnapshot(query(collection(db, 'lessons'), orderBy('year', 'desc')), snap => {
    allLessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderYearFilter();
    renderLessonsList('All');
  });
  window.MFCC.unsubscribers.push(unsub);

  function renderYearFilter() {
    const bar = document.getElementById('lesson-year-filter');
    if (!bar) return;
    const years = [...new Set(allLessons.map(l => l.year))].sort((a,b) => b-a);
    bar.innerHTML = `<button class="filter-chip active" data-year="All">ALL YEARS</button>` +
      years.map(y => `<button class="filter-chip" data-year="${y}">${y}</button>`).join('');
    bar.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderLessonsList(chip.dataset.year);
      });
    });
  }

  function renderLessonsList(year) {
    const listEl = document.getElementById('lessons-list');
    if (!listEl) return;
    const filtered = year === 'All' ? allLessons : allLessons.filter(l => String(l.year) === String(year));
    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◉</div><div class="empty-state-title">NO ENTRIES YET</div><div class="empty-state-text">Document lessons learned after each event to improve year over year</div></div>`;
      return;
    }
    listEl.innerHTML = filtered.map(l => `
      <div class="card card-accent-top" style="margin-bottom:12px;cursor:pointer" data-id="${l.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div style="font-family:var(--font-display);font-size:0.75rem;color:var(--accent-cyan);margin-bottom:4px">EVENT ${l.year} — ${l.category || 'General'}</div>
            <div style="font-size:1rem;font-weight:600">${l.title}</div>
          </div>
          <span class="badge ${l.type === 'Success' ? 'badge-green' : l.type === 'Failure' ? 'badge-red' : 'badge-yellow'}">${l.type || 'Note'}</span>
        </div>
        ${l.description ? `<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px">${l.description.substring(0,200)}${l.description.length>200?'...':''}</div>` : ''}
        ${l.improvement ? `<div style="font-size:0.82rem;color:var(--accent-amber);font-style:italic">💡 ${l.improvement}</div>` : ''}
      </div>
    `).join('');
    listEl.querySelectorAll('[data-id]').forEach(card => {
      card.addEventListener('click', () => { const l = allLessons.find(l => l.id === card.dataset.id); if (l) openLessonModal(l); });
    });
  }

  function openLessonModal(lesson) {
    const isEdit = lesson !== null;
    const l = lesson || {};
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: currentYear - 2014}, (_, i) => 2015 + i).reverse();
    showModal(isEdit ? 'EDIT LESSON' : 'NEW LESSON LEARNED', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">TITLE *</label>
          <input class="form-input" id="lf-title" value="${l.title || ''}" placeholder="e.g. Need backup generator" />
        </div>
        <div class="form-group">
          <label class="form-label">YEAR</label>
          <select class="form-select" id="lf-year">
            ${years.map(y => `<option ${l.year == y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">TYPE</label>
          <select class="form-select" id="lf-type">
            ${['Success','Failure','Improvement','Guest Feedback','Food Feedback','Setup Issue','Teardown Issue','Idea'].map(t => `<option ${l.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">CATEGORY</label>
          <select class="form-select" id="lf-cat">
            ${['General','Setup','Teardown','Food','Decor','Build','Safety','Logistics','Guest Experience','Budget'].map(c => `<option ${l.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label">DESCRIPTION</label>
          <textarea class="form-textarea" id="lf-desc" rows="5">${l.description || ''}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">IMPROVEMENT RECOMMENDATION</label>
          <textarea class="form-textarea" id="lf-improvement" rows="3">${l.improvement || ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        ${isEdit ? `<button class="btn btn-danger btn-sm" id="lf-del">DELETE</button>` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="lf-save">${isEdit ? 'SAVE' : 'ADD LESSON'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('lf-save').addEventListener('click', async () => {
          const title = document.getElementById('lf-title')?.value?.trim();
          if (!title) { toast('Title required', 'warning'); return; }
          const p = window.MFCC.userProfile;
          const data = { title, year: parseInt(document.getElementById('lf-year')?.value), type: document.getElementById('lf-type')?.value, category: document.getElementById('lf-cat')?.value, description: document.getElementById('lf-desc')?.value || '', improvement: document.getElementById('lf-improvement')?.value || '', updatedAt: serverTimestamp(), updatedBy: p.uid };
          if (lesson?.id) { await updateDoc(doc(db, 'lessons', lesson.id), data); toast('Updated!', 'success'); }
          else { data.createdAt = serverTimestamp(); data.createdBy = p.uid; await addDoc(collection(db, 'lessons'), data); toast('Lesson saved!', 'success'); }
          await logActivity('saved lesson', { title });
          closeModal();
        });
        if (isEdit) document.getElementById('lf-del').addEventListener('click', () => {
          const { confirm } = window.MFCC;
          confirm(`Delete "${lesson.title}"?`, async () => { await deleteDoc(doc(db, 'lessons', lesson.id)); toast('Deleted', 'info'); closeModal(); });
        });
      }
    });
  }
}
