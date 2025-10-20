# My LMS

A simple static learning management system prototype featuring several lessons and shared assets.

## Tooling

This repository now includes Node-based linting to help keep the HTML and CSS consistent.

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

## Project Structure
- `index.html` – learner dashboard that surfaces progress, daily highlights, and a grade-by-grade directory.
- `grades/` – Kindergarten through Grade 12 landing pages with subject overviews and, where available, direct lesson links.
- `lessons/` – interactive Grade 1 lessons for Math, English, and Science activities.
- `styles/` – shared styling for the site.
- `scripts/` – shared JavaScript utilities (e.g., localStorage-backed progress tracking).
- `assets/` – images and media referenced by lessons.

## Features
- **Grade coverage:** Kindergarten through Grade 12 pages outline subject expectations, with Grade 1 offering interactive Math, English, and Science lessons that mirror Time4Learning-style interactivity.
- **Dynamic progress tracking:** Completing any lesson saves progress to `localStorage`, updates the dashboard meters, and highlights finished lesson cards across visits.
- **Reset controls:** A “Reset Progress” button on the dashboard clears saved data on the current device so learners can restart.
- **Accessible interactions:** Activities support keyboard interaction, announce feedback, and expose progress via ARIA attributes.

## Next Steps
- Persist progress and schedules to a multi-user backend service so families can access the LMS across devices.
- Implement secure authentication tying student logins to their parent or guardian accounts.
- Expand the lesson catalog for additional grades and subjects while optimizing the mobile navigation experience.
