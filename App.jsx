
import React, { useState, useEffect } from 'react';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { StudyPlanProvider } from './context/StudyPlanContext.jsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      setHasProfile(true);
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    setHasProfile(true);
  };
  
  const handleReset = () => {
    if(window.confirm("Are you sure you want to reset all your data and start over?")) {
      localStorage.clear();
      setHasProfile(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-xl font-semibold text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <StudyPlanProvider>
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen bg-slate-50 font-sans">
          {hasProfile ? <Dashboard onReset={handleReset} /> : <Onboarding onComplete={handleOnboardingComplete} />}
        </div>
      </DndProvider>
    </StudyPlanProvider>
  );
}

export default App;
