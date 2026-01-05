
import React, { useContext, useMemo } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';
import WeaknessActionCard from './WeaknessActionCard.jsx';
import WeeklyStudyLoadChart from './WeeklyStudyLoadChart.jsx';

// Note: In a real project, you'd install recharts. For this environment, we'll mock the charts.
// This is a limitation of not having a build step. For a functional demo, we'll render SVGs.

const Analytics = () => {
  const { studyPlan, userProfile } = useContext(StudyPlanContext);

  const stats = useMemo(() => {
    if (!studyPlan || !userProfile) return null;

    const totalTasks = studyPlan.length;
    const completedTasks = studyPlan.filter(t => t.status === 'Completed').length;
    const missedTasks = studyPlan.filter(t => t.status === 'Missed').length;
    const partiallyDoneTasks = studyPlan.filter(t => t.status === 'Partially Done').length;
    const pendingTasks = totalTasks - completedTasks - missedTasks - partiallyDoneTasks;

    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const hoursPlanned = studyPlan.reduce((acc, t) => acc + t.duration, 0);
    const hoursStudied = studyPlan.filter(t => t.status === 'Completed').reduce((acc, t) => acc + t.duration, 0);

    const subjectData = userProfile.subjects.map(subject => {
      const subjectTasks = studyPlan.filter(t => t.subject === subject.name);
      const total = subjectTasks.length;
      const completed = subjectTasks.filter(t => t.status === 'Completed').length;
      return {
        name: subject.name,
        completed,
        total,
        percentage: total > 0 ? (completed / total) * 100 : 0,
      };
    });

    const weaknesses = subjectData.filter(s => s.percentage < 50 && s.total > 2).sort((a, b) => a.percentage - b.percentage);

    return { totalTasks, completedTasks, missedTasks, completionPercentage, hoursPlanned, hoursStudied, subjectData, weaknesses };
  }, [studyPlan, userProfile]);

  if (!stats) {
    return <p>Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Your Progress</h1>
      
      <WeaknessActionCard />

      {/* Weekly Study Load Chart */}
      <WeeklyStudyLoadChart />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Overall Completion" value={`${stats.completionPercentage.toFixed(1)}%`} />
        <StatCard title="Tasks Completed" value={stats.completedTasks} />
        <StatCard title="Hours Studied" value={`${stats.hoursStudied} / ${stats.hoursPlanned}`} />
        <StatCard title="Tasks Missed" value={stats.missedTasks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-700 mb-4">Subject Progress</h2>
          <div className="space-y-4">
            {stats.subjectData.map(subject => (
              <div key={subject.name}>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-slate-600">{subject.name}</span>
                  <span className="text-sm font-medium text-slate-500">{subject.completed} / {subject.total} tasks</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div className="bg-indigo-600 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${subject.percentage}%` }}>
                    {subject.percentage > 10 && `${Math.round(subject.percentage)}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold text-slate-700 mb-4">Weakness Detection</h2>
          {stats.weaknesses.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Topics you might want to focus on more:</p>
              {stats.weaknesses.map(sub => (
                <div key={sub.name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-semibold text-red-700">{sub.name}</span>
                  <span className="text-sm font-bold text-red-600">{Math.round(sub.percentage)}% completion</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500">🚀 Great job! No significant weaknesses detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="text-3xl font-bold text-indigo-600 mt-1">{value}</p>
  </div>
);


export default Analytics;
