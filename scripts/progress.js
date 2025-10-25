(function () {
  /**
   * Progress orchestration module
   * ------------------------------
   * This file manages every bit of front-end state related to lessons,
   * completion metrics, goals, schedules, and dashboard rendering. The
   * functions are intentionally verbose and accompanied by documentation so
   * designers, curriculum authors, and engineers can reason about how the
   * student experience is assembled without tracing through minified logic.
   */
  const STORAGE_KEY_BASE = "my-lms-progress-v2";

  const storageKey = () => {
    const user = window.LMSUser;
    if (user && user.id) {
      return `${STORAGE_KEY_BASE}-${user.id}`;
    }
    return STORAGE_KEY_BASE;
  };

  const SUBJECTS = {
    math: {
      id: "math",
      label: "Math Adventures",
      description: "Build number sense, operations confidence, and word problems skills.",
      categories: {
        counting: { id: "counting", label: "Counting & Number Sense" },
        operations: { id: "operations", label: "Operations & Problem Solving" }
      }
    },
    english: {
      id: "english",
      label: "English Explorers",
      description: "Grow reading fluency, vocabulary, and comprehension strategies.",
      categories: {
        reading: { id: "reading", label: "Reading Comprehension" },
        vocabulary: { id: "vocabulary", label: "Vocabulary Building" }
      }
    },
    science: {
      id: "science",
      label: "Science Lab",
      description: "Investigate the world through observation, experiments, and discovery.",
      categories: {
        weather: { id: "weather", label: "Weather & Climate" },
        life: { id: "life", label: "Life Science" }
      }
    }
  };

  const GRADE_LEVELS = [
    {
      id: "grade-k",
      label: "Kindergarten",
      shortLabel: "K",
      description: "Play-based readiness with letters, sounds, and number exploration."
    },
    {
      id: "grade-1",
      label: "Grade 1",
      shortLabel: "1",
      description: "Strengthen foundational reading, vocabulary, and counting fluency."
    },
    {
      id: "grade-2",
      label: "Grade 2",
      shortLabel: "2",
      description: "Grow comprehension, multi-digit operations, and simple science investigations."
    },
    {
      id: "grade-3",
      label: "Grade 3",
      shortLabel: "3",
      description: "Introduce fractions, paragraph reading, and lab-style experiments."
    },
    {
      id: "grade-4",
      label: "Grade 4",
      shortLabel: "4",
      description: "Expand critical reading, multi-step problem solving, and earth science projects."
    },
    {
      id: "grade-5",
      label: "Grade 5",
      shortLabel: "5",
      description: "Prepare for middle school with advanced fluency, fractions, and inquiry labs."
    },
    {
      id: "grade-6",
      label: "Grade 6",
      shortLabel: "6",
      description: "Build middle school readiness across ratios, literary analysis, and ecosystems."
    },
    {
      id: "grade-7",
      label: "Grade 7",
      shortLabel: "7",
      description: "Connect proportional reasoning, structured writing, and life science labs."
    },
    {
      id: "grade-8",
      label: "Grade 8",
      shortLabel: "8",
      description: "Solidify algebra foundations, argument writing, and physical science concepts."
    },
    {
      id: "grade-9",
      label: "Grade 9",
      shortLabel: "9",
      description: "Launch high school pathways with algebra, literary themes, and biology studies."
    },
    {
      id: "grade-10",
      label: "Grade 10",
      shortLabel: "10",
      description: "Deepen geometry, world literature, and chemistry investigations."
    },
    {
      id: "grade-11",
      label: "Grade 11",
      shortLabel: "11",
      description: "Prepare for college-level math, American literature, and physics applications."
    },
    {
      id: "grade-12",
      label: "Grade 12",
      shortLabel: "12",
      description: "Capstone year with calculus readiness, rhetoric, and advanced science research."
    }
  ];

  const DEFAULT_GRADE_SUBJECTS = ["math", "english", "science"];
  const GRADES = GRADE_LEVELS.map((grade) => ({
    ...grade,
    subjects: Array.isArray(grade.subjects) && grade.subjects.length ? grade.subjects : DEFAULT_GRADE_SUBJECTS
  }));
  const gradeIndex = Object.fromEntries(GRADES.map((grade) => [grade.id, grade]));

  const LESSONS = [
    {
      id: "math1",
      subject: "math",
      category: "counting",
      grade: "grade-1",
      name: "Lesson 1: Learning Numbers",
      shortName: "Learning Numbers",
      path: "lessons/lesson1.html",
      estimatedMinutes: 8
    },
    {
      id: "math2",
      subject: "math",
      category: "counting",
      grade: "grade-1",
      name: "Lesson 2: Counting Objects",
      shortName: "Counting Objects",
      path: "lessons/lesson2.html",
      estimatedMinutes: 7
    },
    {
      id: "math3",
      subject: "math",
      category: "operations",
      grade: "grade-1",
      name: "Lesson 3: Number to Word Matching",
      shortName: "Number Word Match",
      path: "lessons/lesson3.html",
      estimatedMinutes: 6
    },
    {
      id: "english1",
      subject: "english",
      category: "reading",
      grade: "grade-1",
      name: "Lesson 4: Story Sequencing",
      shortName: "Story Sequencing",
      path: "lessons/english1.html",
      estimatedMinutes: 10
    },
    {
      id: "english2",
      subject: "english",
      category: "vocabulary",
      grade: "grade-1",
      name: "Lesson 5: Vocabulary Builder",
      shortName: "Vocabulary Builder",
      path: "lessons/english2.html",
      estimatedMinutes: 9
    },
    {
      id: "science1",
      subject: "science",
      category: "weather",
      grade: "grade-1",
      name: "Lesson 6: Weather Watch",
      shortName: "Weather Watch",
      path: "lessons/science1.html",
      estimatedMinutes: 6
    },
    {
      id: "science2",
      subject: "science",
      category: "life",
      grade: "grade-1",
      name: "Lesson 7: Habitat Match-Up",
      shortName: "Habitat Match-Up",
      path: "lessons/science2.html",
      estimatedMinutes: 6
    }
  ];

  const lessonIndex = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson]));
  const subjectLessons = LESSONS.reduce((acc, lesson) => {
    if (!acc[lesson.subject]) {
      acc[lesson.subject] = [];
    }
    acc[lesson.subject].push(lesson.id);
    return acc;
  }, {});

  const categoryLessons = LESSONS.reduce((acc, lesson) => {
    const key = `${lesson.subject}:${lesson.category}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lesson.id);
    return acc;
  }, {});

  const gradeLessons = LESSONS.reduce((acc, lesson) => {
    if (!acc[lesson.grade]) {
      acc[lesson.grade] = [];
    }
    acc[lesson.grade].push(lesson.id);
    return acc;
  }, {});

  const subjectGradeLessons = LESSONS.reduce((acc, lesson) => {
    const key = `${lesson.grade}:${lesson.subject}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lesson.id);
    return acc;
  }, {});

  const categoryGradeLessons = LESSONS.reduce((acc, lesson) => {
    const key = `${lesson.grade}:${lesson.subject}:${lesson.category}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lesson.id);
    return acc;
  }, {});

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const defaultLessonState = () => ({
    completed: false,
    attempts: 0,
    bestScore: null,
    lastScore: null,
    lastCompletedAt: null,
    totalTimeMs: 0,
    grade: null
  });

  const defaultState = {
    lessons: LESSONS.reduce((acc, lesson) => {
      acc[lesson.id] = defaultLessonState();
      return acc;
    }, {}),
    history: [],
    schedule: [],
    goals: Object.fromEntries(Object.keys(SUBJECTS).map((id) => [id, { targetPercent: null, notes: "" }]))
  };

  const storageAvailable = (() => {
    try {
      const key = "__lms_progress_test__";
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  })();

  let state = loadState();

  /**
   * Restores persisted progress from localStorage, merging it with defaults so
   * newly introduced fields receive sensible initial values.
   * @returns {typeof defaultState}
   */
  function loadState() {
    if (!storageAvailable) {
      return clone(defaultState);
    }

    const raw = window.localStorage.getItem(storageKey());
    if (!raw) {
      return clone(defaultState);
    }

    try {
      const parsed = JSON.parse(raw);
      const nextState = clone(defaultState);
      if (parsed && typeof parsed === "object") {
        if (parsed.lessons && typeof parsed.lessons === "object") {
          Object.entries(parsed.lessons).forEach(([id, value]) => {
            if (Object.prototype.hasOwnProperty.call(nextState.lessons, id)) {
              const target = nextState.lessons[id];
              if (value && typeof value === "object") {
                Object.assign(target, {
                  completed: Boolean(value.completed),
                  attempts: Number.isFinite(value.attempts) ? value.attempts : target.attempts,
                  bestScore: value.bestScore === null ? null : Number(value.bestScore),
                  lastScore: value.lastScore === null ? null : Number(value.lastScore),
                  lastCompletedAt: value.lastCompletedAt || null,
                  totalTimeMs: Number.isFinite(value.totalTimeMs) ? value.totalTimeMs : target.totalTimeMs,
                  grade: value.grade === null ? null : Number(value.grade)
                });
              } else {
                target.completed = Boolean(value);
              }
            }
          });
        }
        if (Array.isArray(parsed.history)) {
          nextState.history = parsed.history
            .filter((entry) => entry && lessonIndex[entry.lessonId])
            .map((entry) => ({
              lessonId: entry.lessonId,
              score: entry.score === null ? null : Number(entry.score),
              completedAt: entry.completedAt || null
            }))
            .slice(0, 20);
        }
        if (Array.isArray(parsed.schedule)) {
          nextState.schedule = parsed.schedule
            .filter((item) => item && lessonIndex[item.lessonId])
            .map((item) => ({
              id: item.id || cryptoRandomId(),
              day: item.day || "monday",
              lessonId: item.lessonId,
              time: item.time || "09:00",
              notes: item.notes || ""
            }));
        }
        if (parsed.goals && typeof parsed.goals === "object") {
          Object.entries(parsed.goals).forEach(([subjectId, goal]) => {
            if (Object.prototype.hasOwnProperty.call(nextState.goals, subjectId) && goal && typeof goal === "object") {
              nextState.goals[subjectId] = {
                targetPercent: goal.targetPercent === null ? null : Number(goal.targetPercent),
                notes: goal.notes || ""
              };
            }
          });
        }
      }
      return nextState;
    } catch (error) {
      return clone(defaultState);
    }
  }

  /**
   * Serialises the current state tree to localStorage (when available).
   */
  function persistState() {
    if (!storageAvailable) {
      return;
    }
    window.localStorage.setItem(storageKey(), JSON.stringify(state));
  }

  /**
   * Generates a stable unique identifier for schedule rows when the browser
   * supports `crypto.randomUUID`, otherwise falls back to Math.random.
   * @returns {string}
   */
  function cryptoRandomId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `id-${Math.random().toString(16).slice(2, 10)}`;
  }

  /**
   * Retrieves (and initialises if necessary) the progress record for a lesson.
   * @param {string} lessonId
   * @returns {ReturnType<typeof defaultLessonState>|null}
   */
  function getLessonRecord(lessonId) {
    if (!lessonIndex[lessonId]) {
      return null;
    }
    const record = state.lessons[lessonId];
    if (!record) {
      state.lessons[lessonId] = defaultLessonState();
      return state.lessons[lessonId];
    }
    return record;
  }

  /**
   * Applies a shallow merge to a lesson record and persists the change.
   * @param {string} lessonId
   * @param {Partial<ReturnType<typeof defaultLessonState>>} partial
   */
  function setLessonMetrics(lessonId, partial) {
    const record = getLessonRecord(lessonId);
    if (!record) {
      return;
    }
    Object.assign(record, partial);
    persistState();
  }

  /**
   * Records a learner attempt, updating score, attempts, duration, and history
   * arrays before refreshing dependent UI widgets.
   * @param {string} lessonId
   * @param {{score:number|null, durationMs:number, completed:boolean}} options
   */
  function recordLessonAttempt(lessonId, { score = null, durationMs = 0, completed = false } = {}) {
    const record = getLessonRecord(lessonId);
    if (!record) {
      return;
    }
    record.attempts += 1;
    if (durationMs && Number.isFinite(durationMs) && durationMs > 0) {
      record.totalTimeMs += durationMs;
    }
    if (score === null || Number.isNaN(Number(score))) {
      record.lastScore = null;
    } else {
      const numericScore = Number(score);
      record.lastScore = numericScore;
      if (record.bestScore === null || numericScore > record.bestScore) {
        record.bestScore = numericScore;
      }
    }
    if (completed) {
      record.completed = true;
      record.lastCompletedAt = new Date().toISOString();
      state.history.unshift({
        lessonId,
        score: record.lastScore,
        completedAt: record.lastCompletedAt
      });
      state.history = state.history.slice(0, 20);
    }
    persistState();
    updateDashboard();
  }

  /**
   * Convenience wrapper to flag a lesson as complete while optionally storing
   * additional attempt metadata.
   * @param {string} lessonId
   * @param {{score:number|null, durationMs:number}} details
   */
  function markLessonComplete(lessonId, details = {}) {
    recordLessonAttempt(lessonId, { ...details, completed: true });
  }

  /**
   * Clears the persisted data for a specific lesson, effectively returning it
   * to a "not started" state.
   * @param {string} lessonId
   */
  function resetLessonProgress(lessonId) {
    const record = getLessonRecord(lessonId);
    if (!record) {
      return;
    }
    Object.assign(record, defaultLessonState());
    state.history = state.history.filter((entry) => entry.lessonId !== lessonId);
    persistState();
    updateDashboard();
  }

  /**
   * Nukes all learner state. Typically invoked from the parent reset control.
   */
  function resetAllProgress() {
    state = clone(defaultState);
    persistState();
    updateDashboard();
  }

  /**
   * Returns whether a given lesson is marked complete.
   * @param {string} lessonId
   * @returns {boolean}
   */
  function getLessonProgress(lessonId) {
    const record = getLessonRecord(lessonId);
    return record ? Boolean(record.completed) : false;
  }

  /**
   * Calculates progress metrics for a subject, optionally scoped to a grade.
   * @param {string} subjectId
   * @param {{gradeId?:string}} options
   * @returns {{completed:number,total:number,percent:number}}
   */
  function computeSubjectProgress(subjectId, options = {}) {
    const { gradeId = null } = options || {};
    const lessons = gradeId
      ? subjectGradeLessons[`${gradeId}:${subjectId}`] || []
      : subjectLessons[subjectId] || [];
    const completed = lessons.filter((id) => getLessonProgress(id)).length;
    const total = lessons.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  /**
   * Calculates progress for a specific subject/category combination.
   * @param {string} subjectId
   * @param {string} categoryId
   * @param {{gradeId?:string}} options
   */
  function computeCategoryProgress(subjectId, categoryId, options = {}) {
    const { gradeId = null } = options || {};
    const lessons = gradeId
      ? categoryGradeLessons[`${gradeId}:${subjectId}:${categoryId}`] || []
      : categoryLessons[`${subjectId}:${categoryId}`] || [];
    const completed = lessons.filter((id) => getLessonProgress(id)).length;
    const total = lessons.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  /**
   * Summarises progress across all lessons attached to a grade level.
   * @param {string} gradeId
   */
  function computeGradeProgress(gradeId) {
    const lessons = gradeLessons[gradeId] || [];
    const completed = lessons.filter((id) => getLessonProgress(id)).length;
    const total = lessons.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  /**
   * Aggregates completion across every available lesson.
   */
  function computeOverallProgress() {
    const total = LESSONS.length;
    const completed = Object.values(state.lessons).filter((lesson) => lesson && lesson.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  /**
   * Derives a lightweight attendance metric based on completed lessons per week.
   * @param {number} goalDays
   */
  function computeAttendanceProgress(goalDays = 5) {
    const overall = computeOverallProgress();
    const completedDays = Math.min(goalDays, overall.completed);
    const percent = goalDays ? Math.round((completedDays / goalDays) * 100) : 0;
    return { completedDays, goalDays, percent };
  }

  /**
   * Returns the next incomplete lesson (or the final lesson if everything is
   * complete).
   */
  function getNextLesson() {
    const next = LESSONS.find((lesson) => !getLessonProgress(lesson.id));
    return next || LESSONS[LESSONS.length - 1];
  }

  /**
   * Produces a defensive clone of the stored lesson metrics so callers cannot
   * mutate internal state accidentally.
   * @param {string} lessonId
   */
  function getLessonMetrics(lessonId) {
    const record = getLessonRecord(lessonId);
    if (!record) {
      return null;
    }
    return clone(record);
  }

  /**
   * Returns the N most recent completion history entries.
   * @param {number} limit
   */
  function getRecentAchievements(limit = 3) {
    return state.history.slice(0, limit).map((entry) => ({
      ...entry,
      lesson: lessonIndex[entry.lessonId]
    }));
  }

  /**
   * Fetches the stored subject goal configuration (target percent + notes).
   * @param {string} subjectId
   */
  function getSubjectGoal(subjectId) {
    return clone(state.goals[subjectId] || { targetPercent: null, notes: "" });
  }

  /**
   * Persists subject goal updates triggered from the parent dashboard.
   * @param {string} subjectId
   * @param {{targetPercent:number|null, notes:string}} goal
   */
  function setSubjectGoal(subjectId, goal) {
    if (!Object.prototype.hasOwnProperty.call(state.goals, subjectId)) {
      return;
    }
    const { targetPercent = null, notes = "" } = goal || {};
    state.goals[subjectId] = {
      targetPercent: targetPercent === null || Number.isNaN(Number(targetPercent)) ? null : Number(targetPercent),
      notes: notes || ""
    };
    persistState();
    updateDashboard();
  }

  /**
   * Saves a manual grade override, accepting blank values to clear the grade.
   * @param {string} lessonId
   * @param {number|null|string} grade
   */
  function setLessonGrade(lessonId, grade) {
    const record = getLessonRecord(lessonId);
    if (!record) {
      return;
    }
    if (grade === null || grade === "") {
      record.grade = null;
    } else {
      const numeric = Number(grade);
      record.grade = Number.isNaN(numeric) ? null : numeric;
    }
    persistState();
    updateDashboard();
  }

  /**
   * Adds a parent-defined schedule entry for the weekly planner.
   * @param {{lessonId:string, day:string, time:string, notes:string}} item
   * @returns {object|null}
   */
  function addScheduleItem({ lessonId, day, time, notes }) {
    if (!lessonIndex[lessonId]) {
      return null;
    }
    const item = {
      id: cryptoRandomId(),
      lessonId,
      day: (day || "monday").toLowerCase(),
      time: time || "09:00",
      notes: notes || ""
    };
    state.schedule.push(item);
    persistState();
    updateDashboard();
    return clone(item);
  }

  /**
   * Deletes a schedule entry by identifier.
   * @param {string} id
   */
  function removeScheduleItem(id) {
    const before = state.schedule.length;
    state.schedule = state.schedule.filter((item) => item.id !== id);
    if (state.schedule.length !== before) {
      persistState();
      updateDashboard();
    }
  }

  /**
   * Mutates an existing schedule item with the provided partial updates.
   * @param {string} id
   * @param {{lessonId?:string, day?:string, time?:string, notes?:string}} updates
   */
  function updateScheduleItem(id, updates) {
    const item = state.schedule.find((entry) => entry.id === id);
    if (!item) {
      return;
    }
    if (updates.lessonId && lessonIndex[updates.lessonId]) {
      item.lessonId = updates.lessonId;
    }
    if (updates.day) {
      item.day = updates.day.toLowerCase();
    }
    if (updates.time) {
      item.time = updates.time;
    }
    if (typeof updates.notes === "string") {
      item.notes = updates.notes;
    }
    persistState();
    updateDashboard();
  }

  const DAYS_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  /**
   * Returns an ordered list of schedule entries for a specific weekday.
   * @param {string} day
   */
  function getDaySchedule(day) {
    const normalized = (day || "").toLowerCase();
    const filtered = state.schedule.filter((item) => item.day === normalized);
    return filtered
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((item) => ({ ...item, lesson: lessonIndex[item.lessonId] }));
  }

  /**
   * Returns the full week of schedule items grouped by day.
   */
  function getWeeklySchedule() {
    return DAYS_ORDER.map((day) => ({ day, items: getDaySchedule(day) }));
  }

  /**
   * Generates a human-readable time range using the stored start time and
   * lesson duration.
   * @param {string} timeString
   * @param {number} minutes
   */
  function formatTimeRange(timeString, minutes) {
    if (!timeString) {
      return "Flexible";
    }
    const [hours, mins] = timeString.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(mins)) {
      return "Flexible";
    }
    const start = new Date();
    start.setHours(hours, mins, 0, 0);
    const end = new Date(start.getTime() + minutes * 60000);
    const format = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${format(start)} – ${format(end)}`;
  }

  /**
   * Convenience helper that returns the schedule entries for the current day.
   * @param {Date} date
   */
  function getTodaysSchedule(date = new Date()) {
    const day = DAYS_ORDER[date.getDay() === 0 ? 6 : date.getDay() - 1];
    return getDaySchedule(day);
  }

  /**
   * Determines the highest priority focus lesson, preferring scheduled items
   * before falling back to the next incomplete activity.
   */
  function getTodaysFocus() {
    const schedule = getTodaysSchedule();
    const nextScheduled = schedule.find((item) => !getLessonProgress(item.lessonId));
    if (nextScheduled) {
      return {
        type: "schedule",
        lesson: lessonIndex[nextScheduled.lessonId],
        scheduleItem: nextScheduled,
        label: "Today's Scheduled Focus"
      };
    }
    const nextLesson = getNextLesson();
    return {
      type: "lesson",
      lesson: nextLesson,
      scheduleItem: null,
      label: "Next Suggested Lesson"
    };
  }

  /**
   * Identifies the subject with the lowest completion percentage so the
   * dashboard can spotlight areas needing attention.
   */
  function getSubjectNeedingAttention() {
    const progressEntries = Object.keys(SUBJECTS).map((subjectId) => ({
      subjectId,
      progress: computeSubjectProgress(subjectId)
    }));
    progressEntries.sort((a, b) => a.progress.percent - b.progress.percent);
    return progressEntries[0];
  }

  /**
   * Converts a history entry into a friendly sentence for the achievements list.
   * @param {{lessonId:string, score:number|null, completedAt:string|null}} entry
   */
  function formatAchievement(entry) {
    const lesson = lessonIndex[entry.lessonId];
    if (!lesson) {
      return null;
    }
    const date = entry.completedAt ? new Date(entry.completedAt) : null;
    const dateLabel = date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recently";
    if (entry.score === null) {
      return `✅ Completed ${lesson.shortName} (${dateLabel})`;
    }
    return `🏅 ${lesson.shortName}: Scored ${Math.round(entry.score)}% (${dateLabel})`;
  }

  /**
   * Syncs lesson cards with completion state, toggling status labels and bars.
   * @param {ParentNode} root
   */
  function updateLessonCards(root) {
    root.querySelectorAll("[data-lesson-id]").forEach((card) => {
      const lessonId = card.getAttribute("data-lesson-id");
      const isComplete = getLessonProgress(lessonId);
      card.classList.toggle("lesson-card-completed", isComplete);
      const status = card.querySelector("[data-lesson-status]");
      if (status) {
        status.textContent = isComplete ? "Completed" : "Not started";
      }
      const bar = card.querySelector("[data-progress-bar]");
      if (bar) {
        bar.style.width = isComplete ? "100%" : "0%";
      }
    });
  }

  /**
   * Updates subject summary cards with completion and goal details.
   * @param {ParentNode} root
   */
  function updateSubjectCards(root) {
    root.querySelectorAll("[data-subject-progress]").forEach((card) => {
      const subjectId = card.getAttribute("data-subject-progress");
      const gradeId = card.getAttribute("data-grade") || null;
      const { completed, total, percent } = computeSubjectProgress(subjectId, { gradeId });
      const status = card.querySelector("[data-status]");
      if (status) {
        status.textContent = total ? `${completed} of ${total} lessons` : "No lessons yet";
      }
      const track = card.querySelector("[data-progress-track]");
      if (track) {
        track.setAttribute("aria-valuenow", String(completed));
        track.setAttribute("aria-valuemax", String(total));
      }
      const bar = card.querySelector("[data-progress-bar]");
      if (bar) {
        bar.style.width = `${percent}%`;
      }
    });
  }

      const goal = state.goals[subjectId];
      const goalEl = card.querySelector("[data-goal]");
      if (goalEl) {
        const goalParts = [];
        if (goal && goal.targetPercent !== null && !Number.isNaN(goal.targetPercent)) {
          goalParts.push(`${goal.targetPercent}% target`);
        }
        if (goal && goal.notes) {
          goalParts.push(goal.notes);
        }
        goalEl.textContent = goalParts.length ? goalParts.join(" • ") : "No goal set";
      }
    });
  }

  /**
   * Refreshes the category-level cards displayed on subject pages.
   * @param {ParentNode} root
   */
  function updateCategoryCards(root) {
    root.querySelectorAll("[data-category-progress]").forEach((card) => {
      const subjectId = card.getAttribute("data-subject");
      const categoryId = card.getAttribute("data-category-progress");
      const gradeId = card.getAttribute("data-grade") || null;
      const { completed, total, percent } = computeCategoryProgress(subjectId, categoryId, { gradeId });
      const status = card.querySelector("[data-status]");
      if (status) {
        status.textContent = total ? `${completed} of ${total} lessons` : "No lessons yet";
      }
      const bar = card.querySelector("[data-progress-bar]");
      if (bar) {
        bar.style.width = `${percent}%`;
      }
    });
  }

  /**
   * Re-renders progress panels for each grade level.
   * @param {ParentNode} root
   */
  function updateGradeCards(root) {
    root.querySelectorAll("[data-grade-progress]").forEach((card) => {
      const gradeId = card.getAttribute("data-grade-progress");
      const info = gradeIndex[gradeId];
      const { completed, total, percent } = computeGradeProgress(gradeId);
      const status = card.querySelector("[data-status]");
      if (status) {
        status.textContent = total ? `${completed} of ${total} lessons` : "No lessons yet";
      }
      const percentEl = card.querySelector("[data-grade-percent]");
      if (percentEl) {
        percentEl.textContent = `${percent}%`;
      }
      const summary = card.querySelector("[data-grade-summary]");
      if (summary && info) {
        summary.textContent = info.description;
      }
      const track = card.querySelector("[data-progress-track]");
      if (track) {
        track.setAttribute("aria-valuenow", String(percent));
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
      }
      const bar = card.querySelector("[data-progress-bar]");
      if (bar) {
        bar.style.width = `${percent}%`;
      }
    });
  }

  /**
   * Paints the attendance widget with the latest weekly completion tally.
   * @param {ParentNode} root
   */
  function updateAttendanceCard(root) {
    const attendanceCard = root.querySelector("[data-attendance-card]");
    if (!attendanceCard) {
      return;
    }
    const { completedDays, goalDays, percent } = computeAttendanceProgress();
    const status = attendanceCard.querySelector("[data-status]");
    if (status) {
      status.textContent = `${completedDays} of ${goalDays} days`;
    }
    const track = attendanceCard.querySelector("[data-progress-track]");
    if (track) {
      track.setAttribute("aria-valuenow", String(completedDays));
    }
    const bar = attendanceCard.querySelector("[data-progress-bar]");
    if (bar) {
      bar.style.width = `${percent}%`;
    }
  }

  /**
   * Writes the overall completion percentage into navigation badges.
   * @param {ParentNode} root
   * @param {{percent:number}} overall
   */
  function updateOverallProgress(root, overall = computeOverallProgress()) {
    const navProgress = root.querySelector("[data-overall-progress]");
    if (navProgress) {
      navProgress.textContent = `${overall.percent}%`;
    }
  }

  /**
   * Refreshes the "next lesson" quick link on dashboards and nav bars.
   * @param {ParentNode} root
   */
  function updateNextLesson(root) {
    const link = root.querySelector("[data-next-lesson]");
    if (!link) {
      return;
    }
    const lesson = getNextLesson();
    link.setAttribute("href", lesson.path);
    const label = root.querySelector("[data-next-lesson-label]");
    if (label) {
      const subjectLabel = SUBJECTS[lesson.subject]?.label || lesson.subject;
      label.textContent = `${subjectLabel} • ${lesson.name}`;
    }
  }

  /**
   * Orchestrates all per-page UI updates to keep progress-driven widgets in
   * sync.
   * @param {Document|ParentNode} root
   */
  function updateDashboard(root = document) {
    if (!root) {
      return;
    }
    const overall = computeOverallProgress();
    updateOverallProgress(root, overall);
    updateAttendanceCard(root);
    updateGradeCards(root);
    updateSubjectCards(root);
    updateCategoryCards(root);
    updateLessonCards(root);
    updateNextLesson(root);
    updateDynamicHighlights(root);
    const resetMessage = root.querySelector("[data-reset-message]");
    if (resetMessage && overall.completed > 0) {
      resetMessage.textContent = "";
    }
  }

  /**
   * Hydrates Today’s Focus, achievements, and schedule highlights with live
   * data each time progress changes.
   * @param {Document|ParentNode} root
   */
  function updateDynamicHighlights(root) {
    const focus = getTodaysFocus();
    const focusTitle = root.querySelector("[data-focus-title]");
    const focusDescription = root.querySelector("[data-focus-description]");
    const focusProgress = root.querySelector("[data-focus-progress]");
    const focusStatus = root.querySelector("[data-focus-status]");
    if (focus && focus.lesson) {
      const lesson = focus.lesson;
      const scheduleLabel = focus.scheduleItem
        ? `${formatTimeRange(focus.scheduleItem.time, lesson.estimatedMinutes)} • ${SUBJECTS[lesson.subject]?.label || lesson.subject}`
        : `${SUBJECTS[lesson.subject]?.label || lesson.subject}`;
      if (focusTitle) {
        focusTitle.textContent = lesson.name;
      }
      if (focusDescription) {
        focusDescription.textContent = focus.scheduleItem && focus.scheduleItem.notes
          ? focus.scheduleItem.notes
          : `Estimated ${lesson.estimatedMinutes} minutes to reinforce ${SUBJECTS[lesson.subject]?.categories?.[lesson.category]?.label || "key skills"}.`;
      }
      if (focusProgress) {
        const progress = getLessonProgress(lesson.id) ? 100 : 0;
        focusProgress.style.width = `${progress}%`;
      }
      if (focusStatus) {
        focusStatus.textContent = focus.scheduleItem ? `${focus.label} · ${scheduleLabel}` : focus.label;
      }
    }

    const achievementsList = root.querySelector("[data-achievements]");
    if (achievementsList) {
      achievementsList.innerHTML = "";
      const achievements = getRecentAchievements();
      if (!achievements.length) {
        const li = document.createElement("li");
        li.textContent = "Complete your first lesson to start earning achievements!";
        achievementsList.appendChild(li);
      } else {
        achievements.forEach((achievement) => {
          const formatted = formatAchievement(achievement);
          if (!formatted) {
            return;
          }
          const li = document.createElement("li");
          li.textContent = formatted;
          achievementsList.appendChild(li);
        });
      }
    }

    const nextUp = root.querySelector("[data-next-up]");
    if (nextUp) {
      const nextLesson = getNextLesson();
      if (nextLesson) {
        const subjectLabel = SUBJECTS[nextLesson.subject]?.label || nextLesson.subject;
        nextUp.textContent = `${subjectLabel}: ${nextLesson.shortName}`;
      }
    }

    const spotlight = root.querySelector("[data-subject-spotlight]");
    if (spotlight) {
      const subject = getSubjectNeedingAttention();
      if (subject) {
        const subjectInfo = SUBJECTS[subject.subjectId];
        if (subjectInfo) {
          spotlight.querySelector("h3").textContent = `${subjectInfo.label} Spotlight`;
          const paragraph = spotlight.querySelector("p");
          if (paragraph) {
            paragraph.textContent = `You're ${subject.progress.percent}% complete. Focus on ${subjectInfo.description}`;
          }
          const bar = spotlight.querySelector("[data-progress-bar]");
          if (bar) {
            bar.style.width = `${subject.progress.percent}%`;
          }
        }
      }
    }

    const todaySchedule = root.querySelector("[data-today-schedule]");
    if (todaySchedule) {
      todaySchedule.innerHTML = "";
      const schedule = getTodaysSchedule();
      if (!schedule.length) {
        const li = document.createElement("li");
        li.textContent = "No scheduled lessons today. Add items from the parent dashboard.";
        todaySchedule.appendChild(li);
      } else {
        schedule.forEach((item) => {
          const li = document.createElement("li");
          const lesson = lessonIndex[item.lessonId];
          if (!lesson) {
            return;
          }
          const subjectLabel = SUBJECTS[lesson.subject]?.label || lesson.subject;
          li.innerHTML = `<strong>${item.time}</strong> • ${lesson.shortName} <span>${subjectLabel}</span>`;
          if (item.notes) {
            const notes = document.createElement("div");
            notes.className = "schedule-note";
            notes.textContent = item.notes;
            li.appendChild(notes);
          }
          todaySchedule.appendChild(li);
        });
      }
    }
  }

  // Refresh state after the authenticated user context loads.
  window.addEventListener("lms:user-ready", () => {
    state = loadState();
    updateDashboard();
  });

  // Kick off initial rendering and bind reset controls once the DOM is ready.
  document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    const resetButton = document.querySelector("[data-reset-progress]");
    const resetMessage = document.querySelector("[data-reset-message]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        resetAllProgress();
        if (resetMessage) {
          resetMessage.textContent = "Progress cleared! You're starting fresh.";
        }
      });
    }
  });

  /**
   * Public API exposed to other scripts (lessons, dashboards, parent tools).
   * Keep this list in sync with documentation under docs/frontend/progress-module.md.
   */
  window.LMSProgress = {
    markLessonComplete,
    resetLessonProgress,
    resetAllProgress,
    getLessonProgress,
    computeSubjectProgress,
    computeCategoryProgress,
    computeGradeProgress,
    getNextLesson,
    updateDashboard,
    recordLessonAttempt,
    getLessonMetrics,
    getRecentAchievements,
    getTodaysSchedule,
    getWeeklySchedule,
    addScheduleItem,
    removeScheduleItem,
    updateScheduleItem,
    setLessonGrade,
    setSubjectGoal,
    getSubjectGoal,
    SUBJECTS,
    LESSONS,
    GRADES
  };
})();
