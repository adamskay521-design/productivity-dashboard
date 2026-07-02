"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays, startOfWeek, addDays, parseISO } from "date-fns";
import { Plus, Trash2, Flame, X, Loader2 } from "lucide-react";
import type { Habit, HabitLog } from "@/lib/schema";
import { HABIT_TIMES } from "@/lib/schema";

const COLORS = [
  "#b89060", "#c9913a", "#3d8c6a", "#c45a7a",
  "#7c5cba", "#4a7a8c", "#8a6a1a", "#6b4c3b",
];

const HEATMAP_COLORS = ["#f1f5f9", "#f6e3d5", "#e9a572", "#ce6717", "#5a2e0c"];

const HABIT_TIME_LABELS: Record<(typeof HABIT_TIMES)[number], string> = {
  morning: "Morning",
  evening: "Evening",
  anytime: "Anytime",
};

function calcStreak(dates: string[]): number {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (!dates.includes(today) && !dates.includes(yesterday)) return 0;
  let streak = dates.includes(today) ? 1 : 0;
  let d = subDays(new Date(), dates.includes(today) ? 1 : 2);
  while (true) {
    const s = format(d, "yyyy-MM-dd");
    if (dates.includes(s)) { streak++; d = subDays(d, 1); } else break;
  }
  return streak;
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));
}

function heatmapColor(ratio: number | null): string {
  if (ratio === null) return HEATMAP_COLORS[0];
  if (ratio === 0) return HEATMAP_COLORS[0];
  if (ratio <= 0.25) return HEATMAP_COLORS[1];
  if (ratio <= 0.5) return HEATMAP_COLORS[2];
  if (ratio <= 0.75) return HEATMAP_COLORS[3];
  return HEATMAP_COLORS[4];
}

