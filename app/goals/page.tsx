"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO, isPast } from "date-fns";
import { Plus, X, Trash2, Loader2, Trophy, Star, ChevronDown, ChevronUp, CheckSquare, Square, CalendarDays, Gift, Ruler } from "lucide-react";
import type { Goal, GoalMilestone } from "@/lib/schema";
import { GOAL_CATEGORIES, GOAL_CATEGORY_META, GOAL_TYPES, GOAL_TYPE_META } from "@/lib/schema";

function getCurrentQuarter() {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

const QUARTER_LABELS = ["Q1 Jan–Mar", "Q2 Apr–Jun", "Q3 Jul–Sep", "Q4 Oct–Dec"];

export default function GoalsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<Record<number, GoalMilestone[]>>({});
  const [milestoneInput, setMilestoneInput] = useState<Record<number, { title: string; dueDate: string; reward: string }>>({});
  const [form, setForm] = useState({
    title: "", category: "personal" as string, goalType: "mini" as string, description: "",
    measurable: "", targetDate: "", reward: "",
  });
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  async function load() {
    setLoading(true);
    const data = await fetch(`/api/goals?quarter=${quarter}&year=${year}`).then((r) => r.json());
    setGoals(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [quarter, year]);

  const loadMilestones = useCallback(async (goalId: number) => {
    const data = await fetch(`/api/goal-milestones?goalId=${goalId}`).then((r) => r.json());
    setMilestones((prev) => ({ ...prev, [goalId]: Array.isArray(data) ? data : [] }));
  }, []);

  function getMilestoneInput(goalId: number) {
    return milestoneInput[goalId] ?? { title: "", dueDate: "", reward: "" };
  }

  async function addMilestone(goalId: number) {
    const input = getMilestoneInput(goalId);
    const title = input.title.trim();
    if (!title) return;
    await fetch("/api/goal-milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId, title, dueDate: input.dueDate || null, reward: input.reward }),
    });
    setMilestoneInput((prev) => ({ ...prev, [goalId]: { title: "", dueDate: "", reward: "" } }));
    loadMilestones(goalId);
  }

  async function toggleMilestone(id: number, goalId: number, completed: boolean) {
    await fetch(`/api/goal-milestones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    loadMilestones(goalId);
  }

  async function deleteMilestone(id: number, goalId: number) {
    await fetch(`/api/goal-milestones/${id}`, { method: "DELETE" });
    loadMilestones(goalId);
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, targetDate: form.targetDate || null, quarter, year }),
    });
    setForm({ title: "", category: "personal", goalType: "mini", description: "", measurable: "", targetDate: "", reward: "" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function updateProgress(id: number, progressPercent: number) {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressPercent: clamped }),
    });
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, progressPercent: clamped } : g));
  }

  async function toggleStatus(goal: Goal) {
    const newStatus = goal.status === "completed" ? "active" : "completed";
    const newProgress = newStatus === "completed" ? 100 : goal.progressPercent;
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, progressPercent: newProgress }),
    });
    setGoals((prev) => prev.map((g) => g.id === goal.id
      ? { ...g, status: newStatus, progressPercent: newProgress }
      : g
    ));
  }

  async function deleteGoal(id: number) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const filtered = goals.filter((g) =>
    (filterCategory === "all" || g.category === filterCategory) &&
    (filterType === "all" || g.goalType === filterType)
  );
  const completed = filtered.filter((g) => g.status === "completed").length;
  const total = filtered.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Quarterly Goals</h1>
          <p className="text-stone-400 text-sm mt-0.5">Set intentions, track wins, celebrate progress</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add goal
        </button>
      </div>

      {/* Quarter / year selector */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <button key={y} onClick={() => setYear(y)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  year === y ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-700 hover:bg-cream-50"
                }`}>
                {y}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-cream-200" />
          <div className="flex gap-1">
            {QUARTER_LABELS.map((label, i) => {
              const q = i + 1;
              const isCurrent = q === getCurrentQuarter() && year === currentYear;
              return (
                <button key={q} onClick={() => setQuarter(q)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    quarter === q
                      ? "bg-nude-500 text-white"
                      : isCurrent
                        ? "text-nude-600 bg-nude-50 hover:bg-nude-100"
                        : "text-stone-400 hover:text-stone-700 hover:bg-cream-50"
                  }`}>
                  {label.split(" ")[0]}
                  {isCurrent && quarter !== q && <span className="ml-1 text-xs">•</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-stone-900">{total}</p>
            <p className="text-xs text-stone-400 mt-0.5">Goals set</p>
          </div>
          <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-sage-600">{completed}</p>
            <p className="text-xs text-stone-400 mt-0.5">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-nude-600">
              {total > 0 ? Math.round(filtered.reduce((s, g) => s + g.progressPercent, 0) / total) : 0}%
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Avg. progress</p>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterType === "all" ? "bg-stone-800 text-white" : "bg-white border border-cream-200 text-stone-500 hover:text-stone-700"
          }`}
        >
          All Types
        </button>
        {GOAL_TYPES.map((t) => {
          const meta = GOAL_TYPE_META[t];
          const count = goals.filter((g) => g.goalType === t).length;
          if (count === 0) return null;
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterType === t ? "text-white" : "bg-white border border-cream-200 text-stone-500 hover:text-stone-700"
              }`}
              style={filterType === t ? { backgroundColor: meta.color } : {}}
            >
              {meta.emoji} {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterCategory === "all" ? "bg-stone-800 text-white" : "bg-white border border-cream-200 text-stone-500 hover:text-stone-700"
          }`}
        >
          All
        </button>
        {GOAL_CATEGORIES.map((cat) => {
          const meta = GOAL_CATEGORY_META[cat];
          const count = goals.filter((g) => g.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCategory === cat ? "text-white" : "bg-white border border-cream-200 text-stone-500 hover:text-stone-700"
              }`}
              style={filterCategory === cat ? { backgroundColor: meta.color } : {}}
            >
              {meta.emoji} {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Add goal form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">New goal for Q{quarter} {year}</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
          </div>
          <form onSubmit={createGoal} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Goal title</label>
              <input
                type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                placeholder="e.g. Read 5 books this quarter" autoFocus required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_CATEGORIES.map((cat) => {
                  const meta = GOAL_CATEGORY_META[cat];
                  return (
                    <button
                      type="button" key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.category === cat ? "text-white shadow-sm scale-105" : "bg-cream-50 text-stone-500 hover:bg-cream-100"
                      }`}
                      style={form.category === cat ? { backgroundColor: meta.color } : {}}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_TYPES.map((t) => {
                  const meta = GOAL_TYPE_META[t];
                  return (
                    <button
                      type="button" key={t}
                      onClick={() => setForm({ ...form, goalType: t })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.goalType === t ? "text-white shadow-sm scale-105" : "bg-cream-50 text-stone-500 hover:bg-cream-100"
                      }`}
                      style={form.goalType === t ? { backgroundColor: meta.color } : {}}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Description (optional)</label>
              <textarea
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2} placeholder="Why this matters to you..."
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none"
              />
            </div>

            {/* SMART fields */}
            <div className="border-t border-cream-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-3">Make it SMART</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1.5">
                    <Ruler className="w-3 h-3" /> How will you measure success?
                  </label>
                  <input
                    type="text" value={form.measurable} onChange={(e) => setForm({ ...form, measurable: e.target.value })}
                    placeholder="e.g. Finish 5 books, track pages read weekly"
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" /> Target date
                    </label>
                    <input
                      type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 flex items-center gap-1.5">
                      <Gift className="w-3 h-3" /> Reward
                    </label>
                    <input
                      type="text" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })}
                      placeholder="e.g. New pair of shoes"
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add goal
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goal cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-100 shadow-sm py-16 text-center">
          <Star className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">No goals yet for Q{quarter} {year}</p>
          <p className="text-stone-300 text-xs mt-1">What do you want to achieve this quarter?</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Completed goals at bottom */}
          {[...filtered.filter((g) => g.status !== "completed"), ...filtered.filter((g) => g.status === "completed")].map((goal) => {
            const meta = GOAL_CATEGORY_META[goal.category as keyof typeof GOAL_CATEGORY_META];
            const isCompleted = goal.status === "completed";
            const isExpanded = expandedGoal === goal.id;

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isCompleted ? "border-sage-200 opacity-80" : "border-cream-200"
                }`}
              >
                {/* Category color strip */}
                <div className="h-1" style={{ backgroundColor: meta.color }} />

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Complete button */}
                    <button
                      onClick={() => toggleStatus(goal)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-90 mt-0.5 ${
                        isCompleted
                          ? "bg-sage-400 border-sage-400 text-white"
                          : "border-cream-300 hover:border-sage-300"
                      }`}
                      title={isCompleted ? "Mark incomplete" : "Mark complete"}
                    >
                      {isCompleted && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{meta.emoji}</span>
                        <h3 className={`font-semibold text-stone-800 ${isCompleted ? "line-through text-stone-400" : ""}`}>
                          {goal.title}
                        </h3>
                        {isCompleted && (
                          <span className="text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Done!
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="text-xs text-stone-400">{meta.label}</p>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            color: GOAL_TYPE_META[goal.goalType as keyof typeof GOAL_TYPE_META].color,
                            backgroundColor: `${GOAL_TYPE_META[goal.goalType as keyof typeof GOAL_TYPE_META].color}1a`,
                          }}
                        >
                          {GOAL_TYPE_META[goal.goalType as keyof typeof GOAL_TYPE_META].emoji}{" "}
                          {GOAL_TYPE_META[goal.goalType as keyof typeof GOAL_TYPE_META].label}
                        </span>
                        {goal.targetDate && (
                          <span className={`text-xs flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                            !isCompleted && isPast(parseISO(goal.targetDate))
                              ? "text-red-500 bg-red-50"
                              : "text-stone-400 bg-cream-50"
                          }`}>
                            <CalendarDays className="w-3 h-3" />
                            {format(parseISO(goal.targetDate), "MMM d, yyyy")}
                          </span>
                        )}
                        {goal.reward && (
                          <span className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded-full text-amber-600 bg-amber-50">
                            <Gift className="w-3 h-3" /> {goal.reward}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mb-1">
                        <div className="flex justify-between text-xs text-stone-400 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold" style={{ color: meta.color }}>{goal.progressPercent}%</span>
                        </div>
                        <div className="h-2.5 bg-cream-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${goal.progressPercent}%`,
                              backgroundColor: isCompleted ? "#5aaa66" : meta.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Progress slider */}
                      {!isCompleted && (
                        <input
                          type="range" min={0} max={100} step={5}
                          value={goal.progressPercent}
                          onChange={(e) => updateProgress(goal.id, parseInt(e.target.value))}
                          className="w-full h-1 accent-nude-500 cursor-pointer mt-2"
                          style={{ accentColor: meta.color }}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          const next = isExpanded ? null : goal.id;
                          setExpandedGoal(next);
                          if (next !== null) loadMilestones(next);
                        }}
                        className="text-stone-300 hover:text-stone-500 transition-colors p-1"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteGoal(goal.id)}
                        className="text-stone-200 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pl-11 space-y-3">
                      {goal.description && (
                        <p className="text-sm text-stone-500 italic">{goal.description}</p>
                      )}
                      {goal.measurable && (
                        <p className="text-xs text-stone-500 flex items-start gap-1.5">
                          <Ruler className="w-3.5 h-3.5 mt-0.5 shrink-0 text-stone-400" />
                          <span><span className="font-medium text-stone-600">Measuring: </span>{goal.measurable}</span>
                        </p>
                      )}

                      {/* Milestones */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-2">Milestones</p>
                        {(milestones[goal.id] ?? []).map((m) => {
                          const overdue = !m.completed && m.dueDate && isPast(parseISO(m.dueDate));
                          return (
                            <div key={m.id} className="flex items-start gap-2 py-1.5 group/m">
                              <button
                                onClick={() => toggleMilestone(m.id, goal.id, !m.completed)}
                                className="flex-shrink-0 text-stone-400 hover:text-nude-500 transition-colors mt-0.5"
                              >
                                {m.completed
                                  ? <CheckSquare className="w-4 h-4 text-sage-500" />
                                  : <Square className="w-4 h-4" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm ${m.completed ? "line-through text-stone-400" : "text-stone-700"}`}>
                                  {m.title}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {m.dueDate && (
                                    <span className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                                      overdue ? "text-red-500 bg-red-50" : "text-stone-400 bg-cream-50"
                                    }`}>
                                      <CalendarDays className="w-2.5 h-2.5" />
                                      {format(parseISO(m.dueDate), "MMM d")}
                                    </span>
                                  )}
                                  {m.reward && (
                                    <span className="text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded-full text-amber-600 bg-amber-50">
                                      <Gift className="w-2.5 h-2.5" /> {m.reward}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteMilestone(m.id, goal.id)}
                                className="opacity-0 group-hover/m:opacity-100 text-stone-300 hover:text-red-400 transition-all mt-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Add mini goal */}
                        <div className="mt-3 space-y-2 bg-cream-50/60 rounded-lg p-2.5">
                          <input
                            type="text"
                            value={getMilestoneInput(goal.id).title}
                            onChange={(e) => setMilestoneInput((p) => ({ ...p, [goal.id]: { ...getMilestoneInput(goal.id), title: e.target.value } }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMilestone(goal.id); }}}
                            placeholder="Add a mini goal…"
                            className="w-full text-sm border-b border-cream-200 focus:border-nude-300 focus:outline-none py-1 bg-transparent text-stone-700 placeholder:text-stone-300"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={getMilestoneInput(goal.id).dueDate}
                              onChange={(e) => setMilestoneInput((p) => ({ ...p, [goal.id]: { ...getMilestoneInput(goal.id), dueDate: e.target.value } }))}
                              className="text-xs border border-cream-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-nude-300 bg-white text-stone-600"
                            />
                            <input
                              type="text"
                              value={getMilestoneInput(goal.id).reward}
                              onChange={(e) => setMilestoneInput((p) => ({ ...p, [goal.id]: { ...getMilestoneInput(goal.id), reward: e.target.value } }))}
                              placeholder="Reward (optional)"
                              className="flex-1 text-xs border border-cream-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-nude-300 bg-white text-stone-600 placeholder:text-stone-300"
                            />
                            <button
                              onClick={() => addMilestone(goal.id)}
                              className="text-nude-500 hover:text-nude-700 transition-colors shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
