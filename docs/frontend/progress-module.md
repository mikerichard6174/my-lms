# Progress Module Reference

`scripts/progress.js` exposes a global `window.LMSProgress` object plus a number of DOM update helpers that drive the learner dashboards. This document lists each method, expected parameters, and side effects so lesson authors and portal developers can safely extend the system.

## Lifecycle

1. `scripts/session.js` validates the JWT and dispatches the `lms:user-ready` event with the authenticated user record.
2. `scripts/progress.js` listens for `lms:user-ready`, reloads state from `localStorage`, and triggers a full dashboard refresh via `updateDashboard()`.
3. Any subsequent call to methods such as `markLessonComplete`, `addScheduleItem`, or `setSubjectGoal` automatically persists changes and repaints connected UI widgets.

## State structure

The module persists the following structure under a per-user key in `localStorage`:

```json
{
  "lessons": {
    "math1": {
      "completed": true,
      "attempts": 3,
      "bestScore": 95,
      "lastScore": 80,
      "lastCompletedAt": "2024-03-01T15:25:00.000Z",
      "totalTimeMs": 120000,
      "grade": 92
    }
  },
  "history": [
    {
      "lessonId": "math1",
      "score": 80,
      "completedAt": "2024-03-01T15:25:00.000Z"
    }
  ],
  "schedule": [
    {
      "id": "uuid",
      "lessonId": "math1",
      "day": "monday",
      "time": "09:00",
      "notes": "Work on number bonds"
    }
  ],
  "goals": {
    "math": { "targetPercent": 80, "notes": "Aim for mastery by Friday" }
  }
}
```

## Public API

| Method | Parameters | Description |
|--------|------------|-------------|
| `markLessonComplete(lessonId, details)` | `lessonId: string`, `details?: { score?: number, durationMs?: number }` | Marks a lesson as completed, logs the attempt history, and refreshes dashboards. |
| `resetLessonProgress(lessonId)` | `lessonId: string` | Clears a single lesson’s metrics, including history entries. |
| `resetAllProgress()` | – | Restores the default blank state for all lessons, schedules, and goals. |
| `getLessonProgress(lessonId)` | `lessonId: string` | Returns `true` if the lesson is completed. |
| `computeSubjectProgress(subjectId, options)` | `subjectId: string`, `options?: { gradeId?: string }` | Returns `{ completed, total, percent }` for the subject. |
| `computeCategoryProgress(subjectId, categoryId, options)` | As above, with `categoryId`. | Calculates completion for a specific subject/category pairing. |
| `computeGradeProgress(gradeId)` | `gradeId: string` | Returns `{ completed, total, percent }` for a grade. |
| `getNextLesson()` | – | Returns the next incomplete lesson metadata. |
| `updateDashboard(root?)` | `root?: Document | ParentNode` | Recomputes all progress-driven UI elements. Automatically invoked after state changes. |
| `recordLessonAttempt(lessonId, options)` | `lessonId: string`, `options?: { score?: number, durationMs?: number, completed?: boolean }` | Lower-level helper used by lessons to log attempts without auto-marking completion. |
| `getLessonMetrics(lessonId)` | `lessonId: string` | Returns a defensive clone of the metrics for inspection (best score, attempts, etc.). |
| `getRecentAchievements(limit)` | `limit?: number` | Returns the most recent completion entries, each including `lesson` metadata for display. |
| `getTodaysSchedule(date?)` | `date?: Date` | Returns an ordered array of schedule items for the provided day (defaults to today). |
| `getWeeklySchedule()` | – | Returns the seven-day schedule grouped by weekday. |
| `addScheduleItem(payload)` | `{ lessonId: string, day: string, time: string, notes: string }` | Pushes a new schedule entry, returning the stored clone. |
| `removeScheduleItem(id)` | `id: string` | Removes a schedule entry. |
| `updateScheduleItem(id, updates)` | `id: string`, `updates: { lessonId?, day?, time?, notes? }` | Applies partial updates to an existing schedule entry. |
| `setLessonGrade(lessonId, grade)` | `grade: number | null | string` | Stores a manual grade override. |
| `setSubjectGoal(subjectId, goal)` | `goal: { targetPercent?: number | null, notes?: string }` | Persists subject goals from the parent dashboard. |
| `getSubjectGoal(subjectId)` | – | Returns a clone of the stored goal. |

### Static metadata exports

`LMSProgress` also exposes:

* `SUBJECTS` – canonical labels and category groupings for each subject.
* `LESSONS` – metadata for every lesson (id, subject, grade, duration, and file path).
* `GRADES` – grade-level descriptors used throughout subject and parent dashboards.

These structures should be the single source of truth when building new UI components so that progress statistics line up across the LMS.

## DOM hooks

The module looks for specific `data-*` attributes when updating the UI:

* `[data-lesson-id]`, `[data-lesson-status]`, `[data-progress-bar]` – individual lesson cards.
* `[data-subject-progress]`, `[data-status]`, `[data-goal]` – subject summary panels.
* `[data-grade-progress]`, `[data-grade-percent]` – grade band progress circles.
* `[data-attendance-card]` – weekly attendance widget.
* `[data-focus-title]`, `[data-focus-description]`, `[data-focus-status]` – Today’s Focus feature.
* `[data-achievements]` – rolling list of recent achievements.
* `[data-today-schedule]` – unordered list populated with today’s scheduled items.

When designing new pages, prefer reusing these attributes so the auto-update logic works out of the box.

## Extending the module

1. **Add metadata** – Introduce new subjects, categories, or lessons by editing the `SUBJECTS`, `GRADE_LEVELS`, or `LESSONS` arrays near the top of `scripts/progress.js`.
2. **Expose new helpers** – If UI needs additional derived data, add a documented helper function and export it via `window.LMSProgress`.
3. **Document the change** – Update this reference file so consumers know about the new capability.

For complex analytics or multi-student reporting, plan to replace the localStorage persistence with backend APIs so progress can be shared between devices and linked parent/teacher accounts.
