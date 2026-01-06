
import { planWithRevisions } from './revisionBooster.js';
import { toISODate, getTodayISODate, getYesterdayISODate } from './date.js';

const SKILL_WEIGHTS = {
  Beginner: 3,
  Medium: 2,
  Advanced: 1,
};

const PLAN_DURATION_DAYS = 30; // Generate plan for the next 30 days

// Simple UUID generator
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

export const generateInitialPlan = (userProfile) => {
  const { subjects, dailyHours, studyTime, scheduleDuration = 30 } = userProfile;

  // ✅ NEW: Respect max 3-4 tasks per day (or 5 with revision)
  const maxTasksPerDay = 3; // Base tasks per day
  const daysToGenerate = scheduleDuration || 30;

  const weightedTopics = [];
  subjects.forEach(subject => {
    const units = subject.units.split(',').map(u => u.trim());
    const weight = SKILL_WEIGHTS[subject.skill];
    units.forEach(unit => {
      weightedTopics.push({ subject: subject.name, unit, weight });
    });
  });

  const totalWeight = weightedTopics.reduce((sum, topic) => sum + topic.weight, 0);
  const totalTasks = maxTasksPerDay * daysToGenerate; // Limit to 3-4 tasks per day

  const topicSchedule = weightedTopics.flatMap(topic => {
    const slots = Math.round((topic.weight / totalWeight) * totalTasks);
    return Array(slots).fill({ subject: topic.subject, unit: topic.unit });
  });

  // Shuffle to distribute topics
  for (let i = topicSchedule.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topicSchedule[i], topicSchedule[j]] = [topicSchedule[j], topicSchedule[i]];
  }

  const plan = [];
  let topicIndex = 0;
  let tasksPerCurrentDay = 0;
  const today = new Date();

  for (let day = 0; day < daysToGenerate; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateString = toISODate(date);
    
    let startHour = studyTime === 'Morning' ? 8 : 19;
    tasksPerCurrentDay = 0; // Reset counter for each day

    // Add exactly 3-4 tasks per day (random between 3-4)
    const tasksForThisDay = Math.random() < 0.5 ? 3 : 4;

    for (let taskNum = 0; taskNum < tasksForThisDay; taskNum++) {
      if (topicIndex < topicSchedule.length) {
        const topic = topicSchedule[topicIndex];
        plan.push({
          id: uuid(),
          date: dateString,
          subject: topic.subject,
          unit: topic.unit,
          startTime: startHour + taskNum,
          duration: 1,
          status: 'Pending',
          isRevision: false,
          revisionOffsetDays: 0,
        });
        topicIndex++;
        tasksPerCurrentDay++;
      }
    }
  }

  // Add Revision Booster: 1-day and 7-day spaced slots (max 5 total = 3-4 base + 1-2 revision)
  return planWithRevisions(plan);
};

export const adaptPlan = (currentPlan, userProfile) => {
  const today = new Date();
  const todayString = getTodayISODate();

  const missedTasks = currentPlan.filter(task => {
    const taskDate = new Date(task.date);
    return task.status === 'Missed' && taskDate < today;
  });

  if (missedTasks.length === 0) return currentPlan; // No adaptation needed

  let adaptablePlan = currentPlan.filter(task => !missedTasks.find(mt => mt.id === task.id));
  
  const futurePendingSlots = adaptablePlan.filter(task => {
    const taskDate = new Date(task.date);
    return task.status === 'Pending' && taskDate >= today;
  }).sort((a,b) => new Date(a.date) - new Date(b.date));

  // Try to reschedule missed tasks into the next available slots
  missedTasks.forEach(missedTask => {
    if(futurePendingSlots.length > 0) {
      const nextSlot = futurePendingSlots.shift();
      // Replace the pending task with the missed one
      adaptablePlan = adaptablePlan.map(task => {
        if(task.id === nextSlot.id) {
          return {
            ...task,
            subject: missedTask.subject,
            unit: missedTask.unit,
            originalTaskId: missedTask.id, // keep track of original
          }
        }
        return task;
      });
    } else {
        // If no future slots, add a new task at the end of the plan
        const lastTask = adaptablePlan[adaptablePlan.length - 1];
        const newDate = new Date(lastTask.date);
        newDate.setDate(newDate.getDate() + 1);

        adaptablePlan.push({
            ...missedTask,
            id: uuid(),
            date: newDate.toISOString().split('T')[0],
            status: 'Pending'
        });
    }
  });

  // Mark original missed tasks as "Rescheduled" to avoid re-processing
  return currentPlan.map(task => {
      if (missedTasks.find(mt => mt.id === task.id)) {
          return { ...task, status: 'Rescheduled' };
      }
      return task;
  }).concat(adaptablePlan.filter(task => !currentPlan.find(p => p.id === task.id))); // Add newly scheduled tasks
};

