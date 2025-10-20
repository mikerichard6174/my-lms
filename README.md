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
- `index.html` – landing page linking to each lesson.
- `lessons/` – individual lesson pages.
- `styles/` – shared styling for the site.
- `assets/` – images and media referenced by lessons.

## Next Steps
- Expand shared layout components to reduce reliance on page-level styles.
- Backfill missing media assets or update lessons to avoid broken references.
- Build a dashboard layout that more closely matches Time4Learning's user experience.
