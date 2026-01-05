// Emergency Catch-Up Mode - Priority-based task planning
import { getTodayISODate, addDays } from './date';

// Calculate missed rate from study plan
export const calculateMissedRate = (studyPlan) => {
  if (studyPlan.length === 0) return 0;
  const missedCount = studyPlan.filter(t => t.date < getTodayISODate() && !t.completed).length;
  return missedCount / studyPlan.length;
};

// Check if emergency catch-up should be triggered
export const shouldTriggerCatchup = (studyPlan, exams) => {
  const missedRate = calculateMissedRate(studyPlan);
  
  console.log('📋 shouldTriggerCatchup check:');
  console.log('   missedRate:', missedRate);
  console.log('   exams:', exams?.length || 0);
  
  // Trigger if more than 20% of tasks are missed
  if (missedRate > 0.2) {
    console.log('✅ Triggered: missedRate > 20%');
    return true;
  }
  
  // Trigger if there are ANY upcoming exams (not just 3 days)
  const upcomingExams = exams?.filter(exam => {
    const today = getTodayISODate();
    const daysLeft = Math.ceil((new Date(exam.date) - new Date(today)) / (1000 * 60 * 60 * 24));
    return daysLeft > 0;
  }) || [];
  
  console.log('   upcomingExams:', upcomingExams.length);
  
  if (upcomingExams.length > 0) {
    console.log('✅ Triggered: Upcoming exams found');
    return true;
  }
  
  console.log('❌ Not triggered: No exams, no overdue tasks');
  return false;
};

