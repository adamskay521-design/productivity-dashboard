"use client";

import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Circle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Task, Habit, HabitLog, TaskCategory, CalendarEvent } from "@/lib/schema";
import { CATEGORY_META } from "@/lib/schema";

const EVENT_COLORS = [
  "#b89060", "#c9888c", "#6fa8a3", "#c9913a", "#7c5cba", "#3d8c6a",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PRIORITY_STYLES: Record<string, { chip: string; dot: string }> = {
  high:   { chip: "bg-drose-100 text-drose-700",   dot: "bg-drose-400"  },
  medium: { chip: "bg-cream-200 text-nude-700",    dot: "bg-nude-400"  },
  low:    { chip: "bg-stone-100 text-stone-500",    dot: "bg-stone-300"  },
};

function getCalendarDays(month: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end:   endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", priority: "medium" as "low" | "medium" | "high" });
  const [eventForm, setEventForm] = useState({ title: "", startTime: "", endTime: "", color: EVENT_COLORS[0] });
  const [saving, setSaving] = useState(false);

  async function load() {
    const start = format(startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const [t, h, l, ev] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/habits").then((r) => r.json()),
      fetch("/api/habit-logs?days=90").then((r) => r.json()),
      fetch(`/api/events?start=${start}&end=${end}`).then((r) => r.json()),
    ]);
    setTasks(Array.isArray(t) ? t : []);
    setHabits(Array.isArray(h) ? h : []);
    setLogs(Array.isArray(l) ? l : []);
    setEvents(Array.isArray(ev) ? ev : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [currentMonth]);

  const days = getCalendarDays(currentMonth);

  function tasksForDay(date: Date): Task[] {
    const ds = format(date, "yyyy-MM-dd");
    return tasks.filter((t) => t.dueDate === ds);
  }

  function eventsForDay(date: Date): CalendarEvent[] {
    const ds = format(date, "yyyy-MM-dd");
    return events.filter((e) => e.date === ds);
  }

  function habitsForDay(date: Date): { habit: Habit; done: boolean }[] {
    const ds = format(date, "yyyy-MM-dd");
    return habits.map((h) => ({
      habit: h,
      done: logs.some((l) => l.habitId === h.id && l.completedDate === ds),
    }));
  }

  async function toggleTask(taskId: number, status: string) {
    const next = status === "done" ? "todo" : "done";
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function toggleHabit(habitId: number, date: Date) {
    await fetch("/api/habit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, completedDate: format(date, "yyyy-MM-dd") }),
    });
    load();
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title.trim() || !selectedDate) return;
    setSaving(true);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: eventForm.title.trim(),
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        color: eventForm.color,
        allDay: !eventForm.startTime,
      }),
    });
    setEventForm({ title: "", startTime: "", endTime: "", color: EVENT_COLORS[0] });
    setShowAddEvent(false);
    setSaving(false);
    load();
  }

  async function deleteEvent(id: number) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    load();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.title.trim() || !selectedDate) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: addForm.title.trim(),
        priority: addForm.priority,
        dueDate: format(selectedDate, "yyyy-MM-dd"),
      }),
    });
    setAddForm({ title: "", priority: "medium" });
    setShowAddTask(false);
    setSaving(false);
    load();
  }

  const selectedTasks  = selectedDate ? tasksForDay(selectedDate)  : [];
  const selectedHabits = selectedDate ? habitsForDay(selectedDate) : [];
  const selectedEvents = selectedDate ? eventsForDay(selectedDate) : [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Calendar</h1>
          <p className="text-stone-400 text-sm mt-0.5">{format(currentMonth, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-cream-50 shadow-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCurrentMonth(startOfMonth(new Date())); setSelectedDate(new Date()); }}
            className="px-3 h-8 rounded-lg border border-cream-300 bg-white text-stone-600 text-sm font-medium hover:bg-cream-50 shadow-sm transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-lg border border-cream-300 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-cream-50 shadow-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`flex gap-5 ${selectedDate ? "items-start" : ""}`}>
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-cream-200">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-3 text-center text-xs font-semibold text-stone-400 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-stone-300">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 divide-x divide-y divide-cream-100">
              {days.map((day) => {
                const inMonth  = isSameMonth(day, currentMonth);
                const today    = isToday(day);
                const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                const dayTasks = tasksForDay(day);
                const dayLogs   = logs.filter((l) => l.completedDate === format(day, "yyyy-MM-dd"));
                const dayEvents = eventsForDay(day);
                const visibleTasks = dayTasks.slice(0, 2);
                const overflow = dayTasks.length - 2;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() =>
                      setSelectedDate(isSameDay(day, selectedDate ?? new Date(-1)) ? null : day)
                    }
                    className={`min-h-[96px] p-2 text-left transition-colors flex flex-col ${
                      selected
                        ? "bg-sage-50"
                        : today
                          ? "bg-drose-50/40"
                          : inMonth
                            ? "bg-white hover:bg-cream-50"
                            : "bg-cream-50/60 hover:bg-cream-100/60"
                    }`}
                  >
                    {/* Day number */}
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        today
                          ? "bg-sage-400 text-white"
                          : selected
                            ? "bg-drose-200 text-drose-800"
                            : inMonth
                              ? "text-stone-700"
                              : "text-stone-300"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Event chips (above tasks) */}
                    {inMonth && dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="text-xs px-1.5 py-0.5 rounded truncate leading-tight mb-0.5 font-medium"
                        style={{ backgroundColor: ev.color + "25", color: ev.color }}
                      >
                        {ev.startTime ? `${ev.startTime.slice(0, 5)} ` : "• "}{ev.title}
                      </div>
                    ))}

                    {/* Task chips */}
                    <div className="flex-1 space-y-0.5 w-full">
                      {inMonth &&
                        visibleTasks.map((task) => {
                          const catColor =
                            task.category && task.category in CATEGORY_META
                              ? CATEGORY_META[task.category as TaskCategory].color
                              : null;
                          return (
                            <div
                              key={task.id}
                              className={`text-xs px-1.5 py-0.5 rounded truncate leading-tight ${
                                task.status === "done"
                                  ? "bg-stone-100 text-stone-400 line-through"
                                  : PRIORITY_STYLES[task.priority].chip
                              }`}
                              style={
                                catColor && task.status !== "done"
                                  ? { backgroundColor: catColor + "20", color: catColor }
                                  : {}
                              }
                            >
                              {task.title}
                            </div>
                          );
                        })}
                      {inMonth && overflow > 0 && (
                        <p className="text-xs text-stone-400 pl-1">+{overflow} more</p>
                      )}
                    </div>

                    {/* Habit dots */}
                    {inMonth && dayLogs.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap mt-1">
                        {habits
                          .filter((h) => dayLogs.some((l) => l.habitId === h.id))
                          .map((h) => (
                            <span
                              key={h.id}
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: h.color }}
                              title={h.name}
                            />
                          ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDate && (
          <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
            <div
              className="h-1 w-full"
              style={{ backgroundColor: isToday(selectedDate) ? "#6fa8a3" : "#c9888c" }}
            />
            <div className="px-4 py-3 border-b border-cream-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-800 text-sm">
                  {format(selectedDate, "EEEE")}
                </p>
                <p className="text-xs text-stone-400">
                  {format(selectedDate, "MMMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-stone-300 hover:text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Events section */}
            <div className="px-4 py-3 border-b border-cream-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Events</p>
                <button onClick={() => setShowAddEvent((v) => !v)} className="text-nude-500 hover:text-nude-700">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showAddEvent && (
                <form onSubmit={addEvent} className="mb-3 space-y-2">
                  <input
                    type="text" placeholder="Event title" value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full border border-cream-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-nude-300"
                    autoFocus required
                  />
                  <div className="flex gap-2">
                    <input type="time" value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="flex-1 border border-cream-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-nude-300"
                      placeholder="Start" />
                    <input type="time" value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="flex-1 border border-cream-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-nude-300"
                      placeholder="End" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {EVENT_COLORS.map((c) => (
                      <button type="button" key={c} onClick={() => setEventForm({ ...eventForm, color: c })}
                        className={`w-5 h-5 rounded-full transition-transform ${eventForm.color === c ? "scale-125 ring-2 ring-offset-1" : "hover:scale-110"}`}
                        style={{ backgroundColor: c, outlineColor: eventForm.color === c ? c : "transparent" }} />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button type="submit" disabled={saving}
                      className="bg-nude-500 hover:bg-nude-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1">
                      {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                      Add
                    </button>
                    <button type="button" onClick={() => setShowAddEvent(false)} className="text-stone-400 hover:text-stone-600 px-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              )}

              {selectedEvents.length === 0 ? (
                <p className="text-xs text-stone-300 py-1">No events</p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedEvents.map((ev) => (
                    <li key={ev.id} className="flex items-center gap-2 group">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-700 font-medium">{ev.title}</p>
                        {ev.startTime && (
                          <p className="text-xs text-stone-400">{ev.startTime.slice(0, 5)}{ev.endTime ? `–${ev.endTime.slice(0, 5)}` : ""}</p>
                        )}
                      </div>
                      <button onClick={() => deleteEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-200 hover:text-red-400 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tasks section */}
            <div className="px-4 py-3 border-b border-cream-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Tasks</p>
                <button
                  onClick={() => setShowAddTask((v) => !v)}
                  className="text-nude-500 hover:text-nude-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showAddTask && (
                <form onSubmit={addTask} className="mb-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    className="w-full border border-cream-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-nude-300"
                    autoFocus
                    required
                  />
                  <div className="flex gap-1.5">
                    <select
                      value={addForm.priority}
                      onChange={(e) =>
                        setAddForm({ ...addForm, priority: e.target.value as "low" | "medium" | "high" })
                      }
                      className="flex-1 border border-cream-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-nude-500 hover:bg-nude-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="text-stone-400 hover:text-stone-600 px-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              )}

              {selectedTasks.length === 0 ? (
                <p className="text-xs text-stone-300 py-1">No tasks due</p>
              ) : (
                <ul className="space-y-1.5">
                  {selectedTasks.map((task) => (
                    <li key={task.id} className="flex items-start gap-2">
                      <button
                        onClick={() => toggleTask(task.id, task.status)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.status === "done" ? (
                          <CheckCircle2 className="w-4 h-4 text-sage-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-300 hover:text-nude-400 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-snug ${
                            task.status === "done" ? "line-through text-stone-400" : "text-stone-700"
                          }`}
                        >
                          {task.title}
                        </p>
                        <span
                          className={`text-xs ${PRIORITY_STYLES[task.priority].chip} px-1.5 py-0.5 rounded mt-0.5 inline-block`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Habits section */}
            {habits.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Habits
                </p>
                <ul className="space-y-1.5">
                  {selectedHabits.map(({ habit, done }) => (
                    <li key={habit.id} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleHabit(habit.id, selectedDate)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          done ? "border-transparent" : "border-stone-200 hover:border-sage-300"
                        }`}
                        style={done ? { backgroundColor: habit.color } : {}}
                      >
                        {done && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`text-xs ${done ? "text-stone-400 line-through" : "text-stone-700"}`}
                      >
                        {habit.name}
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 px-1 flex-wrap">
        <p className="text-xs text-stone-400 font-medium">Legend:</p>
        {Object.entries(PRIORITY_STYLES).map(([priority, { dot }]) => (
          <div key={priority} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-sm ${dot}`} />
            <span className="text-xs text-stone-400 capitalize">{priority} priority</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sage-400" />
          <span className="text-xs text-stone-400">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-drose-300" />
          <span className="text-xs text-stone-400">Selected</span>
        </div>
      </div>
    </div>
  );
}
