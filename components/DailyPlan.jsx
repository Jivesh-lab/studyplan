
import React, { useContext, useMemo } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';
import TaskItem from './TaskItem.jsx';
import StudyLoadMeter from './StudyLoadMeter.jsx';
import ExamCountdown from './ExamCountdown.jsx';

const DailyPlan = () => {
  const { studyPlan, streak, loading } = useContext(StudyPlanContext);

  const today = new Date().toISOString().split('T')[0];

  const todaysTasks = useMemo(() => {
    if (!studyPlan) return [];
    return studyPlan
      .filter(task => task.date === today)
      .sort((a, b) => a.startTime - b.startTime);
  }, [studyPlan, today]);

  if (loading) {
    return <div>Loading plan...</div>;
  }

  const completedTasks = todaysTasks.filter(t => t.status === 'Completed');
  const missedTasks = todaysTasks.filter(t => t.status === 'Missed');
  const activeTasks = todaysTasks.filter(t => t.status !== 'Completed' && t.status !== 'Missed');
  const progress = todaysTasks.length > 0 ? (completedTasks.length / todaysTasks.length) * 100 : 0;
  const showMissedWarning = missedTasks.length >= 2;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Today's Plan</h1>
            <p className="text-slate-500 mt-1">{new Date().toDateString()}</p>
          </div>
          <div className="text-right">
             <div className="text-2xl font-bold text-indigo-600 flex items-center">
              {streak.current} <span className="text-3xl ml-1">🔥</span>
            </div>
            <p className="text-sm text-slate-500">Day Streak</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-right text-sm mt-1 text-slate-500">{Math.round(progress)}% Complete</p>
        </div>
      </div>

      {/* Exam Countdown */}
      <ExamCountdown />

      {/* Missed Tasks Warning */}
      {missedTasks.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-800">You have {missedTasks.length} missed tasks</h3>
              <p className="text-sm text-red-700 mt-1">Consider using Emergency Catch-Up Mode to reschedule them.</p>
            </div>
          </div>
        </div>
      )}

      {/* Study Load Meter */}
      <StudyLoadMeter />

      {/* Active Tasks */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-slate-700 mb-4">Active Tasks</h2>
        {activeTasks.length > 0 ? (
          <div className="space-y-4">
            {activeTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500">No active tasks for today</p>
          </div>
        )}
      </div>

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="bg-green-50 p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-green-700 mb-4">✅ Completed Today ({completedTasks.length})</h2>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 line-through opacity-60">{task.subject}</p>
                  <p className="text-sm text-slate-500 line-through opacity-60">{task.unit}</p>
                </div>
                <span className="text-2xl">✅</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Tasks Section */}
      {missedTasks.length > 0 && (
        <div className="bg-red-50 p-6 rounded-2xl shadow-lg border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-700 mb-4">❌ Missed Today ({missedTasks.length})</h2>
          <div className="space-y-3">
            {missedTasks.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg flex items-center justify-between opacity-70">
                <div className="flex-1">
                  <p className="font-semibold text-red-800">{task.subject}</p>
                  <p className="text-sm text-red-600">{task.unit}</p>
                </div>
                <span className="text-2xl">❌</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-4">💡 Tip: Use "Select Days & Schedule" in the Progress page to reschedule these tasks</p>
        </div>
      )}
    </div>
  );
};

export default DailyPlan;
