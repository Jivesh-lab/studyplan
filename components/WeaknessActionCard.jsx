import React, { useContext, useState, useEffect } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';
import { findWeakSubjectsWithCauses, generateSuggestedActions, createTaskFromAction } from '../utils/planner.js';

const WeaknessActionCard = () => {
  const { userProfile, studyPlan, updateTaskStatus, refreshPlanFromStorage } = useContext(StudyPlanContext);
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [selectedWeakness, setSelectedWeakness] = useState(null);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3]); // Default: next 3 days
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    // Find weak subjects on component mount or when data changes
    let weak = findWeakSubjectsWithCauses(studyPlan, userProfile);
    
    // Also add subjects with 2+ missed tasks TODAY as weak subjects
    const today = new Date().toISOString().split('T')[0];
    const todaysMissedBySubject = {};
    studyPlan.forEach(task => {
      if (task.date === today && task.status === 'Missed') {
        todaysMissedBySubject[task.subject] = (todaysMissedBySubject[task.subject] || 0) + 1;
      }
    });
    
    console.log(`📊 Today's missed tasks by subject:`, todaysMissedBySubject);
    
    // Add subjects with 2+ missed tasks TODAY to weak subjects
    Object.entries(todaysMissedBySubject).forEach(([subject, missedCount]) => {
      if (missedCount >= 2) {
        const existingWeak = weak.find(w => w.subjectName === subject);
        if (!existingWeak) {
          weak.push({
            subjectName: subject,
            completionPercentage: 0,
            cause: 'Missed tasks',
            totalTasks: studyPlan.filter(t => t.subject === subject).length,
            completedTasks: studyPlan.filter(t => t.subject === subject && t.status === 'Completed').length,
            missedTasks: missedCount,
          });
        }
      }
    });
    
    console.log(`🔍 Weak subjects found:`, weak);
    setWeakSubjects(weak);
    
    if (weak.length > 0 && !selectedWeakness) {
      console.log(`✅ Selecting first weakness:`, weak[0]);
      selectWeakness(weak[0]);
    }
  }, [studyPlan, userProfile]);

  const selectWeakness = (weakness) => {
    setSelectedWeakness(weakness);
    const actions = generateSuggestedActions(weakness.subjectName, weakness.cause);
    setSuggestedActions(actions);
  };

  const addActionToToday = () => {
    console.log("✅ 'Add to Today' clicked");
    if (!selectedWeakness || suggestedActions.length === 0) {
      console.error("❌ No weakness or actions selected");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Adding to date: ${today}`);
    console.log(`📋 Actions to add:`, suggestedActions);
    
    const todaysTasks = studyPlan.filter(t => t.date === today);
    
    // Add all 3 actions to today's plan
    suggestedActions.forEach((action, idx) => {
      const task = createTaskFromAction(action, userProfile);
      task.date = today;
      // Stagger start times to avoid conflicts
      task.startTime = userProfile.studyTime === 'Morning' ? 8 + idx : 19 + idx;
      
      console.log(`📝 Creating task ${idx + 1}:`, task);
      
      // Add to studyPlan through localStorage
      const currentPlan = JSON.parse(localStorage.getItem('studyPlan')) || [];
      console.log(`📦 Current plan size before: ${currentPlan.length}`);
      currentPlan.push(task);
      localStorage.setItem('studyPlan', JSON.stringify(currentPlan));
      console.log(`📦 Current plan size after: ${currentPlan.length}`);
    });

    console.log(`💾 Tasks saved to localStorage`);
    refreshPlanFromStorage();
    alert(`✅ Added 3 actions to today's plan for ${selectedWeakness.subjectName}`);
  };

  const rescheduleMissedTasks = () => {
    console.log("✅ 'Reschedule Missed Tasks' clicked");
    if (!selectedWeakness) {
      console.error("❌ No weakness selected");
      return;
    }

    // Find all missed tasks for this subject TODAY
    const today = new Date().toISOString().split('T')[0];
    const currentPlan = JSON.parse(localStorage.getItem('studyPlan')) || [];
    
    const missedTasksForSubject = currentPlan.filter(task => 
      task.date === today && 
      task.subject === selectedWeakness.subjectName && 
      task.status === 'Missed'
    );

    if (missedTasksForSubject.length === 0) {
      alert("❌ No missed tasks found for this subject today");
      return;
    }

    console.log(`📋 Found ${missedTasksForSubject.length} missed tasks to reschedule:`, missedTasksForSubject);
    console.log(`📅 Selected days:`, selectedDays);

    // Reschedule each missed task to the selected days
    const updatedPlan = currentPlan.map(task => {
      const isMissedForThisSubject = missedTasksForSubject.find(m => m.id === task.id);
      if (isMissedForThisSubject) {
        // Find the day index to reschedule this task
        const dayIndex = missedTasksForSubject.indexOf(isMissedForThisSubject);
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + selectedDays[dayIndex % selectedDays.length]);
        
        const rescheduledTask = {
          ...task,
          date: scheduleDate.toISOString().split('T')[0],
          status: 'Pending', // Reset to Pending after rescheduling
          isRescheduled: true,
        };
        console.log(`↪️ Rescheduling ${task.subject} from ${task.date} to ${rescheduledTask.date}`);
        return rescheduledTask;
      }
      return task;
    });

    // Save updated plan
    localStorage.setItem('studyPlan', JSON.stringify(updatedPlan));
    console.log(`💾 Rescheduled tasks saved to localStorage`);
    alert(`📅 Rescheduled ${missedTasksForSubject.length} missed tasks to selected days!`);

    // Refresh and recalculate weaknesses
    setTimeout(() => {
      const finalPlan = JSON.parse(localStorage.getItem('studyPlan')) || [];
      const updatedProfile = JSON.parse(localStorage.getItem('userProfile'));
      
      const updatedWeaknesses = findWeakSubjectsWithCauses(finalPlan, updatedProfile);
      
      // Check if current weakness still exists
      const stillWeak = updatedWeaknesses.find(w => w.subjectName === selectedWeakness.subjectName);
      
      if (stillWeak) {
        console.log(`✅ ${selectedWeakness.subjectName} still has issues`);
        setWeakSubjects(updatedWeaknesses);
        selectWeakness(stillWeak);
      } else {
        console.log(`🎉 ${selectedWeakness.subjectName} tasks rescheduled!`);
        setWeakSubjects(updatedWeaknesses);
        setSelectedWeakness(null);
        refreshPlanFromStorage();
      }
    }, 300);
    
    setShowDatePicker(false);
  };

  if (!selectedWeakness || weakSubjects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
        <p className="text-slate-600 text-center">✅ No weak subjects detected! Keep up the great work!</p>
      </div>
    );
  }

  const getCauseEmoji = (cause) => {
    switch (cause) {
      case 'Missed tasks': return '❌';
      case 'Low study time': return '⏱️';
      case 'Low quiz score': return '📝';
      default: return '📊';
    }
  };

  const getActionEmoji = (type) => {
    switch (type) {
      case 'video': return '📹';
      case 'practice': return '✍️';
      case 'revision': return '📖';
      case 'focus': return '🎯';
      case 'notes': return '📝';
      case 'examples': return '💡';
      case 'quiz': return '❓';
      default: return '📚';
    }
  };

  return (
    <div className="space-y-6">
      {/* Weak Subjects Tabs */}
      {weakSubjects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weakSubjects.map(weakness => (
            <button
              key={weakness.subjectName}
              onClick={() => selectWeakness(weakness)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition-colors ${
                selectedWeakness.subjectName === weakness.subjectName
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {weakness.subjectName} ({weakness.completionPercentage}%)
            </button>
          ))}
        </div>
      )}

      {/* Main Weakness Card */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl shadow-lg border-l-4 border-red-500">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-red-700 mb-1">⚠️ Weakness Action Card</h2>
            <p className="text-slate-600">Let's improve your {selectedWeakness.subjectName} performance</p>
          </div>
        </div>

        {/* Subject Details */}
        <div className="bg-white p-4 rounded-lg mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Subject:</span>
            <span className="text-lg font-bold text-slate-800">{selectedWeakness.subjectName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Completion:</span>
            <span className="text-lg font-bold text-red-600">{selectedWeakness.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className="bg-red-500 h-3 rounded-full" 
              style={{ width: `${selectedWeakness.completionPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700">Main Reason:</span>
            <span className="text-lg font-bold text-slate-800">
              {getCauseEmoji(selectedWeakness.cause)} {selectedWeakness.cause}
            </span>
          </div>
        </div>

        {/* Suggested Actions */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <h3 className="font-bold text-slate-700 mb-3">🧩 Suggested Next Actions:</h3>
          <div className="space-y-2">
            {suggestedActions.map((action, index) => (
              <div key={action.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-2xl">{getActionEmoji(action.type)}</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700">{index + 1}. {action.title}</p>
                  <p className="text-sm text-slate-500">⏱️ {action.duration} min</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={addActionToToday}
              className="px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              ➕ Add to Today
            </button>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              📅 Select Days & Schedule
            </button>
          </div>

          {/* Date Picker */}
          {showDatePicker && (
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-300">
              <p className="font-semibold text-slate-700 mb-3">📅 Select days for 3 actions:</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <button
                    key={day}
                    onClick={() => {
                      const newDays = [...selectedDays];
                      const actionIndex = newDays.indexOf(day);
                      if (actionIndex > -1) {
                        newDays.splice(actionIndex, 1);
                      } else if (newDays.length < 3) {
                        newDays.push(day);
                      }
                      newDays.sort((a, b) => a - b);
                      setSelectedDays(newDays);
                    }}
                    className={`px-3 py-2 rounded font-semibold transition-colors ${
                      selectedDays.includes(day)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    +{day}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Selected: {selectedDays.length > 0 ? selectedDays.map(d => `+${d} days`).join(', ') : 'None'}
              </p>
              <button
                onClick={rescheduleMissedTasks}
                disabled={selectedDays.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition-colors"
              >
                ✅ Reschedule Missed Tasks
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-red-100 p-2 rounded">
            <p className="font-bold text-red-700">{selectedWeakness.missedTasks}</p>
            <p className="text-xs text-red-600">Missed</p>
          </div>
          <div className="bg-green-100 p-2 rounded">
            <p className="font-bold text-green-700">{selectedWeakness.completedTasks}</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
          <div className="bg-blue-100 p-2 rounded">
            <p className="font-bold text-blue-700">{selectedWeakness.totalTasks}</p>
            <p className="text-xs text-blue-600">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeaknessActionCard;
