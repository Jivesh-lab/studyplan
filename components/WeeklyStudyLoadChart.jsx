import React, { useContext, useMemo } from "react";
import { StudyPlanContext } from "../context/StudyPlanContext.jsx";
import { getTodayISODate } from "../utils/date.js";

const WeeklyStudyLoadChart = () => {
  const { studyPlan, userProfile } = useContext(StudyPlanContext);

  // Get fixed load percentage based on task count
  const getLoadPercentage = (taskCount) => {
    if (taskCount <= 2) return 25;
    if (taskCount <= 3) return 50;
    if (taskCount <= 4) return 75;
    return 100;
  };

  // Get load level based on percentage
  const getLoadLevel = (percentage) => {
    if (percentage <= 25) return { level: 'Relaxed', color: 'bg-green-500' };
    if (percentage <= 50) return { level: 'Moderate', color: 'bg-yellow-500' };
    if (percentage <= 75) return { level: 'High', color: 'bg-orange-500' };
    return { level: 'Overloaded', color: 'bg-red-500' };
  };

  const { weekData, averagePercentage, maxPercentage } = useMemo(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week
    
    const data = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Count tasks for this day (excluding completed)
      const dayTasks = studyPlan?.filter(t => t.date === dateString && t.status !== 'Completed') || [];
      const taskCount = dayTasks.length;
      const percentage = getLoadPercentage(taskCount);
      const loadInfo = getLoadLevel(percentage);
      
      data.push({
        label: dayLabels[i],
        date: dateString,
        taskCount,
        percentage,
        ...loadInfo,
      });
    }
    
    const averagePercentage = Math.round(data.reduce((sum, d) => sum + d.percentage, 0) / 7);
    const maxPercentage = Math.max(...data.map(d => d.percentage));
    
    return { weekData: data, averagePercentage, maxPercentage };
  }, [studyPlan]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-700 mb-4">📊 Weekly Study Load</h2>
      
      {/* Bar Chart */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-1 h-48 border-b-2 border-slate-200">
          {weekData.map((day) => {
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-2 relative group"
              >
                {/* Bar - FIXED PERCENTAGE */}
                <div
                  className={`w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer ${day.color}`}
                  style={{ height: `${day.percentage}%` }}
                  title={`${day.label}: ${day.percentage}% (${day.taskCount} tasks)`}
                />
                
                {/* Label */}
                <span className="text-xs font-semibold text-slate-600 text-center">
                  {day.label}
                </span>

                {/* Tooltip */}
                <div className="invisible group-hover:visible absolute bottom-full mb-2 bg-slate-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                  {day.percentage}% ({day.taskCount} tasks)
                </div>
              </div>
            );
          })}
        </div>

        {/* Capacity Line - 100% */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-1 relative h-1 bg-slate-200">
            <div className="absolute h-full bg-amber-500 border-2 border-amber-500 w-full" />
          </div>
          <span className="text-slate-600 font-semibold min-w-fit">
            100% Capacity
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 border border-blue-300 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-semibold">Avg Load</p>
          <p className="text-lg font-bold text-blue-700">{averagePercentage}%</p>
        </div>
        <div className="bg-green-50 border border-green-300 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-semibold">Peak Load</p>
          <p className="text-lg font-bold text-green-700">{maxPercentage}%</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-300 p-3 rounded-lg">
          <p className="text-xs text-indigo-600 font-semibold">Capacity</p>
          <p className="text-lg font-bold text-indigo-700">100%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Relaxed (25% - 0-2 tasks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>Moderate (50% - 3 tasks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span>High (75% - 4 tasks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Overloaded (100% - 5+ tasks)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStudyLoadChart;
