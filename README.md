# My LMS

A simple static learning management system prototype featuring several lessons and shared assets.

## Tooling

This repository now includes Node-based linting along with a lightweight Express/SQLite backend for authentication and role management.

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later

### Install dependencies
```bash
npm install
```

### Run lint checks
```bash
npm test
```
This command runs both HTMLHint and Stylelint across the project files.

### Start the backend API
```bash
npm run backend:start
```
The service boots on port `4000` by default, seeds demo accounts for each role, and issues JWTs backed by bcrypt-hashed passwords stored in SQLite.

## Project Structure
- `index.html` – consolidated sign-in portal for students, parents, teachers, and administrators.
- `frontend/student/dashboard.html` – student dashboard with progress highlights, schedules, and subject cards.
- `frontend/parent/dashboard.html` – parent controls for scheduling, goal setting, and grade overrides.
- `frontend/teacher/dashboard.html` – class and assignment workspace tailored for teachers.
- `frontend/admin/dashboard.html` – system-wide admin control center with user management placeholders.
- `grades/` – Kindergarten through Grade 12 landing pages with subject overviews and, where available, direct lesson links.
- `lessons/` – interactive Grade 1 lessons for Math, English, and Science activities.
- `styles/` – shared styling for the site.
- `scripts/` – shared JavaScript utilities (auth/session helpers, progress tracking, scheduling tools).
- `assets/` – images and media referenced by lessons.
- `backend/` – Express server, SQLite schema bootstrapping, and seeded demo roles.

## Features
- **Role-based access:** A unified login funnels students, parents, teachers, and administrators into tailored dashboards backed by a seeded SQLite user store.
- **Grade coverage:** Kindergarten through Grade 12 pages outline subject expectations, with Grade 1 offering interactive Math, English, and Science lessons that mirror Time4Learning-style interactivity.
- **Dynamic progress tracking:** Completing any lesson saves progress to `localStorage`, updates the dashboard meters, and highlights finished lesson cards across visits.
- **Reset controls:** A “Reset Progress” button on the dashboard clears saved data on the current device so learners can restart.
- **Accessible interactions:** Activities support keyboard interaction, announce feedback, and expose progress via ARIA attributes.

## Next Steps
- Sync lesson progress, schedules, and goals with the backend so learners can resume on any device.
- Build teacher- and admin-facing APIs for managing classes, rostering, and curriculum integrations.
- Expand the lesson catalog for additional grades and subjects while optimizing the mobile navigation experience.
