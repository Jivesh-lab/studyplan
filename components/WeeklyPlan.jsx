import React, { useContext, useMemo, useState } from "react";
import { StudyPlanContext } from "../context/StudyPlanContext.jsx";

const WeeklyPlan = () => {
  const { studyPlan } = useContext(StudyPlanContext);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  /* ---------------- WEEK DATES ---------------- */
  const getWeekDates = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDates = useMemo(
    () => getWeekDates(currentWeek),
    [currentWeek]
  );

  /* ---------------- TASKS BY DAY ---------------- */
  const tasksByDay = useMemo(() => {
    const map = {};
    weekDates.forEach((date) => {
      const dateString = date.toISOString().split("T")[0];
      map[dateString] = (studyPlan || [])
        .filter((task) => task.date === dateString)
        .sort((a, b) => a.startTime - b.startTime);
    });
    return map;
  }, [studyPlan, weekDates]);

  /* ---------------- WEEK CHANGE ---------------- */
  const changeWeek = (offset) => {
    setCurrentWeek((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset * 7);
      return d;
    });
  };

  /* ---------------- STATUS COLORS ---------------- */
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Missed":
        return "bg-red-100 text-red-800";
      case "Partially Done":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-indigo-100 text-indigo-800";
    }
  };

  /* ---------------- REVISION TOOLTIP ---------------- */
  const getRevisionTitle = (task) => {
    if (!task?.isRevision) return undefined;
    return `Revision (+${task.revisionOffsetDays}d)`;
  };

  /* ---------------- EMPTY STATE ---------------- */
  if (!studyPlan || studyPlan.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
        <p className="text-slate-700 mb-2">📅 No tasks scheduled yet.</p>
        <p className="text-sm text-slate-500">
          Add tasks from Today’s Plan or Weakness Action Card.
        </p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeWeek(-1)}
          className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
        >
          ← Prev
        </button>

        <h1 className="text-2xl font-bold text-slate-900">
          Week of{" "}
          {weekDates[0].toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
        </h1>

        <button
          onClick={() => changeWeek(1)}
          className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
        >
          Next →
        </button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDates.map((date) => {
          const dateString = date.toISOString().split("T")[0];
          const isToday =
            dateString === new Date().toISOString().split("T")[0];

          return (
            <div
              key={dateString}
              className={`p-3 rounded-xl min-h-[150px] ${
                isToday ? "bg-indigo-100" : "bg-slate-100"
              }`}
            >
              <p
                className={`font-bold text-center ${
                  isToday ? "text-indigo-700" : "text-slate-800"
                }`}
              >
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </p>

              <p
                className={`text-sm text-center mb-3 ${
                  isToday ? "text-indigo-600" : "text-slate-600"
                }`}
              >
                {date.getDate()}
              </p>

              <div className="space-y-2">
                {tasksByDay[dateString]?.map((task) => (
                  <div
                    key={task.id}
                    title={getRevisionTitle(task)}
                    className={`p-2 rounded-md text-xs ${getStatusColor(
                      task.status
                    )}`}
                  >
                    <p className="font-semibold truncate">
                      {task.subject}{" "}
                      {task.isRevision && "(Rev)"}
                    </p>
                    <p className="truncate">{task.unit}</p>
                  </div>
                ))}

                {tasksByDay[dateString]?.length === 0 && (
                  <p className="text-xs text-slate-500 text-center">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPlan;
