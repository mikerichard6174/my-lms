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
- `index.html` – learner dashboard that surfaces progress, subject navigation, and quick actions.
- `lessons/` – individual lesson pages for Math, English, and Science activities.
- `styles/` – shared styling for the site.
- `scripts/` – shared JavaScript utilities (e.g., localStorage-backed progress tracking).
- `assets/` – images and media referenced by lessons.

## Features
- **Subject coverage:** Math (counting, drag-and-drop, word matching), English (story sequencing, vocabulary), and Science (weather decisions, habitat matching) lessons that mirror Time4Learning-style interactivity.
- **Dynamic progress tracking:** Completing any lesson saves progress to `localStorage`, updates the dashboard meters, and highlights finished lesson cards across visits.
- **Reset controls:** A “Reset Progress” button on the dashboard clears saved data on the current device so learners can restart.
- **Accessible interactions:** Activities support keyboard interaction, announce feedback, and expose progress via ARIA attributes.

## Next Steps
- Persist progress to a multi-user backend service instead of browser storage.
- Add a teacher/parent dashboard with assignment controls and reporting.
- Layer in audio narration and mini-games to extend the lesson catalog.
