/* ═══════════════════════════════════════════════════
   SHARED.JS — Crypto Research Vault
   Common code used across all pages
═══════════════════════════════════════════════════ */

/* ── THEME ── */
function initTheme() {
  const saved = localStorage.getItem('crv_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeUI(saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('crv_theme', next);
  updateThemeUI(next);
}
function updateThemeUI(theme) {
  const lbl = document.getElementById('theme-label');
  if (lbl) lbl.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

/* ── MOBILE SIDEBAR ── */
function initMobileNav() {
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);
}
function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
  document.body.style.overflow = '';
}

/* ── PDF VIEWER ── */
function openPdf(url, name) {
  const overlay = document.getElementById('pdf-viewer');
  if (!overlay) return;
  document.getElementById('pdf-viewer-title').textContent = name || 'DOCUMENT';
  document.getElementById('pdf-dl-btn').href = url;
  const iframe = document.getElementById('pdf-iframe');
  const loading = document.getElementById('pdf-loading');
  iframe.style.display = 'none';
  if (loading) loading.style.display = 'flex';
  iframe.src = 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(url);
  overlay.classList.add('on');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    if (loading && loading.style.display !== 'none') showPdfFallback(url, name);
  }, 12000);
}
function showPdfFallback(url, name) {
  const b = document.querySelector('.pdf-viewer-body');
  if (!b) return;
  b.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;gap:16px;padding:28px;text-align:center;"><div style="font-size:3rem">📄</div><div style="font-family:Orbitron,monospace;font-size:0.75rem;color:var(--gold)">' + (name||'DOCUMENT') + '</div><p style="font-size:0.85rem;color:var(--text-muted)">Cannot preview on this device.</p><a href="' + url + '" target="_blank" download style="font-size:0.8rem;font-weight:700;color:#000;background:var(--gold);padding:12px 24px;border-radius:6px;text-decoration:none">⬇ DOWNLOAD PDF</a><a href="' + url + '" target="_blank" style="font-size:0.8rem;color:var(--accent);border:1px solid rgba(139,92,246,0.3);padding:8px 16px;border-radius:6px;text-decoration:none">🔗 OPEN IN BROWSER</a></div>';
}
function closePdf() {
  const overlay = document.getElementById('pdf-viewer');
  if (!overlay) return;
  overlay.classList.remove('on');
  const iframe = document.getElementById('pdf-iframe');
  if (iframe) { iframe.src = ''; iframe.style.display = 'none'; }
  const loading = document.getElementById('pdf-loading');
  if (loading) loading.style.display = 'flex';
  document.body.style.overflow = '';
}

/* ── SCROLL REVEAL ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}

/* ── DATE FORMAT ── */
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── MODAL HELPERS ── */
function oModal(id) { document.getElementById(id)?.classList.add('on'); document.body.style.overflow = 'hidden'; }
function cModal(id) { document.getElementById(id)?.classList.remove('on'); document.body.style.overflow = ''; }
function oClick(e, id) { if (e.target === document.getElementById(id)) cModal(id); }

/* ── BUG REPORT ── */
function submitBug() {
  const n = document.getElementById('bug-name')?.value.trim() || 'Anonymous';
  const t = document.getElementById('bug-type')?.value;
  const d = document.getElementById('bug-desc')?.value.trim();
  if (!d) { alert('Please describe the bug.'); return; }
  const s = encodeURIComponent('[BUG REPORT] ' + t + ' — CRV');
  const b = encodeURIComponent('From: ' + n + '\nType: ' + t + '\n\n' + d);
  window.location.href = 'mailto:nasirbello008@gmail.com?subject=' + s + '&body=' + b;
}

/* ── KEYBOARD ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.on, .auth-overlay.on').forEach(m => m.classList.remove('on'));
    closePdf();
    closeSidebar();
    document.body.style.overflow = '';
  }
});

/* ══════════════════════════════════════
   SUPABASE AUTH
══════════════════════════════════════ */
const SUPA_URL = 'https://ilpzujzrtesugmnevilt.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHp1anpydGVzdWdtbmV2aWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDQ0NjMsImV4cCI6MjA5NjYyMDQ2M30.diF50rUzLhlo-zzofDgrJ9ngU0F7_gT7FTWqbpaVgFk';
let currentUser = null;
let userBookmarks = [];

async function supaReq(endpoint, method, body, token) {
  if (!method) method = 'GET';
  const headers = { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + (token || SUPA_KEY) };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SUPA_URL + endpoint, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
async function supaSignUp(email, password, meta) { return supaReq('/auth/v1/signup', 'POST', { email, password, data: meta }); }
async function supaSignIn(email, password) { return supaReq('/auth/v1/token?grant_type=password', 'POST', { email, password }); }
async function supaSignOut(token) { return supaReq('/auth/v1/logout', 'POST', null, token); }
async function supaResetPassword(email) { return supaReq('/auth/v1/recover', 'POST', { email }); }
async function supaGetUser(token) { return supaReq('/auth/v1/user', 'GET', null, token); }

function saveSession(data) {
  try { localStorage.setItem('crv_session', JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user })); } catch(e) {}
}
function getSession() { try { return JSON.parse(localStorage.getItem('crv_session')); } catch(e) { return null; } }
function clearSession() { try { localStorage.removeItem('crv_session'); localStorage.removeItem('crv_bookmarks'); } catch(e) {} }

