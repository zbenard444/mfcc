// ═══════════════════════════════════════════════════════════════════════════
// MILLENNIUM FALCON COMMAND CENTER — APP.JS
// Core application: Auth, routing, utilities, realtime listeners
// ═══════════════════════════════════════════════════════════════════════════

import { renderDashboard } from './pages/dashboard.js';
import { renderTasks } from './pages/tasks.js';
import { renderAreas } from './pages/areas.js';
import { renderBuildManual } from './pages/buildManual.js';
import { renderSetupCommand } from './pages/setupCommand.js';
import { renderEventDay } from './pages/eventDay.js';
import { renderInventory } from './pages/inventory.js';
import { renderBudget } from './pages/budget.js';
import { renderPurchases } from './pages/purchases.js';
import { renderStopwatch } from './pages/stopwatch.js';
import { renderQRCodes } from './pages/qrCodes.js';
import { renderMeetings } from './pages/meetings.js';
import { renderMilestones } from './pages/milestones.js';
import { renderRisks } from './pages/risks.js';
import { renderLessons } from './pages/lessons.js';
import { renderKnowledge } from './pages/knowledge.js';
import { renderReports } from './pages/reports.js';
import { renderUsers } from './pages/users.js';
import { renderSettings } from './pages/settings.js';

// ── GLOBALS ──────────────────────────────────────────────────────────────
const { auth, db, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit, serverTimestamp,
  getDocs, writeBatch, increment } = window.__firebase;

window.MFCC = {
  currentUser: null,
  userProfile: null,
  currentPage: 'dashboard',
  unsubscribers: [],
  db, auth, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs,
  writeBatch, increment,
  // Helpers
  toast, showModal, closeModal, formatDate, formatDateTime, formatRelative,
  timeAgo, debounce, generateId, confirm: confirmDialog,
  logActivity, updateBadges, calcReadiness
};

// ── AUTH ──────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadUserProfile(user);
  } else {
    showLogin();
  }
});

async function loadUserProfile(user) {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await signOut(auth);
      showLogin();
      showLoginError('Account not found. Contact administrator.');
      return;
    }
    const profile = userDoc.data();
    if (profile.status === 'pending') {
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('app').classList.add('hidden');
      document.getElementById('pending-approval').classList.remove('hidden');
      document.getElementById('login-card').classList.add('hidden');
      return;
    }
    if (profile.status === 'disabled') {
      await signOut(auth);
      showLogin();
      showLoginError('Account disabled. Contact administrator.');
      return;
    }

    window.MFCC.currentUser = user;
    window.MFCC.userProfile = { uid: user.uid, email: user.email, ...profile };

    // Update last login
    await updateDoc(doc(db, 'users', user.uid), { lastLogin: serverTimestamp() });

    showApp();
  } catch (e) {
    console.error('Profile load error:', e);
    showLogin();
    showLoginError('Error loading profile. Try again.');
  }
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('pending-approval').classList.add('hidden');
  const loginCard = document.getElementById('login-card');
  if (loginCard) loginCard.classList.remove('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  const p = window.MFCC.userProfile;
  document.getElementById('nav-username').textContent = p.displayName || p.email;
  document.getElementById('nav-role').textContent = p.role || 'Member';
  document.getElementById('nav-avatar').textContent = (p.displayName || p.email || 'U')[0].toUpperCase();

  // Show admin nav
  if (p.role === 'Administrator') {
    document.getElementById('admin-section-label').style.display = '';
    document.getElementById('admin-nav').style.display = '';
  }

  setupSidebar();
  setupNavigation();
  setupOfflineDetection();
  navigateTo('dashboard');
  updateBadges();
}

// ── LOGIN ─────────────────────────────────────────────────────────────────
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const pwd = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');

  if (!email || !pwd) { showLoginError('Please enter email and password.'); return; }

  btn.querySelector('.btn-text').classList.add('hidden');
  btn.querySelector('.btn-loader').classList.remove('hidden');
  btn.disabled = true;
  errEl.classList.add('hidden');

  try {
    await signInWithEmailAndPassword(auth, email, pwd);
  } catch (e) {
    let msg = 'Login failed. Check credentials.';
    if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
    else if (e.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
    showLoginError(msg);
    btn.querySelector('.btn-text').classList.remove('hidden');
    btn.querySelector('.btn-loader').classList.add('hidden');
    btn.disabled = false;
  }
});

document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-btn').click();
});

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  window.MFCC.unsubscribers.forEach(u => u());
  window.MFCC.unsubscribers = [];
  await signOut(auth);
  showLogin();
});

// ── SIDEBAR ───────────────────────────────────────────────────────────────
function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');

  // Mobile overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  toggle.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });
}

// ── NAVIGATION ────────────────────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
      // Close mobile sidebar
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
        document.getElementById('sidebar-overlay').classList.remove('active');
      }
    });
  });
}

function navigateTo(page) {
  // Update active nav
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) {
    pageEl.classList.add('active');
    pageEl.innerHTML = `<div style="padding:40px;text-align:center"><div class="loading-spinner"></div></div>`;
  }

  window.MFCC.currentPage = page;

  // Render page
  const renderers = {
    dashboard: renderDashboard,
    tasks: renderTasks,
    areas: renderAreas,
    'build-manual': renderBuildManual,
    'setup-command': renderSetupCommand,
    'event-day': renderEventDay,
    inventory: renderInventory,
    budget: renderBudget,
    purchases: renderPurchases,
    stopwatch: renderStopwatch,
    'qr-codes': renderQRCodes,
    meetings: renderMeetings,
    milestones: renderMilestones,
    risks: renderRisks,
    lessons: renderLessons,
    knowledge: renderKnowledge,
    reports: renderReports,
    users: renderUsers,
    settings: renderSettings
  };

  if (renderers[page]) {
    setTimeout(() => renderers[page](pageEl), 50);
  }
}

