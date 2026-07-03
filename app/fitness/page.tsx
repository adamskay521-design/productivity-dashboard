"use client";

import { useEffect, useState, useRef } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Plus, Trash2, Trophy, Flame, Loader2, ChevronDown, ChevronUp, Dumbbell, TrendingDown, TrendingUp, Droplets, X, Check, Sparkles, ArrowUp, Minus, Info, ArrowRight } from "lucide-react";
import type { FitnessGoal, WeightLog, Workout, ExerciseSet } from "@/lib/schema";
import { WORKOUT_TYPE_META, WORKOUT_TYPES } from "@/lib/schema";
import { getProgressionAdvice, type LoggedSet } from "@/lib/progressiveOverload";

type WorkoutWithSets = Workout & { exercises: ExerciseSet[] };

type ExRow = { exercise: string; sets: string; reps: string; weight: string; unit: string };

const EVENT_COLORS = [
  "#b89060", "#c9888c", "#6fa8a3", "#c9913a", "#7c5cba", "#3d8c6a",
];

function getMilestones(start: number, goal: number): number[] {
  const step = 5;
  const milestones: number[] = [];
  if (goal < start) {
    for (let w = Math.floor(start / step) * step; w >= goal; w -= step) {
      if (w < start) milestones.push(w);
    }
  } else {
    for (let w = Math.ceil(start / step) * step; w <= goal; w += step) {
      if (w > start) milestones.push(w);
    }
  }
  return milestones;
}