// Find weak subjects and determine causes
export const findWeakSubjectsWithCauses = (studyPlan, userProfile) => {
  if (!studyPlan || !userProfile) return [];

  const today = new Date();
  const subjectData = userProfile.subjects.map(subject => {
    const subjectTasks = studyPlan.filter(t => t.subject === subject.name && new Date(t.date) <= today);
    
    if (subjectTasks.length < 2) {
      return null; // Skip subjects with less than 2 tasks
    }

    const totalTasks = subjectTasks.length;
    const completedTasks = subjectTasks.filter(t => t.status === 'Completed').length;
    const missedTasks = subjectTasks.filter(t => t.status === 'Missed').length;
    const completionPercentage = (completedTasks / totalTasks) * 100;

    // Only show card if there are MISSED tasks
    if (missedTasks === 0) {
      return null; // No missed tasks = no weakness card
    }

    // Only return if completion < 50%
    if (completionPercentage >= 50) {
      return null;
    }

    // Determine the cause of weakness
    let cause = 'Inconsistent progress';
    const missedPercentage = (missedTasks / totalTasks) * 100;
    const plannedHours = subjectTasks.length; // Each task is 1 hour
    const completedHours = completedTasks; // Only completed tasks count

    if (missedPercentage > 40) {
      cause = 'Missed tasks';
    } else if (completedHours < (plannedHours * 0.6)) {
      cause = 'Low study time';
    }

    return {
      subjectName: subject.name,
      completionPercentage: Math.round(completionPercentage),
      cause,
      totalTasks,
      completedTasks,
      missedTasks,
    };
  });

  return subjectData.filter(s => s !== null);
};

// Generate suggested actions based on cause
export const generateSuggestedActions = (subjectName, cause) => {
  const actionTemplates = {
    'Missed tasks': [
      { title: 'Watch topic video', duration: 20, type: 'video' },
      { title: 'Practice questions', duration: 15, type: 'practice' },
      { title: 'Quick revision', duration: 10, type: 'revision' },
    ],
    'Low study time': [
      { title: 'Short focus session', duration: 25, type: 'focus' },
      { title: 'Notes reading', duration: 10, type: 'notes' },
      { title: 'One practice set', duration: 15, type: 'practice' },
    ],
    'Low quiz score': [
      { title: 'Revise weak topics', duration: 20, type: 'revision' },
      { title: 'Example-based learning', duration: 15, type: 'examples' },
      { title: 'Mini quiz', duration: 10, type: 'quiz' },
    ],
    'Inconsistent progress': [
      { title: 'Watch topic video', duration: 20, type: 'video' },
      { title: 'Practice questions', duration: 15, type: 'practice' },
      { title: 'Quick revision', duration: 10, type: 'revision' },
    ],
  };

  const actions = actionTemplates[cause] || actionTemplates['Inconsistent progress'];
  return actions.map((action, index) => ({
    id: uuid(),
    subject: subjectName,
    unit: `${cause} - ${action.title}`,
    title: action.title,
    duration: action.duration,
    type: action.type,
    actionIndex: index,
  }));
};

