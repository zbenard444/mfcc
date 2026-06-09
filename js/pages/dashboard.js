// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════

export async function renderDashboard(el) {
  const { db, collection, query, where, orderBy, limit, onSnapshot,
    getDocs, formatDate, formatDateTime, timeAgo, calcReadiness,
    toast, navigateTo, formatRelativeDate } = window.MFCC;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">MILLENNIUM FALCON COMMAND CENTER</span>
        <h1 class="page-title">MISSION CONTROL</h1>
      </div>
      <div class="page-actions">
        <span id="dash-event-year" style="font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em"></span>
      </div>
    </div>

    <!-- COUNTDOWN + READINESS ROW -->
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card card-accent-top card-accent-cyan" id="countdown-card">
        <div class="card-title">⏱ DAYS UNTIL MAY 4TH</div>
        <div id="countdown-display" class="countdown-display">
          <div class="countdown-unit">
            <span class="countdown-number" id="cd-days">—</span>
            <span class="countdown-label">DAYS</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-unit">
            <span class="countdown-number" id="cd-hours">—</span>
            <span class="countdown-label">HRS</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-unit">
            <span class="countdown-number" id="cd-mins">—</span>
            <span class="countdown-label">MIN</span>
          </div>
        </div>
        <div class="card-sub" id="countdown-sub">Calculating...</div>
      </div>

      <div class="card card-accent-top card-accent-green" id="readiness-card">
        <div class="card-title">◉ OVERALL EVENT READINESS</div>
        <div style="display:flex;align-items:center;gap:24px">
          <div>
            <div class="card-value" id="readiness-pct" style="color:var(--accent-green)">—%</div>
            <div class="card-sub" id="readiness-level">Loading...</div>
          </div>
          <div style="flex:1">
            <div id="readiness-main-bar" class="readiness-meter">
              <div class="readiness-bar-track" style="height:20px">
                <div class="readiness-bar-fill" id="readiness-fill" style="width:0%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS ROW -->
    <div class="grid-4" style="margin-bottom:20px" id="stats-row">
      <div class="card" id="stat-open"><div class="card-title">OPEN TASKS</div><div class="card-value">—</div><div class="card-sub">active</div></div>
      <div class="card" id="stat-overdue"><div class="card-title">⚠ OVERDUE</div><div class="card-value" style="color:var(--accent-red)">—</div><div class="card-sub">past due</div></div>
      <div class="card" id="stat-critical"><div class="card-title">🔴 CRITICAL</div><div class="card-value" style="color:var(--accent-amber)">—</div><div class="card-sub">blockers</div></div>
      <div class="card" id="stat-complete"><div class="card-title">✓ COMPLETE</div><div class="card-value" style="color:var(--accent-green)">—</div><div class="card-sub">done</div></div>
    </div>

    <!-- READINESS BREAKDOWN -->
    <div style="margin-bottom:20px">
      <div class="section-divider">
        <span class="section-divider-label">AREA READINESS</span>
        <div class="section-divider-line"></div>
      </div>
      <div class="card card-accent-top">
        <div id="readiness-breakdown" style="display:flex;flex-direction:column;gap:10px">
          <div class="skeleton" style="height:24px"></div>
          <div class="skeleton" style="height:24px"></div>
          <div class="skeleton" style="height:24px"></div>
        </div>
      </div>
    </div>

    <!-- MAIN 3-COLUMN LAYOUT -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:20px" id="main-cols">

      <!-- TODAY'S WORK LIST -->
      <div>
        <div class="section-divider">
          <span class="section-divider-label">TODAY'S WORK LIST</span>
          <div class="section-divider-line"></div>
        </div>
        <div class="card card-accent-top">
          <div id="todays-list">
            <div class="skeleton" style="height:60px;margin-bottom:8px"></div>
            <div class="skeleton" style="height:60px"></div>
          </div>
        </div>
      </div>

      <!-- CRITICAL ISSUES -->
      <div>
        <div class="section-divider">
          <span class="section-divider-label">CRITICAL ISSUES</span>
          <div class="section-divider-line"></div>
        </div>
        <div class="card card-accent-top card-accent-red">
          <div id="critical-list">
            <div class="skeleton" style="height:60px;margin-bottom:8px"></div>
          </div>
        </div>
      </div>

      <!-- RECENT ACTIVITY -->
      <div>
        <div class="section-divider">
          <span class="section-divider-label">RECENT ACTIVITY</span>
          <div class="section-divider-line"></div>
        </div>
        <div class="card card-accent-top">
          <div class="activity-feed" id="activity-feed">
            <div class="skeleton" style="height:40px;margin-bottom:8px"></div>
            <div class="skeleton" style="height:40px"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- UPCOMING MILESTONES + BUDGET + ALERTS -->
    <div class="grid-3" style="margin-bottom:20px">

      <div>
        <div class="section-divider">
          <span class="section-divider-label">UPCOMING MILESTONES</span>
          <div class="section-divider-line"></div>
        </div>
        <div class="card card-accent-top">
          <div id="milestone-list"><div class="skeleton" style="height:48px"></div></div>
        </div>
      </div>

      <div>
        <div class="section-divider">
          <span class="section-divider-label">BUDGET STATUS</span>
          <div class="section-divider-line"></div>
        </div>
        <div class="card card-accent-top">
          <div id="budget-status"><div class="skeleton" style="height:48px"></div></div>
        </div>
      </div>

      <div>
        <div class="section-divider">
          <span class="section-divider-label">INVENTORY ALERTS</span>
          <div class="section-divider-line"></div>
        </div>
        <div class="card card-accent-top card-accent-amber">
          <div id="inventory-alerts"><div class="skeleton" style="height:48px"></div></div>
        </div>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="section-divider">
      <span class="section-divider-label">QUICK ACTIONS</span>
      <div class="section-divider-line"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
      <button class="btn btn-primary" onclick="window.MFCC.openQuickTask()">+ Add Task</button>
      <button class="btn btn-secondary" onclick="window.MFCC.navigateTo('tasks')">View All Tasks</button>
      <button class="btn btn-secondary" onclick="window.MFCC.navigateTo('setup-command')">⚡ Setup Command</button>
      <button class="btn btn-secondary" onclick="window.MFCC.navigateTo('inventory')">◻ Inventory</button>
      <button class="btn btn-secondary" onclick="window.MFCC.navigateTo('stopwatch')">⏱ Build Timer</button>
      <button class="btn btn-amber" onclick="window.MFCC.navigateTo('reports')">◫ Generate Report</button>
    </div>
  `;

  // Countdown
  updateCountdown();
  const countdownTimer = setInterval(updateCountdown, 60000);

  // Year label
  const nextMay4 = getNextMay4();
  document.getElementById('dash-event-year').textContent = `STAR WARS DAY ${nextMay4.getFullYear()} — EVENT #${nextMay4.getFullYear() - 2014}`;

  // Load all data
  await Promise.all([
    loadTaskStats(),
    loadReadiness(),
    loadActivityFeed(),
    loadMilestones(),
    loadBudgetStatus(),
    loadInventoryAlerts()
  ]);

  // Realtime task updates
  const unsub = onSnapshot(
    query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'), limit(100)),
    () => { loadTaskStats(); loadTodaysList(); }
  );
  window.MFCC.unsubscribers.push(unsub);
  window.MFCC.unsubscribers.push(() => clearInterval(countdownTimer));

  // Quick task modal
  window.MFCC.openQuickTask = () => {
    const { showModal } = window.MFCC;
    showModal('QUICK ADD TASK', quickTaskForm());
    document.getElementById('qtask-save').addEventListener('click', saveQuickTask);
  };
}

