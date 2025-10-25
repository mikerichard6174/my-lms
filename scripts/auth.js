const API_BASE = '/api';
const SESSION_KEY = 'lms:session';

const redirectMap = {
  student: 'frontend/student/dashboard.html',
  parent: 'frontend/parent/dashboard.html',
  teacher: 'frontend/teacher/dashboard.html',
  administrator: 'frontend/admin/dashboard.html'
};

function setFeedback(form, message, type = 'error') {
  const feedback = form.querySelector('[data-feedback]');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = type;
}

async function performLogin(role, form) {
  const data = new FormData(form);
  const identifier = data.get('identifier');
  const password = data.get('password');
  setFeedback(form, 'Signing in…', 'info');
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier, password, expectedRole: role })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Unable to sign in.' }));
      throw new Error(payload.error || 'Unable to sign in.');
    }
    const payload = await response.json();
    const session = {
      token: payload.token,
      user: payload.user,
      createdAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setFeedback(form, 'Success! Redirecting…', 'success');
    const redirect = redirectMap[payload.user.role] || redirectMap[role];
    window.location.href = redirect;
  } catch (error) {
    setFeedback(form, error.message || 'Unable to sign in.', 'error');
  }
}

function bindForms() {
  document.querySelectorAll('[data-role-form]').forEach((form) => {
    const role = form.dataset.roleForm;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      performLogin(role, form);
    });
  });
}

async function validateExistingSession() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return;
  try {
    const session = JSON.parse(stored);
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });
    if (!response.ok) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    const payload = await response.json();
    if (payload?.user?.role) {
      const redirect = redirectMap[payload.user.role];
      if (redirect) {
        window.location.href = redirect;
      }
    }
  } catch (error) {
    localStorage.removeItem(SESSION_KEY);
  }
}

bindForms();
validateExistingSession();
