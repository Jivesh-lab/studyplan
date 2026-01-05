
import React, { useState } from 'react';
import { generateInitialPlan } from '../utils/planner.js';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: '',
    course: '',
    dailyHours: 4,
    studyTime: 'Morning',
  });
  const [subjects, setSubjects] = useState([{ name: '', skill: 'Medium', units: 'Unit 1, Unit 2, Unit 3' }]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (index, e) => {
    const { name, value } = e.target;
    const newSubjects = [...subjects];
    newSubjects[index][name] = value;
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { name: '', skill: 'Medium', units: '' }]);
  };

  const removeSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = () => {
    if (profile.name && profile.course && subjects.every(s => s.name && s.units)) {
      const userProfile = { ...profile, subjects };
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      const initialPlan = generateInitialPlan(userProfile);
      localStorage.setItem('studyPlan', JSON.stringify(initialPlan));
      localStorage.setItem('studyStreak', JSON.stringify({ current: 0, lastCompletedDate: null }));
      localStorage.setItem('achievements', JSON.stringify([]));

      onComplete();
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 profile={profile} handleChange={handleProfileChange} nextStep={nextStep} />;
      case 2:
        return <Step2 subjects={subjects} handleChange={handleSubjectChange} addSubject={addSubject} removeSubject={removeSubject} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step3 profile={profile} subjects={subjects} handleChange={handleProfileChange} handleSubmit={handleSubmit} prevStep={prevStep} />;
      default:
        return <Step1 profile={profile} handleChange={handleProfileChange} nextStep={nextStep} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 transition-all duration-500">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">Welcome to IntelliPlan</h1>
        <p className="text-center text-slate-500 mb-8">Let's create your personalized study plan.</p>
        <div className="relative h-1 bg-slate-200 rounded-full mb-8">
            <div className="absolute top-0 left-0 h-1 bg-indigo-600 rounded-full transition-all duration-500" style={{width: `${(step-1)/2 * 100}%`}}></div>
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

const Step1 = ({ profile, handleChange, nextStep }) => (
  <div>
    <h2 className="text-2xl font-semibold mb-6 text-slate-700">Tell us about yourself</h2>
    <div className="space-y-4">
      <input type="text" name="name" value={profile.name} onChange={handleChange} placeholder="Your Name" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      <input type="text" name="course" value={profile.course} onChange={handleChange} placeholder="Class / Course (e.g., 12th Grade, B.Sc. Computer Science)" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
    <div className="mt-8 flex justify-end">
      <button onClick={nextStep} disabled={!profile.name || !profile.course} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors">Next</button>
    </div>
  </div>
);

const Step2 = ({ subjects, handleChange, addSubject, removeSubject, nextStep, prevStep }) => (
  <div>
    <h2 className="text-2xl font-semibold mb-6 text-slate-700">What are you studying?</h2>
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {subjects.map((subject, index) => (
        <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-600">Subject {index + 1}</h3>
            {subjects.length > 1 && <button onClick={() => removeSubject(index)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>}
          </div>
          <input type="text" name="name" value={subject.name} onChange={(e) => handleChange(index, e)} placeholder="Subject Name (e.g., Physics)" className="w-full p-3 border border-slate-300 rounded-lg" />
          <textarea name="units" value={subject.units} onChange={(e) => handleChange(index, e)} placeholder="Syllabus Units (comma separated, e.g., Kinematics, Thermodynamics)" className="w-full p-3 border border-slate-300 rounded-lg" rows="2" />
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Your Skill Level</label>
            <select name="skill" value={subject.skill} onChange={(e) => handleChange(index, e)} className="w-full p-3 border border-slate-300 rounded-lg bg-white">
              <option value="Beginner">Beginner (Need more focus)</option>
              <option value="Medium">Medium (Comfortable)</option>
              <option value="Advanced">Advanced (Confident)</option>
            </select>
          </div>
        </div>
      ))}
    </div>
    <button onClick={addSubject} className="mt-4 text-indigo-600 font-semibold hover:text-indigo-800">+ Add another subject</button>
    <div className="mt-8 flex justify-between">
      <button onClick={prevStep} className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Back</button>
      <button onClick={nextStep} disabled={subjects.some(s => !s.name || !s.units)} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">Next</button>
    </div>
  </div>
);


const Step3 = ({ profile, subjects, handleChange, handleSubmit, prevStep }) => (
    <div>
        <h2 className="text-2xl font-semibold mb-6 text-slate-700">Set your study habits</h2>
        <div className="space-y-6">
            <div>
                <label htmlFor="dailyHours" className="block text-sm font-medium text-slate-700">How many hours can you study per day?</label>
                <input id="dailyHours" type="range" name="dailyHours" min="1" max="10" value={profile.dailyHours} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <div className="text-center font-semibold text-indigo-600 mt-2">{profile.dailyHours} hours</div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">When do you prefer to study?</label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                    <label className={`p-4 border rounded-lg cursor-pointer text-center ${profile.studyTime === 'Morning' ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-300'}`}>
                        <input type="radio" name="studyTime" value="Morning" checked={profile.studyTime === 'Morning'} onChange={handleChange} className="sr-only"/>
                        ☀️ Morning
                    </label>
                    <label className={`p-4 border rounded-lg cursor-pointer text-center ${profile.studyTime === 'Night' ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-300'}`}>
                        <input type="radio" name="studyTime" value="Night" checked={profile.studyTime === 'Night'} onChange={handleChange} className="sr-only"/>
                        🌙 Night
                    </label>
                </div>
            </div>
        </div>
        <div className="mt-8 flex justify-between">
            <button onClick={prevStep} className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Back</button>
            <button onClick={handleSubmit} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">Generate My Plan!</button>
        </div>
    </div>
);


export default Onboarding;
