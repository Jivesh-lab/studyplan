import React, { useContext, useMemo, useState } from 'react';
import { StudyPlanContext } from '../context/StudyPlanContext';
import { calculateMissedRate, shouldTriggerCatchup } from '../utils/catchupPlanner';
import { CatchupModal } from './CatchupModal';

export const CatchupSuggestion = () => {
  const { studyPlan, exams } = useContext(StudyPlanContext);
  const [showModal, setShowModal] = useState(false);

  console.log('🔍 CatchupSuggestion rendered | showModal:', showModal);

  const { isCritical, missedRate } = useMemo(() => {
    const rate = calculateMissedRate(studyPlan);
    const shouldShow = shouldTriggerCatchup(studyPlan, exams);
    console.log('📊 CatchupSuggestion check | isCritical:', shouldShow, '| missedRate:', rate);
    return {
      isCritical: shouldShow,
      missedRate: rate
    };
  }, [studyPlan, exams]);

  if (!isCritical) {
    console.log('❌ CatchupSuggestion: Not critical, returning null');
    return null;
  }

  console.log('✅ CatchupSuggestion: SHOWING alert card');

  const percentMissed = Math.round(missedRate * 100);
  const messageType =
    missedRate > 0.3 ? 'critical' : missedRate > 0.15 ? 'warning' : 'info';

  return (
    <>
      <div
        className={`rounded-2xl shadow-lg p-4 mb-6 border-2 ${
          messageType === 'critical'
            ? 'bg-red-50 border-red-300'
            : messageType === 'warning'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-blue-50 border-blue-300'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl">
            {messageType === 'critical' ? '🚨' : messageType === 'warning' ? '⚠️' : '💡'}
          </div>
          <div className="flex-1">
            <h3
              className={`font-bold text-lg mb-1 ${
                messageType === 'critical'
                  ? 'text-red-800'
                  : messageType === 'warning'
                    ? 'text-amber-800'
                    : 'text-blue-800'
              }`}
            >
              {messageType === 'critical'
                ? "You're Behind! 🎯"
                : messageType === 'warning'
                  ? 'Time to Catch Up'
                  : 'Quick Catch-Up Available'}
            </h3>
            <p
              className={`text-sm mb-3 ${
                messageType === 'critical'
                  ? 'text-red-700'
                  : messageType === 'warning'
                    ? 'text-amber-700'
                    : 'text-blue-700'
              }`}
            >
              {messageType === 'critical'
                ? `${percentMissed}% of your tasks are overdue. Use Emergency Catch-Up Mode to create a focused plan right now.`
                : messageType === 'warning'
                  ? `${percentMissed}% of your tasks are overdue. Let's prioritize and catch up today.`
                  : `${percentMissed}% of tasks behind schedule. Try Emergency Catch-Up Mode to stay on track.`}
            </p>
            <button
              onClick={() => {
                console.log('🔴 "Catch Up Now" button CLICKED!');
                setShowModal(true);
                console.log('✅ setShowModal(true) called, showModal should be true now');
              }}
              className={`px-4 py-2 rounded-lg font-semibold text-white transition ${
                messageType === 'critical'
                  ? 'bg-red-600 hover:bg-red-700'
                  : messageType === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {messageType === 'critical'
                ? '⚡ Launch Emergency Mode'
                : '🎯 Catch Up Now'}
            </button>
          </div>
        </div>
      </div>

      <CatchupModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
