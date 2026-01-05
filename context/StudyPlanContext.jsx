import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { adaptPlan } from "../utils/planner.js";

/* -------------------- CONTEXT -------------------- */
export const StudyPlanContext = createContext({
  userProfile: null,
  studyPlan: [],
  streak: { current: 0, lastCompletedDate: null },
  achievements: [],
  exams: [],
  updateTaskStatus: () => {},
  loading: true,
  refreshPlanFromStorage: () => {},
  updateExams: () => {},
});

/* -------------------- PROVIDER -------------------- */
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

  /* -------------------- INITIAL LOAD -------------------- */
  useEffect(() => {
    try {
      const storedProfile = JSON.parse(localStorage.getItem("userProfile"));
      const storedPlan = JSON.parse(localStorage.getItem("studyPlan"));
      const storedStreak =
        JSON.parse(localStorage.getItem("studyStreak")) || streak;
      const storedAchievements =
        JSON.parse(localStorage.getItem("achievements")) || [];
      const storedExams = 
        JSON.parse(localStorage.getItem("exams")) || [];

      if (storedProfile && storedPlan) {
        setUserProfile(storedProfile);

        // Adaptive rescheduling for missed tasks
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

  /* -------------------- UPDATE TASK STATUS -------------------- */
  const updateTaskStatus = useCallback(
    (taskIdOrPlan, status) => {
      // Support two modes: updateTaskStatus(id, status) or updateTaskStatus(fullPlan)
      let updatedPlan;
      let updatedStreak = { ...streak };
      let updatedAchievements = [...achievements];

      // Check if first parameter is an array (full plan) or string (task ID)
      if (Array.isArray(taskIdOrPlan)) {
        // Mode 1: Full plan replacement (for Emergency Catch-Up)
        updatedPlan = taskIdOrPlan;
      } else {
        // Mode 2: Single task update by ID and status
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

  /* -------------------- REFRESH FROM STORAGE -------------------- */
  const refreshPlanFromStorage = useCallback(() => {
    try {
      const storedPlan = JSON.parse(localStorage.getItem("studyPlan"));
      if (storedPlan) setStudyPlan(storedPlan);
    } catch (err) {
      console.error("Failed to refresh plan:", err);
    }
  }, []);

  /* -------------------- STORAGE SYNC -------------------- */
  useEffect(() => {
    window.addEventListener("storage", refreshPlanFromStorage);
    return () =>
      window.removeEventListener("storage", refreshPlanFromStorage);
  }, [refreshPlanFromStorage]);

  /* -------------------- UPDATE EXAMS -------------------- */
  const updateExams = useCallback((newExams) => {
    setExams(newExams);
    localStorage.setItem("exams", JSON.stringify(newExams));
  }, []);

  /* -------------------- PROVIDER VALUE -------------------- */
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

// import React, { createContext, useState, useEffect, useCallback } from 'react';
// import { adaptPlan } from '../utils/planner.js';

// export const StudyPlanContext = createContext();

// export const StudyPlanProvider = ({ children }) => {
//   const [userProfile, setUserProfile] = useState(null);
//   const [studyPlan, setStudyPlan] = useState([]);
//   const [streak, setStreak] = useState({ current: 0, lastCompletedDate: null });
//   const [achievements, setAchievements] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     try {
//       const storedProfile = JSON.parse(localStorage.getItem('userProfile'));
//       const storedPlan = JSON.parse(localStorage.getItem('studyPlan'));
//       const storedStreak = JSON.parse(localStorage.getItem('studyStreak')) || { current: 0, lastCompletedDate: null };
//       const storedAchievements = JSON.parse(localStorage.getItem('achievements')) || [];

//       if (storedProfile && storedPlan) {
//         setUserProfile(storedProfile);
//         // On load, run adaptive logic to reschedule any missed tasks from previous days
//         const adapted = adaptPlan(storedPlan, storedProfile);
//         setStudyPlan(adapted);
//         localStorage.setItem('studyPlan', JSON.stringify(adapted));
//       }
//       setStreak(storedStreak);
//       setAchievements(storedAchievements);
//     } catch (error) {
//       console.error("Failed to load data from localStorage", error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const updateTaskStatus = useCallback((taskId, status) => {
//     let updatedStreak = { ...streak };
//     let newAchievements = [...achievements];
    
//     const updatedPlan = studyPlan.map(task => {
//       if (task.id === taskId) {
//         // Handle streak logic
//         if (status === 'Completed' && task.status !== 'Completed') {
//           const today = new Date().toISOString().split('T')[0];
//           const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
          
//           if (streak.lastCompletedDate !== today) {
//             if (streak.lastCompletedDate === yesterday) {
//               updatedStreak.current += 1;
//             } else {
//               updatedStreak.current = 1;
//             }
//             updatedStreak.lastCompletedDate = today;
//           }
//         }
//         return { ...task, status };
//       }
//       return task;
//     });

//     const completedCount = updatedPlan.filter(t => t.status === 'Completed').length;
    
//     // Handle achievements
//     const checkAndAddAchievement = (id, name, icon, condition) => {
//       if (!newAchievements.find(a => a.id === id) && condition) {
//         newAchievements.push({ id, name, icon, date: new Date().toISOString() });
//       }
//     };

//     checkAndAddAchievement('first_step', 'First Step', '👟', completedCount >= 1);
//     checkAndAddAchievement('five_done', 'High Five', '🖐️', completedCount >= 5);
//     checkAndAddAchievement('ten_done', 'Ten-tastic!', '🔟', completedCount >= 10);
//     checkAndAddAchievement('streak_3', 'On a Roll!', '🔥', updatedStreak.current >= 3);
//     checkAndAddAchievement('streak_7', 'Week Warrior', '🗓️', updatedStreak.current >= 7);

//     setStudyPlan(updatedPlan);
//     setStreak(updatedStreak);
//     setAchievements(newAchievements);
    
//     localStorage.setItem('studyPlan', JSON.stringify(updatedPlan));
//     localStorage.setItem('studyStreak', JSON.stringify(updatedStreak));
//     localStorage.setItem('achievements', JSON.stringify(newAchievements));

//   }, [studyPlan, streak, achievements]);

//   const refreshPlanFromStorage = useCallback(() => {
//     try {
//       const storedPlan = JSON.parse(localStorage.getItem('studyPlan'));
//       if (storedPlan) {
//         setStudyPlan(storedPlan);
//       }
//     } catch (error) {
//       console.error("Failed to refresh plan from localStorage", error);
//     }
//   }, []);

//   // Listen for storage changes from other parts of the app (e.g., WeaknessActionCard)
//   useEffect(() => {
//     const handleStorageChange = () => {
//       refreshPlanFromStorage();
//     };

//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [refreshPlanFromStorage]);

//   const value = {
//     userProfile,
//     studyPlan,
//     streak,
//     achievements,
//     updateTaskStatus,
//     loading,
//     refreshPlanFromStorage
//   };

//   return (
//     <StudyPlanContext.Provider value={value}>
//       {!loading && children}
//     </StudyPlanContext.Provider>
//   );
// };
