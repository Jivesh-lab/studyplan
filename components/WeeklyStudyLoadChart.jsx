import React, { useContext, useMemo } from "react";
import { StudyPlanContext } from "../context/StudyPlanContext.jsx";
import { getWeeklyStudyMinutes, getStudyLoadLevel } from "../utils/planner.js";

const WeeklyStudyLoadChart = () => {
  const { studyPlan, userProfile } = useContext(StudyPlanContext);
  
  const dailyCapacity = (userProfile?.dailyHours || 4) * 60; // Convert to minutes

  const { weekData, averageMinutes, maxMinutes } = useMemo(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of current week
    
    const weeklyMinutes = getWeeklyStudyMinutes(studyPlan, startDate);
    
    const data = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const minutes = weeklyMinutes[dateString] || 0;
      
      data.push({
        label: dayLabels[i],
        date: dateString,
        minutes,
        loadInfo: getStudyLoadLevel(minutes, dailyCapacity),
      });
    }
    
    const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);
    const averageMinutes = Math.round(totalMinutes / 7);
    const maxMinutes = Math.max(...data.map(d => d.minutes));
    
    return { weekData: data, averageMinutes, maxMinutes };
  }, [studyPlan, userProfile, dailyCapacity]);

  const maxScale = Math.max(maxMinutes, dailyCapacity) * 1.1;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-700 mb-4">📊 Weekly Study Load</h2>
      
      {/* Bar Chart */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-1 h-48 border-b-2 border-slate-200">
          {weekData.map((day) => {
            const barHeight = (day.minutes / maxScale) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-2 relative group"
              >
                {/* Bar */}
                <div
                  className={`w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer ${day.loadInfo.meterColor}`}
                  style={{ height: `${barHeight}%` }}
                  title={`${day.label}: ${day.minutes}m (${day.loadInfo.level})`}
                />
                
                {/* Label */}
                <span className="text-xs font-semibold text-slate-600 text-center">
                  {day.label}
                </span>

                {/* Tooltip */}
                <div className="invisible group-hover:visible absolute bottom-full mb-2 bg-slate-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                  {day.minutes}m
                </div>
              </div>
            );
          })}
        </div>

        {/* Capacity Line */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-1 relative h-1 bg-slate-200">
            <div
              className="absolute h-full bg-amber-500 border-2 border-amber-500"
              style={{ width: `${(dailyCapacity / maxScale) * 100}%` }}
            />
          </div>
          <span className="text-slate-600 font-semibold min-w-fit">
            {Math.floor(dailyCapacity)}m/day capacity
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 border border-blue-300 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-semibold">Avg Daily</p>
          <p className="text-lg font-bold text-blue-700">{averageMinutes}m</p>
        </div>
        <div className="bg-green-50 border border-green-300 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-semibold">Peak Day</p>
          <p className="text-lg font-bold text-green-700">{maxMinutes}m</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-300 p-3 rounded-lg">
          <p className="text-xs text-indigo-600 font-semibold">Capacity/Day</p>
          <p className="text-lg font-bold text-indigo-700">{Math.floor(dailyCapacity)}m</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Low (0-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Medium (50-85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span>High (85-120%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Overloaded (120%+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStudyLoadChart;
