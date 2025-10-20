(function () {
  const STORAGE_KEY = "my-lms-progress-v2";

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

  const LESSONS = [
    {
      id: "math1",
      subject: "math",
      category: "counting",
      name: "Lesson 1: Learning Numbers",
      shortName: "Learning Numbers",
      path: "lessons/lesson1.html",
      estimatedMinutes: 8
    },
    {
      id: "math2",
      subject: "math",
      category: "counting",
      name: "Lesson 2: Counting Objects",
      shortName: "Counting Objects",
      path: "lessons/lesson2.html",
      estimatedMinutes: 7
    },
    {
      id: "math3",
      subject: "math",
      category: "operations",
      name: "Lesson 3: Number to Word Matching",
      shortName: "Number Word Match",
      path: "lessons/lesson3.html",
      estimatedMinutes: 6
    },
    {
      id: "english1",
      subject: "english",
      category: "reading",
      name: "Lesson 4: Story Sequencing",
      shortName: "Story Sequencing",
      path: "lessons/english1.html",
      estimatedMinutes: 10
    },
    {
      id: "english2",
      subject: "english",
      category: "vocabulary",
      name: "Lesson 5: Vocabulary Builder",
      shortName: "Vocabulary Builder",
      path: "lessons/english2.html",
      estimatedMinutes: 9
    },
    {
      id: "science1",
      subject: "science",
      category: "weather",
      name: "Lesson 6: Weather Watch",
      shortName: "Weather Watch",
      path: "lessons/science1.html",
      estimatedMinutes: 6
    },
    {
      id: "science2",
      subject: "science",
      category: "life",
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

  function loadState() {
    if (!storageAvailable) {
      return clone(defaultState);
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
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

  function persistState() {
    if (!storageAvailable) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function cryptoRandomId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `id-${Math.random().toString(16).slice(2, 10)}`;
  }

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

  function setLessonMetrics(lessonId, partial) {
    const record = getLessonRecord(lessonId);
    if (!record) {
      return;
    }
    Object.assign(record, partial);
    persistState();
  }

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

  function markLessonComplete(lessonId, details = {}) {
    recordLessonAttempt(lessonId, { ...details, completed: true });
  }

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

  function resetAllProgress() {
    state = clone(defaultState);
    persistState();
    updateDashboard();
  }

  function getLessonProgress(lessonId) {
    const record = getLessonRecord(lessonId);
    return record ? Boolean(record.completed) : false;
  }

  function computeSubjectProgress(subjectId) {
    const lessons = subjectLessons[subjectId] || [];
    const completed = lessons.filter((id) => getLessonProgress(id)).length;
    const total = lessons.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  function computeCategoryProgress(subjectId, categoryId) {
    const lessons = categoryLessons[`${subjectId}:${categoryId}`] || [];
    const completed = lessons.filter((id) => getLessonProgress(id)).length;
    const total = lessons.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  function computeOverallProgress() {
    const total = LESSONS.length;
    const completed = Object.values(state.lessons).filter((lesson) => lesson && lesson.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  function computeAttendanceProgress(goalDays = 5) {
    const overall = computeOverallProgress();
    const completedDays = Math.min(goalDays, overall.completed);
    const percent = goalDays ? Math.round((completedDays / goalDays) * 100) : 0;
    return { completedDays, goalDays, percent };
  }

  function getNextLesson() {
    const next = LESSONS.find((lesson) => !getLessonProgress(lesson.id));
    return next || LESSONS[LESSONS.length - 1];
  }

  function getLessonMetrics(lessonId) {
    const record = getLessonRecord(lessonId);
    if (!record) {
      return null;
    }
    return clone(record);
  }

  function getRecentAchievements(limit = 3) {
    return state.history.slice(0, limit).map((entry) => ({
      ...entry,
      lesson: lessonIndex[entry.lessonId]
    }));
  }

  function getSubjectGoal(subjectId) {
    return clone(state.goals[subjectId] || { targetPercent: null, notes: "" });
  }

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

  function removeScheduleItem(id) {
    const before = state.schedule.length;
    state.schedule = state.schedule.filter((item) => item.id !== id);
    if (state.schedule.length !== before) {
      persistState();
      updateDashboard();
    }
  }

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

  function getDaySchedule(day) {
    const normalized = (day || "").toLowerCase();
    const filtered = state.schedule.filter((item) => item.day === normalized);
    return filtered
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((item) => ({ ...item, lesson: lessonIndex[item.lessonId] }));
  }

  function getWeeklySchedule() {
    return DAYS_ORDER.map((day) => ({ day, items: getDaySchedule(day) }));
  }

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

  function getTodaysSchedule(date = new Date()) {
    const day = DAYS_ORDER[date.getDay() === 0 ? 6 : date.getDay() - 1];
    return getDaySchedule(day);
  }

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

  function getSubjectNeedingAttention() {
    const progressEntries = Object.keys(SUBJECTS).map((subjectId) => ({
      subjectId,
      progress: computeSubjectProgress(subjectId)
    }));
    progressEntries.sort((a, b) => a.progress.percent - b.progress.percent);
    return progressEntries[0];
  }

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

  function updateSubjectCards(root) {
    root.querySelectorAll("[data-subject-progress]").forEach((card) => {
      const subjectId = card.getAttribute("data-subject-progress");
      const { completed, total, percent } = computeSubjectProgress(subjectId);
      const status = card.querySelector("[data-status]");
      if (status) {
        status.textContent = `${completed} of ${total} lessons`;
      }
      const track = card.querySelector("[data-progress-track]");
      if (track) {
        track.setAttribute("aria-valuenow", String(completed));
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

  function updateCategoryCards(root) {
    root.querySelectorAll("[data-category-progress]").forEach((card) => {
      const subjectId = card.getAttribute("data-subject");
      const categoryId = card.getAttribute("data-category-progress");
      const { completed, total, percent } = computeCategoryProgress(subjectId, categoryId);
      const status = card.querySelector("[data-status]");
      if (status) {
        status.textContent = `${completed} of ${total} lessons`;
      }
      const bar = card.querySelector("[data-progress-bar]");
      if (bar) {
        bar.style.width = `${percent}%`;
      }
    });
  }

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

  function updateOverallProgress(root, overall = computeOverallProgress()) {
    const navProgress = root.querySelector("[data-overall-progress]");
    if (navProgress) {
      navProgress.textContent = `${overall.percent}%`;
    }
  }

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

  function updateDashboard(root = document) {
    if (!root) {
      return;
    }
    const overall = computeOverallProgress();
    updateOverallProgress(root, overall);
    updateAttendanceCard(root);
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

  window.LMSProgress = {
    markLessonComplete,
    resetLessonProgress,
    resetAllProgress,
    getLessonProgress,
    computeSubjectProgress,
     computeCategoryProgress,
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
    LESSONS
  };
})();
