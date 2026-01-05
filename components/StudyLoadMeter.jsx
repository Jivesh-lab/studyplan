import React, { useContext, useMemo } from "react";
import { StudyPlanContext } from "../context/StudyPlanContext.jsx";
import {
  calculateDailyStudyMinutes,
  getStudyLoadLevel,
  getStudyLoadSuggestion,
} from "../utils/planner.js";
import { getTodayISODate } from "../utils/date.js";

const StudyLoadMeter = () => {
  const { studyPlan, userProfile } = useContext(StudyPlanContext);
  const todayString = getTodayISODate();

  // Calculate today's study load
  const { dailyMinutes, loadInfo } = useMemo(() => {
    const minutes = calculateDailyStudyMinutes(studyPlan, todayString);
    const dailyCapacity = (userProfile?.dailyHours || 4) * 60; // Convert hours to minutes
    const info = getStudyLoadLevel(minutes, dailyCapacity);
    return { dailyMinutes: minutes, loadInfo: info };
  }, [studyPlan, todayString, userProfile]);

  const suggestion = useMemo(() => {
    const dailyCapacity = (userProfile?.dailyHours || 4) * 60;
    return getStudyLoadSuggestion(dailyMinutes, dailyCapacity);
  }, [dailyMinutes, userProfile]);

  const dailyCapacity = (userProfile?.dailyHours || 4) * 60;
  const displayMinutes = Math.floor(dailyMinutes);
  const displayCapacity = Math.floor(dailyCapacity);

  return (
    <div className={`p-4 rounded-2xl border-2 ${loadInfo.backgroundColor} ${loadInfo.borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">📊 Today's Study Load</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${loadInfo.textColor} bg-white border ${loadInfo.borderColor}`}>
          {loadInfo.level}
        </span>
      </div>

      {/* Visual Meter */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${loadInfo.meterColor}`}
            style={{ width: `${loadInfo.percentage}%` }}
          />
        </div>
      </div>

      {/* Minutes Info */}
      <div
        className={`text-sm mb-2 ${loadInfo.textColor} font-semibold flex justify-between items-center`}
        title={`${displayMinutes}m planned / ${displayCapacity}m capacity (${Math.round(loadInfo.actualPercentage)}%)`}
      >
        <span>{displayMinutes} mins planned</span>
        <span className="text-xs opacity-75">{displayCapacity}m capacity</span>
      </div>

      {/* Suggestion */}
      <div className={`text-xs ${loadInfo.textColor} py-2 px-2 rounded bg-white border ${loadInfo.borderColor}`}>
        {suggestion}
      </div>

      {/* Info Icon with Tooltip */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          title={`Total: ${displayMinutes}m ÷ Capacity: ${displayCapacity}m = ${Math.round(loadInfo.actualPercentage)}%`}
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>Hover for calculation details</span>
      </div>
    </div>
  );
};

export default StudyLoadMeter;
