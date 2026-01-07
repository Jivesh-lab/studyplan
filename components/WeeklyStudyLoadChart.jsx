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
    if (percentage <= 25) return { level: 'Relaxed', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (percentage <= 50) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    if (percentage <= 75) return { level: 'High', color: 'text-orange-600', bgColor: 'bg-orange-500' };
    return { level: 'Overloaded', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  const { weekData, averagePercentage, maxPercentage, minPercentage, todayPercentage } = useMemo(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week
    
    const data = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDate = new Date().toISOString().split('T')[0];
    let todayLoad = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Count tasks for this day (excluding completed)
      const dayTasks = studyPlan?.filter(t => t.date === dateString && t.status !== 'Completed') || [];
      const taskCount = dayTasks.length;
      const percentage = getLoadPercentage(taskCount);
      const loadInfo = getLoadLevel(percentage);
      
      if (dateString === todayDate) {
        todayLoad = percentage;
      }
      
      data.push({
        label: dayLabels[i],
        date: dateString,
        taskCount,
        percentage,
        isToday: dateString === todayDate,
        ...loadInfo,
      });
    }
    
    const averagePercentage = Math.round(data.reduce((sum, d) => sum + d.percentage, 0) / 7);
    const maxPercentage = Math.max(...data.map(d => d.percentage));
    const minPercentage = Math.min(...data.map(d => d.percentage));
    
    return { weekData: data, averagePercentage, maxPercentage, minPercentage, todayPercentage: todayLoad };
  }, [studyPlan]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-700 mb-4">📊 Weekly Study Load</h2>
      
      <div className="space-y-4">
        {/* Bar Chart */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Daily Load Distribution</h3>
          
          {/* Bar Container with Grid Background */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            {/* Y-axis labels */}
            <div className="flex mb-4 gap-4">
              <div className="w-12 flex flex-col justify-between text-right text-xs text-slate-500 font-semibold h-48">
                <div>100%</div>
                <div>75%</div>
                <div>50%</div>
                <div>25%</div>
                <div>0%</div>
              </div>
              
              {/* Bars */}
              <div className="flex-1 flex items-end justify-around gap-3 h-48 border-l-2 border-b-2 border-slate-300 relative">
                {/* Reference lines */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                  <div className="flex-1 border-b border-slate-200"></div>
                  <div className="flex-1 border-b border-slate-200"></div>
                  <div className="flex-1 border-b border-slate-200"></div>
                  <div className="flex-1 border-b border-slate-200"></div>
                </div>
                
                {/* Day bars */}
                {weekData.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end group relative min-w-fit">
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 hover:shadow-lg cursor-pointer ${day.bgColor}`}
                      style={{ height: `${day.percentage * 2}px` }}
                      title={`${day.label}: ${day.percentage}% (${day.taskCount} tasks)`}
                    >
                      <div className="text-white text-xs font-bold text-center py-1">
                        {day.percentage}%
                      </div>
                    </div>
                    
                    {/* Day Label */}
                    <span className="text-xs font-semibold text-slate-600 mt-2">
                      {day.label}
                    </span>

                    {/* Tooltip */}
                    <div className="invisible group-hover:visible absolute -top-8 bg-slate-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                      {day.taskCount} tasks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

      {/* Legend & Info */}
      <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
        <div className="text-xs text-slate-600 font-semibold">Legend:</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-slate-600">Daily Load (Purple Line)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-500" />
            <span className="text-xs text-slate-600">Avg Load (Blue Dash)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-slate-200" />
            <span className="text-xs text-slate-600">Today (Gold)</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-3 p-2 bg-slate-50 rounded">
          <strong>How it works:</strong> Each day's load is determined by your pending tasks. Complete tasks to see your load percentage decrease!
        </div>
      </div>
    </div>
  );
};

export default WeeklyStudyLoadChart;