function loadBookmarks() { try { userBookmarks = JSON.parse(localStorage.getItem('crv_bookmarks')) || []; } catch(e) { userBookmarks = []; } }
function saveBookmarks() { try { localStorage.setItem('crv_bookmarks', JSON.stringify(userBookmarks)); } catch(e) {} }

function toggleBookmark(name, url) {
  if (!currentUser) { openAuth(); showAuthMsg('Sign in to bookmark reports.', 'info'); return; }
  const idx = userBookmarks.findIndex(b => b.url === url);
  if (idx > -1) { userBookmarks.splice(idx, 1); } else { userBookmarks.push({ name, url, saved: new Date().toISOString() }); }
  saveBookmarks();
  updateBookmarkButtons();
  renderBookmarks();
}
function isBookmarked(url) { return userBookmarks.some(b => b.url === url); }

function updateBookmarkButtons() {
  document.querySelectorAll('.rc-star,[data-url]').forEach(btn => {
    const url = btn.dataset.url;
    if (!url) return;
    if (isBookmarked(url)) { btn.classList.add('saved'); btn.textContent = '★'; }
    else { btn.classList.remove('saved'); btn.textContent = '☆'; }
  });
}

function renderBookmarks() {
  const list = document.getElementById('bm-list');
  if (!list) return;
  if (!userBookmarks.length) { list.innerHTML = '<div class="bm-empty">No bookmarks yet. Save reports by tapping the ★ icon.</div>'; return; }
  list.innerHTML = userBookmarks.map(b =>
    '<div class="bm-item"><div class="bm-name">' + b.name + '</div><div class="bm-actions"><span class="bm-open" onclick="openPdf(\'' + b.url + '\',\'' + b.name + '\')">OPEN</span><button class="bm-remove" onclick="toggleBookmark(\'' + b.name + '\',\'' + b.url + '\')">✕</button></div></div>'
  ).join('');
}

function setLoggedIn(user) {
  currentUser = user;
  const name = (user.user_metadata && user.user_metadata.full_name) ? user.user_metadata.full_name : user.email.split('@')[0];
  const nd = document.getElementById('user-name-display');
  if (nd) nd.textContent = name.substring(0, 10).toUpperCase();
  const ed = document.getElementById('user-email-display');
  if (ed) ed.textContent = user.email;
  const ab = document.getElementById('auth-btn');
  if (ab) ab.style.display = 'none';
  const ub = document.getElementById('user-badge');
  if (ub) ub.classList.add('show');
  loadBookmarks();
  updateBookmarkButtons();
}
function setLoggedOut() {
  currentUser = null;
  userBookmarks = [];
  const ab = document.getElementById('auth-btn');
  if (ab) ab.style.display = 'flex';
  const ub = document.getElementById('user-badge');
  if (ub) ub.classList.remove('show');
  updateBookmarkButtons();
}

function openAuth() { document.getElementById('auth-overlay')?.classList.add('on'); document.body.style.overflow = 'hidden'; clearAuthMsg(); }
function closeAuth() { document.getElementById('auth-overlay')?.classList.remove('on'); document.body.style.overflow = ''; }
function authOverlayClick(e) { if (e.target === document.getElementById('auth-overlay')) closeAuth(); }

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('form-' + tab)?.classList.add('active');
  document.getElementById('tab-' + tab)?.classList.add('active');
  clearAuthMsg();
  var titles = { signin: 'ACCESS THE VAULT', signup: 'JOIN THE VAULT', reset: 'RESET PASSWORD', verify: 'VERIFY EMAIL' };
  var el = document.getElementById('auth-title');
  if (el) el.textContent = titles[tab] || 'THE VAULT';
}

function showAuthMsg(msg, type) {
  if (!type) type = 'error';
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}
function clearAuthMsg() {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.className = 'auth-msg';
  el.textContent = '';
}

function checkPwStrength(pw) {
  const bar = document.getElementById('pw-bar');
  const txt = document.getElementById('pw-text');
  if (!bar || !txt) return;
  var score = 0, label = '', color = '';
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) { label = 'WEAK'; color = '#ef4444'; }
  else if (score <= 3) { label = 'FAIR'; color = '#f59e0b'; }
  else if (score <= 4) { label = 'STRONG'; color = '#10b981'; }
  else { label = 'VERY STRONG'; color = '#8b5cf6'; }
  bar.style.width = (score / 5 * 100) + '%';
  bar.style.background = color;
  txt.textContent = label;
  txt.style.color = color;
}

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

