/**
 * Shared session bootstrapper loaded on every protected portal page.
 * It validates the active JWT, exposes the hydrated LMS user on `window`, and
 * redirects visitors who attempt to open a page outside of their permission
 * scope.
 */

const API_BASE = '/api';
const SESSION_KEY = 'lms:session';
const LOGIN_PAGE = '/index.html';

const roleRedirect = {
  student: '/frontend/student/dashboard.html',
  parent: '/frontend/parent/dashboard.html',
  teacher: '/frontend/teacher/dashboard.html',
  administrator: '/frontend/admin/dashboard.html'
};

/**
 * Fetches the authenticated session. Redirects to the login hub if the stored
 * token is missing or invalid.
 * @returns {Promise<{token:string, user:object}|null>}
 */
async function fetchSession() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) {
    window.location.href = LOGIN_PAGE;
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = LOGIN_PAGE;
    return null;
  }
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${parsed.token}`
      }
    });
    if (!response.ok) {
      throw new Error('Session expired');
    }
    const payload = await response.json();
    return { ...parsed, user: payload.user };
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = LOGIN_PAGE;
    return null;
  }
}

/**
 * Hydrates DOM placeholders with the active user's display name and hides
 * elements restricted to other roles.
 * @param {{displayName:string, username:string, role:string}} user
 */
function applyUserContext(user) {
  document.querySelectorAll('[data-user-display-name]').forEach((el) => {
    el.textContent = user.displayName || user.username;
  });
  document.querySelectorAll('[data-requires-role]').forEach((el) => {
    const roles = el.dataset.requiresRole.split(',').map((role) => role.trim());
    if (!roles.includes(user.role)) {
      el.setAttribute('hidden', 'hidden');
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('hidden');
      el.removeAttribute('aria-hidden');
    }
  });
}

/**
 * Attaches click handlers that destroy the session token and return the user to
 * the shared login page.
 */
function bindSignOut() {
  document.querySelectorAll('[data-sign-out]').forEach((button) => {
    button.addEventListener('click', () => {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = LOGIN_PAGE;
    });
  });
}

(async () => {
  const session = await fetchSession();
  if (!session) return;
  const { user } = session;
  const requiredAttr = document.body?.dataset?.requiredRole || '';
  const requiredRoles = requiredAttr
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
  if (requiredRoles.length && !requiredRoles.includes(user.role)) {
    const redirect = roleRedirect[user.role] || LOGIN_PAGE;
    window.location.href = redirect;
    return;
  }
  window.LMSUser = user;
  window.LMSSession = session;
  applyUserContext(user);
  window.dispatchEvent(new CustomEvent('lms:user-ready', { detail: user }));
  bindSignOut();
})();
