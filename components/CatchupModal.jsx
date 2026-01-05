import React, { useState, useContext, useMemo } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext';
import {
  generateCatchupPlan,
  getDifficultyLevel,
  getMotivationalMessage,
  createEmergencyCatchupTasks,
  getUrgentExams,
  getExamSubjects,
  distributeStudyHours,
  getTasksForExamSubjects,
  rebalancePlanForExam
} from '../utils/catchupPlanner';
import { getTodayISODate } from '../utils/date';

export const CatchupModal = ({ isOpen, onClose }) => {
  const { studyPlan, exams, userProfile, updateTaskStatus, refreshPlanFromStorage } = useContext(StudyPlanContext);
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [applying, setApplying] = useState(false);
  const [scheduleFor, setScheduleFor] = useState('today');

  console.log('🔍 CatchupModal rendered | isOpen:', isOpen);

  const catchupPlan = useMemo(() => {
    // Check for ANY upcoming exam (not just urgent ones)
    const upcomingExams = exams?.filter(exam => {
      const today = getTodayISODate();
      const daysLeft = Math.ceil((new Date(exam.date) - new Date(today)) / (1000 * 60 * 60 * 24));
      return daysLeft > 0; // Any future exam
    }) || [];
    
    console.log('📚 Upcoming exams (any):', upcomingExams.length, upcomingExams);
    
    if (upcomingExams.length > 0) {
      // EXAM MODE: Get all tasks for exam subjects and allocate time
      const examSubjects = getExamSubjects(upcomingExams);
      const subjectNames = examSubjects.map(s => s.name);
      const examTasks = getTasksForExamSubjects(studyPlan, subjectNames);
      
      console.log('🎓 Exam subjects found:', subjectNames);
      console.log('📋 Tasks for exam subjects:', examTasks.length);
      
      const hourDistribution = distributeStudyHours(timeAvailable, examSubjects, studyPlan, userProfile);
      
      return {
        tasks: examTasks,
        totalMinutes: timeAvailable,
        completionEstimate: timeAvailable,
        missedCount: examTasks.length,
        focusSubjects: subjectNames,
        isExamMode: true,
        hourDistribution,
        upcomingExams
      };
    } else {
      // NORMAL MODE: Use priority-based selection
      return generateCatchupPlan(studyPlan, timeAvailable, exams, userProfile);
    }
  }, [timeAvailable, studyPlan, exams, userProfile]);

  const difficulty = useMemo(() => {
    return getDifficultyLevel(catchupPlan.totalMinutes, timeAvailable);
  }, [catchupPlan, timeAvailable]);

  const message = useMemo(() => {
    return getMotivationalMessage(catchupPlan.missedCount, timeAvailable, difficulty);
  }, [catchupPlan.missedCount, timeAvailable, difficulty]);

  const handleApply = () => {
    console.log('🔴 ⚠️ handleApply CLICKED!');
    console.log('   catchupPlan.tasks.length:', catchupPlan.tasks.length);
    console.log('   applying state:', applying);
    
    if (catchupPlan.tasks.length === 0) {
      alert('No tasks available for catch-up.');
      return;
    }

    setApplying(true);
    console.log('✅ setApplying(true) called');
    
    console.log('🎯 EMERGENCY CATCH-UP APPLY STARTED');
    console.log('Exam Mode:', catchupPlan.isExamMode);
    console.log('Tasks to reschedule:', catchupPlan.tasks.length);
    console.log('Schedule for:', scheduleFor);

    // Get upcoming exams for exam-mode handling
    const upcomingExams = catchupPlan.upcomingExams || [];
    console.log('🎓 Upcoming exams found:', upcomingExams.length);
    upcomingExams.forEach(exam => {
      console.log(`  📚 ${exam.name} - Date: ${exam.date}, Subjects: ${exam.subjects.join(', ')}`);
    });

    // Create emergency catchup tasks
    const emergencyTasks = createEmergencyCatchupTasks(catchupPlan, scheduleFor);
    const scheduleDate = scheduleFor === 'today' ? getTodayISODate() : new Date(new Date(getTodayISODate()).getTime() + 86400000).toISOString().split('T')[0];
    
    console.log('📅 Schedule date:', scheduleDate);
    console.log('📋 Emergency tasks count:', emergencyTasks.length);
    console.log('📋 Emergency task subjects:', [...new Set(emergencyTasks.map(t => t.subject))]);
    console.log('-------------------------------------------');

    // Create emergency catchup tasks
    let rescheduledCount = 0;
    let removedCount = 0;
    let pausedCount = 0;
    let keptCount = 0;

    // KEEP ALL OTHER TASKS - Only update emergency tasks
    let updatedPlan = studyPlan.map(task => {
      // Check if this task is one of the emergency priority tasks
      const isEmergencyTask = emergencyTasks.find(
        e => e.subject === task.subject && e.title === task.title
      );
      
      if (isEmergencyTask) {
        // IF EXAM MODE: Only reschedule until exam date
        if (catchupPlan.isExamMode && upcomingExams.length > 0) {
          const exam = upcomingExams.find(e => e.subjects.includes(task.subject));
          const examDate = exam?.date;
          
          // Only reschedule if scheduling date is BEFORE exam date
          if (examDate && scheduleDate <= examDate) {
            console.log(`✅ RESCHEDULING: ${task.subject} "${task.title}" | From: ${task.date} → To: ${scheduleDate} (Exam: ${examDate})`);
            rescheduledCount++;
            return { ...task, date: scheduleDate, isEmergencyCatchup: true };
          } else {
            console.log(`🗑️ REMOVING: ${task.subject} "${task.title}" | Date: ${task.date} is AFTER exam on ${examDate}`);
            removedCount++;
            return null; // Remove it (after exam date)
          }
        } else {
          // Normal mode: Just reschedule
          console.log(`✅ RESCHEDULING (Normal): ${task.subject} "${task.title}" | From: ${task.date} → To: ${scheduleDate}`);
          rescheduledCount++;
          return { ...task, date: scheduleDate, isEmergencyCatchup: true };
        }
      }
      
      // FOR EXAM-MODE: REMOVE ALL exam-subject tasks scheduled ON/AFTER exam date
      if (catchupPlan.isExamMode && upcomingExams.length > 0) {
        const exam = upcomingExams.find(e => e.subjects.includes(task.subject));
        if (exam && task.date >= exam.date) {
          console.log(`🗑️ REMOVING: ${task.subject} "${task.title}" | Date: ${task.date} ≥ Exam: ${exam.date}`);
          removedCount++;
          return null; // Remove this task
        }
      }
      
      // FOR NON-EXAM SUBJECTS: Don't schedule 2 days before any exam
      if (catchupPlan.isExamMode && upcomingExams.length > 0) {
        // Check if this task's subject is NOT an exam subject
        const isExamSubject = upcomingExams.some(e => e.subjects.includes(task.subject));
        if (!isExamSubject) {
          // Check if task date is within 2 days before any exam
          const tooCloseToExam = upcomingExams.some(exam => {
            const examDate = new Date(exam.date);
            const taskDate = new Date(task.date);
            const twoDaysBefore = new Date(examDate.getTime() - 2 * 24 * 60 * 60 * 1000);
            return taskDate >= twoDaysBefore && taskDate < examDate;
          });
          
          if (tooCloseToExam) {
            console.log(`⏸️ PAUSING: ${task.subject} "${task.title}" | Date: ${task.date} is 2 days before exam`);
            pausedCount++;
            return null; // Pause this task
          }
        }
      }
      
      // KEEP ALL OTHER TASKS UNCHANGED
      console.log(`✓ KEEPING: ${task.subject} "${task.title}" | Date: ${task.date} (Unchanged)`);
      keptCount++;
      return task;
    }).filter(task => task !== null); // Remove null tasks
    
    console.log('-------------------------------------------');
    console.log(`📊 SUMMARY:`);
    console.log(`  ✅ Rescheduled: ${rescheduledCount}`);
    console.log(`  🗑️ Removed: ${removedCount}`);
    console.log(`  ⏸️ Paused: ${pausedCount}`);
    console.log(`  ✓ Kept unchanged: ${keptCount}`);
    console.log(`  📦 Original plan: ${studyPlan.length} tasks`);
    console.log(`  📦 Updated plan: ${updatedPlan.length} tasks`);
    console.log('-------------------------------------------');

    // Add any new emergency tasks that don't exist yet
    emergencyTasks.forEach(emergency => {
      const exists = updatedPlan.some(
        t => t.subject === emergency.subject && t.title === emergency.title
      );
      if (!exists && (!catchupPlan.isExamMode || scheduleDate <= (upcomingExams.find(e => e.subjects.includes(emergency.subject))?.date || '2099-12-31'))) {
        updatedPlan.push({
          ...emergency,
          date: scheduleDate,
          id: emergency.id || `emergency-${Date.now()}-${Math.random()}`,
          completed: false,
          isEmergencyCatchup: true
        });
      }
    });

    console.log('📦 Updated plan:', updatedPlan.length, 'tasks');
    console.log('-------------------------------------------');
    console.log(`📊 FINAL SUMMARY:`);
    console.log(`  ✅ Rescheduled: ${rescheduledCount}`);
    console.log(`  🗑️ Removed: ${removedCount}`);
    console.log(`  ⏸️ Paused: ${pausedCount}`);
    console.log(`  ✓ Kept unchanged: ${keptCount}`);
    console.log(`  Original: ${studyPlan.length} → Updated: ${updatedPlan.length} tasks`);
    console.log('-------------------------------------------');

    console.log('💾 STEP 1: Saving to context via updateTaskStatus()...');
    console.log('   Input: Array of', updatedPlan.length, 'tasks');
    updateTaskStatus(updatedPlan);
    console.log('✅ STEP 1 Complete: updateTaskStatus() called');
    
    setApplying(false);
    
    alert(`✅ Emergency Plan Applied!\n\n✅ Rescheduled: ${rescheduledCount}\n🗑️ Removed: ${removedCount}\n⏸️ Paused: ${pausedCount}\n\nChanges saved to localStorage!`);
    
    console.log('⏳ STEP 2: Waiting 500ms for React to update...');
    // Refresh to recalculate - alert should disappear now
    setTimeout(() => {
      console.log('🔄 STEP 3: Refreshing plan from localStorage...');
      refreshPlanFromStorage();
      console.log('✅ STEP 3 Complete: Plan refreshed');
      
      console.log('🚪 STEP 4: Closing modal...');
      onClose();
      console.log('✅ STEP 4 Complete: Modal closed');
      
      console.log('🎉 ✅ EMERGENCY CATCH-UP FULLY COMPLETE!');
      console.log('   All tasks removed, rescheduled, and saved.');
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {catchupPlan.isExamMode ? '🎯 Exam Focus Mode' : '⚡ Emergency Catch-Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Message */}
        <p className="text-slate-600 mb-6 text-center">
          {catchupPlan.isExamMode 
            ? 'Study hours divided by subject priority & urgency'
            : message}
        </p>

        {/* Time Slider */}
        <div className="mb-6 space-y-3">
          <label className="block text-slate-700 font-semibold">
            How much time can you spare today?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={timeAvailable}
              onChange={(e) => setTimeAvailable(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-2xl font-bold text-indigo-600 min-w-16 text-right">
              {timeAvailable}m
            </span>
          </div>
          <p className="text-xs text-slate-500">Adjust the slider to see your personalized plan</p>
        </div>

        {/* Plan Summary */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tasks to complete:</span>
            <span className="font-semibold text-slate-800">{catchupPlan.tasks.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total study time:</span>
            <span className="font-semibold text-slate-800">{catchupPlan.completionEstimate}m</span>
          </div>
          
          {/* Exam Mode: Show hour distribution */}
          {catchupPlan.isExamMode && catchupPlan.hourDistribution && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-2 font-semibold">📚 Time per subject:</p>
              <div className="space-y-1">
                {Object.entries(catchupPlan.hourDistribution).map(([subject, minutes]) => (
                  <div key={subject} className="flex justify-between text-xs">
                    <span className="text-slate-600">{subject}:</span>
                    <span className="font-semibold text-indigo-600">{minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Normal Mode: Difficulty indicator */}
          {!catchupPlan.isExamMode && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Difficulty:</span>
              <span
                className={`font-semibold px-2 py-1 rounded-lg ${
                  difficulty === 'Easy'
                    ? 'bg-green-100 text-green-700'
                    : difficulty === 'Balanced'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {difficulty}
              </span>
            </div>
          )}
          
          {catchupPlan.focusSubjects.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-2">Focus on: </p>
              <div className="flex flex-wrap gap-2">
                {catchupPlan.focusSubjects.map((subject) => (
                  <span
                    key={subject}
                    className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Schedule Options */}
        <div className="mb-6 space-y-3">
          <label className="block text-slate-700 font-semibold">When to start?</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border-2 border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50">
              <input
                type="radio"
                value="today"
                checked={scheduleFor === 'today'}
                onChange={(e) => setScheduleFor(e.target.value)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-slate-800 font-medium">Today (Right Now)</span>
              <span className="text-sm text-indigo-600 ml-auto">Now</span>
            </label>
            <label className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="radio"
                value="tomorrow"
                checked={scheduleFor === 'tomorrow'}
                onChange={(e) => setScheduleFor(e.target.value)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-slate-800 font-medium">Tomorrow</span>
              <span className="text-sm text-slate-500 ml-auto">More prep time</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log('🔴 BUTTON CLICKED - handleApply wrapper triggered');
              handleApply();
            }}
            disabled={applying}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {applying ? 'Applying...' : '✨ Apply Plan'}
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          This plan will prioritize exam-critical subjects and overdue tasks.
        </p>
      </div>
    </div>
  );
};
