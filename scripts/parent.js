(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const progress = window.LMSProgress;
    if (!progress) {
      return;
    }

    const subjectSelect = document.querySelector("[data-subject-select]");
    const lessonSelect = document.querySelector("[data-lesson-select]");
    const scheduleForm = document.querySelector("[data-schedule-form]");
    const scheduleList = document.querySelector("[data-schedule-list]");
    const scheduleFeedback = document.querySelector("[data-schedule-feedback]");
    const goalGrid = document.querySelector("[data-goal-grid]");
    const gradeRows = document.querySelector("[data-grade-rows]");

    const SUBJECTS = progress.SUBJECTS || {};
    const LESSONS = progress.LESSONS || [];
    const lessonsBySubject = LESSONS.reduce((acc, lesson) => {
      if (!acc[lesson.subject]) {
        acc[lesson.subject] = [];
      }
      acc[lesson.subject].push(lesson);
      return acc;
    }, {});

    const DAY_LABELS = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday"
    };

    function renderSubjectOptions() {
      if (!subjectSelect) {
        return;
      }
      subjectSelect.innerHTML = "";
      Object.values(SUBJECTS).forEach((subject, index) => {
        const option = document.createElement("option");
        option.value = subject.id;
        option.textContent = subject.label;
        if (index === 0) {
          option.selected = true;
        }
        subjectSelect.append(option);
      });
      updateLessonOptions(subjectSelect.value);
    }

    function updateLessonOptions(subjectId) {
      if (!lessonSelect) {
        return;
      }
      const lessons = lessonsBySubject[subjectId] || [];
      lessonSelect.innerHTML = "";
      lessons.forEach((lesson) => {
        const option = document.createElement("option");
        option.value = lesson.id;
        option.textContent = lesson.name;
        lessonSelect.append(option);
      });
      if (!lessons.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No lessons available";
        lessonSelect.append(option);
      }
    }

    function renderSchedule() {
      if (!scheduleList) {
        return;
      }
      const weekly = progress.getWeeklySchedule ? progress.getWeeklySchedule() : [];
      scheduleList.innerHTML = "";
      weekly.forEach(({ day, items }) => {
        const column = document.createElement("section");
        column.className = "schedule-column";
        const title = document.createElement("h3");
        title.textContent = DAY_LABELS[day] || day;
        column.append(title);
        const list = document.createElement("ul");
        list.className = "schedule-day";
        if (!items.length) {
          const li = document.createElement("li");
          li.className = "schedule-empty";
          li.textContent = "No lessons scheduled.";
          list.append(li);
        } else {
          items.forEach((item) => {
            const li = document.createElement("li");
            li.className = "schedule-item";
            const header = document.createElement("div");
            header.className = "schedule-item-header";
            const time = document.createElement("strong");
            time.textContent = item.time;
            header.append(time);
            const label = document.createElement("span");
            const subjectLabel = SUBJECTS[item.lesson?.subject]?.label || item.lesson?.subject || "";
            label.textContent = `${item.lesson?.shortName || item.lesson?.name || "Lesson"} • ${subjectLabel}`;
            header.append(label);
            li.append(header);
            if (item.notes) {
              const notes = document.createElement("p");
              notes.className = "schedule-note";
              notes.textContent = item.notes;
              li.append(notes);
            }
            const actions = document.createElement("div");
            actions.className = "schedule-actions";
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "button tertiary";
            removeBtn.textContent = "Remove";
            removeBtn.addEventListener("click", () => {
              progress.removeScheduleItem(item.id);
              renderSchedule();
              showScheduleFeedback("Removed from schedule.");
            });
            actions.append(removeBtn);
            li.append(actions);
            list.append(li);
          });
        }
        column.append(list);
        scheduleList.append(column);
      });
    }

    function showScheduleFeedback(message, isError = false) {
      if (!scheduleFeedback) {
        return;
      }
      scheduleFeedback.textContent = message;
      scheduleFeedback.classList.toggle("error", isError);
    }

    function renderGoals() {
      if (!goalGrid) {
        return;
      }
      goalGrid.innerHTML = "";
      Object.values(SUBJECTS).forEach((subject) => {
        const goal = progress.getSubjectGoal ? progress.getSubjectGoal(subject.id) : { targetPercent: null, notes: "" };
        const card = document.createElement("article");
        card.className = "goal-card";
        const title = document.createElement("h3");
        title.textContent = subject.label;
        const description = document.createElement("p");
        description.textContent = subject.description;
        const targetLabel = document.createElement("label");
        targetLabel.textContent = "Target completion (%)";
        const targetInput = document.createElement("input");
        targetInput.type = "number";
        targetInput.min = "0";
        targetInput.max = "100";
        targetInput.value = goal.targetPercent ?? "";
        targetInput.placeholder = "e.g. 75";
        targetInput.addEventListener("input", () => {
          progress.setSubjectGoal(subject.id, {
            targetPercent: targetInput.value === "" ? null : Number(targetInput.value),
            notes: notesArea.value
          });
        });
        targetLabel.append(targetInput);
        const notesLabel = document.createElement("label");
        notesLabel.textContent = "Notes";
        const notesArea = document.createElement("textarea");
        notesArea.rows = 2;
        notesArea.placeholder = "Encouragement or focus areas";
        notesArea.value = goal.notes || "";
        notesArea.addEventListener("input", () => {
          progress.setSubjectGoal(subject.id, {
            targetPercent: targetInput.value === "" ? null : Number(targetInput.value),
            notes: notesArea.value
          });
        });
        notesLabel.append(notesArea);
        card.append(title, description, targetLabel, notesLabel);
        goalGrid.append(card);
      });
    }

    function renderGrades() {
      if (!gradeRows) {
        return;
      }
      gradeRows.innerHTML = "";
      LESSONS.forEach((lesson) => {
        const metrics = progress.getLessonMetrics ? progress.getLessonMetrics(lesson.id) : null;
        const row = document.createElement("div");
        row.className = "grade-row";
        row.setAttribute("role", "row");

        const lessonCell = document.createElement("span");
        lessonCell.setAttribute("role", "cell");
        lessonCell.innerHTML = `<strong>${lesson.name}</strong><small>${SUBJECTS[lesson.subject]?.label || ""}</small>`;

        const scoreCell = document.createElement("span");
        scoreCell.setAttribute("role", "cell");
        const bestScore = metrics && metrics.bestScore !== null ? `${Math.round(metrics.bestScore)}%` : "—";
        const attempts = metrics ? metrics.attempts : 0;
        scoreCell.textContent = `${bestScore} (Attempts: ${attempts})`;

        const gradeCell = document.createElement("span");
        gradeCell.setAttribute("role", "cell");
        const gradeInput = document.createElement("input");
        gradeInput.type = "number";
        gradeInput.min = "0";
        gradeInput.max = "100";
        gradeInput.value = metrics && metrics.grade !== null ? metrics.grade : "";
        gradeInput.placeholder = "Set grade";
        gradeInput.addEventListener("change", () => {
          const value = gradeInput.value === "" ? null : Number(gradeInput.value);
          progress.setLessonGrade(lesson.id, value);
          renderGrades();
        });
        gradeCell.append(gradeInput);

        const completionCell = document.createElement("span");
        completionCell.setAttribute("role", "cell");
        const completionButton = document.createElement("button");
        completionButton.type = "button";
        completionButton.className = "button tertiary";
        const isComplete = metrics ? Boolean(metrics.completed) : false;
        completionButton.textContent = isComplete ? "Mark Incomplete" : "Mark Complete";
        completionButton.addEventListener("click", () => {
          if (isComplete) {
            progress.resetLessonProgress(lesson.id);
          } else {
            progress.markLessonComplete(lesson.id, { score: metrics?.bestScore ?? null });
          }
          renderGrades();
        });
        completionCell.append(completionButton);

        row.append(lessonCell, scoreCell, gradeCell, completionCell);
        gradeRows.append(row);
      });
    }

    if (subjectSelect) {
      subjectSelect.addEventListener("change", (event) => {
        updateLessonOptions(event.target.value);
      });
    }

    if (scheduleForm) {
      scheduleForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(scheduleForm);
        const lessonId = formData.get("lesson");
        if (!lessonId) {
          showScheduleFeedback("Select a lesson to add.", true);
          return;
        }
        progress.addScheduleItem({
          lessonId,
          day: formData.get("day"),
          time: formData.get("time"),
          notes: formData.get("notes")
        });
        showScheduleFeedback("Scheduled successfully!");
        scheduleForm.reset();
        updateLessonOptions(subjectSelect.value);
        renderSchedule();
        renderGoals();
        renderGrades();
      });
    }

    renderSubjectOptions();
    renderSchedule();
    renderGoals();
    renderGrades();
  });
})();