export default function FitnessPage() {
  const [tab, setTab] = useState<"weight" | "workouts" | "water">("weight");

  // Weight
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [goalForm, setGoalForm] = useState({ startWeight: "", goalWeight: "", targetDate: "" });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [logWeightForm, setLogWeightForm] = useState({ weight: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
  const [weightSaving, setWeightSaving] = useState(false);
  const [celebrateMilestone, setCelebrateMilestone] = useState<number | null>(null);

  // Workouts
  const [workoutList, setWorkoutList] = useState<WorkoutWithSets[]>([]);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null);
  const [workoutForm, setWorkoutForm] = useState({
    name: "", type: "strength" as string, date: format(new Date(), "yyyy-MM-dd"), durationMins: "", notes: "",
  });
  const [exRows, setExRows] = useState<ExRow[]>([{ exercise: "", sets: "3", reps: "10", weight: "0", unit: "lbs" }]);
  const [workoutSaving, setWorkoutSaving] = useState(false);

  // Water
  const [cups, setCups] = useState(0);
  const [goalCups] = useState(8);
  const today = format(new Date(), "yyyy-MM-dd");
  const [waterLoading, setWaterLoading] = useState(true);
  const [justFilledCup, setJustFilledCup] = useState<number | null>(null);

  async function loadAll() {
    const [g, wl, wo, water] = await Promise.all([
      fetch("/api/fitness-goal").then((r) => r.json()),
      fetch("/api/weight").then((r) => r.json()),
      fetch("/api/workouts").then((r) => r.json()),
      fetch(`/api/water?date=${today}`).then((r) => r.json()),
    ]);
    setGoal(g || null);
    setWeightLogs(Array.isArray(wl) ? wl : []);
    setWorkoutList(Array.isArray(wo) ? wo : []);
    setCups(water.cups ?? 0);
    setWaterLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  // Weight helpers
  const currentWeight = weightLogs[0]?.weight;
  const losing = goal ? goal.goalWeight < goal.startWeight : true;
  const totalChange = goal ? Math.abs(goal.goalWeight - goal.startWeight) : 0;
  const changedSoFar = goal && currentWeight != null
    ? Math.abs(goal.startWeight - currentWeight)
    : 0;
  const progressPct = totalChange > 0 ? Math.min(100, Math.round((changedSoFar / totalChange) * 100)) : 0;
  const milestones = goal ? getMilestones(goal.startWeight, goal.goalWeight) : [];

  function isMilestoneReached(m: number) {
    if (currentWeight == null) return false;
    return losing ? currentWeight <= m : currentWeight >= m;
  }

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    const sw = parseFloat(goalForm.startWeight);
    const gw = parseFloat(goalForm.goalWeight);
    if (!sw || !gw) return;
    if (goal) {
      await fetch("/api/fitness-goal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goal.id, startWeight: sw, goalWeight: gw, targetDate: goalForm.targetDate || null }),
      });
    } else {
      await fetch("/api/fitness-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startWeight: sw, goalWeight: gw, targetDate: goalForm.targetDate || null }),
      });
    }
    setShowGoalForm(false);
    loadAll();
  }

  async function logWeight(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(logWeightForm.weight);
    if (!w) return;
    setWeightSaving(true);

    const prevWeight = currentWeight;
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: w, date: logWeightForm.date, notes: logWeightForm.notes }),
    });

    // Check if new weight crosses a milestone
    if (goal && prevWeight != null) {
      const newMilestones = milestones.filter((m) => {
        const wasReached = losing ? prevWeight <= m : prevWeight >= m;
        const nowReached = losing ? w <= m : w >= m;
        return !wasReached && nowReached;
      });
      if (newMilestones.length > 0) {
        setCelebrateMilestone(newMilestones[0]);
        setTimeout(() => setCelebrateMilestone(null), 4000);
      }
    }

    setLogWeightForm({ weight: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setWeightSaving(false);
    loadAll();
  }

  async function deleteWeight(id: number) {
    await fetch(`/api/weight/${id}`, { method: "DELETE" });
    loadAll();
  }

  // Workout helpers
  async function saveWorkout(e: React.FormEvent) {
    e.preventDefault();
    setWorkoutSaving(true);
    const validExercises = exRows.filter((r) => r.exercise.trim());
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...workoutForm,
        durationMins: parseInt(workoutForm.durationMins) || 0,
        exercises: validExercises.map((r) => ({
          exercise: r.exercise.trim(),
          sets: parseInt(r.sets) || 1,
          reps: parseInt(r.reps) || 0,
          weight: parseFloat(r.weight) || 0,
          unit: r.unit,
        })),
      }),
    });
    setShowWorkoutForm(false);
    setWorkoutForm({ name: "", type: "strength", date: format(new Date(), "yyyy-MM-dd"), durationMins: "", notes: "" });
    setExRows([{ exercise: "", sets: "3", reps: "10", weight: "0", unit: "lbs" }]);
    setWorkoutSaving(false);
    loadAll();
  }

  async function deleteWorkout(id: number) {
    await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    loadAll();
  }

  // Progressive overload: group logged exercise entries by name, most recent first
  const exerciseHistory: Record<string, LoggedSet[]> = {};
  workoutList.forEach((w) => {
    w.exercises.forEach((ex) => {
      const key = ex.exercise.trim().toLowerCase();
      if (!key) return;
      if (!exerciseHistory[key]) exerciseHistory[key] = [];
      exerciseHistory[key].push({
        date: w.date, sets: ex.sets, reps: ex.reps, weight: ex.weight, unit: ex.unit,
      });
    });
  });
  const progressionRows = Object.entries(exerciseHistory)
    .map(([key, entries]) => {
      const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
      const displayName = workoutList
        .flatMap((w) => w.exercises)
        .find((ex) => ex.exercise.trim().toLowerCase() === key)?.exercise ?? key;
      return { name: displayName, latest: sorted[0], advice: getProgressionAdvice(sorted) };
    })
    .sort((a, b) => b.latest.date.localeCompare(a.latest.date));

  // PRs: max weight per exercise across all workouts
  const prs: Record<string, number> = {};
  workoutList.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (!prs[ex.exercise] || ex.weight > prs[ex.exercise]) {
        prs[ex.exercise] = ex.weight;
      }
    });
  });

  // Water
  async function setCupsCount(n: number) {
    const newCups = Math.max(0, Math.min(goalCups, n));
    setCups(newCups);
    await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, cups: newCups, goalCups }),
    });
  }

  async function handleCupClick(i: number) {
    const newCups = i < cups ? i : i + 1;
    setJustFilledCup(i);
    setTimeout(() => setJustFilledCup(null), 500);
    await setCupsCount(newCups);
  }

  const tabs = [
    { key: "weight" as const, label: "⚖️ Weight", },
    { key: "workouts" as const, label: "🏋️ Workouts" },
    { key: "water" as const, label: "💧 Water" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Milestone celebration */}
      {celebrateMilestone && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-nude-300 rounded-2xl shadow-lg px-8 py-5 flex items-center gap-4 animate-bounce">
          <Trophy className="w-8 h-8 text-nude-500" />
          <div>
            <p className="font-bold text-stone-900 text-lg">Milestone reached!</p>
            <p className="text-stone-500 text-sm">{celebrateMilestone} {goal?.unit ?? "lbs"} — you crushed it! 🎉</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Fitness</h1>
        <p className="text-stone-400 text-sm mt-0.5">Track your weight, workouts, and hydration</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-cream-200 rounded-xl p-1 shadow-sm mb-8 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-nude-500 text-white shadow-sm"
                : "text-stone-500 hover:text-stone-700 hover:bg-cream-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── WEIGHT TAB ─── */}
      {tab === "weight" && (
        <div className="space-y-6">
          {/* Goal setup / progress */}
          {!goal && !showGoalForm ? (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-10 text-center">
              <TrendingDown className="w-12 h-12 text-nude-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-stone-800 mb-2">Set your weight goal</h2>
              <p className="text-stone-400 text-sm mb-6">Track your progress and hit milestones along the way</p>
              <button
                onClick={() => setShowGoalForm(true)}
                className="bg-nude-500 hover:bg-nude-600 text-white font-medium px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                + Set Goal
              </button>
            </div>
          ) : showGoalForm ? (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-stone-900">{goal ? "Edit goal" : "Set your goal"}</h2>
                <button onClick={() => setShowGoalForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
              </div>
              <form onSubmit={saveGoal} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Starting weight (lbs)</label>
                  <input type="number" step="0.1" value={goalForm.startWeight} onChange={(e) => setGoalForm({ ...goalForm, startWeight: e.target.value })}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300" placeholder="185" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Goal weight (lbs)</label>
                  <input type="number" step="0.1" value={goalForm.goalWeight} onChange={(e) => setGoalForm({ ...goalForm, goalWeight: e.target.value })}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300" placeholder="150" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Target date (optional)</label>
                  <input type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-nude-500 hover:bg-nude-600 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                    Save Goal
                  </button>
                </div>
              </form>
            </div>
          ) : goal ? (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-stone-900 text-lg">
                    {goal.startWeight} → {goal.goalWeight} {goal.unit}
                  </h2>
                  <p className="text-stone-400 text-sm mt-0.5">
                    {currentWeight != null
                      ? `Current: ${currentWeight} ${goal.unit} · ${Math.abs(goal.goalWeight - currentWeight).toFixed(1)} to go`
                      : "Log your first weight to get started"}
                  </p>
                </div>
                <button
                  onClick={() => { setGoalForm({ startWeight: String(goal.startWeight), goalWeight: String(goal.goalWeight), targetDate: goal.targetDate || "" }); setShowGoalForm(true); }}
                  className="text-xs text-stone-400 hover:text-stone-600 border border-cream-200 rounded-lg px-3 py-1.5"
                >
                  Edit goal
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-stone-400 mb-1.5">
                  <span>{goal.startWeight} {goal.unit}</span>
                  <span className="font-semibold text-nude-600">{progressPct}%</span>
                  <span>{goal.goalWeight} {goal.unit}</span>
                </div>
                <div className="h-4 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-nude-400 to-nude-500 rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {changedSoFar > 0 && (
                  <p className="text-center text-sm font-medium text-nude-600 mt-2">
                    {changedSoFar.toFixed(1)} {goal.unit} {losing ? "lost" : "gained"} so far! 🔥
                  </p>
                )}
              </div>

              {/* Milestones */}
              {milestones.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Milestones</p>
                  <div className="flex flex-wrap gap-2">
                    {milestones.map((m) => {
                      const reached = isMilestoneReached(m);
                      const isGoal = m === goal.goalWeight;
                      return (
                        <div
                          key={m}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            reached
                              ? isGoal
                                ? "bg-sage-100 text-sage-700 border-2 border-sage-300"
                                : "bg-nude-100 text-nude-700 border border-nude-200"
                              : "bg-cream-50 text-stone-400 border border-cream-200"
                          }`}
                        >
                          {reached ? (
                            isGoal ? <Trophy className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-cream-300 inline-block" />
                          )}
                          {m} {goal.unit}
                          {isGoal && " 🎯"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Log weight */}
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
            <h3 className="font-semibold text-stone-900 mb-4">Log weight</h3>
            <form onSubmit={logWeight} className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Weight</label>
                <input
                  type="number" step="0.1" value={logWeightForm.weight}
                  onChange={(e) => setLogWeightForm({ ...logWeightForm, weight: e.target.value })}
                  className="border border-cream-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-nude-300"
                  placeholder="168.5" required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
                <input type="date" value={logWeightForm.date}
                  onChange={(e) => setLogWeightForm({ ...logWeightForm, date: e.target.value })}
                  className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs font-medium text-stone-500 mb-1 block">Notes (optional)</label>
                <input type="text" value={logWeightForm.notes}
                  onChange={(e) => setLogWeightForm({ ...logWeightForm, notes: e.target.value })}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  placeholder="Morning, before breakfast..."
                />
              </div>
              <button
                type="submit" disabled={weightSaving}
                className="bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-sm"
              >
                {weightSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Log it
              </button>
            </form>
          </div>

          {/* Weight history */}
          {weightLogs.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
              <h3 className="font-semibold text-stone-900 mb-4">History</h3>
              <div className="space-y-2">
                {weightLogs.slice(0, 15).map((log, i) => {
                  const prev = weightLogs[i + 1];
                  const diff = prev ? log.weight - prev.weight : null;
                  return (
                    <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-cream-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-stone-800 w-16">{log.weight}</span>
                        <span className="text-xs text-stone-400">{format(parseISO(log.date), "MMM d, yyyy")}</span>
                        {log.notes && <span className="text-xs text-stone-300 italic">{log.notes}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {diff !== null && (
                          <span className={`text-xs font-medium flex items-center gap-0.5 ${
                            (losing && diff < 0) || (!losing && diff > 0) ? "text-sage-500" : "text-drose-400"
                          }`}>
                            {diff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {Math.abs(diff).toFixed(1)}
                          </span>
                        )}
                        {i === 0 && <span className="text-xs bg-nude-100 text-nude-600 px-2 py-0.5 rounded-full font-medium">latest</span>}
                        <button onClick={() => deleteWeight(log.id)} className="text-stone-200 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── WORKOUTS TAB ─── */}
      {tab === "workouts" && (
        <div className="space-y-6">
          {/* PRs */}
          {Object.keys(prs).length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-nude-400" /> Personal Records
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(prs).map(([ex, w]) => (
                  <div key={ex} className="bg-nude-50 border border-nude-100 rounded-lg px-3 py-1.5 text-sm">
                    <span className="font-medium text-stone-700">{ex}</span>
                    <span className="text-nude-600 ml-2 font-semibold">{w} lbs</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progressive overload */}
          {progressionRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUp className="w-4 h-4 text-drose-400" />
                <h2 className="font-semibold text-stone-900">Progressive overload</h2>
              </div>
              <p className="text-stone-400 text-sm mb-4">Based on what you've logged — whether to go up in weight next time</p>
              <div className="space-y-2">
                {progressionRows.map((row) => (
                  <div key={row.name} className="flex items-start gap-3 py-2.5 border-b border-cream-100 last:border-0">
                    <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      row.advice.status === "increase" ? "bg-sage-100 text-sage-600"
                        : row.advice.status === "hold" ? "bg-nude-100 text-nude-600"
                        : "bg-cream-100 text-stone-400"
                    }`}>
                      {row.advice.status === "increase" ? <ArrowUp className="w-3.5 h-3.5" />
                        : row.advice.status === "hold" ? <Minus className="w-3.5 h-3.5" />
                        : <Info className="w-3.5 h-3.5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-medium text-stone-800 text-sm">{row.name}</span>
                        <span className="text-xs text-stone-400">
                          last: {row.latest.sets} × {row.latest.reps} @ {row.latest.weight} {row.latest.unit}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{row.advice.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yoga & mobility guide */}
          <Link href="/yoga" className="flex items-center justify-between bg-white rounded-2xl border border-cream-200 shadow-sm p-6 hover:shadow-md hover:border-drose-200 transition-all group">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-drose-50 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-drose-400" />
              </span>
              <div>
                <h2 className="font-semibold text-stone-900">Yoga &amp; Mobility Guide</h2>
                <p className="text-stone-400 text-sm">6 guided flows with photos — from a 4-min desk break to a 25-min full practice</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-drose-400 transition-colors flex-shrink-0" />
          </Link>

          {/* Log workout button */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Workout log</h2>
            <button
              onClick={() => setShowWorkoutForm(true)}
              className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Log workout
            </button>
          </div>

          {/* Workout form */}
          {showWorkoutForm && (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-stone-900">New workout</h3>
                <button onClick={() => setShowWorkoutForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
              </div>
              <form onSubmit={saveWorkout} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Type</label>
                    <select value={workoutForm.type} onChange={(e) => setWorkoutForm({ ...workoutForm, type: e.target.value })}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300">
                      {WORKOUT_TYPES.map((t) => (
                        <option key={t} value={t}>{WORKOUT_TYPE_META[t].emoji} {WORKOUT_TYPE_META[t].label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
                    <input type="date" value={workoutForm.date} onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Name (optional)</label>
                    <input type="text" value={workoutForm.name} onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300" placeholder="Upper body day" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Duration (mins)</label>
                    <input type="number" value={workoutForm.durationMins} onChange={(e) => setWorkoutForm({ ...workoutForm, durationMins: e.target.value })}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300" placeholder="45" />
                  </div>
                </div>

                {/* Exercises (strength/hiit only) */}
                {(workoutForm.type === "strength" || workoutForm.type === "hiit") && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Exercises</label>
                      <button type="button" onClick={() => setExRows([...exRows, { exercise: "", sets: "3", reps: "10", weight: "0", unit: "lbs" }])}
                        className="text-xs text-nude-500 hover:text-nude-700 font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exRows.map((row, i) => (
                        <div key={i} className="grid grid-cols-[1fr_60px_60px_80px_70px_auto] gap-2 items-center">
                          <input placeholder="Exercise" value={row.exercise} onChange={(e) => { const r = [...exRows]; r[i].exercise = e.target.value; setExRows(r); }}
                            className="border border-cream-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-nude-300" />
                          <input placeholder="Sets" type="number" value={row.sets} onChange={(e) => { const r = [...exRows]; r[i].sets = e.target.value; setExRows(r); }}
                            className="border border-cream-300 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-nude-300" />
                          <input placeholder="Reps" type="number" value={row.reps} onChange={(e) => { const r = [...exRows]; r[i].reps = e.target.value; setExRows(r); }}
                            className="border border-cream-300 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-nude-300" />
                          <input placeholder="Weight" type="number" step="0.5" value={row.weight} onChange={(e) => { const r = [...exRows]; r[i].weight = e.target.value; setExRows(r); }}
                            className="border border-cream-300 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-nude-300" />
                          <select value={row.unit} onChange={(e) => { const r = [...exRows]; r[i].unit = e.target.value; setExRows(r); }}
                            className="border border-cream-300 rounded-lg px-1 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-nude-300">
                            <option value="lbs">lbs</option>
                            <option value="kg">kg</option>
                          </select>
                          <button type="button" onClick={() => setExRows(exRows.filter((_, j) => j !== i))}
                            className="text-stone-300 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-[1fr_60px_60px_80px_70px_auto] gap-2 mt-1 px-1">
                      {["Exercise", "Sets", "Reps", "Weight", "Unit", ""].map((h) => (
                        <span key={h} className="text-xs text-stone-300">{h}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Notes (optional)</label>
                  <textarea value={workoutForm.notes} onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                    rows={2} placeholder="How did it go?"
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none" />
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={workoutSaving}
                    className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                    {workoutSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save workout
                  </button>
                  <button type="button" onClick={() => setShowWorkoutForm(false)}
                    className="text-stone-500 hover:text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Workout list */}
          {workoutList.length === 0 && !showWorkoutForm && (
            <div className="bg-white rounded-2xl border border-cream-100 shadow-sm py-16 text-center">
              <Dumbbell className="w-10 h-10 text-stone-200 mx-auto mb-3" />
              <p className="text-stone-400 text-sm">No workouts yet. Log your first session!</p>
            </div>
          )}
          <div className="space-y-3">
            {workoutList.map((w) => {
              const meta = WORKOUT_TYPE_META[w.type as keyof typeof WORKOUT_TYPE_META];
              const isExpanded = expandedWorkout === w.id;
              return (
                <div key={w.id} className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedWorkout(isExpanded ? null : w.id)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: meta.color + "20" }}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm">
                        {w.name || meta.label}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {format(parseISO(w.date), "MMM d, yyyy")}
                        {w.durationMins > 0 && ` · ${w.durationMins} min`}
                        {w.exercises.length > 0 && ` · ${w.exercises.length} exercise${w.exercises.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); deleteWorkout(w.id); }}
                        className="text-stone-200 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-300" /> : <ChevronDown className="w-4 h-4 text-stone-300" />}
                    </div>
                  </div>

                  {isExpanded && (w.exercises.length > 0 || w.notes) && (
                    <div className="border-t border-cream-100 px-4 py-4">
                      {w.exercises.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {w.exercises.map((ex) => {
                            const isPR = prs[ex.exercise] === ex.weight && ex.weight > 0;
                            return (
                              <div key={ex.id} className="flex items-center gap-3 text-sm">
                                <span className="font-medium text-stone-700 w-40 truncate">{ex.exercise}</span>
                                <span className="text-stone-400">{ex.sets}×{ex.reps}</span>
                                {ex.weight > 0 && (
                                  <span className="text-stone-500">{ex.weight} {ex.unit}</span>
                                )}
                                {isPR && (
                                  <span className="text-xs bg-nude-100 text-nude-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> PR
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {w.notes && <p className="text-xs text-stone-400 italic">{w.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── WATER TAB ─── */}
      {tab === "water" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <Droplets className={`w-12 h-12 mx-auto mb-3 transition-colors ${cups >= goalCups ? "text-sage-400" : "text-sky-300"}`} />
              <h2 className="text-2xl font-bold text-stone-900">{cups} / {goalCups}</h2>
              <p className="text-stone-400 text-sm mt-1">
                {cups >= goalCups ? "🎉 Daily goal reached! Amazing!" : `${goalCups - cups} more to reach your goal`}
              </p>
            </div>

            {/* Cup grid */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {Array.from({ length: goalCups }, (_, i) => {
                const filled = i < cups;
                const justFilled = justFilledCup === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleCupClick(i)}
                    className={`w-14 h-18 rounded-xl border-2 flex flex-col items-center justify-end pb-2 transition-all duration-300 hover:scale-110 active:scale-95 ${
                      filled
                        ? "border-sky-300 bg-sky-100"
                        : "border-cream-200 bg-cream-50 hover:border-sky-200 hover:bg-sky-50"
                    } ${justFilled ? "scale-125" : ""}`}
                    style={{ height: "72px" }}
                    title={filled ? "Click to unfill" : "Click to fill"}
                  >
                    <Droplets className={`w-7 h-7 transition-colors ${filled ? "text-sky-400" : "text-cream-300"}`} />
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-cream-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-300 to-sage-400 rounded-full transition-all duration-500"
                style={{ width: `${(cups / goalCups) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-300 mt-1.5">
              <span>0</span>
              <span>{goalCups} cups</span>
            </div>

            {/* Quick add/remove */}
            <div className="flex items-center gap-4 justify-center mt-8">
              <button onClick={() => setCupsCount(cups - 1)} disabled={cups === 0}
                className="w-12 h-12 rounded-xl bg-cream-100 hover:bg-cream-200 disabled:opacity-40 text-stone-600 text-xl font-bold transition-all hover:scale-105 active:scale-95">
                −
              </button>
              <span className="text-3xl font-bold text-stone-800 w-12 text-center">{cups}</span>
              <button onClick={() => setCupsCount(cups + 1)} disabled={cups >= goalCups}
                className="w-12 h-12 rounded-xl bg-sky-100 hover:bg-sky-200 disabled:opacity-40 text-sky-600 text-xl font-bold transition-all hover:scale-105 active:scale-95">
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
