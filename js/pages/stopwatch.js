// ═══════════════════════════════════════════════════════════════════════════
// STOPWATCH PAGE — Build Timers with Historical Tracking
// ═══════════════════════════════════════════════════════════════════════════

export async function renderStopwatch(el) {
  const { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp, toast, showModal, closeModal, logActivity } = window.MFCC;

  const DEFAULT_AREAS = [
    'Falcon Ramp', 'Falcon Interior', 'Marketplace', 'Photo Booth',
    'Endor', 'Lighting Setup', 'Sound Setup', 'Archway',
    'Tie Fighter', 'Social Area', 'Full Event Setup', 'Full Teardown'
  ];

  let timerState = { running: false, startTime: null, elapsed: 0, interval: null };
  let selectedArea = DEFAULT_AREAS[0];
  let timerType = 'Setup';
  let allRecords = [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">BUILD TIMING SYSTEM</span>
        <h1 class="page-title">BUILD TIMERS</h1>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:24px">
      <!-- Active Timer -->
      <div class="card card-accent-top card-accent-cyan">
        <div class="card-title">⏱ ACTIVE TIMER</div>
        <div class="stopwatch-display" id="sw-display">00:00:00</div>
        <div style="text-align:center;margin-top:8px">
          <select class="form-select" id="sw-area" style="width:220px;margin-bottom:10px">
            ${DEFAULT_AREAS.map(a => `<option>${a}</option>`).join('')}
          </select>
          <select class="form-select" id="sw-type" style="width:140px;margin-bottom:10px">
            <option>Setup</option>
            <option>Teardown</option>
            <option>Build</option>
          </select>
          <input class="form-input" id="sw-note" placeholder="Optional note..." style="margin-bottom:10px" />
        </div>
        <div class="stopwatch-controls">
          <button class="btn btn-primary" id="sw-start">▶ START</button>
          <button class="btn btn-secondary" id="sw-pause" disabled>⏸ PAUSE</button>
          <button class="btn btn-secondary" id="sw-reset" disabled>↺ RESET</button>
          <button class="btn btn-success" id="sw-save" disabled>✓ SAVE</button>
        </div>
      </div>

      <!-- Quick Add Historical -->
      <div class="card card-accent-top">
        <div class="card-title">📅 ADD HISTORICAL TIME</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">AREA</label>
            <select class="form-select" id="hist-area">
              ${DEFAULT_AREAS.map(a => `<option>${a}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">TYPE</label>
            <select class="form-select" id="hist-type">
              <option>Setup</option><option>Teardown</option><option>Build</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">HOURS</label>
            <input type="number" class="form-input" id="hist-hours" min="0" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">MINUTES</label>
            <input type="number" class="form-input" id="hist-mins" min="0" max="59" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">YEAR</label>
            <select class="form-select" id="hist-year">
              ${[2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026].map(y => `<option ${y === new Date().getFullYear() ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">NOTES</label>
            <input class="form-input" id="hist-note" placeholder="Optional notes" />
          </div>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary btn-full" id="hist-save">SAVE HISTORICAL TIME</button>
        </div>
      </div>
    </div>

    <!-- Records & Analysis -->
    <div class="section-divider"><span class="section-divider-label">TIMING RECORDS & ANALYSIS</span><div class="section-divider-line"></div></div>

    <div class="filter-bar" style="margin-bottom:16px">
      <select class="form-select" id="rec-area-filter" style="width:200px">
        <option value="All">All Areas</option>
        ${DEFAULT_AREAS.map(a => `<option>${a}</option>`).join('')}
      </select>
      <select class="form-select" id="rec-type-filter" style="width:140px">
        <option value="All">All Types</option>
        <option>Setup</option><option>Teardown</option><option>Build</option>
      </select>
    </div>

    <div id="timing-analysis" class="grid-3" style="margin-bottom:20px"></div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>AREA</th><th>TYPE</th><th>DURATION</th><th>YEAR</th><th>RECORDED BY</th><th>NOTES</th></tr>
        </thead>
        <tbody id="timing-table"></tbody>
      </table>
    </div>
  `;

  // Timer controls
  document.getElementById('sw-start').addEventListener('click', startTimer);
  document.getElementById('sw-pause').addEventListener('click', pauseTimer);
  document.getElementById('sw-reset').addEventListener('click', resetTimer);
  document.getElementById('sw-save').addEventListener('click', saveTimer);
  document.getElementById('hist-save').addEventListener('click', saveHistorical);
  document.getElementById('rec-area-filter').addEventListener('change', renderRecords);
  document.getElementById('rec-type-filter').addEventListener('change', renderRecords);

  // Load records
  try {
    const snap = await getDocs(query(collection(db, 'timingRecords'), orderBy('year', 'desc'), orderBy('createdAt', 'desc')));
    allRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderRecords();
  } catch (e) { toast('Error loading timing records', 'error'); }

  function startTimer() {
    if (timerState.running) return;
    timerState.running = true;
    timerState.startTime = Date.now() - timerState.elapsed;
    timerState.interval = setInterval(updateDisplay, 100);
    document.getElementById('sw-start').disabled = true;
    document.getElementById('sw-pause').disabled = false;
    document.getElementById('sw-reset').disabled = false;
    document.getElementById('sw-save').disabled = false;
  }

  function pauseTimer() {
    if (!timerState.running) { startTimer(); return; }
    clearInterval(timerState.interval);
    timerState.elapsed = Date.now() - timerState.startTime;
    timerState.running = false;
    document.getElementById('sw-start').disabled = false;
    document.getElementById('sw-pause').textContent = '▶ RESUME';
  }

  function resetTimer() {
    clearInterval(timerState.interval);
    timerState = { running: false, startTime: null, elapsed: 0, interval: null };
    document.getElementById('sw-display').textContent = '00:00:00';
    document.getElementById('sw-start').disabled = false;
    document.getElementById('sw-pause').disabled = true;
    document.getElementById('sw-pause').textContent = '⏸ PAUSE';
    document.getElementById('sw-reset').disabled = true;
    document.getElementById('sw-save').disabled = true;
  }

  function updateDisplay() {
    const elapsed = timerState.running ? Date.now() - timerState.startTime : timerState.elapsed;
    document.getElementById('sw-display').textContent = formatMs(elapsed);
  }

  async function saveTimer() {
    if (timerState.elapsed < 1000 && !timerState.running) { toast('No time recorded', 'warning'); return; }
    const elapsed = timerState.running ? Date.now() - timerState.startTime : timerState.elapsed;
    const area = document.getElementById('sw-area')?.value;
    const type = document.getElementById('sw-type')?.value;
    const note = document.getElementById('sw-note')?.value || '';
    const p = window.MFCC.userProfile;

    await addDoc(collection(db, 'timingRecords'), {
      area, type,
      durationMs: elapsed,
      durationFormatted: formatMs(elapsed),
      durationMinutes: Math.round(elapsed / 60000),
      year: new Date().getFullYear(),
      notes: note,
      createdBy: p.uid,
      recordedBy: p.displayName || p.email,
      createdAt: serverTimestamp()
    });
    await logActivity('saved timing record', { area, type, duration: formatMs(elapsed) });
    toast(`Time saved: ${formatMs(elapsed)} for ${area} ${type}`, 'success');
    resetTimer();
    const snap = await getDocs(query(collection(db, 'timingRecords'), orderBy('year', 'desc'), orderBy('createdAt', 'desc')));
    allRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderRecords();
  }

  async function saveHistorical() {
    const area = document.getElementById('hist-area')?.value;
    const type = document.getElementById('hist-type')?.value;
    const hours = parseInt(document.getElementById('hist-hours')?.value) || 0;
    const mins = parseInt(document.getElementById('hist-mins')?.value) || 0;
    const year = parseInt(document.getElementById('hist-year')?.value);
    const note = document.getElementById('hist-note')?.value || '';
    const totalMs = (hours * 3600 + mins * 60) * 1000;
    if (totalMs === 0) { toast('Enter a duration', 'warning'); return; }
    const p = window.MFCC.userProfile;

    await addDoc(collection(db, 'timingRecords'), {
      area, type, durationMs: totalMs,
      durationFormatted: `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`,
      durationMinutes: hours * 60 + mins,
      year, notes: note, historical: true,
      createdBy: p.uid,
      recordedBy: p.displayName || p.email,
      createdAt: serverTimestamp()
    });
    await logActivity('added historical timing', { area, type, year });
    toast('Historical time saved!', 'success');
    document.getElementById('hist-hours').value = '';
    document.getElementById('hist-mins').value = '';
    document.getElementById('hist-note').value = '';
    const snap = await getDocs(query(collection(db, 'timingRecords'), orderBy('year', 'desc'), orderBy('createdAt', 'desc')));
    allRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderRecords();
  }

  function renderRecords() {
    const areaF = document.getElementById('rec-area-filter')?.value || 'All';
    const typeF = document.getElementById('rec-type-filter')?.value || 'All';

    let filtered = allRecords.filter(r => {
      if (areaF !== 'All' && r.area !== areaF) return false;
      if (typeF !== 'All' && r.type !== typeF) return false;
      return true;
    });

    // Analysis cards
    const analysisEl = document.getElementById('timing-analysis');
    if (analysisEl && filtered.length > 0) {
      const durations = filtered.map(r => r.durationMs).sort((a,b) => a-b);
      const avg = durations.reduce((s,v) => s+v, 0) / durations.length;
      const fastest = durations[0];
      const slowest = durations[durations.length - 1];

      // Year-over-year trend
      const byYear = {};
      filtered.forEach(r => { if (!byYear[r.year]) byYear[r.year] = []; byYear[r.year].push(r.durationMs); });
      const yearAvgs = Object.entries(byYear).sort(([a],[b]) => a-b).map(([yr, durs]) => ({
        year: yr, avg: durs.reduce((s,v)=>s+v,0)/durs.length
      }));

      analysisEl.innerHTML = `
        <div class="card card-accent-top card-accent-cyan">
          <div class="card-title">AVG DURATION</div>
          <div class="card-value" style="font-size:1.6rem">${formatMs(avg)}</div>
          <div class="card-sub">across ${filtered.length} records</div>
        </div>
        <div class="card card-accent-top card-accent-green">
          <div class="card-title">FASTEST</div>
          <div class="card-value" style="font-size:1.6rem;color:var(--accent-green)">${formatMs(fastest)}</div>
          <div class="card-sub">best recorded time</div>
        </div>
        <div class="card card-accent-top card-accent-amber">
          <div class="card-title">SLOWEST</div>
          <div class="card-value" style="font-size:1.6rem;color:var(--accent-amber)">${formatMs(slowest)}</div>
          <div class="card-sub">longest recorded time</div>
        </div>
      `;

      if (yearAvgs.length > 1) {
        analysisEl.innerHTML += `
          <div class="card card-accent-top" style="grid-column:1/-1">
            <div class="card-title">YEAR-OVER-YEAR TREND</div>
            <div style="display:flex;gap:16px;align-items:flex-end;margin-top:8px;flex-wrap:wrap">
              ${yearAvgs.map(ya => {
                const h = Math.min(Math.round(ya.avg / 60000), 240);
                return `
                  <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <span style="font-family:var(--font-mono);font-size:0.62rem;color:var(--text-muted)">${formatMs(ya.avg)}</span>
                    <div style="width:48px;background:var(--accent-cyan);border-radius:4px 4px 0 0;height:${Math.max(h,8)}px;opacity:0.8"></div>
                    <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-secondary)">${ya.year}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    } else if (analysisEl) {
      analysisEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:20px"><div class="empty-state-text">No timing records match the current filter</div></div>`;
    }

    // Table
    const tbody = document.getElementById('timing-table');
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);font-family:var(--font-mono);font-size:0.7rem">No records found</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(r => `
          <tr>
            <td>${r.area}</td>
            <td><span class="badge badge-cyan">${r.type}</span></td>
            <td style="font-family:var(--font-display);font-weight:700;color:var(--accent-cyan)">${r.durationFormatted || formatMs(r.durationMs)}</td>
            <td>${r.year}${r.historical ? ' <span class="badge badge-gray" style="font-size:0.5rem">HISTORICAL</span>' : ''}</td>
            <td>${r.recordedBy || '—'}</td>
            <td style="font-size:0.78rem;color:var(--text-muted)">${r.notes || '—'}</td>
          </tr>
        `).join('');
      }
    }
  }

  // Cleanup interval on page change
  window.MFCC.unsubscribers.push(() => {
    if (timerState.interval) clearInterval(timerState.interval);
  });
}

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
