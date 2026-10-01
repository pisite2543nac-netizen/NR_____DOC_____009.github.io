import { CONFIG } from './config.js';
import { state } from './state.js';
import { restoreSession, loadProfile, login, registerStudent, registrationMeta, logout, rpc } from './api.js';
import { renderLogin, renderRegister, renderShell, renderMobileStaffNotice } from './ui.js';
import { MENUS, registerPage, navigate, bindHashRouting } from './router.js';
import { renderMobileShell } from './mobile.js';
import { dashboardPage } from './pages/dashboard.js';
import { subjectsPage } from './pages/subjects.js';
import { teachingPage } from './pages/teaching.js';
import { usersPage } from './pages/users.js';
import { assignmentsPage } from './pages/assignments.js';
import { worksheetsPage } from './pages/worksheets.js';
import { submissionsPage } from './pages/submissions.js';
import { examsPage } from './pages/exams.js';
import { gradebookPage } from './pages/gradebook.js';
import { groupsPage } from './pages/groups.js';
import { diagnosticsPage } from './pages/diagnostics.js';
import { profilePage } from './pages/profile.js';

registerPage('dashboard', dashboardPage);
registerPage('subjects', subjectsPage);
registerPage('teaching', teachingPage);
registerPage('users', usersPage);
registerPage('assignments', assignmentsPage);
registerPage('worksheets', worksheetsPage);
registerPage('submissions', submissionsPage);
registerPage('exams', examsPage);
registerPage('gradebook', gradebookPage);
registerPage('groups', groupsPage);
registerPage('diagnostics', diagnosticsPage);
registerPage('profile', profilePage);

function isPhone() { return window.innerWidth < CONFIG.phoneBreakpoint; }

async function cleanupLegacyRuntime() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
  } catch {}
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {}
}

function showLogin() {
  renderLogin({
    onLogin: async (identifier, password) => {
      await login(identifier, password);
      await afterAuth();
    },
    onRegister: showRegister,
  });
}

async function showRegister() {
  try {
    const meta = await registrationMeta();
    renderRegister({ meta, onSubmit: registerStudent, onBack: showLogin });
  } catch (error) {
    renderRegister({ meta: { enabled: false, load_error: String(error?.message || error) }, onSubmit: registerStudent, onBack: showLogin });
  }
}

async function onLogout() {
  await logout();
  showLogin();
}

async function afterAuth() {
  if (!state.profile?.id) await loadProfile();
  if (isPhone()) {
    if (state.profile.role === 'student') renderMobileShell(showLogin);
    else renderMobileStaffNotice(onLogout);
    return;
  }
  const menus = MENUS[state.profile.role] || MENUS.student;
  renderShell(menus, navigate, onLogout);
  bindHashRouting();
  const route = location.hash.replace('#/', '') || 'dashboard';
  await navigate(route, false);
}

async function boot() {
  await cleanupLegacyRuntime();
  try { state.build = await fetch('./BUILD.json', { cache: 'no-store' }).then((r) => r.json()); } catch {}
  restoreSession();
  if (!state.session) return showLogin();
  try {
    const health = await rpc('clean_health');
    if (!health?.ok) throw new Error('BACKEND_HEALTH_FAILED');
    await loadProfile();
    await afterAuth();
  } catch {
    localStorage.removeItem(CONFIG.sessionKey);
    state.session = null;
    state.profile = null;
    showLogin();
  }
}

let lastPhone = isPhone();
window.addEventListener('resize', () => {
  const now = isPhone();
  if (now !== lastPhone) { lastPhone = now; location.reload(); }
});

boot();
