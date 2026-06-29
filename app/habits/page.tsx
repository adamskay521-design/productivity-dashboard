"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Plus, Trash2, Flame, X, Loader2 } from "lucide-react";
import type { Habit, HabitLog } from "@/lib/schema";

const COLORS = [
  "#b89060", // terracotta
  "#c9913a", // mustard gold
  "#3d8c6a", // sage green
  "#c45a7a", // dusty rose
  "#7c5cba", // dusty purple
  "#4a7a8c", // dusty teal
  "#8a6a1a", // ochre
  "#6b4c3b", // warm brown
];

function calcStreak(dates: string[]): number {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (!dates.includes(today) && !dates.includes(yesterday)) return 0;
  let streak = dates.includes(today) ? 1 : 0;
  let d = subDays(new Date(), dates.includes(today) ? 1 : 2);
  while (true) {
    const s = format(d, "yyyy-MM-dd");
    if (dates.includes(s)) {
      streak++;
      d = subDays(d, 1);
    } else break;
  }
  return streak;
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), "yyyy-MM-dd")
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#b89060" });

  const today = format(new Date(), "yyyy-MM-dd");
  const week = last7Days();

  async function load() {
    const [h, l] = await Promise.all([
      fetch("/api/habits").then((r) => r.json()),
      fetch("/api/habit-logs?days=30").then((r) => r.json()),
    ]);
    setHabits(Array.isArray(h) ? h : []);
    setLogs(Array.isArray(l) ? l : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(habitId: number, date: string) {
    await fetch("/api/habit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, completedDate: date }),
    });
    load();
  }

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", description: "", color: "#b89060" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function deleteHabit(id: number) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    load();
  }

  const logSet = new Set(logs.map((l) => `${l.habitId}-${l.completedDate}`));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Habits</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {habits.length} habit{habits.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* New habit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-stone-800">New Habit</h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={createHabit} className="space-y-3">
            <input
              type="text"
              placeholder="Habit name (e.g. Morning run)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-400"
              autoFocus
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-400"
            />
            <div>
              <p className="text-xs text-stone-500 mb-2">Color</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-1 ring-slate-400" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Create Habit
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : habits.length === 0 ? (
        <div className="bg-white rounded-xl border border-cream-100 shadow-sm py-16 text-center">
          <Target className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">No habits yet. Start building one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const habitDates = logs
              .filter((l) => l.habitId === habit.id)
              .map((l) => l.completedDate);
            const streak = calcStreak(habitDates);
            const doneToday = logSet.has(`${habit.id}-${today}`);

            return (
              <div
                key={habit.id}
                className="bg-white rounded-xl border border-cream-100 shadow-sm p-5 group"
              >
                <div className="flex items-start gap-4">
                  {/* Check today button */}
                  <button
                    onClick={() => toggle(habit.id, today)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                      doneToday
                        ? "border-transparent scale-100"
                        : "border-cream-200 hover:border-opacity-80"
                    }`}
                    style={
                      doneToday
                        ? { backgroundColor: habit.color }
                        : { borderColor: habit.color + "60" }
                    }
                  >
                    {doneToday && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <p className="font-medium text-stone-800 text-sm">{habit.name}</p>
                      {streak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3" />
                          {streak}
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-xs text-stone-400 mt-0.5">{habit.description}</p>
                    )}

                    {/* 7-day grid */}
                    <div className="flex items-center gap-1.5 mt-3">
                      {week.map((date) => {
                        const done = logSet.has(`${habit.id}-${date}`);
                        const isToday = date === today;
                        return (
                          <button
                            key={date}
                            onClick={() => toggle(habit.id, date)}
                            title={date}
                            className={`w-6 h-6 rounded-md transition-all ${
                              isToday ? "ring-2 ring-offset-1" : ""
                            }`}
                            style={
                              done
                                ? {
                                    backgroundColor: habit.color,
                                    ...(isToday ? { ringColor: habit.color } : {}),
                                  }
                                : {
                                    backgroundColor: "#f1f5f9",
                                    ...(isToday ? { ringColor: habit.color + "80" } : {}),
                                  }
                            }
                          />
                        );
                      })}
                      <span className="text-xs text-stone-400 ml-1">
                        {format(subDays(new Date(), 6), "MMM d")} – today
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
