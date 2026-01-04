
import React, { useContext } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';

const Achievements = () => {
    const { achievements } = useContext(StudyPlanContext);

    const allAchievements = [
        { id: 'first_step', name: 'First Step', icon: '👟', description: "Complete your first task." },
        { id: 'five_done', name: 'High Five', icon: '🖐️', description: "Complete 5 tasks." },
        { id: 'ten_done', name: 'Ten-tastic!', icon: '🔟', description: "Complete 10 tasks." },
        { id: 'streak_3', name: 'On a Roll!', icon: '🔥', description: "Maintain a 3-day streak." },
        { id: 'streak_7', name: 'Week Warrior', icon: '🗓️', description: "Maintain a 7-day streak." },
        { id: 'consistency_king', name: 'Consistency King', icon: '👑', description: "Maintain a 30-day streak." },
    ];
    
    const earnedIds = new Set(achievements.map(a => a.id));

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Your Achievements</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allAchievements.map(ach => {
                    const isEarned = earnedIds.has(ach.id);
                    const earnedData = isEarned ? achievements.find(a => a.id === ach.id) : null;

                    return (
                        <div key={ach.id} className={`p-6 rounded-2xl text-center transition-all duration-300 ${isEarned ? 'bg-white shadow-lg' : 'bg-slate-100'}`}>
                            <div className={`text-6xl mx-auto mb-4 transition-transform duration-300 ${isEarned ? 'grayscale-0 scale-100' : 'grayscale scale-90'}`}>
                                {ach.icon}
                            </div>
                            <h3 className={`font-bold ${isEarned ? 'text-indigo-600' : 'text-slate-600'}`}>{ach.name}</h3>
                            <p className="text-sm text-slate-500 h-10">{ach.description}</p>
                            {isEarned && (
                                <p className="text-xs text-green-600 mt-2 font-semibold">
                                    Unlocked on {new Date(earnedData.date).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default Achievements;
