
import React, { useContext, useMemo, useState } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';

const WeeklyPlan = () => {
    const { studyPlan } = useContext(StudyPlanContext);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    const getWeekDates = (date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const week = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            week.push(day);
        }
        return week;
    };

    const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
    
    const tasksByDay = useMemo(() => {
        const tasksMap = {};
        weekDates.forEach(date => {
            const dateString = date.toISOString().split('T')[0];
            tasksMap[dateString] = studyPlan
                .filter(task => task.date === dateString)
                .sort((a,b) => a.startTime - b.startTime);
        });
        return tasksMap;
    }, [studyPlan, weekDates]);

    const changeWeek = (offset) => {
        setCurrentWeek(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + offset * 7);
            return newDate;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-500';
            case 'Missed': return 'bg-red-500';
            case 'Partially Done': return 'bg-yellow-500';
            default: return 'bg-indigo-500';
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => changeWeek(-1)} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">&larr; Prev</button>
                <h1 className="text-2xl font-bold text-slate-800">
                    Week of {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h1>
                <button onClick={() => changeWeek(1)} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Next &rarr;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {weekDates.map(date => {
                    const dateString = date.toISOString().split('T')[0];
                    const isToday = dateString === new Date().toISOString().split('T')[0];
                    return (
                        <div key={dateString} className={`p-3 rounded-lg ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                            <p className={`font-bold text-center ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className={`text-sm text-center mb-3 ${isToday ? 'text-indigo-500' : 'text-slate-400'}`}>{date.getDate()}</p>
                            <div className="space-y-2">
                                {tasksByDay[dateString].map(task => (
                                    <div key={task.id} className="p-2 rounded-md text-white text-xs" style={{ backgroundColor: getStatusColor(task.status) }}>
                                        <p className="font-semibold truncate">{task.subject}</p>
                                        <p className="truncate opacity-80">{task.unit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyPlan;
