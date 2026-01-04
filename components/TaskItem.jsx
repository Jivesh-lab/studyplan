
import React, { useContext } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext.jsx';

const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;


const TaskItem = ({ task }) => {
  const { updateTaskStatus } = useContext(StudyPlanContext);

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      case 'Missed':
        return 'bg-red-100 text-red-800 border-l-4 border-red-500 opacity-70';
      case 'Partially Done':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      default:
        return 'bg-slate-50 border-l-4 border-slate-300';
    }
  };

  const formatTime = (hour) => {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className={`p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all duration-300 ${getStatusClasses(task.status)}`}>
      <div className="flex-1 mb-4 sm:mb-0">
        <p className="font-bold text-lg">{task.subject}</p>
        <p className="text-slate-600">{task.unit}</p>
        <p className="text-sm text-slate-500 mt-1">{formatTime(task.startTime)} - {formatTime(task.startTime + task.duration)} ({task.duration} hr)</p>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={() => updateTaskStatus(task.id, 'Completed')} className="p-2 rounded-full bg-green-200 text-green-700 hover:bg-green-300 transition-colors disabled:opacity-50" disabled={task.status === 'Completed'}><CheckIcon /></button>
        <button onClick={() => updateTaskStatus(task.id, 'Partially Done')} className="p-2 rounded-full bg-yellow-200 text-yellow-700 hover:bg-yellow-300 transition-colors disabled:opacity-50" disabled={task.status === 'Partially Done'}><ClockIcon /></button>
        <button onClick={() => updateTaskStatus(task.id, 'Missed')} className="p-2 rounded-full bg-red-200 text-red-700 hover:bg-red-300 transition-colors disabled:opacity-50" disabled={task.status === 'Missed'}><XIcon /></button>
      </div>
    </div>
  );
};

export default TaskItem;
