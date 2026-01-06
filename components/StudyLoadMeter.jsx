import React, { useContext, useMemo } from "react";
import { StudyPlanContext } from "../context/StudyPlanContext.jsx";
import { getTodayISODate } from "../utils/date.js";

const StudyLoadMeter = () => {
  const { studyPlan, userProfile } = useContext(StudyPlanContext);
  const todayString = getTodayISODate();

  // Determine load level based on task count
  const { loadLevel, percentage } = useMemo(() => {
    const todayTasks = studyPlan?.filter(t => t.date === todayString && t.status !== 'Completed') || [];
    const taskCount = todayTasks.length;

    // Fixed load levels based on task count
    if (taskCount <= 2) {
      return { loadLevel: 'Relaxed', percentage: 25 };
    } else if (taskCount <= 3) {
      return { loadLevel: 'Moderate', percentage: 50 };
    } else if (taskCount <= 4) {
      return { loadLevel: 'High', percentage: 75 };
    } else {
      return { loadLevel: 'Overloaded', percentage: 100 };
    }
  }, [studyPlan, todayString]);

  // Load level styling
  const getLoadInfo = (level) => {
    const info = {
      'Relaxed': {
        backgroundColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-700',
        meterColor: 'bg-green-500',
      },
      'Moderate': {
        backgroundColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-700',
        meterColor: 'bg-yellow-500',
      },
      'High': {
        backgroundColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        textColor: 'text-orange-700',
        meterColor: 'bg-orange-500',
      },
      'Overloaded': {
        backgroundColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-700',
        meterColor: 'bg-red-500',
      },
    };
    return info[level] || info['Moderate'];
  };

  const loadInfo = getLoadInfo(loadLevel);

  return (
    <div className={`p-4 rounded-2xl border-2 ${loadInfo.backgroundColor} ${loadInfo.borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">📊 Today's Study Load</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${loadInfo.textColor} bg-white border ${loadInfo.borderColor}`}>
          {loadLevel}
        </span>
      </div>

      {/* Visual Meter - FIXED PERCENTAGE */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${loadInfo.meterColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Percentage Display */}
      <div className={`text-sm mb-2 ${loadInfo.textColor} font-semibold flex justify-between items-center`}>
        <span>{percentage}% Load</span>
        <span className="text-xs opacity-75">
          {loadLevel === 'Relaxed' && '✅ Easy day'}
          {loadLevel === 'Moderate' && '⚖️ Good balance'}
          {loadLevel === 'High' && '💪 Challenging'}
          {loadLevel === 'Overloaded' && '⚠️ Too much!'}
        </span>
      </div>

      {/* Message */}
      <div className={`text-xs ${loadInfo.textColor} py-2 px-2 rounded bg-white border ${loadInfo.borderColor}`}>
        {loadLevel === 'Relaxed' && '✓ Light workload - you can take it easy today'}
        {loadLevel === 'Moderate' && '✓ Perfect balance - steady pace recommended'}
        {loadLevel === 'High' && '⚠️ Heavy workload - stay focused and energized'}
        {loadLevel === 'Overloaded' && '⚠️ Too many tasks - consider completing some tomorrow'}
      </div>
    </div>
  );
};

export default StudyLoadMeter;