function HabitHeatmap({ habits, allLogs }: { habits: Habit[]; allLogs: HabitLog[] }) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // Build 52 weeks ending today (Mon-Sun columns)
  const weekEnd = startOfWeek(addDays(today, 7 - today.getDay() || 7), { weekStartsOn: 1 });
  const weeks: string[][] = [];
  let ptr = subDays(weekEnd, 7 * 52 - 1);
  for (let w = 0; w < 52; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(format(addDays(ptr, d), "yyyy-MM-dd"));
    }
    weeks.push(week);
    ptr = addDays(ptr, 7);
  }

  const logsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of allLogs) {
      map[log.completedDate] = (map[log.completedDate] ?? 0) + 1;
    }
    return map;
  }, [allLogs]);

  const total = habits.length;

  // Month labels: find the first week each month appears
  const monthLabels: { label: string; weekIdx: number }[] = [];
  let lastMonth = "";
  weeks.forEach((week, i) => {
    const m = format(parseISO(week[0]), "MMM");
    if (m !== lastMonth) { monthLabels.push({ label: m, weekIdx: i }); lastMonth = m; }
  });

  const DAY_LABELS = ["Mon", "Wed", "Fri"];
  const DAY_INDICES = [0, 2, 4];

  return (
    <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-6">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4">Year in Review</p>

      {total === 0 ? (
        <p className="text-sm text-stone-300 py-4">Add habits to see your yearly heatmap.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-flex gap-0" style={{ minWidth: "min-content" }}>
            {/* Day labels */}
            <div className="flex flex-col justify-around mr-1.5" style={{ paddingTop: 18 }}>
              {DAY_INDICES.map((di, i) => (
                <span key={di} className="text-[9px] text-stone-300 leading-none h-3 flex items-center">
                  {DAY_LABELS[i]}
                </span>
              ))}
            </div>

            <div>
              {/* Month labels */}
              <div className="flex mb-1">
                {weeks.map((_, i) => {
                  const ml = monthLabels.find((m) => m.weekIdx === i);
                  return (
                    <div key={i} className="w-3 mr-0.5 flex-shrink-0">
                      {ml && <span className="text-[9px] text-stone-400 whitespace-nowrap">{ml.label}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="flex gap-0.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((dateStr) => {
                      const count = logsByDate[dateStr] ?? 0;
                      const ratio = total > 0 ? count / total : 0;
                      const isFuture = dateStr > todayStr;
                      const color = isFuture ? "#f8f9fa" : heatmapColor(ratio);
                      const pct = total > 0 ? Math.round(ratio * 100) : 0;
                      return (
                        <div
                          key={dateStr}
                          title={`${format(parseISO(dateStr), "MMM d, yyyy")}: ${count}/${total} habits (${pct}%)`}
                          className="w-3 h-3 rounded-sm transition-colors cursor-default"
                          style={{ backgroundColor: color, opacity: isFuture ? 0 : 1 }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[10px] text-stone-400">Less</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[10px] text-stone-400">More</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "year">("week");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#b89060", timeOfDay: "anytime" as (typeof HABIT_TIMES)[number] });

  const today = format(new Date(), "yyyy-MM-dd");
  const week = last7Days();

  async function load() {
    const [h, l, al] = await Promise.all([
      fetch("/api/habits").then((r) => r.json()),
      fetch("/api/habit-logs?days=30").then((r) => r.json()),
      fetch("/api/habit-logs?days=365").then((r) => r.json()),
    ]);
    setHabits(Array.isArray(h) ? h : []);
    setLogs(Array.isArray(l) ? l : []);
    setAllLogs(Array.isArray(al) ? al : []);
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
    setForm({ name: "", description: "", color: "#b89060", timeOfDay: "anytime" });
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
          <p className="text-stone-400 text-sm mt-0.5">{habits.length} habit{habits.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 bg-cream-50 border border-cream-200 rounded-lg p-1">
            {(["week", "year"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  view === v ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}>
                {v === "week" ? "Week" : "Year"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New Habit
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-stone-800">New Habit</h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={createHabit} className="space-y-3">
            <input type="text" placeholder="Habit name (e.g. Morning run)" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-400"
              autoFocus required />
            <input type="text" placeholder="Description (optional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-400" />
            <div>
              <p className="text-xs text-stone-500 mb-2">Color</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-1 ring-slate-400" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-2">Time of day</p>
              <div className="flex gap-2">
                {HABIT_TIMES.map((t) => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, timeOfDay: t })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      form.timeOfDay === t ? "bg-nude-500 text-white shadow-sm" : "bg-cream-50 text-stone-500 hover:bg-cream-100"
                    }`}>
                    {HABIT_TIME_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Create Habit
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors">
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
          <TargetIcon className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">No habits yet. Start building one!</p>
        </div>
      ) : (
        <>
          {view === "year" && <HabitHeatmap habits={habits} allLogs={allLogs} />}

          <div className="space-y-3">
            {habits.map((habit) => {
              const habitDates = logs.filter((l) => l.habitId === habit.id).map((l) => l.completedDate);
              const streak = calcStreak(habitDates);
              const doneToday = logSet.has(`${habit.id}-${today}`);

              return (
                <div key={habit.id} className="bg-white rounded-xl border border-cream-100 shadow-sm p-5 group">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggle(habit.id, today)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                        doneToday ? "border-transparent" : "border-cream-200 hover:border-opacity-80"
                      }`}
                      style={doneToday ? { backgroundColor: habit.color } : { borderColor: habit.color + "60" }}
                    >
                      {doneToday && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                        <p className="font-medium text-stone-800 text-sm">{habit.name}</p>
                        {streak > 0 && (
                          <span className="flex items-center gap-1 text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3" />{streak}
                          </span>
                        )}
                      </div>
                      {habit.description && <p className="text-xs text-stone-400 mt-0.5">{habit.description}</p>}

                      <div className="flex items-center gap-1.5 mt-3">
                        {week.map((date) => {
                          const done = logSet.has(`${habit.id}-${date}`);
                          const isToday = date === today;
                          return (
                            <button key={date} onClick={() => toggle(habit.id, date)} title={date}
                              className={`w-6 h-6 rounded-md transition-all ${isToday ? "ring-2 ring-offset-1" : ""}`}
                              style={done ? { backgroundColor: habit.color } : { backgroundColor: "#f1f5f9" }}
                            />
                          );
                        })}
                        <span className="text-xs text-stone-400 ml-1">
                          {format(subDays(new Date(), 6), "MMM d")} – today
                        </span>
                      </div>
                    </div>

                    <button onClick={() => deleteHabit(habit.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
