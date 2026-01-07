import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { adaptPlan } from "../utils/planner.js";

/* ===================== CONTEXT ===================== */
/* IMPORTANT: keep context default STABLE */
export const StudyPlanContext = createContext(null);

/* ===================== PROVIDER ===================== */
export const StudyPlanProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [studyPlan, setStudyPlan] = useState([]);
  const [streak, setStreak] = useState({
    current: 0,
    lastCompletedDate: null,
  });
  const [achievements, setAchievements] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===================== INITIAL LOAD ===================== */
  useEffect(() => {
    try {
      const storedProfile = JSON.parse(localStorage.getItem("userProfile"));
      const storedPlan = JSON.parse(localStorage.getItem("studyPlan"));
      const storedStreak =
        JSON.parse(localStorage.getItem("studyStreak")) || {
          current: 0,
          lastCompletedDate: null,
        };
      const storedAchievements =
        JSON.parse(localStorage.getItem("achievements")) || [];
      const storedExams =
        JSON.parse(localStorage.getItem("exams")) || [];

      if (storedProfile && storedPlan) {
        setUserProfile(storedProfile);

        const adaptedPlan = adaptPlan(storedPlan, storedProfile);
        setStudyPlan(adaptedPlan);
        localStorage.setItem("studyPlan", JSON.stringify(adaptedPlan));
      }

      setStreak(storedStreak);
      setAchievements(storedAchievements);
      setExams(storedExams);
    } catch (err) {
      console.error("LocalStorage load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ===================== UPDATE TASK STATUS ===================== */
  const updateTaskStatus = useCallback(
    (taskIdOrPlan, status) => {
      let updatedPlan;
      let updatedStreak = { ...streak };
      let updatedAchievements = [...achievements];

      if (Array.isArray(taskIdOrPlan)) {
        updatedPlan = taskIdOrPlan;
      } else {
        const taskId = taskIdOrPlan;
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 864e5)
          .toISOString()
          .split("T")[0];

        updatedPlan = studyPlan.map((task) => {
          if (task.id === taskId) {
            if (status === "Completed" && task.status !== "Completed") {
              if (streak.lastCompletedDate !== today) {
                updatedStreak.current =
                  streak.lastCompletedDate === yesterday
                    ? updatedStreak.current + 1
                    : 1;
                updatedStreak.lastCompletedDate = today;
              }
            }
            return { ...task, status };
          }
          return task;
        });
      }

      const completedCount = updatedPlan.filter(
        (t) => t.status === "Completed"
      ).length;

      const addAchievement = (id, name, icon, condition) => {
        if (
          condition &&
          !updatedAchievements.find((a) => a.id === id)
        ) {
          updatedAchievements.push({
            id,
            name,
            icon,
            date: new Date().toISOString(),
          });
        }
      };

      addAchievement("first_step", "First Step", "👟", completedCount >= 1);
      addAchievement("five_done", "High Five", "🖐️", completedCount >= 5);
      addAchievement("ten_done", "Ten-tastic!", "🔟", completedCount >= 10);
      addAchievement("streak_3", "On a Roll!", "🔥", updatedStreak.current >= 3);
      addAchievement("streak_7", "Week Warrior", "🗓️", updatedStreak.current >= 7);

      setStudyPlan(updatedPlan);
      setStreak(updatedStreak);
      setAchievements(updatedAchievements);

      localStorage.setItem("studyPlan", JSON.stringify(updatedPlan));
      localStorage.setItem("studyStreak", JSON.stringify(updatedStreak));
      localStorage.setItem("achievements", JSON.stringify(updatedAchievements));
    },
    [studyPlan, streak, achievements]
  );

  /* ===================== REFRESH FROM STORAGE ===================== */
  const refreshPlanFromStorage = useCallback(() => {
    try {
      const storedPlan = JSON.parse(localStorage.getItem("studyPlan"));
      if (storedPlan) setStudyPlan(storedPlan);
    } catch (err) {
      console.error("Failed to refresh plan:", err);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refreshPlanFromStorage);
    return () =>
      window.removeEventListener("storage", refreshPlanFromStorage);
  }, [refreshPlanFromStorage]);

  /* ===================== UPDATE EXAMS ===================== */
  const updateExams = useCallback((newExams) => {
    setExams(newExams);
    localStorage.setItem("exams", JSON.stringify(newExams));
  }, []);

  /* ===================== AUTO RESCHEDULE ON EXAMS ===================== */
  useEffect(() => {
    if (exams.length === 0 || studyPlan.length === 0) return;

    console.log('🎯 AUTO-RESCHEDULE TRIGGERED');
    
    const today = new Date().toISOString().split("T")[0];
    const MAX_TASKS_PER_DAY = 4;

    const upcomingExams = exams.filter((exam) => {
      const daysLeft = Math.ceil((new Date(exam.date) - new Date(today)) / (1000 * 60 * 60 * 24));
      return daysLeft > 0;
    });

    console.log(`📊 Today: ${today}`);
    console.log(`📚 Upcoming exams: ${upcomingExams.length}`);
    upcomingExams.forEach(exam => console.log(`   - ${exam.name}: ${exam.date}, Subjects: ${exam.subjects?.join(', ')}`));
    console.log(`📋 Total tasks in plan: ${studyPlan.length}`);

    if (upcomingExams.length === 0) return;

    let rescheduledCount = 0;
    let removedCount = 0;
    let pausedCount = 0;

    // Process each exam separately
    let finalPlan = [...studyPlan];

    upcomingExams.forEach((currentExam) => {
      const examDate = new Date(currentExam.date);
      const twoDaysBeforeExam = new Date(examDate);
      twoDaysBeforeExam.setDate(twoDaysBeforeExam.getDate() - 2);
      const twoDaysBeforeStr = twoDaysBeforeExam.toISOString().split("T")[0];
      
      const oneDayBeforeExam = new Date(examDate);
      oneDayBeforeExam.setDate(oneDayBeforeExam.getDate() - 1);
      const oneDayBeforeExamStr = oneDayBeforeExam.toISOString().split("T")[0];
      
      const examDateStr = currentExam.date;

      console.log(`\n🎯 Processing exam: ${currentExam.name} (${examDateStr})`);
      console.log(`   Exam subject focus window: ${twoDaysBeforeStr} to ${oneDayBeforeExamStr}`);

      // Step 1: Separate exam and non-exam tasks
      const examSubjects = currentExam.subjects || [];
      const examSubjectTasks = finalPlan.filter(
        task => examSubjects.includes(task.subject) && task.status !== 'Completed'
      );

      const nonExamTasks = finalPlan.filter(
        task => !examSubjects.includes(task.subject) && task.status !== 'Completed'
      );

      console.log(`   📚 Exam subject (${examSubjects.join('/')}) tasks: ${examSubjectTasks.length}`);

      // Step 2: Categorize exam subject tasks
      const examTasksBeforeWindow = examSubjectTasks.filter(t => new Date(t.date) < twoDaysBeforeExam);
      const examTasksInWindow = examSubjectTasks.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= twoDaysBeforeExam && tDate < examDate;
      });
      const examTasksOnExamDay = examSubjectTasks.filter(t => new Date(t.date) >= examDate);

      removedCount += examTasksOnExamDay.length;
      console.log(`   🗑️ Removing ${examTasksOnExamDay.length} exam subject tasks on/after exam date`);

      // Step 3: Separate non-exam tasks
      const nonExamTasksBeforeWindow = nonExamTasks.filter(t => new Date(t.date) < twoDaysBeforeExam);
      const nonExamTasksInWindow = nonExamTasks.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= twoDaysBeforeExam && tDate <= examDate;
      });
      const nonExamTasksAfterExam = nonExamTasks.filter(t => new Date(t.date) > examDate);

      pausedCount += nonExamTasksInWindow.length;
      console.log(`   ⏸️ Pausing ${nonExamTasksInWindow.length} non-exam subject tasks during focus window`);

      // Step 4: Reschedule exam tasks to focus window smartly
      const focusWindowDays = [twoDaysBeforeStr, oneDayBeforeExamStr];
      const tasksPerFocusDay = { [twoDaysBeforeStr]: 0, [oneDayBeforeExamStr]: 0 };

      // Count existing tasks in focus window
      examTasksInWindow.forEach(task => {
        tasksPerFocusDay[task.date] = (tasksPerFocusDay[task.date] || 0) + 1;
      });

      // Group exam tasks by type (regular vs revision)
      const regularExamTasks = examTasksBeforeWindow.filter(t => !t.isRevision);
      const revisionExamTasks = examTasksBeforeWindow.filter(t => t.isRevision);

      console.log(`   📅 Exam tasks to reschedule: ${regularExamTasks.length} regular, ${revisionExamTasks.length} revision`);

      // Reschedule: prioritize placing regular tasks first, then revisions
      const rescheduledExamTasks = [
        ...regularExamTasks.map(task => {
          let targetDay = null;
          for (const day of focusWindowDays) {
            if ((tasksPerFocusDay[day] || 0) < MAX_TASKS_PER_DAY) {
              targetDay = day;
              tasksPerFocusDay[day] = (tasksPerFocusDay[day] || 0) + 1;
              rescheduledCount++;
              console.log(`   ↪️ Rescheduling ${task.subject} to ${day} (regular)`);
              break;
            }
          }
          if (targetDay) return { ...task, date: targetDay, isAutoRescheduled: true };
          return null;
        }),
        ...revisionExamTasks.map(task => {
          let targetDay = null;
          for (const day of focusWindowDays) {
            if ((tasksPerFocusDay[day] || 0) < MAX_TASKS_PER_DAY) {
              targetDay = day;
              tasksPerFocusDay[day] = (tasksPerFocusDay[day] || 0) + 1;
              rescheduledCount++;
              console.log(`   ↪️ Rescheduling ${task.subject} to ${day} (revision)`);
              break;
            }
          }
          if (targetDay) return { ...task, date: targetDay, isAutoRescheduled: true };
          return null;
        }),
      ].filter(t => t !== null);

      // Step 5: Enforce max 4 tasks per day on regular days (before focus window)
      const tasksBeforeWindow = [
        ...examTasksBeforeWindow.filter(t => !rescheduledExamTasks.find(rt => rt.id === t.id)),
        ...nonExamTasksBeforeWindow,
      ];

      const tasksPerRegularDay = {};
      tasksBeforeWindow.forEach(task => {
        tasksPerRegularDay[task.date] = (tasksPerRegularDay[task.date] || 0) + 1;
      });

      const validTasksBeforeWindow = tasksBeforeWindow.filter(task => {
        const count = tasksPerRegularDay[task.date] || 0;
        // Keep only if this day hasn't exceeded max
        if (count <= MAX_TASKS_PER_DAY) {
          return true;
        }
        // Remove excess tasks
        tasksPerRegularDay[task.date] -= 1;
        removedCount++;
        return false;
      });

      // Step 6: Build final plan for this exam
      finalPlan = [
        ...validTasksBeforeWindow,
        ...examTasksInWindow,
        ...rescheduledExamTasks,
        ...nonExamTasksAfterExam,
      ];
    });

    console.log(`\n✅ RESCHEDULE SUMMARY:`);
    console.log(`  📅 Rescheduled: ${rescheduledCount}`);
    console.log(`  🗑️ Removed: ${removedCount}`);
    console.log(`  ⏸️ Paused: ${pausedCount}`);
    console.log(`  ✅ Max ${MAX_TASKS_PER_DAY} tasks/day enforced everywhere`);
    console.log(`  📌 Exam focus window: ONLY exam subject tasks\n`);

    setStudyPlan(finalPlan);
    localStorage.setItem("studyPlan", JSON.stringify(finalPlan));
  }, [exams, studyPlan.length]);

  /* ===================== PROVIDER VALUE ===================== */
  const value = {
    userProfile,
    studyPlan,
    streak,
    achievements,
    exams,
    updateTaskStatus,
    updateExams,
    loading,
    refreshPlanFromStorage,
  };

  return (
    <StudyPlanContext.Provider value={value}>
      {!loading && children}
    </StudyPlanContext.Provider>
  );
};
