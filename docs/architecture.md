# System Architecture Overview

This document explains how the learning management system (LMS) prototype is organised, how the front end and back end communicate, and where key data flows live. Use it as an entry point before diving into individual modules.

## High-level topology

```
┌────────────────────────┐      ┌────────────────────────────┐
│ Static front-end pages │◀────▶│ Express API + SQLite store │
└────────────────────────┘      └────────────────────────────┘
          ▲                                     ▲
          │                                     │
          │   localStorage-backed progress      │   JWT + bcrypt-secured
          │   (per authenticated user)          │   authentication
          ▼                                     ▼
┌────────────────────────┐      ┌────────────────────────────┐
│ `scripts/progress.js`  │      │ `backend/server.js`        │
│ Dashboard rendering,   │      │ Role seeding, login, /me,  │
│ schedules, achievements│      │ and RBAC middleware        │
└────────────────────────┘      └────────────────────────────┘
```

* **Front end.** Static HTML pages in `frontend/`, `grades/`, and `lessons/` deliver the UX for each persona. Shared CSS and JavaScript (under `styles/` and `scripts/`) provide a cohesive design system and progressive enhancement.
* **Back end.** `backend/server.js` runs an Express server that bootstraps an on-disk SQLite database (`backend/data/lms.db`) with demo roles and accounts. It exposes minimal authentication endpoints so each role-specific dashboard can enforce permissions.
* **Progress persistence.** Lesson completion, schedule plans, and goals are saved per user in `localStorage` by `scripts/progress.js`. When the session bootstrapper raises the `lms:user-ready` event, the progress module reloads state so multiple browser tabs stay in sync.

## Request flow

1. A user navigates to `index.html` and chooses the login panel for their role.
2. `scripts/auth.js` posts credentials to `POST /api/auth/login`.
3. On success the response includes a JWT; the token and sanitised user profile are stored under the `lms:session` key in `localStorage`.
4. The browser redirects to the correct portal (`frontend/student/dashboard.html`, etc.).
5. Each portal loads `scripts/session.js`, which validates the JWT with `GET /api/auth/me`, stores the hydrated user on `window.LMSUser`, and emits `lms:user-ready`.
6. `scripts/progress.js` reacts to `lms:user-ready`, reloads progress, and paints the dashboard cards and schedules. Other scripts (such as `scripts/parent.js`) call into the `window.LMSProgress` API to mutate state.

## Data model quick reference

| Table        | Purpose                                             |
|--------------|-----------------------------------------------------|
| `roles`      | Defines the system roles (student, parent, etc.) and serialised permission lists. |
| `users`      | Stores demo accounts with bcrypt-hashed passwords, emails, and optional parent-child relationships. |

`localStorage` holds a JSON blob with three top-level keys:

* `lessons` – keyed by lesson id, stores completion flags, scores, and duration metrics.
* `schedule` – array of parent-configured weekly schedule entries.
* `goals` – subject-specific target percentages and coaching notes.

For a detailed breakdown of the API surface exposed to the front end, see [`frontend/progress-module.md`](./frontend/progress-module.md) and [`backend/api.md`](./backend/api.md).

## Deployment considerations

* The Express server is stateless beyond its SQLite file, making it suitable for containerisation. Mount `/backend/data` as a volume when running in production so seeded accounts and future persistence survive restarts.
* Replace the default `JWT_SECRET` in production by copying `backend/.env.example` to `backend/.env` and providing strong secrets.
* When hooking into a real SSO or curriculum provider, swap out the local progress store for API-driven persistence so progress follows the user across devices.