// Create task from action
export const createTaskFromAction = (action, userProfile) => {
  const today = new Date();
  
  let startHour = userProfile.studyTime === 'Morning' ? 8 : 19;
  // Schedule for tomorrow to avoid conflicts
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = toISODate(tomorrow);

  return {
    id: uuid(),
    date: tomorrowString,
    subject: action.subject,
    unit: action.unit,
    startTime: startHour,
    duration: Math.ceil(action.duration / 60), // Convert minutes to hours
    status: 'Pending',
    isActionTask: true, // Mark as action task
  };
};

/* -------------------- STUDY LOAD METER -------------------- */

/**
 * Calculate total study minutes for a specific date
 * @param {Array} studyPlan - The complete study plan
 * @param {string} dateString - Date in ISO format (YYYY-MM-DD)
 * @returns {number} Total minutes planned for that date
 */
export const calculateDailyStudyMinutes = (studyPlan, dateString) => {
  if (!studyPlan || !dateString) return 0;
  
  return studyPlan
    .filter(task => task.date === dateString && task.status !== 'Rescheduled')
    .reduce((total, task) => total + (task.duration * 60), 0); // Convert hours to minutes
};

/**
 * Determine study load level based on daily capacity
 * @param {number} dailyMinutes - Total study minutes planned
 * @param {number} dailyCapacity - User's daily study capacity in minutes (from userProfile)
 * @returns {Object} Load level with status, color, and percentage
 */
export const getStudyLoadLevel = (dailyMinutes, dailyCapacity = 240) => {
  const percentage = (dailyMinutes / dailyCapacity) * 100;
  
  let level = 'Low';
  let color = 'green';
  let backgroundColor = 'bg-green-50';
  let borderColor = 'border-green-300';
  let textColor = 'text-green-700';
  let meterColor = 'bg-green-500';
  
  if (percentage >= 120) {
    // Over capacity
    level = 'Overloaded';
    color = 'red';
    backgroundColor = 'bg-red-50';
    borderColor = 'border-red-300';
    textColor = 'text-red-700';
    meterColor = 'bg-red-500';
  } else if (percentage >= 85) {
    // Near or at capacity
    level = 'High';
    color = 'amber';
    backgroundColor = 'bg-amber-50';
    borderColor = 'border-amber-300';
    textColor = 'text-amber-700';
    meterColor = 'bg-amber-500';
  } else if (percentage >= 50) {
    // Medium load
    level = 'Medium';
    color = 'blue';
    backgroundColor = 'bg-blue-50';
    borderColor = 'border-blue-300';
    textColor = 'text-blue-700';
    meterColor = 'bg-blue-500';
  }
  
  return {
    level,
    color,
    backgroundColor,
    borderColor,
    textColor,
    meterColor,
    percentage: Math.min(100, percentage), // Cap at 100 for visual meter
    actualPercentage: percentage,
  };
};

/**
 * Generate suggestion based on study load
 * @param {number} dailyMinutes - Total study minutes planned
 * @param {number} dailyCapacity - User's daily capacity in minutes
 * @returns {string} Suggestion message
 */
export const getStudyLoadSuggestion = (dailyMinutes, dailyCapacity = 240) => {
  const excess = dailyMinutes - dailyCapacity;
  
  if (excess <= 0) return '✓ Load within healthy limits';
  
  const excessMinutes = Math.ceil(excess / 30) * 30; // Round up to nearest 30 min
  return `⚠️ Consider moving ${excessMinutes}m to tomorrow`;
};

/**
 * Get all daily study minutes for the week (for analytics)
 * @param {Array} studyPlan - The complete study plan
 * @param {Date} startDate - Start date of the week
 * @returns {Object} Daily minutes keyed by date
 */
export const getWeeklyStudyMinutes = (studyPlan, startDate = new Date()) => {
  const weekMinutes = {};
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateString = toISODate(date);
    weekMinutes[dateString] = calculateDailyStudyMinutes(studyPlan, dateString);
  }
  
  return weekMinutes;
};