window.MFCC.navigateTo = navigateTo;

// ── OFFLINE DETECTION ─────────────────────────────────────────────────────
function setupOfflineDetection() {
  const banner = document.getElementById('offline-banner');
  const dot = document.querySelector('.sync-dot');
  const syncText = document.querySelector('.sync-text');

  function updateOnlineStatus() {
    if (navigator.onLine) {
      banner.classList.add('hidden');
      dot.className = 'sync-dot';
      syncText.textContent = 'SYNCED';
    } else {
      banner.classList.remove('hidden');
      dot.className = 'sync-dot offline';
      syncText.textContent = 'OFFLINE';
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

// ── MODAL ─────────────────────────────────────────────────────────────────
function showModal(title, bodyHTML, options = {}) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-overlay').classList.remove('hidden');
  if (options.onOpen) options.onOpen();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-body').innerHTML = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// Confirm dialog
function confirmDialog(msg, onConfirm, onCancel) {
  showModal('CONFIRM ACTION', `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:1.8rem;margin-bottom:16px">⚠</div>
      <p style="color:var(--text-secondary);margin-bottom:24px;font-size:0.9rem">${msg}</p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button class="btn btn-danger" id="confirm-yes">CONFIRM</button>
        <button class="btn btn-secondary" id="confirm-no">CANCEL</button>
      </div>
    </div>
  `);
  document.getElementById('confirm-yes').onclick = () => { closeModal(); onConfirm && onConfirm(); };
  document.getElementById('confirm-no').onclick = () => { closeModal(); onCancel && onCancel(); };
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const colors = { success: 'var(--accent-green)', error: 'var(--accent-red)', warning: 'var(--accent-amber)', info: 'var(--accent-cyan)' };
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span style="color:${colors[type]};font-size:1rem">${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '0.3s ease'; setTimeout(() => t.remove(), 300); }, duration);
}

// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatRelative(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  return formatDate(ts);
}

function timeAgo(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return formatRelative(ts);
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((d - today) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff}d`;
}
window.MFCC.formatRelativeDate = formatRelativeDate;

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ── ACTIVITY LOGGING ──────────────────────────────────────────────────────
async function logActivity(action, details = {}) {
  try {
    const p = window.MFCC.userProfile;
    await addDoc(collection(db, 'activity'), {
      action,
      details,
      userId: p.uid,
      userName: p.displayName || p.email,
      timestamp: serverTimestamp()
    });
  } catch (e) { /* silent */ }
}

// ── BADGE UPDATES ─────────────────────────────────────────────────────────
async function updateBadges() {
  try {
    const now = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'tasks'),
      where('status', 'in', ['Not Started', 'In Progress', 'Blocked']),
      where('dueDate', '<', now));
    const snap = await getDocs(q);
    const count = snap.size;
    const badge = document.getElementById('badge-tasks');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  } catch (e) { /* silent */ }
}

// ── READINESS CALCULATION ─────────────────────────────────────────────────
async function calcReadiness() {
  try {
    const categories = {
      tasks: { weight: 30, score: 0 },
      milestones: { weight: 20, score: 0 },
      inventory: { weight: 15, score: 0 },
      builds: { weight: 15, score: 0 },
      food: { weight: 10, score: 0 },
      safety: { weight: 10, score: 0 }
    };

    // Tasks
    const allTasks = await getDocs(collection(db, 'tasks'));
    const tasks = allTasks.docs.map(d => d.data());
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    categories.tasks.score = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // Milestones
    const allMs = await getDocs(collection(db, 'milestones'));
    const ms = allMs.docs.map(d => d.data());
    const completedMs = ms.filter(m => m.status === 'Completed').length;
    categories.milestones.score = ms.length > 0 ? (completedMs / ms.length) * 100 : 0;

    // Inventory — items in Good condition vs total
    const allInv = await getDocs(collection(db, 'inventory'));
    const inv = allInv.docs.map(d => d.data());
    const okInv = inv.filter(i => i.status === 'Available').length;
    categories.inventory.score = inv.length > 0 ? (okInv / inv.length) * 100 : 50;

    // Builds — build manual items with all steps documented
    const allBuilds = await getDocs(collection(db, 'buildManual'));
    const builds = allBuilds.docs.map(d => d.data());
    const readyBuilds = builds.filter(b => b.steps && b.steps.length > 0).length;
    categories.builds.score = builds.length > 0 ? (readyBuilds / builds.length) * 100 : 50;

    // Food & safety — check specific task categories
    const foodTasks = tasks.filter(t => t.area === 'Food');
    categories.food.score = foodTasks.length > 0
      ? (foodTasks.filter(t => t.status === 'Completed').length / foodTasks.length) * 100 : 50;

    const safetyTasks = tasks.filter(t => t.priority === 'Critical');
    categories.safety.score = safetyTasks.length > 0
      ? (safetyTasks.filter(t => t.status === 'Completed').length / safetyTasks.length) * 100 : 50;

    // Weighted overall
    let totalWeight = 0, weightedScore = 0;
    Object.values(categories).forEach(c => {
      weightedScore += c.score * c.weight;
      totalWeight += c.weight;
    });
    const overall = Math.round(weightedScore / totalWeight);

    return { overall, categories };
  } catch (e) {
    console.error('Readiness calc error:', e);
    return { overall: 0, categories: {} };
  }
}

// ── SERVICE WORKER ────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
