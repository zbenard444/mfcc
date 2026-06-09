// ═══════════════════════════════════════════════════════════════════════════
// TASKS PAGE — Full Project Management System
// ═══════════════════════════════════════════════════════════════════════════

export async function renderTasks(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot,
    query, orderBy, doc, serverTimestamp, logActivity, toast, showModal,
    closeModal, formatDate, formatRelativeDate } = window.MFCC;

  const AREAS = ['All Areas','Millennium Falcon Ramp','Millennium Falcon Interior','Photo Booth','Marketplace','Archway','Endor','Tie Fighter','Food','Parking','Signage','Storage','General'];
  const STATUSES = ['All','Not Started','In Progress','Waiting','Blocked','Completed','Archived'];
  const PRIORITIES = ['All','Critical','High','Medium','Low'];
  const USERS = ['Tyson','Brad','Cayla','Liz','Zach'];

  let allTasks = [];
  let filters = { status: 'All', priority: 'All', area: 'All Areas', owner: 'All', search: '' };
  let sortBy = 'dueDate';

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">PROJECT MANAGEMENT</span>
        <h1 class="page-title">TASK COMMAND</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" id="new-task-btn">+ NEW TASK</button>
        <button class="btn btn-secondary" id="task-report-btn">◫ REPORT</button>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="card" style="margin-bottom:16px;padding:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="search-bar" style="flex:1;min-width:200px">
          <span class="search-bar-icon">⌕</span>
          <input type="text" id="task-search" placeholder="Search tasks..." />
        </div>
        <select class="form-select" id="filter-status" style="width:150px">
          ${STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select class="form-select" id="filter-priority" style="width:130px">
          ${PRIORITIES.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <select class="form-select" id="filter-area" style="width:180px">
          ${AREAS.map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <select class="form-select" id="filter-owner" style="width:130px">
          <option value="All">All Owners</option>
          ${USERS.map(u => `<option value="${u}">${u}</option>`).join('')}
        </select>
        <select class="form-select" id="sort-by" style="width:150px">
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="area">Sort: Area</option>
          <option value="owner">Sort: Owner</option>
          <option value="status">Sort: Status</option>
        </select>
      </div>
    </div>

    <!-- TASK SUMMARY STATS -->
    <div class="grid-4" style="margin-bottom:16px" id="task-stats"></div>

    <!-- TASK LIST -->
    <div id="task-list-container">
      <div style="text-align:center;padding:40px"><div class="loading-spinner"></div></div>
    </div>
  `;

  // Filter handlers
  ['task-search','filter-status','filter-priority','filter-area','filter-owner','sort-by'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });

  document.getElementById('new-task-btn').addEventListener('click', () => openTaskModal(null));
  document.getElementById('task-report-btn').addEventListener('click', generateTaskReport);

  // Realtime listener
  const unsub = onSnapshot(
    query(collection(db, 'tasks'), orderBy('createdAt', 'desc')),
    (snap) => {
      allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyFilters();
      renderStats();
    },
    (err) => { toast('Error loading tasks: ' + err.message, 'error'); }
  );
  window.MFCC.unsubscribers.push(unsub);

  function applyFilters() {
    filters.search = document.getElementById('task-search')?.value?.toLowerCase() || '';
    filters.status = document.getElementById('filter-status')?.value || 'All';
    filters.priority = document.getElementById('filter-priority')?.value || 'All';
    filters.area = document.getElementById('filter-area')?.value || 'All Areas';
    filters.owner = document.getElementById('filter-owner')?.value || 'All';
    sortBy = document.getElementById('sort-by')?.value || 'dueDate';
    renderTaskList();
  }

  function renderStats() {
    const statsEl = document.getElementById('task-stats');
    if (!statsEl) return;
    const now = new Date().toISOString().split('T')[0];
    const open = allTasks.filter(t => !['Completed','Archived'].includes(t.status)).length;
    const overdue = allTasks.filter(t => t.dueDate && t.dueDate < now && !['Completed','Archived'].includes(t.status)).length;
    const blocked = allTasks.filter(t => t.status === 'Blocked').length;
    const complete = allTasks.filter(t => t.status === 'Completed').length;
    const pct = allTasks.length > 0 ? Math.round((complete / allTasks.length) * 100) : 0;

    statsEl.innerHTML = `
      <div class="card card-accent-top"><div class="card-title">OPEN</div><div class="card-value">${open}</div></div>
      <div class="card card-accent-top card-accent-red"><div class="card-title">OVERDUE</div><div class="card-value" style="color:var(--accent-red)">${overdue}</div></div>
      <div class="card card-accent-top card-accent-amber"><div class="card-title">BLOCKED</div><div class="card-value" style="color:var(--accent-amber)">${blocked}</div></div>
      <div class="card card-accent-top card-accent-green"><div class="card-title">COMPLETE</div><div class="card-value" style="color:var(--accent-green)">${pct}%</div></div>
    `;
  }

  function renderTaskList() {
    const container = document.getElementById('task-list-container');
    if (!container) return;

    const now = new Date().toISOString().split('T')[0];
    let filtered = allTasks.filter(t => {
      if (filters.search && !t.title?.toLowerCase().includes(filters.search) && !t.description?.toLowerCase().includes(filters.search)) return false;
      if (filters.status !== 'All' && t.status !== filters.status) return false;
      if (filters.priority !== 'All' && t.priority !== filters.priority) return false;
      if (filters.area !== 'All Areas' && t.area !== filters.area) return false;
      if (filters.owner !== 'All' && t.owner !== filters.owner) return false;
      return true;
    });

    // Sort
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
        case 'area': return (a.area || '').localeCompare(b.area || '');
        case 'owner': return (a.owner || '').localeCompare(b.owner || '');
        case 'status': return (a.status || '').localeCompare(b.status || '');
        default: { // dueDate — overdue first, then by date
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
      }
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✓</div><div class="empty-state-title">NO TASKS FOUND</div><div class="empty-state-text">Adjust filters or create a new task</div></div>`;
      return;
    }

    // Group overdue tasks at top
    const overdue = filtered.filter(t => t.dueDate && t.dueDate < now && !['Completed','Archived'].includes(t.status));
    const normal = filtered.filter(t => !overdue.includes(t));

    let html = '';
    if (overdue.length > 0) {
      html += `
        <div class="section-divider" style="margin-bottom:8px">
          <span class="section-divider-label" style="color:var(--accent-red)">⚠ OVERDUE (${overdue.length})</span>
          <div class="section-divider-line"></div>
        </div>
        ${overdue.map(t => taskRow(t, now, true)).join('')}
        <div class="section-divider" style="margin:12px 0 8px">
          <span class="section-divider-label">ALL TASKS (${normal.length})</span>
          <div class="section-divider-line"></div>
        </div>
      `;
    }
    html += normal.map(t => taskRow(t, now, false)).join('');
    container.innerHTML = html;

    // Attach click handlers
    container.querySelectorAll('[data-task-id]').forEach(row => {
      row.addEventListener('click', () => {
        const taskId = row.dataset.taskId;
        const task = allTasks.find(t => t.id === taskId);
        if (task) openTaskModal(task);
      });
    });
  }

  function taskRow(task, now, isOverdue) {
    const overdueCls = isOverdue ? 'overdue-flag' : '';
    const priorCls = `priority-${(task.priority || 'medium').toLowerCase()}`;
    const blocked = task.status === 'Blocked';
    return `
      <div class="task-item ${priorCls} ${overdueCls}" style="margin-bottom:6px;cursor:pointer" data-task-id="${task.id}">
        <div class="task-priority-bar"></div>
        <div class="task-content">
          <div class="task-title">${task.title}${blocked ? ' 🚫' : ''}</div>
          <div class="task-meta">
            ${task.owner ? `<span class="task-meta-item">👤 ${task.owner}</span>` : ''}
            ${task.area ? `<span class="task-meta-item">◈ ${task.area}</span>` : ''}
            ${task.dueDate ? `<span class="task-meta-item" style="${isOverdue ? 'color:var(--accent-red)' : ''}">${formatRelativeDate(task.dueDate)}</span>` : ''}
            ${task.estimatedHours ? `<span class="task-meta-item">⏱ ${task.estimatedHours}h</span>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="badge ${statusBadgeClass(task.status)}">${task.status}</span>
          <span class="badge badge-gray" style="font-size:0.55rem">${task.priority}</span>
        </div>
      </div>
    `;
  }

  function openTaskModal(task) {
    const isEdit = task !== null;
    showModal(isEdit ? 'EDIT TASK' : 'CREATE TASK', taskForm(task), {
      onOpen: () => {
        document.getElementById('tf-save').addEventListener('click', () => saveTask(task?.id));
        if (isEdit) {
          document.getElementById('tf-complete').addEventListener('click', () => markComplete(task.id));
          document.getElementById('tf-delete').addEventListener('click', () => deleteTask(task.id));
          loadTaskComments(task.id);
          loadTaskDependencies(task.id);
        }
      }
    });
  }

  function taskForm(task) {
    const t = task || {};
    const depOptions = allTasks.filter(at => at.id !== task?.id).map(at => `<option value="${at.id}" ${(t.dependencies||[]).includes(at.id) ? 'selected' : ''}>${at.title}</option>`).join('');

    return `
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="details">DETAILS</button>
        <button class="tab-btn" data-tab="deps">DEPENDENCIES</button>
        ${task ? `<button class="tab-btn" data-tab="comments">COMMENTS</button>` : ''}
        ${task ? `<button class="tab-btn" data-tab="history">HISTORY</button>` : ''}
      </div>

      <div class="tab-panel active" id="tab-details">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">TITLE *</label>
            <input class="form-input" id="tf-title" value="${t.title || ''}" placeholder="Task title" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">DESCRIPTION</label>
            <textarea class="form-textarea" id="tf-desc" rows="3">${t.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">AREA</label>
            <select class="form-select" id="tf-area">
              ${AREAS.filter(a => a !== 'All Areas').map(a => `<option ${t.area === a ? 'selected' : ''}>${a}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">PRIORITY</label>
            <select class="form-select" id="tf-priority">
              <option ${t.priority === 'Critical' ? 'selected' : ''}>Critical</option>
              <option ${t.priority === 'High' ? 'selected' : ''}>High</option>
              <option ${(!t.priority || t.priority === 'Medium') ? 'selected' : ''}>Medium</option>
              <option ${t.priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">OWNER</label>
            <select class="form-select" id="tf-owner">
              <option value="">Unassigned</option>
              ${USERS.map(u => `<option ${t.owner === u ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">BACKUP OWNER</label>
            <select class="form-select" id="tf-backup">
              <option value="">None</option>
              ${USERS.map(u => `<option ${t.backupOwner === u ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">STATUS</label>
            <select class="form-select" id="tf-status">
              ${['Not Started','In Progress','Waiting','Blocked','Completed','Archived'].map(s => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">DUE DATE</label>
            <input type="date" class="form-input" id="tf-due" value="${t.dueDate || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">ESTIMATED HOURS</label>
            <input type="number" class="form-input" id="tf-est" value="${t.estimatedHours || ''}" min="0" step="0.5" />
          </div>
          <div class="form-group">
            <label class="form-label">ACTUAL HOURS</label>
            <input type="number" class="form-input" id="tf-actual" value="${t.actualHours || ''}" min="0" step="0.5" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">NOTES</label>
            <textarea class="form-textarea" id="tf-notes">${t.notes || ''}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">GOOGLE DRIVE LINK</label>
            <input class="form-input" id="tf-drive" value="${t.driveLink || ''}" placeholder="https://drive.google.com/..." />
          </div>
        </div>
      </div>

      <div class="tab-panel" id="tab-deps">
        <div style="margin-bottom:12px">
          <label class="form-label">THIS TASK DEPENDS ON (must complete first)</label>
          <select multiple class="form-select" id="tf-deps" style="height:160px;margin-top:6px">
            ${depOptions}
          </select>
          <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted);margin-top:6px">Hold Ctrl/Cmd to select multiple</div>
        </div>
        <div id="dep-chain-viz" style="margin-top:16px"></div>
      </div>

      ${task ? `
      <div class="tab-panel" id="tab-comments">
        <div class="comment-list" id="task-comments">
          <div class="loading-spinner"></div>
        </div>
        <div class="comment-input-row">
          <textarea class="comment-input" id="new-comment" placeholder="Add a comment..." rows="2"></textarea>
          <button class="btn btn-primary btn-sm" id="post-comment">POST</button>
        </div>
      </div>

      <div class="tab-panel" id="tab-history">
        <div id="task-history"><div class="loading-spinner"></div></div>
      </div>
      ` : ''}

      <div class="form-actions" style="flex-wrap:wrap">
        ${task ? `
          <button class="btn btn-danger btn-sm" id="tf-delete">DELETE</button>
          <button class="btn btn-success btn-sm" id="tf-complete">✓ MARK COMPLETE</button>
        ` : ''}
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="tf-save">${task ? 'SAVE CHANGES' : 'CREATE TASK'}</button>
      </div>
    `;
  }

  // After modal opens, wire up tabs
  document.addEventListener('click', e => {
    if (e.target.classList.contains('tab-btn')) {
      const tabBar = e.target.closest('.tab-bar');
      if (!tabBar) return;
      const modal = tabBar.closest('.modal-body');
      if (!modal) return;
      tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      const panel = modal.querySelector(`#tab-${e.target.dataset.tab}`);
      if (panel) panel.classList.add('active');
    }
    if (e.target.id === 'post-comment') {
      postComment();
    }
  });

  async function saveTask(taskId) {
    const title = document.getElementById('tf-title')?.value?.trim();
    if (!title) { toast('Title is required', 'warning'); return; }

    const deps = Array.from(document.getElementById('tf-deps')?.selectedOptions || []).map(o => o.value);
    const p = window.MFCC.userProfile;

    const data = {
      title,
      description: document.getElementById('tf-desc')?.value || '',
      area: document.getElementById('tf-area')?.value || 'General',
      priority: document.getElementById('tf-priority')?.value || 'Medium',
      owner: document.getElementById('tf-owner')?.value || '',
      backupOwner: document.getElementById('tf-backup')?.value || '',
      status: document.getElementById('tf-status')?.value || 'Not Started',
      dueDate: document.getElementById('tf-due')?.value || '',
      estimatedHours: parseFloat(document.getElementById('tf-est')?.value) || 0,
      actualHours: parseFloat(document.getElementById('tf-actual')?.value) || 0,
      notes: document.getElementById('tf-notes')?.value || '',
      driveLink: document.getElementById('tf-drive')?.value || '',
      dependencies: deps,
      updatedAt: serverTimestamp(),
      updatedBy: p.uid
    };

    try {
      if (taskId) {
        await updateDoc(doc(db, 'tasks', taskId), data);
        await logActivity('updated task', { title });
        toast('Task updated!', 'success');
      } else {
        data.createdAt = serverTimestamp();
        data.createdBy = p.uid;
        await addDoc(collection(db, 'tasks'), data);
        await logActivity('created task', { title });
        toast('Task created!', 'success');
      }
      closeModal();
      window.MFCC.updateBadges();
    } catch (e) {
      toast('Error: ' + e.message, 'error');
    }
  }

  async function markComplete(taskId) {
    const { confirm } = window.MFCC;
    confirm('Mark this task as Completed?', async () => {
      const p = window.MFCC.userProfile;
      const task = allTasks.find(t => t.id === taskId);
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'Completed',
        completedAt: serverTimestamp(),
        completedBy: p.uid,
        updatedAt: serverTimestamp()
      });
      await logActivity('completed task', { title: task?.title });
      toast('Task completed! ✓', 'success');
      closeModal();
      window.MFCC.updateBadges();
    });
  }

  async function deleteTask(taskId) {
    const { confirm } = window.MFCC;
    const task = allTasks.find(t => t.id === taskId);
    confirm(`Delete "${task?.title}"? This cannot be undone.`, async () => {
      await deleteDoc(doc(db, 'tasks', taskId));
      await logActivity('deleted task', { title: task?.title });
      toast('Task deleted', 'info');
      closeModal();
    });
  }

  async function loadTaskComments(taskId) {
    const el = document.getElementById('task-comments');
    if (!el) return;
    try {
      const snap = await getDocs(query(collection(db, `tasks/${taskId}/comments`), orderBy('timestamp')));
      const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (comments.length === 0) {
        el.innerHTML = `<div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);text-align:center;padding:20px">No comments yet</div>`;
        return;
      }
      el.innerHTML = comments.map(c => `
        <div class="comment">
          <div class="comment-avatar">${(c.userName || 'U')[0].toUpperCase()}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author">${c.userName || 'Unknown'}</span>
              <span class="comment-time">${c.timestamp ? window.MFCC.timeAgo(c.timestamp) : ''}</span>
            </div>
            <div class="comment-text">${c.text}</div>
          </div>
        </div>
      `).join('');
    } catch (e) { el.innerHTML = '<div style="color:var(--accent-red);font-size:0.8rem">Error loading comments</div>'; }

    async function postComment() {
      const text = document.getElementById('new-comment')?.value?.trim();
      if (!text) return;
      const p = window.MFCC.userProfile;
      await addDoc(collection(db, `tasks/${taskId}/comments`), {
        text,
        userId: p.uid,
        userName: p.displayName || p.email,
        timestamp: serverTimestamp()
      });
      document.getElementById('new-comment').value = '';
      loadTaskComments(taskId);
    }
    window._postComment = postComment;
  }

  async function postComment() {
    if (window._postComment) window._postComment();
  }

  async function loadTaskDependencies(taskId) {
    const viz = document.getElementById('dep-chain-viz');
    if (!viz) return;
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.dependencies?.length) {
      viz.innerHTML = `<div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted)">No dependencies set</div>`;
      return;
    }
    const deps = task.dependencies.map(id => allTasks.find(t => t.id === id)).filter(Boolean);
    viz.innerHTML = `
      <div class="form-label" style="margin-bottom:8px">DEPENDENCY STATUS</div>
      ${deps.map(d => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--bg-base);border-radius:4px;margin-bottom:4px">
          <span style="font-size:0.82rem">${d.title}</span>
          <span class="badge ${statusBadgeClass(d.status)}">${d.status}</span>
        </div>
      `).join('')}
      ${deps.some(d => d.status !== 'Completed') ? `<div style="margin-top:8px;padding:8px;background:var(--accent-amber-dim);border:1px solid var(--accent-amber);border-radius:4px;font-family:var(--font-mono);font-size:0.62rem;color:var(--accent-amber)">⚠ BLOCKED: Dependencies not complete</div>` : `<div style="margin-top:8px;padding:8px;background:var(--accent-green-dim);border:1px solid rgba(0,255,136,0.3);border-radius:4px;font-family:var(--font-mono);font-size:0.62rem;color:var(--accent-green)">✓ All dependencies complete</div>`}
    `;
  }

  function generateTaskReport() {
    const now = new Date().toISOString().split('T')[0];
    const overdue = allTasks.filter(t => t.dueDate && t.dueDate < now && !['Completed','Archived'].includes(t.status));
    const byOwner = {};
    allTasks.forEach(t => {
      const o = t.owner || 'Unassigned';
      if (!byOwner[o]) byOwner[o] = { total: 0, done: 0, overdue: 0 };
      byOwner[o].total++;
      if (t.status === 'Completed') byOwner[o].done++;
      if (t.dueDate && t.dueDate < now && t.status !== 'Completed') byOwner[o].overdue++;
    });

    showModal('TASK ACCOUNTABILITY REPORT', `
      <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);margin-bottom:16px">Generated ${now}</div>
      <div class="section-divider" style="margin-bottom:12px"><span class="section-divider-label">BY OWNER</span><div class="section-divider-line"></div></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>OWNER</th><th>TOTAL</th><th>DONE</th><th>COMPLETION</th><th>OVERDUE</th></tr></thead>
          <tbody>
            ${Object.entries(byOwner).map(([owner, stats]) => `
              <tr>
                <td>${owner}</td>
                <td>${stats.total}</td>
                <td>${stats.done}</td>
                <td><span style="color:${stats.done/stats.total >= 0.8 ? 'var(--accent-green)' : 'var(--accent-amber)'}">${Math.round(stats.done/stats.total*100)}%</span></td>
                <td><span style="color:${stats.overdue > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}">${stats.overdue}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="section-divider" style="margin:16px 0 12px"><span class="section-divider-label">OVERDUE (${overdue.length})</span><div class="section-divider-line"></div></div>
      ${overdue.length === 0 ? '<div style="color:var(--accent-green);font-family:var(--font-mono);font-size:0.7rem">✓ No overdue tasks!</div>' :
        `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>TASK</th><th>OWNER</th><th>DUE</th><th>PRIORITY</th></tr></thead>
          <tbody>${overdue.map(t => `<tr><td>${t.title}</td><td>${t.owner||'—'}</td><td style="color:var(--accent-red)">${t.dueDate}</td><td>${t.priority}</td></tr>`).join('')}</tbody>
        </table></div>`
      }
    `);
  }
}

function statusBadgeClass(status) {
  const map = { 'Completed': 'badge-green', 'In Progress': 'badge-cyan', 'Not Started': 'badge-gray', 'Blocked': 'badge-red', 'Waiting': 'badge-yellow', 'Archived': 'badge-gray' };
  return map[status] || 'badge-gray';
}
