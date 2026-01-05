import React, { useContext, useMemo } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';
import { calculateDaysLeft, getExamStatus, getExamStatusColors } from '../utils/examPlanner.js';

const ExamCountdown = () => {
  const { exams } = useContext(StudyPlanContext);

  // Get nearest upcoming exam
  const nearestExam = useMemo(() => {
    if (!exams || exams.length === 0) return null;

    return exams
      .filter(e => calculateDaysLeft(e.date) > 0)
      .sort((a, b) => calculateDaysLeft(a.date) - calculateDaysLeft(b.date))[0];
  }, [exams]);

  if (!nearestExam) {
    return (
      <div className="p-4 rounded-2xl border-2 bg-blue-50 border-blue-300">
        <h3 className="font-semibold text-slate-800 mb-2">📘 No Upcoming Exams</h3>
        <p className="text-sm text-slate-600">Add an exam to get personalized prep plans</p>
      </div>
    );
  }

  const daysLeft = calculateDaysLeft(nearestExam.date);
  const status = getExamStatus(daysLeft);
  const colors = getExamStatusColors(status);

  // Format subjects list
  const subjectsText = nearestExam.subjects?.slice(0, 2).join(', ') + 
    (nearestExam.subjects?.length > 2 ? ` +${nearestExam.subjects.length - 2}` : '');

  return (
    <div className={`p-4 rounded-2xl border-2 bg-white border-indigo-300 shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800">
            {colors.icon} {nearestExam.name}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Subjects: <span className="font-semibold">{subjectsText}</span>
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
          {daysLeft > 0 ? `${daysLeft}d left` : 'Today!'}
        </span>
      </div>

      {/* Countdown Bar */}
      <div className="space-y-2">
        {/* Visual countdown bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              status === 'today' ? 'bg-green-500' :
              status === 'imminent' ? 'bg-red-500' :
              status === 'approaching' ? 'bg-amber-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (30 - daysLeft) / 30 * 100))}%` }}
          />
        </div>

        {/* Days display */}
        <div className="flex justify-between items-center">
          <span className={`text-sm font-bold ${colors.text}`}>
            {daysLeft > 0 ? `${daysLeft} days to prepare` : 'Exam today!'}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(nearestExam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Quick tip */}
      <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
        {daysLeft > 14 && '📚 Start with fundamentals'}
        {daysLeft > 7 && daysLeft <= 14 && '🎯 Focus on weak areas'}
        {daysLeft > 0 && daysLeft <= 7 && '⚡ Practice past papers & revision'}
        {daysLeft === 0 && '💪 You got this! Light revision only'}
      </div>
    </div>
  );
};

export default ExamCountdown;
