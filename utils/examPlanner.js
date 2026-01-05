// Exam Planner - All calculation logic for exam-based study planning
import { toISODate, addDays } from './date.js';

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

/**
 * Calculate days left until exam
 * @param {string} examDate - ISO date string (YYYY-MM-DD)
 * @returns {number} Days remaining (negative if past)
 */
export const calculateDaysLeft = (examDate) => {
  const today = new Date();
  const exam = new Date(examDate);
  const diffTime = exam - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get exam status based on days left
 * @param {number} daysLeft
 * @returns {string} Status: 'far', 'approaching', 'imminent', 'today', 'completed'
 */
export const getExamStatus = (daysLeft) => {
  if (daysLeft > 14) return 'far';
  if (daysLeft > 7) return 'approaching';
  if (daysLeft > 0) return 'imminent';
  if (daysLeft === 0) return 'today';
  return 'completed';
};

/**
 * Get color coding for exam status
 * @param {string} status
 * @returns {Object} Color scheme
 */
export const getExamStatusColors = (status) => {
  const colors = {
    far: { badge: 'bg-blue-50 text-blue-700 border-blue-300', text: 'text-blue-700', icon: '📅' },
    approaching: { badge: 'bg-amber-50 text-amber-700 border-amber-300', text: 'text-amber-700', icon: '⏳' },
    imminent: { badge: 'bg-red-50 text-red-700 border-red-300', text: 'text-red-700', icon: '🚨' },
    today: { badge: 'bg-green-50 text-green-700 border-green-300', text: 'text-green-700', icon: '🎉' },
    completed: { badge: 'bg-green-50 text-green-700 border-green-300', text: 'text-green-700', icon: '✅' },
  };
  return colors[status] || colors.far;
};

/**
 * Auto-generate revision tasks before exam
 * @param {Object} exam - Exam object
 * @returns {Array} Revision tasks to add
 */
export const generateRevisionTasks = (exam) => {
  const daysLeft = calculateDaysLeft(exam.date);
  const revisions = [];

  // Dynamic revision schedule based on days left
  if (daysLeft <= 14) {
    // 7-day revision
    revisions.push({
      id: uuid(),
      date: addDays(new Date(exam.date), -7),
      subject: `${exam.name} Revision - Day 7`,
      unit: `Revision for ${exam.name}`,
      startTime: 9,
      duration: 0.5,
      status: 'Pending',
      isRevision: true,
      isExamRevision: true,
      examId: exam.id,
      revisionOffsetDays: 7,
    });
  }

  if (daysLeft <= 7) {
    // 3-day practice test
    revisions.push({
      id: uuid(),
      date: addDays(new Date(exam.date), -3),
      subject: `${exam.name} Practice Test`,
      unit: `Full practice test for ${exam.name}`,
      startTime: 9,
      duration: 0.75,
      status: 'Pending',
      isRevision: true,
      isExamRevision: true,
      examId: exam.id,
      revisionOffsetDays: 3,
    });

    // 1-day quick review
    revisions.push({
      id: uuid(),
      date: addDays(new Date(exam.date), -1),
      subject: `${exam.name} Final Review`,
      unit: `Quick notes review for ${exam.name}`,
      startTime: 18,
      duration: 0.33,
      status: 'Pending',
      isRevision: true,
      isExamRevision: true,
      examId: exam.id,
      revisionOffsetDays: 1,
    });
  }

  return revisions;
};

/**
 * Check if emergency catch-up should be triggered
 * @param {Array} studyPlan
 * @param {Array} exams
 * @param {Array} examSubjects
 * @returns {Object} Catch-up recommendation
 */
export const checkEmergencyCatchUp = (studyPlan, exams, examSubjects) => {
  if (!exams || exams.length === 0) return null;

  // Find the nearest upcoming exam
  const nearestExam = exams
    .filter(e => calculateDaysLeft(e.date) > 0)
    .sort((a, b) => calculateDaysLeft(a.date) - calculateDaysLeft(b.date))[0];

  if (!nearestExam) return null;

  const daysLeft = calculateDaysLeft(nearestExam.date);

  // Only check for catch-up in the final weeks
  if (daysLeft > 14) return null;

  // Count missed tasks for exam subjects
  const examTasks = studyPlan.filter(t => examSubjects.includes(t.subject));
  const missedTasks = examTasks.filter(t => t.status === 'Missed').length;
  const missedRate = examTasks.length > 0 ? (missedTasks / examTasks.length) : 0;

  // Determine trigger thresholds based on proximity
  let shouldTrigger = false;
  let reason = '';

  if (daysLeft <= 3 && missedRate > 0) {
    // Final days - any missed task triggers catch-up
    shouldTrigger = true;
    reason = `Exam in ${daysLeft} days with missed tasks`;
  } else if (daysLeft <= 7 && missedRate > 0.2) {
    // Final week - 20%+ missed
    shouldTrigger = true;
    reason = `${Math.round(missedRate * 100)}% tasks missed for ${nearestExam.name}`;
  } else if (daysLeft <= 14 && missedRate > 0.3) {
    // Two weeks - 30%+ missed
    shouldTrigger = true;
    reason = `${Math.round(missedRate * 100)}% tasks missed for ${nearestExam.name}`;
  }

  return shouldTrigger ? { triggered: true, exam: nearestExam, daysLeft, missedRate, reason } : null;
};

/**
 * Adjust study plan frequency for exam subjects
 * @param {Array} studyPlan
 * @param {Array} exams
 * @param {Array} examSubjects
 * @returns {Object} Adjustment info
 */
export const calculateExamAdjustments = (exams, examSubjects) => {
  if (!exams || exams.length === 0) return { adjustments: {} };

  const nearestExam = exams
    .filter(e => calculateDaysLeft(e.date) > 0)
    .sort((a, b) => calculateDaysLeft(a.date) - calculateDaysLeft(b.date))[0];

  if (!nearestExam) return { adjustments: {} };

  const daysLeft = calculateDaysLeft(nearestExam.date);

  // Smart hybrid approach: consider both proximity and subject count
  let examFocus = 50; // Base 50% for single exam
  let nonExamFocus = 50;

  if (daysLeft <= 7) {
    // Final week - heavy focus
    examFocus = 75;
    nonExamFocus = 25;
  } else if (daysLeft <= 14) {
    // Two weeks - medium-heavy focus
    examFocus = 65;
    nonExamFocus = 35;
  }

  return {
    nearestExam,
    daysLeft,
    examFocus,
    nonExamFocus,
    examSubjects,
  };
};

/**
 * Split long topics into smaller tasks
 * Unit-based splitting (natural, matches course structure)
 * @param {Object} task
 * @returns {Array} Split tasks or original task
 */
export const splitLongTopic = (task) => {
  // Only split if duration > 90 minutes
  if ((task.duration * 60) <= 90) return [task];

  // Try to infer units from the unit field
  // Example: "Tenses, Articles, Clauses" → split by comma
  if (task.unit && task.unit.includes(',')) {
    const subUnits = task.unit.split(',').map(u => u.trim());
    const baseMinutes = (task.duration * 60) / subUnits.length;

    return subUnits.map((unit, idx) => ({
      ...task,
      id: task.id + `-part-${idx + 1}`,
      unit: unit,
      duration: Math.max(0.5, Math.ceil(baseMinutes / 60) / 2), // Convert back to hours
      isPartOfSplit: true,
      splitFrom: task.id,
    }));
  }

  // Default: split into 3 equal parts
  const partDuration = task.duration / 3;
  return [
    { ...task, id: task.id + '-part-1', unit: `${task.unit} (Part 1)`, duration: partDuration },
    { ...task, id: task.id + '-part-2', unit: `${task.unit} (Part 2)`, duration: partDuration },
    { ...task, id: task.id + '-part-3', unit: `${task.unit} (Part 3)`, duration: partDuration },
  ];
};

/**
 * Get suggested study time for exam subjects
 * Based on performance and days left
 * @param {number} completionRate - 0-1 (0% to 100%)
 * @param {number} daysLeft
 * @returns {Object} Recommendation
 */
export const getStudySuggestion = (completionRate, daysLeft) => {
  if (completionRate < 0.8 && daysLeft > 0) {
    // Less than 80% complete
    return {
      type: 'increase-frequency',
      message: '📈 Increase daily study for this subject',
      color: 'text-amber-700',
    };
  } else if (completionRate >= 0.8 && daysLeft > 3) {
    // 80%+ complete, still time for difficulty
    return {
      type: 'increase-difficulty',
      message: '⬆️ Practice harder problems',
      color: 'text-blue-700',
    };
  } else if (daysLeft > 0 && daysLeft <= 3) {
    return {
      type: 'quick-review',
      message: '⚡ Quick revision & practice tests',
      color: 'text-red-700',
    };
  }

  return {
    type: 'complete',
    message: '✅ Exam completed!',
    color: 'text-green-700',
  };
};
