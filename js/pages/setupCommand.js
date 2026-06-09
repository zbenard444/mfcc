// ═══════════════════════════════════════════════════════════════════════════
// SETUP COMMAND PAGE — Real-time Setup Day Dashboard
// ═══════════════════════════════════════════════════════════════════════════

export async function renderSetupCommand(el) {
  const { db, collection, getDocs, query, where, calcReadiness, toast } = window.MFCC;

  let clockInterval, refreshInterval;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">REAL-TIME OPERATIONS</span>
        <h1 class="page-title">SETUP COMMAND</h1>
      </div>
      <div class="page-actions">
        <span class="badge badge-cyan" id="sc-phase">PHASE: LOADING</span>
      </div>
    </div>

    <!-- Clock + Phase -->
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card card-accent-top card-accent-cyan" style="text-align:center">
        <div class="command-clock" id="sc-clock">00:00:00</div>
        <div class="command-date" id="sc-date">—</div>
      </div>
      <div class="card card-accent-top card-accent-amber" style="display:flex;align-items:center;justify-content:center;text-align:center">
        <div>
          <div class="card-title">CURRENT PHASE</div>
          <div class="phase-indicator" id="sc-phase-display">LOADING...</div>
          <div style="margin-top:10px">
            <select class="form-select" id="sc-phase-select" style="width:240px">
              <option>Pre-Setup (Day Before)</option>
              <option>Early Morning Setup (6-9am)</option>
              <option>Morning Build (9am-12pm)</option>
              <option>Afternoon Build (12-3pm)</option>
              <option>Final Prep (3-5pm)</option>
              <option>Event Open</option>
              <option>Teardown</option>
            </select>
            <button class="btn btn-primary btn-sm" style="margin-top:8px" id="sc-set-phase">SET PHASE</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="card card-accent-top" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="card-title">OVERALL READINESS</div>
        <span id="sc-overall-pct" style="font-family:var(--font-display);font-size:1.4rem;font-weight:900">—%</span>
      </div>
      <div class="readiness-bar-track" style="height:20px">
        <div id="sc-readiness-bar" class="readiness-bar-fill" style="width:0%"></div>
      </div>
    </div>

    <!-- Priority Tasks + Assignments -->
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card card-accent-top card-accent-red">
        <div class="card-title">🎯 PRIORITY NOW</div>
        <div id="sc-priority-tasks">
          <div class="loading-spinner"></div>
        </div>
      </div>
      <div class="card card-accent-top">
        <div class="card-title">👥 CURRENT ASSIGNMENTS</div>
        <div id="sc-assignments">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>

    <!-- Area Progress Grid -->
    <div class="section-divider"><span class="section-divider-label">AREA PROGRESS</span><div class="section-divider-line"></div></div>
    <div class="grid-auto" id="sc-areas" style="margin-bottom:20px">
      <div class="skeleton" style="height:80px"></div>
    </div>

    <!-- Blocked Tasks -->
    <div class="section-divider"><span class="section-divider-label">BLOCKED / FALLING BEHIND</span><div class="section-divider-line"></div></div>
    <div id="sc-blocked" class="card card-accent-top card-accent-red" style="margin-bottom:20px">
      <div class="loading-spinner"></div>
    </div>

    <!-- Meal / Break Schedule -->
    <div class="section-divider"><span class="section-divider-label">BREAK SCHEDULE</span><div class="section-divider-line"></div></div>
    <div class="card card-accent-top" style="margin-bottom:20px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${[
          { time: '9:00 AM', label: 'MORNING SNACK' },
          { time: '12:00 PM', label: 'LUNCH BREAK' },
          { time: '3:00 PM', label: 'AFTERNOON BREAK' },
          { time: '5:30 PM', label: 'PRE-EVENT MEAL' }
        ].map(b => `
          <div style="padding:12px 20px;background:var(--bg-elevated);border:1px solid var(--border-soft);border-radius:var(--radius-md);text-align:center">
            <div style="font-family:var(--font-display);font-size:1rem;color:var(--accent-cyan)">${b.time}</div>
            <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted);margin-top:4px">${b.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Clock
  function updateClock() {
    const now = new Date();
    const clock = document.getElementById('sc-clock');
    const dateEl = document.getElementById('sc-date');
    if (clock) clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  document.getElementById('sc-set-phase').addEventListener('click', () => {
    const phase = document.getElementById('sc-phase-select')?.value;
    const display = document.getElementById('sc-phase-display');
    const badge = document.getElementById('sc-phase');
    if (display) display.textContent = phase.toUpperCase();
    if (badge) badge.textContent = `PHASE: ${phase.split('(')[0].trim().toUpperCase()}`;
    toast(`Phase set: ${phase}`, 'success');
  });

  async function loadData() {
    const { calcReadiness } = window.MFCC;
    try {
      const [tasksSnap, areasSnap] = await Promise.all([
        getDocs(collection(db, 'tasks')),
        getDocs(collection(db, 'areas'))
      ]);
      const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const areas = areasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const now = new Date().toISOString().split('T')[0];

      // Readiness
      const readiness = await calcReadiness();
      const pctEl = document.getElementById('sc-overall-pct');
      const barEl = document.getElementById('sc-readiness-bar');
      if (pctEl) pctEl.textContent = `${readiness.overall}%`;
      if (barEl) {
        barEl.style.width = `${readiness.overall}%`;
        const c = readiness.overall >= 80 ? 'var(--accent-green)' : readiness.overall >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
        barEl.style.background = c;
      }

      // Priority tasks (critical/overdue, not done)
      const priorityEl = document.getElementById('sc-priority-tasks');
      const priority = tasks.filter(t => (t.priority === 'Critical' || (t.dueDate && t.dueDate <= now)) && !['Completed','Archived'].includes(t.status)).slice(0,5);
      if (priorityEl) {
        priorityEl.innerHTML = priority.length === 0
          ? `<div style="color:var(--accent-green);font-family:var(--font-mono);font-size:0.7rem;text-align:center;padding:12px">✓ NO CRITICAL ISSUES</div>`
          : priority.map(t => `
            <div style="padding:8px 0;border-bottom:1px solid var(--border-dim);display:flex;justify-content:space-between">
              <div>
                <div style="font-size:0.85rem;font-weight:600">${t.title}</div>
                <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted)">${t.owner || 'Unassigned'} · ${t.area || 'General'}</div>
              </div>
              <span class="badge ${t.priority === 'Critical' ? 'badge-red' : 'badge-yellow'}">${t.priority}</span>
            </div>
          `).join('');
      }

      // Assignments — who's doing what
      const assignEl = document.getElementById('sc-assignments');
      const assignMap = {};
      tasks.filter(t => t.status === 'In Progress' && t.owner).forEach(t => {
        if (!assignMap[t.owner]) assignMap[t.owner] = [];
        assignMap[t.owner].push(t);
      });
      if (assignEl) {
        if (Object.keys(assignMap).length === 0) {
          assignEl.innerHTML = `<div style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.7rem;text-align:center;padding:12px">No tasks marked "In Progress"</div>`;
        } else {
          assignEl.innerHTML = Object.entries(assignMap).map(([owner, ownTasks]) => `
            <div style="margin-bottom:10px">
              <div style="font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px">
                <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-cyan);display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:var(--bg-void);font-weight:700">${owner[0]}</div>
                ${owner}
              </div>
              ${ownTasks.slice(0,2).map(t => `<div style="font-size:0.78rem;color:var(--text-muted);padding-left:32px">• ${t.title}</div>`).join('')}
              ${ownTasks.length > 2 ? `<div style="font-size:0.72rem;color:var(--text-muted);padding-left:32px">+${ownTasks.length-2} more</div>` : ''}
            </div>
          `).join('');
        }
      }

      // Area progress
      const areasEl = document.getElementById('sc-areas');
      if (areasEl) {
        areasEl.innerHTML = areas.map(area => {
          const areaTasks = tasks.filter(t => t.area === area.name);
          const doneTasks = areaTasks.filter(t => t.status === 'Completed').length;
          const pct = areaTasks.length > 0 ? Math.round(doneTasks / areaTasks.length * 100) : (area.readiness || 0);
          const color = pct >= 80 ? 'var(--accent-green)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';
          return `
            <div class="card" style="padding:14px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:0.85rem;font-weight:600">${area.icon || '◈'} ${area.name}</span>
                <span style="font-family:var(--font-display);font-size:0.85rem;color:${color}">${pct}%</span>
              </div>
              <div class="readiness-bar-track" style="height:6px">
                <div class="readiness-bar-fill" style="width:${pct}%;background:${color}"></div>
              </div>
            </div>
          `;
        }).join('') || `<div class="empty-state" style="grid-column:1/-1">No areas set up yet</div>`;
      }

      // Blocked tasks
      const blockedEl = document.getElementById('sc-blocked');
      const blocked = tasks.filter(t => t.status === 'Blocked' || (t.dueDate && t.dueDate < now && !['Completed','Archived'].includes(t.status)));
      if (blockedEl) {
        if (blocked.length === 0) {
          blockedEl.innerHTML = `<div style="color:var(--accent-green);font-family:var(--font-mono);font-size:0.7rem;text-align:center;padding:12px">✓ NO BLOCKED TASKS</div>`;
        } else {
          blockedEl.innerHTML = `<div class="card-title">⚠ ${blocked.length} TASK(S) NEED ATTENTION</div>` +
            blocked.slice(0,8).map(t => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-dim)">
                <div>
                  <div style="font-size:0.87rem">${t.title}</div>
                  <div style="font-family:var(--font-mono);font-size:0.6rem;color:var(--text-muted)">${t.owner || 'Unassigned'}</div>
                </div>
                <span class="badge ${t.status === 'Blocked' ? 'badge-red' : 'badge-yellow'}">${t.status === 'Blocked' ? 'BLOCKED' : 'OVERDUE'}</span>
              </div>
            `).join('');
        }
      }
    } catch (e) { console.error(e); toast('Error loading setup data', 'error'); }
  }

  await loadData();
  refreshInterval = setInterval(loadData, 60000); // Auto-refresh every minute
  window.MFCC.unsubscribers.push(() => { clearInterval(clockInterval); clearInterval(refreshInterval); });
}
