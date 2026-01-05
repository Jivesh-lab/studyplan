import React, { useState, useContext } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const ExamForm = ({ exam = null, onClose, onSave }) => {
  const { userProfile } = useContext(StudyPlanContext);
  const [formData, setFormData] = useState(
    exam || {
      name: '',
      date: '',
      subjects: [],
    }
  );

  const [newSubject, setNewSubject] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()],
      }));
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.date || formData.subjects.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    const newExam = {
      ...formData,
      id: exam?.id || uuid(),
      status: 'upcoming',
    };

    onSave(newExam);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {exam ? '✏️ Edit Exam' : '➕ Add New Exam'}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Exam Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📝 Exam Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Mid-Semester, Finals"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-800"
            />
          </div>

          {/* Exam Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📅 Exam Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-800"
            />
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📚 Subjects
            </label>
            
            {/* Subject Input */}
            <div className="flex gap-2 mb-3">
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-800"
              >
                <option value="">Select subject...</option>
                {userProfile?.subjects?.map(subject => (
                  <option key={subject.name} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
              >
                Add
              </button>
            </div>

            {/* Selected Subjects */}
            {formData.subjects.length > 0 && (
              <div className="space-y-2">
                {formData.subjects.map(subject => (
                  <div
                    key={subject}
                    className="flex items-center justify-between bg-indigo-50 border border-indigo-300 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-800">{subject}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subject)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-sm text-blue-700">
            <p>✅ Your study plan will automatically adjust for this exam</p>
            <p className="mt-1 text-xs">Revision tasks will be added automatically</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              {exam ? 'Update' : 'Create'} Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamForm;
