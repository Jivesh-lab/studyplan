
const SKILL_WEIGHTS = {
  Beginner: 3,
  Medium: 2,
  Advanced: 1,
};

const PLAN_DURATION_DAYS = 30; // Generate plan for the next 30 days

// Simple UUID generator
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

export const generateInitialPlan = (userProfile) => {
  const { subjects, dailyHours, studyTime } = userProfile;

  const weightedTopics = [];
  subjects.forEach(subject => {
    const units = subject.units.split(',').map(u => u.trim());
    const weight = SKILL_WEIGHTS[subject.skill];
    units.forEach(unit => {
      weightedTopics.push({ subject: subject.name, unit, weight });
    });
  });

  const totalWeight = weightedTopics.reduce((sum, topic) => sum + topic.weight, 0);
  const totalStudySlots = dailyHours * PLAN_DURATION_DAYS;

  const topicSchedule = weightedTopics.flatMap(topic => {
    const slots = Math.round((topic.weight / totalWeight) * totalStudySlots);
    return Array(slots).fill({ subject: topic.subject, unit: topic.unit });
  });

  // Shuffle to distribute topics
  for (let i = topicSchedule.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topicSchedule[i], topicSchedule[j]] = [topicSchedule[j], topicSchedule[i]];
  }

  const plan = [];
  let topicIndex = 0;
  const today = new Date();

  for (let day = 0; day < PLAN_DURATION_DAYS; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateString = date.toISOString().split('T')[0];
    
    let startHour = studyTime === 'Morning' ? 8 : 19;

    for (let hour = 0; hour < dailyHours; hour++) {
      if (topicIndex < topicSchedule.length) {
        const topic = topicSchedule[topicIndex];
        plan.push({
          id: uuid(),
          date: dateString,
          subject: topic.subject,
          unit: topic.unit,
          startTime: startHour + hour,
          duration: 1,
          status: 'Pending', // Pending, Completed, Missed, Partially Done
        });
        topicIndex++;
      }
    }
  }

  return plan;
};

export const adaptPlan = (currentPlan, userProfile) => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  const missedTasks = currentPlan.filter(task => {
    const taskDate = new Date(task.date);
    return task.status === 'Missed' && taskDate < today;
  });

  if (missedTasks.length === 0) return currentPlan; // No adaptation needed

  let adaptablePlan = currentPlan.filter(task => !missedTasks.find(mt => mt.id === task.id));
  
  const futurePendingSlots = adaptablePlan.filter(task => {
    const taskDate = new Date(task.date);
    return task.status === 'Pending' && taskDate >= today;
  }).sort((a,b) => new Date(a.date) - new Date(b.date));

  // Try to reschedule missed tasks into the next available slots
  missedTasks.forEach(missedTask => {
    if(futurePendingSlots.length > 0) {
      const nextSlot = futurePendingSlots.shift();
      // Replace the pending task with the missed one
      adaptablePlan = adaptablePlan.map(task => {
        if(task.id === nextSlot.id) {
          return {
            ...task,
            subject: missedTask.subject,
            unit: missedTask.unit,
            originalTaskId: missedTask.id, // keep track of original
          }
        }
        return task;
      });
    } else {
        // If no future slots, add a new task at the end of the plan
        const lastTask = adaptablePlan[adaptablePlan.length - 1];
        const newDate = new Date(lastTask.date);
        newDate.setDate(newDate.getDate() + 1);

        adaptablePlan.push({
            ...missedTask,
            id: uuid(),
            date: newDate.toISOString().split('T')[0],
            status: 'Pending'
        });
    }
  });

  // Mark original missed tasks as "Rescheduled" to avoid re-processing
  return currentPlan.map(task => {
      if (missedTasks.find(mt => mt.id === task.id)) {
          return { ...task, status: 'Rescheduled' };
      }
      return task;
  }).concat(adaptablePlan.filter(task => !currentPlan.find(p => p.id === task.id))); // Add newly scheduled tasks
};