async function handleSignUp() {
  clearAuthMsg();
  const name = document.getElementById('su-name').value.trim();
  const username = document.getElementById('su-username').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const country = document.getElementById('su-country').value.trim();
  const phone = document.getElementById('su-phone').value.trim();
  const password = document.getElementById('su-password').value;
  const confirm = document.getElementById('su-confirm').value;
  const terms = document.getElementById('su-terms').checked;
  if (!name) return showAuthMsg('⚠ Please enter your full name.');
  if (!username) return showAuthMsg('⚠ Please enter a username.');
  if (!email) return showAuthMsg('⚠ Please enter your email address.');
  if (!validateEmail(email)) return showAuthMsg('⚠ Please enter a valid email address.');
  if (!country) return showAuthMsg('⚠ Please enter your country.');
  if (password.length < 6) return showAuthMsg('⚠ Password must be at least 6 characters.');
  if (password !== confirm) return showAuthMsg('⚠ Passwords do not match.');
  if (!terms) return showAuthMsg('⚠ Please agree to the Terms and Privacy Policy.');
  setLoading('su-submit', true);
  try {
    const res = await supaSignUp(email, password, { full_name: name, username, country, phone });
    if (res.ok) {
      switchAuthTab('verify');
      showAuthMsg('✓ Account created! Check your email to verify.', 'success');
    } else {
      const msg = (res.data && (res.data.msg || res.data.message)) || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        showAuthMsg('⚠ This email is already registered. Sign in instead.');
        setTimeout(() => switchAuthTab('signin'), 2000);
      } else {
        showAuthMsg('⚠ ' + (msg || 'Sign up failed. Please try again.'));
      }
    }
  } catch(e) { showAuthMsg('⚠ Connection error. Please try again.'); }
  setLoading('su-submit', false);
}

async function handleSignIn() {
  clearAuthMsg();
  const email = document.getElementById('si-email').value.trim();
  const password = document.getElementById('si-password').value;
  if (!email) return showAuthMsg('⚠ Please enter your email address.');
  if (!validateEmail(email)) return showAuthMsg('⚠ Please enter a valid email address.');
  if (!password) return showAuthMsg('⚠ Please enter your password.');
  setLoading('si-submit', true);
  try {
    const res = await supaSignIn(email, password);
    if (res.ok && res.data.access_token) {
      saveSession(res.data);
      setLoggedIn(res.data.user);
      closeAuth();
    } else {
      const msg = (res.data && (res.data.error_description || res.data.msg || res.data.message)) || '';
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
        showAuthMsg('⚠ Wrong email or password.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        showAuthMsg('⚠ Please verify your email first.');
      } else if (msg.toLowerCase().includes('user not found')) {
        showAuthMsg('⚠ No account found. Create one instead.');
        setTimeout(() => switchAuthTab('signup'), 2000);
      } else {
        showAuthMsg('⚠ ' + (msg || 'Sign in failed. Please try again.'));
      }
    }
  } catch(e) { showAuthMsg('⚠ Connection error. Please try again.'); }
  setLoading('si-submit', false);
}

async function handleReset() {
  clearAuthMsg();
  const email = document.getElementById('reset-email').value.trim();
  if (!email) return showAuthMsg('⚠ Please enter your email address.');
  if (!validateEmail(email)) return showAuthMsg('⚠ Please enter a valid email address.');
  setLoading('reset-submit', true);
  try {
    const res = await supaResetPassword(email);
    if (res.ok) { showAuthMsg('✓ Reset link sent! Check your inbox.', 'success'); }
    else { showAuthMsg('⚠ Could not send reset email. Try again.'); }
  } catch(e) { showAuthMsg('⚠ Connection error. Please try again.'); }
  setLoading('reset-submit', false);
}

async function signOut() {
  const session = getSession();
  if (session && session.access_token) {
    try { await supaSignOut(session.access_token); } catch(e) {}
  }
  clearSession();
  setLoggedOut();
  var dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.remove('show');
}

function toggleUserDropdown() { document.getElementById('user-dropdown')?.classList.toggle('show'); }
function closeUserDropdown() { document.getElementById('user-dropdown')?.classList.remove('show'); }
document.addEventListener('click', e => { if (!e.target.closest('.user-badge')) closeUserDropdown(); });

async function checkSession() {
  const session = getSession();
  if (!session || !session.access_token) return;
  try {
    const res = await supaGetUser(session.access_token);
    if (res.ok && res.data && res.data.id) { setLoggedIn(res.data); }
    else { clearSession(); }
  } catch(e) { clearSession(); }
}

function openBookmarks() { renderBookmarks(); oModal('bookmarks-modal'); }
                                        
