
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { adaptPlan } from '../utils/planner.js';

export const StudyPlanContext = createContext();

export const StudyPlanProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [studyPlan, setStudyPlan] = useState([]);
  const [streak, setStreak] = useState({ current: 0, lastCompletedDate: null });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedProfile = JSON.parse(localStorage.getItem('userProfile'));
      const storedPlan = JSON.parse(localStorage.getItem('studyPlan'));
      const storedStreak = JSON.parse(localStorage.getItem('studyStreak')) || { current: 0, lastCompletedDate: null };
      const storedAchievements = JSON.parse(localStorage.getItem('achievements')) || [];

      if (storedProfile && storedPlan) {
        setUserProfile(storedProfile);
        // On load, run adaptive logic to reschedule any missed tasks from previous days
        const adapted = adaptPlan(storedPlan, storedProfile);
        setStudyPlan(adapted);
        localStorage.setItem('studyPlan', JSON.stringify(adapted));
      }
      setStreak(storedStreak);
      setAchievements(storedAchievements);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback((taskId, status) => {
    let updatedStreak = { ...streak };
    let newAchievements = [...achievements];
    
    const updatedPlan = studyPlan.map(task => {
      if (task.id === taskId) {
        // Handle streak logic
        if (status === 'Completed' && task.status !== 'Completed') {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
          
          if (streak.lastCompletedDate !== today) {
            if (streak.lastCompletedDate === yesterday) {
              updatedStreak.current += 1;
            } else {
              updatedStreak.current = 1;
            }
            updatedStreak.lastCompletedDate = today;
          }
        }
        return { ...task, status };
      }
      return task;
    });

    const completedCount = updatedPlan.filter(t => t.status === 'Completed').length;
    
    // Handle achievements
    const checkAndAddAchievement = (id, name, icon, condition) => {
      if (!newAchievements.find(a => a.id === id) && condition) {
        newAchievements.push({ id, name, icon, date: new Date().toISOString() });
      }
    };

    checkAndAddAchievement('first_step', 'First Step', '👟', completedCount >= 1);
    checkAndAddAchievement('five_done', 'High Five', '🖐️', completedCount >= 5);
    checkAndAddAchievement('ten_done', 'Ten-tastic!', '🔟', completedCount >= 10);
    checkAndAddAchievement('streak_3', 'On a Roll!', '🔥', updatedStreak.current >= 3);
    checkAndAddAchievement('streak_7', 'Week Warrior', '🗓️', updatedStreak.current >= 7);

    setStudyPlan(updatedPlan);
    setStreak(updatedStreak);
    setAchievements(newAchievements);
    
    localStorage.setItem('studyPlan', JSON.stringify(updatedPlan));
    localStorage.setItem('studyStreak', JSON.stringify(updatedStreak));
    localStorage.setItem('achievements', JSON.stringify(newAchievements));

  }, [studyPlan, streak, achievements]);

  const value = {
    userProfile,
    studyPlan,
    streak,
    achievements,
    updateTaskStatus,
    loading
  };

  return (
    <StudyPlanContext.Provider value={value}>
      {!loading && children}
    </StudyPlanContext.Provider>
  );
};
