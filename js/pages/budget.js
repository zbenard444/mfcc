// ═══════════════════════════════════════════════════════════════════════════
// BUDGET PAGE — Expense Tracking & Category Breakdowns
// ═══════════════════════════════════════════════════════════════════════════

export async function renderBudget(el) {
  const { db, collection, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot,
    query, orderBy, doc, serverTimestamp, logActivity, toast, showModal, closeModal } = window.MFCC;

  const CATEGORIES = ['Filament','Paint','Lumber','Hardware','Food','Lighting','Electronics',
    'Decor','Tools','Costumes','Props','Sound','Signage','Miscellaneous'];
  const YEARS = ['2025', '2026', '2027', '2028', '2029'];

  let allEntries = [];
  let activeYear = new Date().getFullYear().toString();

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-block">
        <span class="page-eyebrow">FINANCIAL TRACKING</span>
        <h1 class="page-title">BUDGET & EXPENSES</h1>
      </div>
      <div class="page-actions">
        <select class="form-select" id="budget-year" style="width:110px">
          ${YEARS.map(y => `<option ${y === activeYear ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
        <button class="btn btn-primary" id="new-expense-btn">+ ADD EXPENSE</button>
        <button class="btn btn-secondary" id="set-budgets-btn">⚙ SET BUDGETS</button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid-4" style="margin-bottom:20px">
      <div class="card card-accent-top card-accent-cyan">
        <div class="card-title">TOTAL BUDGET</div>
        <div class="card-value" id="budget-total">$—</div>
        <div class="card-sub">planned allocation</div>
      </div>
      <div class="card card-accent-top">
        <div class="card-title">TOTAL SPENT</div>
        <div class="card-value" id="budget-spent">$—</div>
        <div class="card-sub">actual expenses</div>
      </div>
      <div class="card card-accent-top card-accent-green">
        <div class="card-title">REMAINING</div>
        <div class="card-value" id="budget-remaining">$—</div>
        <div class="card-sub">left to spend</div>
      </div>
      <div class="card card-accent-top">
        <div class="card-title">UTILIZATION</div>
        <div class="card-value" id="budget-pct">—%</div>
        <div class="card-sub">of budget used</div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div class="section-divider"><span class="section-divider-label">CATEGORY BREAKDOWN</span><div class="section-divider-line"></div></div>
    <div class="card card-accent-top" style="margin-bottom:20px">
      <div id="budget-categories">
        <div class="loading-spinner"></div>
      </div>
    </div>

    <!-- Expense Table -->
    <div class="section-divider"><span class="section-divider-label">EXPENSE LEDGER</span><div class="section-divider-line"></div></div>
    <div class="search-bar" style="margin-bottom:12px;max-width:400px">
      <span class="search-bar-icon">⌕</span>
      <input type="text" id="expense-search" placeholder="Search expenses..." />
    </div>
    <div class="table-wrap">
      <table class="data-table" id="expense-table">
        <thead>
          <tr>
            <th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>AMOUNT</th><th>PURCHASED BY</th><th>RECEIPT</th><th>ACTIONS</th>
          </tr>
        </thead>
        <tbody id="expense-tbody">
          <tr><td colspan="7" style="text-align:center;padding:40px"><div class="loading-spinner"></div></td></tr>
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('budget-year').addEventListener('change', e => {
    activeYear = e.target.value;
    renderBudget_data();
  });
  document.getElementById('new-expense-btn').addEventListener('click', () => openExpenseModal(null));
  document.getElementById('set-budgets-btn').addEventListener('click', openBudgetSetModal);
  document.getElementById('expense-search').addEventListener('input', renderExpenseTable);

  const unsub = onSnapshot(
    query(collection(db, 'expenses'), orderBy('date', 'desc')),
    snap => {
      allEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderBudget_data();
    }
  );
  window.MFCC.unsubscribers.push(unsub);

  async function renderBudget_data() {
    const yearEntries = allEntries.filter(e => e.year === activeYear);
    let budgetLimits = {};

    try {
      const budgetDoc = await (window.MFCC.getDoc)(window.MFCC.doc(db, 'settings', `budget_${activeYear}`));
      if (budgetDoc.exists()) budgetLimits = budgetDoc.data();
    } catch (e) { /* no budget limits set yet */ }

    const totalBudget = Object.values(budgetLimits).reduce((s, v) => s + (v || 0), 0);
    const totalSpent = yearEntries.reduce((s, e) => s + (e.amount || 0), 0);
    const remaining = totalBudget - totalSpent;
    const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Update summary cards
    const fmt = v => `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('budget-total').textContent = fmt(totalBudget);
    document.getElementById('budget-spent').textContent = fmt(totalSpent);
    const remEl = document.getElementById('budget-remaining');
    remEl.textContent = fmt(remaining);
    remEl.style.color = remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    const pctEl = document.getElementById('budget-pct');
    pctEl.textContent = `${pct}%`;
    pctEl.style.color = pct >= 100 ? 'var(--accent-red)' : pct >= 80 ? 'var(--accent-amber)' : 'var(--accent-green)';

    // Category breakdown
    const catBreakdown = {};
    CATEGORIES.forEach(c => { catBreakdown[c] = { spent: 0, budget: budgetLimits[c] || 0 }; });
    yearEntries.forEach(e => { if (catBreakdown[e.category]) catBreakdown[e.category].spent += e.amount || 0; });

    const catsWithData = Object.entries(catBreakdown).filter(([, v]) => v.spent > 0 || v.budget > 0);
    const catEl = document.getElementById('budget-categories');
    if (catEl) {
      if (catsWithData.length === 0) {
        catEl.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-state-text">No expenses recorded for ${activeYear}</div></div>`;
      } else {
        catEl.innerHTML = catsWithData.map(([cat, vals]) => {
          const catPct = vals.budget > 0 ? Math.min(Math.round((vals.spent / vals.budget) * 100), 100) : 0;
          const barColor = catPct >= 100 ? 'var(--accent-red)' : catPct >= 80 ? 'var(--accent-amber)' : 'var(--accent-green)';
          return `
            <div class="budget-bar" style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-secondary)">${cat}</span>
                <span style="font-family:var(--font-mono);font-size:0.65rem">
                  <span style="color:var(--text-primary)">${fmt(vals.spent)}</span>
                  ${vals.budget > 0 ? `<span style="color:var(--text-muted)"> / ${fmt(vals.budget)}</span>` : ''}
                </span>
              </div>
              ${vals.budget > 0 ? `
                <div class="budget-track">
                  <div class="budget-fill" style="width:${catPct}%;background:${barColor}"></div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    }

    renderExpenseTable();
  }

  function renderExpenseTable() {
    const tbody = document.getElementById('expense-tbody');
    if (!tbody) return;
    const search = document.getElementById('expense-search')?.value?.toLowerCase() || '';
    const yearEntries = allEntries.filter(e => {
      if (e.year !== activeYear) return false;
      if (search && !e.description?.toLowerCase().includes(search) && !e.category?.toLowerCase().includes(search)) return false;
      return true;
    });

    if (yearEntries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);font-family:var(--font-mono);font-size:0.7rem">No expenses recorded for ${activeYear}</td></tr>`;
      return;
    }

    tbody.innerHTML = yearEntries.map(e => `
      <tr>
        <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">${e.date || '—'}</td>
        <td>${e.description || '—'}</td>
        <td><span class="badge badge-gray">${e.category || '—'}</span></td>
        <td style="font-family:var(--font-display);font-weight:700;color:var(--accent-cyan)">$${(e.amount || 0).toFixed(2)}</td>
        <td>${e.purchasedBy || '—'}</td>
        <td>${e.receiptUrl ? `<a href="${e.receiptUrl}" target="_blank" style="color:var(--accent-cyan);font-size:0.75rem">VIEW ↗</a>` : '—'}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm" onclick="window._editExpense('${e.id}')">EDIT</button>
          <button class="btn btn-danger btn-sm" onclick="window._deleteExpense('${e.id}','${e.description?.replace(/'/g,"\\'")}')">✕</button>
        </td>
      </tr>
    `).join('');
  }

  window._editExpense = (id) => {
    const entry = allEntries.find(e => e.id === id);
    if (entry) openExpenseModal(entry);
  };

  window._deleteExpense = (id, desc) => {
    const { confirm } = window.MFCC;
    confirm(`Delete expense "${desc}"?`, async () => {
      await deleteDoc(doc(db, 'expenses', id));
      await logActivity('deleted expense', { description: desc });
      toast('Expense deleted', 'info');
    });
  };

  function openExpenseModal(entry) {
    const isEdit = entry !== null;
    const e = entry || {};
    const users = ['Tyson','Brad','Cayla','Liz','Zach'];
    showModal(isEdit ? 'EDIT EXPENSE' : 'ADD EXPENSE', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">DESCRIPTION *</label>
          <input class="form-input" id="ef-desc" value="${e.description || ''}" placeholder="What was purchased?" />
        </div>
        <div class="form-group">
          <label class="form-label">CATEGORY</label>
          <select class="form-select" id="ef-cat">
            ${CATEGORIES.map(c => `<option ${e.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">AMOUNT ($) *</label>
          <input type="number" class="form-input" id="ef-amt" value="${e.amount || ''}" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label">DATE</label>
          <input type="date" class="form-input" id="ef-date" value="${e.date || new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">PURCHASED BY</label>
          <select class="form-select" id="ef-by">
            ${users.map(u => `<option ${e.purchasedBy === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">YEAR</label>
          <select class="form-select" id="ef-year">
            ${YEARS.map(y => `<option ${(e.year || activeYear) === y ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label">RECEIPT URL (Google Drive link)</label>
          <input class="form-input" id="ef-receipt" value="${e.receiptUrl || ''}" placeholder="https://drive.google.com/..." />
        </div>
        <div class="form-group full-width">
          <label class="form-label">NOTES</label>
          <textarea class="form-textarea" id="ef-notes" rows="2">${e.notes || ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="ef-save">${isEdit ? 'SAVE' : 'ADD EXPENSE'}</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('ef-save').addEventListener('click', async () => {
          const desc = document.getElementById('ef-desc')?.value?.trim();
          const amt = parseFloat(document.getElementById('ef-amt')?.value);
          if (!desc || isNaN(amt)) { toast('Description and amount are required', 'warning'); return; }
          const p = window.MFCC.userProfile;
          const data = {
            description: desc,
            category: document.getElementById('ef-cat')?.value,
            amount: amt,
            date: document.getElementById('ef-date')?.value,
            purchasedBy: document.getElementById('ef-by')?.value,
            year: document.getElementById('ef-year')?.value,
            receiptUrl: document.getElementById('ef-receipt')?.value || '',
            notes: document.getElementById('ef-notes')?.value || '',
            updatedAt: serverTimestamp(),
            updatedBy: p.uid
          };
          try {
            if (entry?.id) {
              await updateDoc(doc(db, 'expenses', entry.id), data);
              await logActivity('updated expense', { description: desc });
              toast('Expense updated!', 'success');
            } else {
              data.createdAt = serverTimestamp();
              data.createdBy = p.uid;
              await addDoc(collection(db, 'expenses'), data);
              await logActivity('added expense', { description: desc, amount: amt });
              toast('Expense added!', 'success');
            }
            closeModal();
          } catch (err) { toast('Error: ' + err.message, 'error'); }
        });
      }
    });
  }

  async function openBudgetSetModal() {
    let budgetLimits = {};
    try {
      const d = await (window.MFCC.getDoc)(window.MFCC.doc(db, 'settings', `budget_${activeYear}`));
      if (d.exists()) budgetLimits = d.data();
    } catch (e) {}

    showModal(`SET BUDGETS — ${activeYear}`, `
      <div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);margin-bottom:16px">Set spending limits per category for ${activeYear}</div>
      <div class="form-grid">
        ${CATEGORIES.map(c => `
          <div class="form-group">
            <label class="form-label">${c.toUpperCase()}</label>
            <div style="position:relative">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-family:var(--font-mono)">$</span>
              <input type="number" class="form-input" id="bl-${c.replace(/\s/g,'-')}" value="${budgetLimits[c] || ''}" min="0" step="1" placeholder="0" style="padding-left:24px" />
            </div>
          </div>
        `).join('')}
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="window.MFCC.closeModal()">CANCEL</button>
        <button class="btn btn-primary" id="bl-save">SAVE BUDGETS</button>
      </div>
    `, {
      onOpen: () => {
        document.getElementById('bl-save').addEventListener('click', async () => {
          const limits = {};
          CATEGORIES.forEach(c => {
            const val = parseFloat(document.getElementById(`bl-${c.replace(/\s/g,'-')}`)?.value);
            if (!isNaN(val) && val > 0) limits[c] = val;
          });
          await window.MFCC.setDoc(window.MFCC.doc(db, 'settings', `budget_${activeYear}`), limits);
          await logActivity('updated budget limits', { year: activeYear });
          toast('Budget limits saved!', 'success');
          closeModal();
          renderBudget_data();
        });
      }
    });
  }
}
