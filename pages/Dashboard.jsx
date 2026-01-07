import React, { useState, useContext } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // ADD THIS
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';
import DailyPlan from '../components/DailyPlan.jsx';
import WeeklyPlan from '../components/WeeklyPlan.jsx';
import Analytics from '../components/Analytics.jsx';
import Achievements from '../components/Achievements.jsx';
import ExamManager from '../components/ExamManager.jsx';

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
const ClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const Dashboard = ({ onReset }) => {
  const [activeView, setActiveView] = useState('daily');
  const { userProfile } = useContext(StudyPlanContext);
  const { logout, user } = useAuth(); // ADD THIS LINE
  
  const renderView = () => {
    switch(activeView) {
      case 'daily':
        return <DailyPlan />;
      case 'weekly':
        return <WeeklyPlan />;
      case 'analytics':
        return <Analytics />;
      case 'achievements':
        return <Achievements />;
      case 'exams':
        return <ExamManager />;
      default:
        return <DailyPlan />;
    }
  };

  const NavItem = ({ view, icon, label }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex flex-col md:flex-row items-center justify-center md:justify-start w-full p-3 my-1 rounded-lg transition-colors duration-200 ${activeView === view ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-indigo-100'}`}
    >
      {icon}
      <span className="mt-1 md:mt-0 md:ml-3 text-sm md:text-base font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100">
      <aside className="w-full md:w-64 bg-white/80 backdrop-blur-sm border-r border-slate-200 p-4 md:p-6 flex flex-col fixed bottom-0 md:relative md:min-h-screen z-10 shadow-t-lg md:shadow-none">
        <div className="hidden md:block mb-10">
          <h1 className="text-2xl font-bold text-indigo-700">IntelliPlan</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.name || userProfile?.name}!</p>
        </div>
        <nav className="flex-grow flex flex-row md:flex-col justify-around md:justify-start">
          <NavItem view="daily" icon={<ClipboardIcon />} label="Today's Plan" />
          <NavItem view="weekly" icon={<CalendarIcon />} label="Weekly View" />
          <NavItem view="analytics" icon={<BarChartIcon />} label="Progress" />
          <NavItem view="achievements" icon={<TrophyIcon />} label="Achievements" />
          <NavItem view="exams" icon={<BookIcon />} label="Exams" />
        </nav>
        <div className="hidden md:block mt-auto space-y-2">
          <button onClick={onReset} className="w-full flex items-center p-3 text-slate-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors">
            <SettingsIcon />
            <span className="ml-3 font-medium">Reset Data</span>
          </button>
          <button onClick={logout} className="w-full flex items-center p-3 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
            <LogOutIcon />
            <span className="ml-3 font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;