function getNextMay4() {
  const now = new Date();
  const may4 = new Date(now.getFullYear(), 4, 4); // Month is 0-indexed
  if (now > may4) may4.setFullYear(may4.getFullYear() + 1);
  return may4;
}

function updateCountdown() {
  const may4 = getNextMay4();
  const now = new Date();
  const diff = may4 - now;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMins = document.getElementById('cd-mins');
  const sub = document.getElementById('countdown-sub');

  if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
  if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
  if (cdMins) cdMins.textContent = String(mins).padStart(2, '0');
  if (sub) sub.textContent = `May 4th, ${may4.getFullYear()} — ${may4.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
}

async function loadTaskStats() {
  const { db, collection, getDocs, where, query } = window.MFCC;
  try {
    const snap = await getDocs(collection(db, 'tasks'));
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const now = new Date().toISOString().split('T')[0];

    const open = tasks.filter(t => ['Not Started', 'In Progress', 'Blocked', 'Waiting'].includes(t.status));
    const overdue = tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'Completed' && t.status !== 'Archived');
    const critical = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed');
    const complete = tasks.filter(t => t.status === 'Completed');

    const statOpen = document.getElementById('stat-open');
    const statOverdue = document.getElementById('stat-overdue');
    const statCritical = document.getElementById('stat-critical');
    const statComplete = document.getElementById('stat-complete');

    if (statOpen) statOpen.innerHTML = `<div class="card-title">OPEN TASKS</div><div class="card-value">${open.length}</div><div class="card-sub">active</div>`;
    if (statOverdue) statOverdue.innerHTML = `<div class="card-title">⚠ OVERDUE</div><div class="card-value" style="color:var(--accent-red)">${overdue.length}</div><div class="card-sub">past due</div>`;
    if (statCritical) statCritical.innerHTML = `<div class="card-title">🔴 CRITICAL</div><div class="card-value" style="color:var(--accent-amber)">${critical.length}</div><div class="card-sub">blockers</div>`;
    if (statComplete) statComplete.innerHTML = `<div class="card-title">✓ COMPLETE</div><div class="card-value" style="color:var(--accent-green)">${complete.length}</div><div class="card-sub">done</div>`;

    // Today's list — tasks due today or in progress
    loadTodaysList(tasks);

    // Critical list
    const critList = document.getElementById('critical-list');
    if (critList) {
      const critItems = [...overdue.slice(0,3), ...critical.filter(t => !overdue.includes(t)).slice(0,2)];
      if (critItems.length === 0) {
        critList.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-icon" style="font-size:1.5rem">✓</div><div class="empty-state-title" style="font-size:0.75rem">NO CRITICAL ISSUES</div></div>`;
      } else {
        critList.innerHTML = critItems.map(t => `
          <div class="task-item priority-${t.priority?.toLowerCase().replace(' ','-')} overdue-flag" style="margin-bottom:6px" onclick="window.MFCC.navigateTo('tasks')">
            <div class="task-priority-bar"></div>
            <div class="task-content">
              <div class="task-title">${t.title}</div>
              <div class="task-meta">
                <span class="task-meta-item">◈ ${t.area || 'General'}</span>
                ${t.dueDate ? `<span class="task-meta-item" style="color:var(--accent-red)">${window.MFCC.formatRelativeDate(t.dueDate)}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (e) { console.error(e); }
}

function loadTodaysList(tasks) {
  const list = document.getElementById('todays-list');
  if (!list) return;
  const now = new Date().toISOString().split('T')[0];
  const todayItems = (tasks || []).filter(t =>
    (t.dueDate === now || t.status === 'In Progress') &&
    t.status !== 'Completed' && t.status !== 'Archived'
  ).slice(0, 5);

  if (todayItems.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-icon" style="font-size:1.5rem">◎</div><div class="empty-state-title" style="font-size:0.75rem">ALL CLEAR</div><div class="empty-state-text" style="font-size:0.7rem">No tasks due today</div></div>`;
  } else {
    list.innerHTML = todayItems.map(t => `
      <div class="task-item priority-${(t.priority||'').toLowerCase()}" style="margin-bottom:6px" onclick="window.MFCC.navigateTo('tasks')">
        <div class="task-priority-bar"></div>
        <div class="task-content">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            <span class="task-meta-item">👤 ${t.owner || 'Unassigned'}</span>
            <span class="task-meta-item">◈ ${t.area || 'General'}</span>
          </div>
        </div>
        <span class="badge ${statusBadgeClass(t.status)}">${t.status}</span>
      </div>
    `).join('');
  }
}

async function loadReadiness() {
  const { calcReadiness } = window.MFCC;
  try {
    const result = await calcReadiness();
    const pct = result.overall;

    const pctEl = document.getElementById('readiness-pct');
    const levelEl = document.getElementById('readiness-level');
    const fillEl = document.getElementById('readiness-fill');
    const readCard = document.getElementById('readiness-card');

    if (pctEl) pctEl.textContent = `${pct}%`;

    let color, levelText;
    if (pct >= 80) { color = 'var(--accent-green)'; levelText = '✓ GREEN — READY TO LAUNCH'; }
    else if (pct >= 50) { color = 'var(--accent-amber)'; levelText = '⚠ YELLOW — WORK NEEDED'; }
    else { color = 'var(--accent-red)'; levelText = '🔴 RED — CRITICAL ATTENTION'; }

    if (pctEl) pctEl.style.color = color;
    if (levelEl) levelEl.textContent = levelText;
    if (fillEl) { fillEl.style.width = `${pct}%`; fillEl.style.background = `linear-gradient(90deg, ${color}, ${color}aa)`; }

    // Breakdown bars
    const breakdown = document.getElementById('readiness-breakdown');
    if (breakdown && result.categories) {
      const cats = [
        { key: 'tasks', label: 'TASK COMPLETION' },
        { key: 'milestones', label: 'MILESTONES' },
        { key: 'inventory', label: 'INVENTORY' },
        { key: 'builds', label: 'BUILD MANUAL' },
        { key: 'food', label: 'FOOD PREP' },
        { key: 'safety', label: 'SAFETY / CRITICAL' }
      ];

      breakdown.innerHTML = cats.map(c => {
        const score = Math.round(result.categories[c.key]?.score || 0);
        let bColor;
        if (score >= 80) bColor = 'var(--accent-green)';
        else if (score >= 50) bColor = 'var(--accent-amber)';
        else bColor = 'var(--accent-red)';
        return `
          <div class="readiness-meter">
            <div class="readiness-label">
              <span class="readiness-name">${c.label}</span>
              <span class="readiness-pct" style="color:${bColor}">${score}%</span>
            </div>
            <div class="readiness-bar-track">
              <div class="readiness-bar-fill" style="width:${score}%;background:${bColor}"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) { console.error(e); }
}

async function loadActivityFeed() {
  const { db, collection, query, orderBy, limit, getDocs, timeAgo } = window.MFCC;
  try {
    const snap = await getDocs(query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(10)));
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (items.length === 0) {
      feed.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-text" style="font-size:0.7rem">No recent activity</div></div>`;
      return;
    }

    feed.innerHTML = items.map(a => {
      const dotClass = a.action?.includes('task') ? 'cyan' : a.action?.includes('delete') ? 'red' : a.action?.includes('complete') ? 'green' : '';
      return `
        <div class="activity-item">
          <div class="activity-dot ${dotClass}"></div>
          <div class="activity-text"><strong>${a.userName || 'User'}</strong> ${a.action} ${a.details?.title ? `"${a.details.title}"` : ''}</div>
          <div class="activity-time">${a.timestamp ? timeAgo(a.timestamp) : '—'}</div>
        </div>
      `;
    }).join('');
  } catch (e) { console.error(e); }
}

async function loadMilestones() {
  const { db, collection, getDocs, query, orderBy, formatDate } = window.MFCC;
  try {
    const snap = await getDocs(query(collection(db, 'milestones'), orderBy('dueDate')));
    const el = document.getElementById('milestone-list');
    if (!el) return;

    const now = new Date().toISOString().split('T')[0];
    const upcoming = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.dueDate >= now && m.status !== 'Completed').slice(0, 5);

    if (upcoming.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-text" style="font-size:0.7rem">No upcoming milestones</div></div>`;
    } else {
      el.innerHTML = upcoming.map(m => {
        const diff = Math.ceil((new Date(m.dueDate) - new Date()) / 86400000);
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-dim)">
            <div>
              <div style="font-size:0.85rem;font-weight:600">${m.title}</div>
              <div style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">${m.dueDate}</div>
            </div>
            <span class="badge ${diff <= 7 ? 'badge-red' : diff <= 30 ? 'badge-yellow' : 'badge-cyan'}">${diff}d</span>
          </div>
        `;
      }).join('');
    }
  } catch (e) { console.error(e); }
}

async function loadBudgetStatus() {
  const { db, collection, getDocs } = window.MFCC;
  try {
    const snap = await getDocs(collection(db, 'budget'));
    const el = document.getElementById('budget-status');
    if (!el) return;

    let totalBudget = 0, totalSpent = 0;
    snap.docs.forEach(d => {
      const data = d.data();
      totalBudget += data.budget || 0;
      totalSpent += data.actual || 0;
    });

    const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const remaining = totalBudget - totalSpent;
    const statusClass = pct >= 100 ? 'budget-over' : pct >= 80 ? 'budget-warn' : 'budget-ok';
    const barColor = pct >= 100 ? 'var(--accent-red)' : pct >= 80 ? 'var(--accent-amber)' : 'var(--accent-green)';

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted)">SPENT</span>
        <span style="font-family:var(--font-display);font-size:0.8rem;font-weight:700">$${totalSpent.toLocaleString()} / $${totalBudget.toLocaleString()}</span>
      </div>
      <div class="budget-track" style="height:10px;background:var(--bg-deep);border-radius:5px;overflow:hidden;border:1px solid var(--border-dim)">
        <div class="budget-fill" style="width:${Math.min(pct,100)}%;height:100%;background:${barColor};border-radius:5px;transition:width 0.6s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <span style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted)">${pct}% used</span>
        <span style="font-family:var(--font-mono);font-size:0.6rem;color:${remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">$${Math.abs(remaining).toLocaleString()} ${remaining >= 0 ? 'remaining' : 'over budget'}</span>
      </div>
      <div style="margin-top:10px;text-align:center">
        <button class="btn btn-secondary btn-sm" onclick="window.MFCC.navigateTo('budget')">VIEW BUDGET</button>
      </div>
    `;
  } catch (e) {
    const el = document.getElementById('budget-status');
    if (el) el.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-text">No budget data yet</div></div>`;
  }
}

async function loadInventoryAlerts() {
  const { db, collection, getDocs, where, query } = window.MFCC;
  try {
    const snap = await getDocs(collection(db, 'inventory'));
    const el = document.getElementById('inventory-alerts');
    if (!el) return;

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const alerts = items.filter(i => i.status === 'Needs Repair' || i.status === 'Missing');

    if (alerts.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-state-icon" style="font-size:1.5rem">✓</div><div class="empty-state-title" style="font-size:0.75rem">INVENTORY OK</div></div>`;
    } else {
      el.innerHTML = alerts.slice(0,5).map(i => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-dim)">
          <div style="font-size:0.83rem">${i.name}</div>
          <span class="badge ${i.status === 'Missing' ? 'badge-red' : 'badge-yellow'}">${i.status}</span>
        </div>
      `).join('') + (alerts.length > 5 ? `<div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted);padding-top:8px">+${alerts.length-5} more alerts</div>` : '');
    }
  } catch (e) { console.error(e); }
}

function statusBadgeClass(status) {
  const map = {
    'Completed': 'badge-green',
    'In Progress': 'badge-cyan',
    'Not Started': 'badge-gray',
    'Blocked': 'badge-red',
    'Waiting': 'badge-yellow',
    'Archived': 'badge-gray'
  };
  return map[status] || 'badge-gray';
}

function quickTaskForm() {
  const p = window.MFCC.userProfile;
  const users = ['Tyson', 'Brad', 'Cayla', 'Liz', 'Zach'];
  const areas = ['Millennium Falcon Ramp','Millennium Falcon Interior','Photo Booth','Marketplace','Archway','Endor','Tie Fighter','Food','Parking','Signage','Storage','General'];
  return `
    <div class="form-grid">
      <div class="form-group full-width">
        <label class="form-label">TASK TITLE *</label>
        <input class="form-input" id="qtask-title" placeholder="What needs to be done?" />
      </div>
      <div class="form-group">
        <label class="form-label">PRIORITY</label>
        <select class="form-select" id="qtask-priority">
          <option>Medium</option><option>Critical</option><option>High</option><option>Low</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">AREA</label>
        <select class="form-select" id="qtask-area">
          ${areas.map(a => `<option>${a}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">OWNER</label>
        <select class="form-select" id="qtask-owner">
          ${users.map(u => `<option ${u === (p.displayName || '') ? 'selected' : ''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">DUE DATE</label>
        <input type="date" class="form-input" id="qtask-due" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
      <button class="btn btn-primary" id="qtask-save">CREATE TASK</button>
    </div>
  `;
}

async function saveQuickTask() {
  const { db, collection, addDoc, serverTimestamp, logActivity, toast, closeModal, updateBadges } = window.MFCC;
  const title = document.getElementById('qtask-title')?.value?.trim();
  if (!title) { toast('Please enter a task title', 'warning'); return; }

  try {
    const p = window.MFCC.userProfile;
    await addDoc(collection(db, 'tasks'), {
      title,
      priority: document.getElementById('qtask-priority')?.value || 'Medium',
      area: document.getElementById('qtask-area')?.value || 'General',
      owner: document.getElementById('qtask-owner')?.value || '',
      dueDate: document.getElementById('qtask-due')?.value || '',
      status: 'Not Started',
      description: '',
      notes: '',
      estimatedHours: 0,
      actualHours: 0,
      createdBy: p.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await logActivity('created task', { title });
    toast('Task created!', 'success');
    closeModal();
    updateBadges();
  } catch (e) {
    toast('Error creating task: ' + e.message, 'error');
  }
}
