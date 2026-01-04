
import React, { useContext, useMemo } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';
import TaskItem from './TaskItem.jsx';

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

  const completedTasks = todaysTasks.filter(t => t.status === 'Completed').length;
  const progress = todaysTasks.length > 0 ? (completedTasks / todaysTasks.length) * 100 : 0;

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

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-slate-700 mb-4">Tasks</h2>
        {todaysTasks.length > 0 ? (
          <div className="space-y-4">
            {todaysTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500">🎉 No tasks for today! Enjoy your break.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPlan;
