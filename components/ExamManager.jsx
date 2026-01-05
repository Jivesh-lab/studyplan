import React, { useState, useContext, useMemo } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';
import ExamForm from './ExamForm.jsx';
import { calculateDaysLeft, getExamStatus, getExamStatusColors, getStudySuggestion } from '../utils/examPlanner.js';

const ExamManager = () => {
  const { exams, updateExams, studyPlan } = useContext(StudyPlanContext);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  // Calculate stats for each exam
  const examStats = useMemo(() => {
    if (!exams) return [];

    return exams.map(exam => {
      const daysLeft = calculateDaysLeft(exam.date);
      const status = getExamStatus(daysLeft);

      // Count completion rate for exam subjects
      const examTasks = studyPlan.filter(t => exam.subjects.includes(t.subject));
      const completedTasks = examTasks.filter(t => t.status === 'Completed').length;
      const completionRate = examTasks.length > 0 ? completedTasks / examTasks.length : 0;

      return {
        ...exam,
        daysLeft,
        status,
        completionRate,
        totalTasks: examTasks.length,
      };
    });
  }, [exams, studyPlan]);

  const handleSaveExam = (newExam) => {
    if (editingExam) {
      // Update existing
      updateExams(examStats.map(e => e.id === newExam.id ? newExam : e));
      setEditingExam(null);
    } else {
      // Add new
      updateExams([...(exams || []), newExam]);
    }
    setShowForm(false);
  };

  const handleDeleteExam = (examId) => {
    if (confirm('Delete this exam?')) {
      updateExams(examStats.filter(e => e.id !== examId));
    }
  };

  const handleCompleteExam = (examId) => {
    if (confirm('Mark this exam as completed? It will be removed from the list.')) {
      updateExams(examStats.filter(e => e.id !== examId));
    }
  };

  const upcomingExams = examStats.filter(e => e.daysLeft > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">📘 Exam Scheduler</h1>
          <p className="text-slate-500 mt-1">Manage exams and track preparation progress</p>
        </div>
        <button
          onClick={() => {
            setEditingExam(null);
            setShowForm(true);
          }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
        >
          ➕ Add Exam
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ExamForm
          exam={editingExam}
          onClose={() => {
            setShowForm(false);
            setEditingExam(null);
          }}
          onSave={handleSaveExam}
        />
      )}

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">⏳ Upcoming Exams</h2>
          {upcomingExams.map(exam => {
            const colors = getExamStatusColors(exam.status);
            const suggestion = getStudySuggestion(exam.completionRate, exam.daysLeft);

            return (
              <div
                key={exam.id}
                className="bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow"
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{colors.icon} {exam.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      📅 {new Date(exam.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
                    {exam.daysLeft}d left
                  </span>
                </div>

                {/* Subjects */}
                <div className="mb-3">
                  <p className="text-xs text-slate-600 font-semibold mb-2">Subjects:</p>
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.map(subject => (
                      <span
                        key={subject}
                        className="px-3 py-1 bg-blue-50 border border-blue-300 text-blue-700 text-xs rounded-full font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">Preparation Progress</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {Math.round(exam.completionRate * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${exam.completionRate * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {Math.round(exam.completionRate * exam.totalTasks)} of {exam.totalTasks} tasks completed
                  </p>
                </div>

                {/* Suggestion */}
                <div className={`bg-blue-50 border border-blue-300 rounded-lg p-3 mb-4 text-sm font-medium ${suggestion.color}`}>
                  {suggestion.message}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingExam(exam);
                      setShowForm(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleCompleteExam(exam.id)}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold text-sm"
                  >
                    ✅ Mark Done
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {examStats.length === 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-800 mb-2">📝 No exams yet</p>
          <p className="text-slate-600 mb-4">Add your exams to get personalized study plans</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
          >
            ➕ Create Your First Exam
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamManager;
