// Revision Booster - Spaced Repetition Engine
// Automatically creates 1-day and 7-day revision slots for completed tasks

import { addDays, toISODate } from './date.js';

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const REVISION_SLOTS = [
  { days: 1, label: '1-Day Review' },
  { days: 7, label: '7-Day Booster' }
];

/**
 * Create revision tasks for a completed task
 * @param {Object} completedTask - The original completed task
 * @returns {Array} Array of revision tasks to be scheduled
 */
export const createRevisionSlots = (completedTask) => {
  if (!completedTask || !completedTask.id) return [];

  return REVISION_SLOTS.map(slot => ({
    id: uuid(),
    date: null, // Will be calculated based on completion date
    subject: completedTask.subject,
    unit: completedTask.unit,
    startTime: completedTask.startTime,
    duration: Math.max(0.5, completedTask.duration * 0.5), // Half the original duration
    status: 'Pending',
    isRevision: true,
    revisionOffsetDays: slot.days,
    revisionLabel: slot.label,
    originalTaskId: completedTask.id,
  }));
};

/**
 * Calculate the date for a revision task
 * @param {string} completionDate - ISO date string of when original task was completed
 * @param {number} offsetDays - Number of days offset
 * @returns {string} ISO date string for revision
 */
export const calculateRevisionDate = (completionDate, offsetDays) => {
  const date = new Date(completionDate);
  return addDays(date, offsetDays);
};

/**
 * Add revision tasks to existing study plan
 * @param {Array} studyPlan - Current study plan
 * @param {Object} completedTask - The task that was completed
 * @param {string} completionDate - Date of completion (ISO format)
 * @returns {Array} Updated study plan with revision tasks
 */
export const addRevisionTasksToplan = (studyPlan, completedTask, completionDate) => {
  const revisionSlots = createRevisionSlots(completedTask);
  
  const revisionTasksWithDates = revisionSlots.map(slot => ({
    ...slot,
    date: calculateRevisionDate(completionDate, slot.revisionOffsetDays),
  }));

  return [...studyPlan, ...revisionTasksWithDates];
};

/**
 * Generate revision tasks for the entire initial plan (for specific subjects)
 * Useful for generating revisions based on initial learning schedule
 * @param {Array} studyPlan - Initial study plan
 * @returns {Array} Array of all revision tasks for the plan
 */
export const generateInitialRevisions = (studyPlan) => {
  if (!studyPlan || studyPlan.length === 0) return [];

  const revisionTasks = [];
  const processedSubjectUnits = new Set();

  studyPlan.forEach(task => {
    // Create unique key for subject+unit combination to avoid duplicate revisions
    const key = `${task.subject}|${task.unit}`;
    
    if (!processedSubjectUnits.has(key) && task.status === 'Pending') {
      processedSubjectUnits.add(key);
      
      // Create revisions for first occurrence of each subject+unit combination
      REVISION_SLOTS.forEach(slot => {
        const revisionDate = addDays(new Date(task.date), slot.days);

        revisionTasks.push({
          id: uuid(),
          date: revisionDate,
          subject: task.subject,
          unit: task.unit,
          startTime: task.startTime,
          duration: Math.max(0.5, task.duration * 0.5),
          status: 'Pending',
          isRevision: true,
          revisionOffsetDays: slot.days,
          revisionLabel: slot.label,
          originalTaskId: task.id,
        });
      });
    }
  });

  return revisionTasks;
};

/**
 * Merge initial plan with generated revisions
 * @param {Array} studyPlan - Initial study plan
 * @returns {Array} Complete study plan with revisions
 */
export const planWithRevisions = (studyPlan) => {
  const revisions = generateInitialRevisions(studyPlan);
  return [...studyPlan, ...revisions].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
};
