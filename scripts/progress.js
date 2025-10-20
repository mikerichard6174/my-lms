(function () {
  const STORAGE_KEY = "my-lms-progress-v1";

  const LESSONS = [
    { id: "math1", subject: "math", name: "Lesson 1: Learning Numbers", path: "lessons/lesson1.html" },
    { id: "math2", subject: "math", name: "Lesson 2: Counting Objects", path: "lessons/lesson2.html" },
    { id: "math3", subject: "math", name: "Lesson 3: Number to Word Matching", path: "lessons/lesson3.html" },
    { id: "english1", subject: "english", name: "Lesson 4: Story Sequencing", path: "lessons/english1.html" },
    { id: "english2", subject: "english", name: "Lesson 5: Vocabulary Builder", path: "lessons/english2.html" },
    { id: "science1", subject: "science", name: "Lesson 6: Weather Watch", path: "lessons/science1.html" },
    { id: "science2", subject: "science", name: "Lesson 7: Habitat Match-Up", path: "lessons/science2.html" }
  ];

  const SUBJECT_LABELS = {
    math: "Math Adventures",
    english: "English Explorers",
    science: "Science Lab"
  };

  const lessonIndex = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson]));
  const subjectLessons = LESSONS.reduce((acc, lesson) => {
    if (!acc[lesson.subject]) {
      acc[lesson.subject] = [];
    }
    acc[lesson.subject].push(lesson.id);
    return acc;
  }, {});

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const defaultState = {
    lessons: LESSONS.reduce((acc, lesson) => {
      acc[lesson.id] = false;
      return acc;
    }, {})
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
      if (parsed && typeof parsed === "object" && parsed.lessons) {
        Object.entries(parsed.lessons).forEach(([id, value]) => {
          if (Object.prototype.hasOwnProperty.call(nextState.lessons, id)) {
            nextState.lessons[id] = Boolean(value);
          }
        });
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

  function setLessonState(lessonId, isComplete) {
    if (!lessonIndex[lessonId]) {
      return;
    }
    if (state.lessons[lessonId] === isComplete) {
      return;
    }
    state.lessons[lessonId] = isComplete;
    persistState();
  }

  function markLessonComplete(lessonId) {
    setLessonState(lessonId, true);
    updateDashboard();
  }

  function resetLessonProgress(lessonId) {
    setLessonState(lessonId, false);
    updateDashboard();
  }

  function resetAllProgress() {
    state = clone(defaultState);
    persistState();
    updateDashboard();
  }

  function getLessonProgress(lessonId) {
    return Boolean(state.lessons[lessonId]);
  }

  function computeSubjectProgress(subjectId) {
    const lessons = subjectLessons[subjectId] || [];
    const completed = lessons.filter((id) => getLessonProgress(id)).length;
    const total = lessons.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }

  function computeOverallProgress() {
    const total = LESSONS.length;
    const completed = Object.values(state.lessons).filter(Boolean).length;
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
      const subjectLabel = SUBJECT_LABELS[lesson.subject] || lesson.subject;
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
    updateLessonCards(root);
    updateNextLesson(root);
    const resetMessage = root.querySelector("[data-reset-message]");
    if (resetMessage && overall.completed > 0) {
      resetMessage.textContent = "";
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
    getNextLesson,
    updateDashboard
  };
})();