// Detect if urgent exam exists (within 3 days)
export const getUrgentExams = (exams) => {
  if (!exams || exams.length === 0) return [];
  const today = getTodayISODate();
  
  return exams.filter(exam => {
    const daysLeft = Math.ceil((new Date(exam.date) - new Date(today)) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  }).sort((a, b) => {
    const daysA = Math.ceil((new Date(a.date) - new Date(today)) / (1000 * 60 * 60 * 24));
    const daysB = Math.ceil((new Date(b.date) - new Date(today)) / (1000 * 60 * 60 * 24));
    return daysA - daysB; // Soonest first
  });
};

// Get all subjects from urgent exams
export const getExamSubjects = (urgentExams) => {
  const subjects = [];
  urgentExams.forEach(exam => {
    exam.subjects?.forEach(subject => {
      if (!subjects.find(s => s.name === subject)) {
        subjects.push({ name: subject, daysUntilExam: getExamDaysLeft(exam.date) });
      }
    });
  });
  return subjects;
};

// Calculate days left for exam
const getExamDaysLeft = (examDate) => {
  const today = getTodayISODate();
  return Math.ceil((new Date(examDate) - new Date(today)) / (1000 * 60 * 60 * 24));
};

// Distribute hours among exam subjects based on priority
export const distributeStudyHours = (totalMinutes, examSubjects, studyPlan, userProfile) => {
  if (examSubjects.length === 0) return {};
  
  // Calculate priority score for each subject
  const subjectsWithScore = examSubjects.map(subject => {
    // More urgent (fewer days) = higher score
    const urgencyScore = Math.max(0, 5 - subject.daysUntilExam); // 0-5 scale
    
    // Weakness = higher score
    const weaknessScore = userProfile?.weaknesses?.includes(subject.name) ? 2 : 0;
    
    // Total priority
    const totalScore = urgencyScore + weaknessScore;
    
    return { ...subject, score: totalScore };
  });
  
  // Calculate total score
  const totalScore = subjectsWithScore.reduce((sum, s) => sum + s.score, 0);
  
  // Distribute hours proportionally
  const distribution = {};
  subjectsWithScore.forEach(subject => {
    const proportion = subject.score / totalScore;
    distribution[subject.name] = Math.floor(totalMinutes * proportion);
  });
  
  return distribution;
};

// Get all tasks for specific exam subjects
export const getTasksForExamSubjects = (studyPlan, subjectNames) => {
  return studyPlan.filter(task => subjectNames.includes(task.subject));
};

// Rebalance plan for exam mode
export const rebalancePlanForExam = (studyPlan, urgentExams, userProfile, totalMinutes) => {
  const examSubjects = getExamSubjects(urgentExams);
  if (examSubjects.length === 0) return studyPlan;
  
  const subjectNames = examSubjects.map(s => s.name);
  const hourDistribution = distributeStudyHours(totalMinutes, examSubjects, studyPlan, userProfile);
  
  // Mark exam tasks with priority and allocated time
  const rebalancedPlan = studyPlan.map(task => {
    if (subjectNames.includes(task.subject)) {
      return {
        ...task,
        examMode: true,
        allocatedMinutes: hourDistribution[task.subject],
        priority: 'exam-focus'
      };
    } else {
      return {
        ...task,
        examMode: false,
        paused: true,
        priority: 'paused'
      };
    }
  });
  
  return rebalancedPlan;
};

// Score tasks by priority (exam > due soon > weakness > other)
const scoreTaskPriority = (task, exams, userProfile) => {
  let score = 0;
  const today = getTodayISODate();
  
  // Priority 1: Exam-critical subjects (highest)
  if (exams && exams.length > 0) {
    const examSubjects = exams.flatMap(e => e.subjects || []);
    if (examSubjects.includes(task.subject)) {
      score += 100; // Highest priority
    }
  }
  
  // Priority 2: Due within 3 days (high)
  if (task.date && task.date <= addDays(today, 3)) {
    score += 50;
  }
  
  // Priority 3: Subject weaknesses (medium)
  if (userProfile?.weaknesses?.includes(task.subject)) {
    score += 30;
  }
  
  // Priority 4: Shorter tasks (easier to complete)
  if (task.duration) {
    score += Math.max(0, 30 - task.duration / 2); // Max 30 points, decreases with duration
  }
  
  return score;
};

// Generate emergency catch-up plan
export const generateCatchupPlan = (studyPlan, timeAvailable, exams, userProfile) => {
  // Get incomplete tasks, sorted by priority
  const incompleteTasks = studyPlan
    .filter(t => !t.completed)
    .map(t => ({
      ...t,
      priority: scoreTaskPriority(t, exams, userProfile)
    }))
    .sort((a, b) => b.priority - a.priority);

  // Select tasks to fit available time
  let totalMinutes = 0;
  const selectedTasks = [];
  
  for (const task of incompleteTasks) {
    const taskDuration = task.duration || 5; // Default 5 min if not specified (was 30)
    if (totalMinutes + taskDuration <= timeAvailable) {
      selectedTasks.push(task);
      totalMinutes += taskDuration;
    }
  }
  
  // If no tasks fit, force at least the top 3 priority items
  if (selectedTasks.length === 0 && incompleteTasks.length > 0) {
    selectedTasks.push(...incompleteTasks.slice(0, Math.min(3, incompleteTasks.length)));
  }
  
  return {
    tasks: selectedTasks,
    totalMinutes: selectedTasks.reduce((sum, t) => sum + (t.duration || 5), 0),
    completionEstimate: Math.ceil(selectedTasks.reduce((sum, t) => sum + (t.duration || 5), 0)),
    missedCount: incompleteTasks.length,
    focusSubjects: [...new Set(selectedTasks.map(t => t.subject))]
  };
};

// Calculate difficulty level based on task volume
export const getDifficultyLevel = (totalMinutes, availableTime) => {
  if (totalMinutes <= availableTime * 0.6) return 'Easy';
  if (totalMinutes <= availableTime * 0.85) return 'Balanced';
  return 'Intense';
};

// Get motivational message based on situation
export const getMotivationalMessage = (missedCount, timeAvailable, difficulty) => {
  const messages = {
    Easy: `You got this! 💪 ${timeAvailable} minutes is enough to catch up.`,
    Balanced: `Ready to focus? 🎯 This is a solid catch-up plan for the next ${timeAvailable} minutes.`,
    Intense: `You're pushing hard! ⚡ This is intensive but doable. Stay focused!`
  };
  
  return messages[difficulty] || messages.Balanced;
};

// Create compressed tasks for today
export const createEmergencyCatchupTasks = (catchupPlan, scheduledFor = 'today') => {
  const today = getTodayISODate();
  const scheduleDate = scheduledFor === 'tomorrow' ? addDays(today, 1) : today;
  
  return catchupPlan.tasks.map(task => ({
    ...task,
    date: scheduleDate,
    isEmergencyCatchup: true,
    originalDate: task.date,
    reason: 'Emergency Catch-Up Mode'
  }));
};
