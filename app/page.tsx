"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  format, isToday, isPast, isSameMonth, isSameDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, addDays, addWeeks, subWeeks, addMonths, subMonths,
  subDays, eachDayOfInterval, parseISO,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Circle, CheckCircle2, Plus, X, Loader2,
  Clock, CalendarDays, CheckSquare, Target, Flame, Droplets, Dumbbell,
  Star, Package, BookOpen, Scissors, FileText, Music2, Sunrise, Moon,
  UtensilsCrossed, Heart, Sparkles, Clapperboard, BookMarked, Archive,
  Wrench, Timer, DollarSign, CalendarCheck, ListChecks, Brain, Clock3,
} from "lucide-react";
import type { Task, Habit, HabitLog, TaskCategory, CalendarEvent, Goal, DeclutterArea, MoodLog, WeeklyReview, DailyMeal, DailyCheckin, DailyPriority, DailyScheduleBlock, BrainDump } from "@/lib/schema";
import { CATEGORY_META, TASK_CATEGORIES, MOOD_META } from "@/lib/schema";

function calcStreak(dates: string[]): number {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (!dates.includes(today) && !dates.includes(yesterday)) return 0;
  let streak = dates.includes(today) ? 1 : 0;
  let d = subDays(new Date(), dates.includes(today) ? 1 : 2);
  while (true) {
    const s = format(d, "yyyy-MM-dd");
    if (dates.includes(s)) { streak++; d = subDays(d, 1); }
    else break;
  }
  return streak;
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function parseSpotifyEmbed(input: string): string {
  try {
    const url = new URL(input.trim());
    if (!url.hostname.includes("spotify.com")) return "";
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed") parts.shift();
    if (parts.length >= 2) return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator`;
    return "";
  } catch { return ""; }
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-drose-400", medium: "bg-amber-400", low: "bg-stone-300",
};

const SCHEDULE_HOURS = [
  "6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm",
  "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm",
];

export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [declutterAreas, setDeclutterAreas] = useState<DeclutterArea[]>([]);
  const [waterCups, setWaterCups] = useState(0);
  const [waterLoading, setWaterLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addPriority, setAddPriority] = useState<"low" | "medium" | "high">("medium");
  const [addCategory, setAddCategory] = useState<TaskCategory | "">("");
  const [saving, setSaving] = useState(false);
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState("");
  const [spotifyInput, setSpotifyInput] = useState("");
  const [spotifyEditing, setSpotifyEditing] = useState(false);
  const [recentMoods, setRecentMoods] = useState<MoodLog[]>([]);
  const [weekReview, setWeekReview] = useState<WeeklyReview | null>(null);
  const [reviewDraft, setReviewDraft] = useState({ wins: "", challenges: "", focusNext: "", gratitude: "" });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [dailyMeals, setDailyMeals] = useState<DailyMeal | null>(null);
  const [mealsDraft, setMealsDraft] = useState({ breakfast: "", lunch: "", dinner: "", snacks: "" });
  const [mealsSaving, setMealsSaving] = useState(false);
  const [dailyCheckin, setDailyCheckin] = useState<DailyCheckin | null>(null);
  const [checkinDraft, setCheckinDraft] = useState({ gratitude: "", affirmation: "" });
  const [checkinSaving, setCheckinSaving] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [priorities, setPriorities] = useState<DailyPriority[]>([]);
  const [priorityInput, setPriorityInput] = useState("");
  const [priorityAdding, setPriorityAdding] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<DailyScheduleBlock[]>([]);
  const [scheduleDraft, setScheduleDraft] = useState<Record<string, string>>({});
  const [brainDump, setBrainDump] = useState<BrainDump | null>(null);
  const [brainDumpDraft, setBrainDumpDraft] = useState("");
  const [brainDumpSaving, setBrainDumpSaving] = useState(false);

  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
  const currentYear = new Date().getFullYear();
  const currentWeekMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("spotify-embed-url");
    if (saved) setSpotifyEmbedUrl(saved);
  }, []);

  async function load() {
    const weekEnd = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const upcomingEnd = format(addDays(new Date(), 14), "yyyy-MM-dd");
    const [t, h, l, ev, water, upcoming, goalsRes, declutter] = await Promise.all([
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/habits").then(r => r.json()),
      fetch("/api/habit-logs?days=60").then(r => r.json()),
      fetch(`/api/events?start=${weekStartStr}&end=${weekEnd}`).then(r => r.json()),
      fetch(`/api/water?date=${todayStr}`).then(r => r.json()),
      fetch(`/api/events?start=${todayStr}&end=${upcomingEnd}`).then(r => r.json()),
      fetch(`/api/goals?quarter=${currentQ}&year=${currentYear}`).then(r => r.json()),
      fetch("/api/declutter").then(r => r.json()),
    ]);
    setTasks(Array.isArray(t) ? t : []);
    setHabits(Array.isArray(h) ? h : []);
    setLogs(Array.isArray(l) ? l : []);
    setWeekEvents(Array.isArray(ev) ? ev : []);
    setUpcomingEvents(Array.isArray(upcoming) ? upcoming : []);
    setGoals(Array.isArray(goalsRes) ? goalsRes : []);
    setDeclutterAreas(Array.isArray(declutter) ? declutter : []);
    setWaterCups(water.cups ?? 0);
    setLoading(false);
    setWaterLoading(false);

    fetch("/api/mood?days=7").then(r => r.json()).then(d => setRecentMoods(Array.isArray(d) ? d : []));
    fetch(`/api/weekly-review?weekStart=${currentWeekMonday}`).then(r => r.json()).then(d => {
      if (d) {
        setWeekReview(d);
        setReviewDraft({ wins: d.wins ?? "", challenges: d.challenges ?? "", focusNext: d.focusNext ?? "", gratitude: d.gratitude ?? "" });
      }
    });
    fetch(`/api/meals?date=${todayStr}`).then(r => r.json()).then(d => {
      if (d) {
        setDailyMeals(d);
        setMealsDraft({ breakfast: d.breakfast ?? "", lunch: d.lunch ?? "", dinner: d.dinner ?? "", snacks: d.snacks ?? "" });
      }
    });
    fetch(`/api/daily-checkin?date=${todayStr}`).then(r => r.json()).then(d => {
      if (d) {
        setDailyCheckin(d);
        setCheckinDraft({ gratitude: d.gratitude ?? "", affirmation: d.affirmation ?? "" });
      }
    });
    fetch(`/api/daily-priorities?date=${todayStr}`).then(r => r.json()).then(d => setPriorities(Array.isArray(d) ? d : []));
    fetch(`/api/daily-schedule?date=${todayStr}`).then(r => r.json()).then(d => {
      const blocks = Array.isArray(d) ? d : [];
      setScheduleBlocks(blocks);
      const draft: Record<string, string> = {};
      for (const b of blocks) draft[b.hour] = b.task;
      setScheduleDraft(draft);
    });
    fetch(`/api/brain-dump?date=${todayStr}`).then(r => r.json()).then(d => {
      if (d) {
        setBrainDump(d);
        setBrainDumpDraft(d.content ?? "");
      }
    });
  }

  useEffect(() => { load(); }, [weekStart]);

  async function loadMonthEvents() {
    const start = format(startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const ev = await fetch(`/api/events?start=${start}&end=${end}`).then(r => r.json());
    setMonthEvents(Array.isArray(ev) ? ev : []);
  }

  useEffect(() => { loadMonthEvents(); }, [calendarMonth]);

  function eventsForDay(date: Date) {
    return weekEvents.filter(e => e.date === format(date, "yyyy-MM-dd"));
  }

  async function toggleWaterCup(idx: number) {
    const newCups = idx < waterCups ? idx : idx + 1;
    setWaterCups(newCups);
    await fetch("/api/water", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, cups: newCups, goalCups: 8 }),
    });
  }

  function doneHabitsForDay(date: Date): Set<number> {
    const ds = format(date, "yyyy-MM-dd");
    return new Set(logs.filter(l => l.completedDate === ds).map(l => l.habitId));
  }

  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === "done") return false;
    return isPast(new Date(t.dueDate + "T12:00:00")) && !isToday(new Date(t.dueDate + "T12:00:00"));
  });
  const backlogTasks = tasks.filter(t => !t.dueDate && t.status !== "done");
  const openCount = tasks.filter(t => t.status !== "done").length;
  const todayDoneSet = doneHabitsForDay(new Date());
  const todayHabitsDone = todayDoneSet.size;
  const morningHabits = habits.filter(h => h.timeOfDay === "morning");
  const eveningHabits = habits.filter(h => h.timeOfDay === "evening");
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 }),
  });
  const activeGoals = goals.filter(g => g.status !== "completed");
  const completedGoals = goals.filter(g => g.status === "completed");
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((s, g) => s + (g.progressPercent ?? 0), 0) / activeGoals.length) : 0;
  const doneRooms = new Set(declutterAreas.filter(a => a.status === "done").map(a => a.room)).size;
  const totalRooms = new Set(declutterAreas.map(a => a.room)).size;
  const totalItems = declutterAreas.reduce((s, a) => s + (a.itemsCount ?? 0), 0);
  const upcomingTasks = tasks
    .filter(t => t.dueDate && t.status !== "done" && !isPast(new Date(t.dueDate + "T12:00:00")))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);

  async function toggleTask(id: number, status: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "done" ? "todo" : "done" }),
    });
    load();
  }

  async function toggleHabit(habitId: number, date: Date) {
    await fetch("/api/habit-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, completedDate: format(date, "yyyy-MM-dd") }),
    });
    load();
  }

  async function addTask(e: React.FormEvent, date: Date) {
    e.preventDefault();
    if (!addTitle.trim()) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: addTitle.trim(), priority: addPriority, category: addCategory || null, dueDate: format(date, "yyyy-MM-dd") }),
    });
    setAddTitle(""); setAddPriority("medium"); setAddCategory(""); setAddingDay(null); setSaving(false);
    load();
  }

  function handleSpotifySubmit(e: React.FormEvent) {
    e.preventDefault();
    const embedUrl = parseSpotifyEmbed(spotifyInput);
    if (embedUrl) {
      setSpotifyEmbedUrl(embedUrl);
      localStorage.setItem("spotify-embed-url", embedUrl);
      setSpotifyInput(""); setSpotifyEditing(false);
    }
  }

  async function saveMood(mood: number) {
    await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, mood }),
    });
    fetch("/api/mood?days=7").then(r => r.json()).then(d => setRecentMoods(Array.isArray(d) ? d : []));
  }

  async function saveWeekReview() {
    setReviewSaving(true);
    const saved = await fetch("/api/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: currentWeekMonday, ...reviewDraft }),
    }).then(r => r.json());
    setWeekReview(saved);
    setReviewSaving(false);
  }

  async function saveMeals() {
    setMealsSaving(true);
    const saved = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, ...mealsDraft }),
    }).then(r => r.json());
    setDailyMeals(saved);
    setMealsSaving(false);
  }

  async function saveCheckin() {
    setCheckinSaving(true);
    const saved = await fetch("/api/daily-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, ...checkinDraft }),
    }).then(r => r.json());
    setDailyCheckin(saved);
    setCheckinSaving(false);
  }

  async function addTopPriority(e: React.FormEvent) {
    e.preventDefault();
    if (!priorityInput.trim() || priorities.length >= 5) return;
    setPriorityAdding(true);
    const saved = await fetch("/api/daily-priorities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, text: priorityInput.trim(), position: priorities.length }),
    }).then(r => r.json());
    setPriorities(p => [...p, saved]);
    setPriorityInput("");
    setPriorityAdding(false);
  }

  async function togglePriority(id: number, completed: boolean) {
    setPriorities(p => p.map(x => x.id === id ? { ...x, completed: !completed } : x));
    await fetch(`/api/daily-priorities/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
  }

  async function deletePriority(id: number) {
    setPriorities(p => p.filter(x => x.id !== id));
    await fetch(`/api/daily-priorities/${id}`, { method: "DELETE" });
  }

  async function saveScheduleHour(hour: string) {
    const task = scheduleDraft[hour] ?? "";
    const saved = await fetch("/api/daily-schedule", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, hour, task }),
    }).then(r => r.json());
    setScheduleBlocks(blocks => {
      const rest = blocks.filter(b => b.hour !== hour);
      return [...rest, saved];
    });
  }

  async function saveBrainDump() {
    setBrainDumpSaving(true);
    const saved = await fetch("/api/brain-dump", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, content: brainDumpDraft }),
    }).then(r => r.json());
    setBrainDump(saved);
    setBrainDumpSaving(false);
  }

  function eventsForMonthDay(date: Date) {
    const ds = format(date, "yyyy-MM-dd");
    return monthEvents.filter(e => e.date === ds);
  }

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  return (
    <div className="p-5 xl:p-7 max-w-[1440px] mx-auto space-y-4">

      {/* ── HEADER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-3xl p-7 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-nude-400 mb-3">
            {format(new Date(), "EEEE · MMMM d, yyyy")}
          </p>
          <h1 className="font-serif text-5xl font-bold text-stone-900 leading-none">{greet()}</h1>
          <div className="flex flex-wrap items-center gap-5 mt-5 pt-5 border-t border-stone-100 text-xs text-stone-500">
            <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-nude-400" />{openCount} open tasks</span>
            <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-sage-400" />{todayHabitsDone}/{habits.length} habits</span>
            <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-sky-300" />{waterCups}/8 cups</span>
            {overdueTasks.length > 0 && (
              <span className="flex items-center gap-1.5 text-drose-500 font-semibold"><Clock className="w-3.5 h-3.5" />{overdueTasks.length} overdue</span>
            )}
          </div>
        </div>

        {/* Clock */}
        <div className="bg-white rounded-3xl p-7 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-nude-400 mb-4">Right now</p>
          <p className="text-5xl font-light text-stone-900 tabular-nums leading-none">
            {format(now, "h:mm")}
            <span className="text-3xl text-stone-300">:{format(now, "ss")}</span>
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-nude-400 font-semibold mt-3">{format(now, "a")}</p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/tasks" className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4">Tasks</p>
          <p className="text-4xl font-bold text-stone-900 leading-none mb-1.5 group-hover:text-nude-600 transition-colors">{openCount}</p>
          <p className="text-xs text-stone-400">open items</p>
        </Link>

        <Link href="/habits" className="bg-sage-500 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          <p className="text-[10px] uppercase tracking-[0.2em] text-sage-100 font-semibold mb-4">Habits</p>
          <p className="text-4xl font-bold text-white leading-none mb-1.5">{todayHabitsDone}</p>
          <p className="text-xs text-sage-100/80">of {habits.length} today</p>
        </Link>

        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4">Water</p>
          <p className="text-4xl font-bold text-stone-900 leading-none mb-1.5">{waterCups}</p>
          <p className="text-xs text-stone-400">of 8 cups today</p>
        </div>

        <Link href="/goals" className="bg-nude-400 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          <p className="text-[10px] uppercase tracking-[0.2em] text-nude-50 font-semibold mb-4">Q{currentQ} Goals</p>
          <p className="text-4xl font-bold text-white leading-none mb-1.5">{completedGoals.length}</p>
          <p className="text-xs text-nude-50/80">of {activeGoals.length} complete</p>
        </Link>
      </div>

      {/* ── TOP PRIORITIES ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
          <ListChecks className="w-3.5 h-3.5 text-drose-400" /> Today's Top Priorities
        </p>
        <div className="space-y-1.5">
          {Array.from({ length: 5 }, (_, i) => {
            const p = priorities[i];
            return (
              <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-stone-50 transition-colors">
                <span className="text-xs font-bold text-stone-300 w-4 flex-shrink-0">{i + 1}.</span>
                {p ? (
                  <>
                    <button onClick={() => togglePriority(p.id, p.completed)} className="flex-shrink-0">
                      {p.completed
                        ? <CheckCircle2 className="w-4 h-4 text-sage-400" />
                        : <Circle className="w-4 h-4 text-stone-300 hover:text-drose-400 transition-colors" />
                      }
                    </button>
                    <span className={`text-sm flex-1 ${p.completed ? "line-through text-stone-300" : "text-stone-700"}`}>
                      {p.text}
                    </span>
                    <button onClick={() => deletePriority(p.id)} className="text-stone-300 hover:text-drose-400 transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : i === priorities.length ? (
                  <form onSubmit={addTopPriority} className="flex-1 flex items-center gap-2">
                    <input type="text" value={priorityInput} onChange={e => setPriorityInput(e.target.value)}
                      placeholder="Add a priority..."
                      className="flex-1 text-sm text-stone-700 placeholder:text-stone-300 border border-transparent focus:border-cream-200 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-nude-200" />
                    {priorityInput && (
                      <button type="submit" disabled={priorityAdding}
                        className="text-xs text-white bg-nude-500 hover:bg-nude-600 font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60 flex-shrink-0">
                        {priorityAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                      </button>
                    )}
                  </form>
                ) : (
                  <span className="text-sm text-stone-300">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MOOD + WEEKLY REVIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mood */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4">How are you feeling?</p>
          <div className="flex items-center gap-3 mb-4">
            {[1,2,3,4,5].map((m) => {
              const meta = MOOD_META[m];
              const todayMood = recentMoods.find(r => r.date === todayStr);
              const active = todayMood?.mood === m;
              return (
                <button key={m} onClick={() => saveMood(m)}
                  title={meta.label}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all hover:scale-110 active:scale-95 ${
                    active ? "scale-110" : "opacity-50 hover:opacity-100"
                  }`}
                  style={active ? { backgroundColor: meta.color + "20" } : {}}
                >
                  <span className="text-2xl leading-none">{meta.emoji}</span>
                  <span className="text-[10px] font-medium" style={{ color: meta.color }}>{meta.label}</span>
                </button>
              );
            })}
          </div>
          {/* 7-day mood trail */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 7 }, (_, i) => {
              const d = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), "yyyy-MM-dd");
              const log = recentMoods.find(r => r.date === d);
              const isToday2 = d === todayStr;
              return (
                <div key={d} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${isToday2 ? "ring-2 ring-offset-1 ring-stone-300" : ""}`}
                    style={log ? { backgroundColor: MOOD_META[log.mood].color + "30" } : { backgroundColor: "#f1f5f9" }}
                    title={`${d}: ${log ? MOOD_META[log.mood].label : "no entry"}`}
                  >
                    {log ? <span className="text-base">{MOOD_META[log.mood].emoji}</span> : <span className="w-1.5 h-1.5 rounded-full bg-stone-200 block" />}
                  </div>
                  <span className="text-[9px] text-stone-300">{format(parseISO(d), "E")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Review */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold">Week in Review</p>
            <Link href="#" className="text-[10px] text-stone-300 hover:text-nude-500 transition-colors">
              {format(parseISO(currentWeekMonday), "MMM d")} week
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "wins",       label: "Wins",              placeholder: "What went well?" },
              { key: "challenges", label: "Challenges",        placeholder: "What was hard?" },
              { key: "focusNext",  label: "Focus next week",   placeholder: "What's the priority?" },
              { key: "gratitude",  label: "Grateful for",      placeholder: "What are you thankful for?" },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <p className="text-[10px] font-semibold text-stone-400 mb-1 uppercase tracking-[0.1em]">{label}</p>
                <textarea
                  value={reviewDraft[key]}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, [key]: e.target.value }))}
                  onBlur={saveWeekReview}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full text-xs text-stone-700 placeholder:text-stone-300 border border-cream-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-nude-200 resize-none"
                />
              </div>
            ))}
          </div>
          {reviewSaving && <p className="text-[10px] text-stone-300 mt-2">Saving…</p>}
        </div>
      </div>

      {/* ── MORNING + EVENING ROUTINE ── */}
      {(morningHabits.length > 0 || eveningHabits.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
              <Sunrise className="w-3.5 h-3.5 text-sage-500" /> Morning Routine
            </p>
            {morningHabits.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {morningHabits.map(habit => {
                  const done = todayDoneSet.has(habit.id);
                  return (
                    <button key={habit.id} onClick={() => toggleHabit(habit.id, new Date())}
                      title={habit.name}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105 ${
                        done ? "border-transparent text-white" : "border-stone-200 text-stone-500 bg-stone-50"
                      }`}
                      style={done ? { backgroundColor: habit.color, borderColor: habit.color } : {}}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: done ? "rgba(255,255,255,0.7)" : habit.color }} />
                      {habit.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-300">No morning habits tagged yet</p>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-sage-500" /> Evening Routine
            </p>
            {eveningHabits.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {eveningHabits.map(habit => {
                  const done = todayDoneSet.has(habit.id);
                  return (
                    <button key={habit.id} onClick={() => toggleHabit(habit.id, new Date())}
                      title={habit.name}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105 ${
                        done ? "border-transparent text-white" : "border-stone-200 text-stone-500 bg-stone-50"
                      }`}
                      style={done ? { backgroundColor: habit.color, borderColor: habit.color } : {}}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: done ? "rgba(255,255,255,0.7)" : habit.color }} />
                      {habit.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-300">No evening habits tagged yet</p>
            )}
          </div>
        </div>
      )}

      {/* ── MEALS + GRATITUDE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meals Today */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-3.5 h-3.5 text-sage-500" /> Meals Today
          </p>
          <div className="space-y-2.5">
            {([
              { key: "breakfast", label: "Breakfast" },
              { key: "lunch",     label: "Lunch" },
              { key: "dinner",    label: "Dinner" },
              { key: "snacks",    label: "Snacks" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs font-medium text-stone-500 w-16 flex-shrink-0">{label}</span>
                <input
                  type="text"
                  value={mealsDraft[key]}
                  onChange={(e) => setMealsDraft((p) => ({ ...p, [key]: e.target.value }))}
                  onBlur={saveMeals}
                  placeholder="—"
                  className="flex-1 text-xs text-stone-700 placeholder:text-stone-300 border border-cream-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-nude-200"
                />
              </div>
            ))}
          </div>
          {mealsSaving && <p className="text-[10px] text-stone-300 mt-2">Saving…</p>}
        </div>

        {/* Daily Gratitude & Affirmation */}
        <div className="bg-cream-50 rounded-3xl p-6 shadow-sm border border-cream-200">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-sage-500" /> Gratitude &amp; Affirmation
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-stone-400 mb-1 uppercase tracking-[0.1em] flex items-center gap-1">
                <Heart className="w-2.5 h-2.5" /> Grateful for
              </p>
              <textarea
                value={checkinDraft.gratitude}
                onChange={(e) => setCheckinDraft((p) => ({ ...p, gratitude: e.target.value }))}
                onBlur={saveCheckin}
                placeholder="What are you grateful for today?"
                rows={2}
                className="w-full text-xs text-stone-700 placeholder:text-stone-300 border border-cream-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-nude-200 resize-none"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-stone-400 mb-1 uppercase tracking-[0.1em] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Today's affirmation
              </p>
              <textarea
                value={checkinDraft.affirmation}
                onChange={(e) => setCheckinDraft((p) => ({ ...p, affirmation: e.target.value }))}
                onBlur={saveCheckin}
                placeholder="A mantra to carry through the day"
                rows={2}
                className="w-full text-xs text-stone-700 placeholder:text-stone-300 border border-cream-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-nude-200 resize-none"
              />
            </div>
          </div>
          {checkinSaving && <p className="text-[10px] text-stone-300 mt-2">Saving…</p>}
        </div>
      </div>

      {/* ── UPCOMING + HABITS + SPOTIFY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Upcoming */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-nude-400" /> Upcoming
          </p>
          {upcomingEvents.length === 0 && upcomingTasks.length === 0 && overdueTasks.length === 0 ? (
            <p className="text-sm text-stone-300 py-6 text-center">Nothing scheduled — enjoy the open day.</p>
          ) : (
            <div className="space-y-1.5">
              {overdueTasks.slice(0, 2).map(task => (
                <div key={`od-${task.id}`} className="flex items-center gap-3 py-2 px-3 rounded-2xl bg-drose-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-drose-400 flex-shrink-0" />
                  <span className="text-sm text-drose-700 flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-drose-400 font-medium flex-shrink-0">
                    {task.dueDate ? format(parseISO(task.dueDate), "MMM d") : ""} overdue
                  </span>
                </div>
              ))}
              {upcomingEvents.slice(0, 5).map(ev => (
                <div key={`ev-${ev.id}`} className="flex items-center gap-3 py-2 px-3 rounded-2xl hover:bg-stone-50 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                  <span className="text-sm text-stone-700 flex-1 truncate">{ev.title}</span>
                  <span className="text-xs text-stone-400 font-medium flex-shrink-0">
                    {ev.date === todayStr ? "Today" : format(parseISO(ev.date), "EEE, MMM d")}
                    {ev.startTime ? ` · ${ev.startTime}` : ""}
                  </span>
                </div>
              ))}
              {upcomingTasks.map(task => (
                <div key={`ut-${task.id}`} className="flex items-center gap-3 py-2 px-3 rounded-2xl hover:bg-stone-50 transition-colors">
                  <Circle className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
                  <span className="text-sm text-stone-600 flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-stone-400 font-medium flex-shrink-0">
                    {task.dueDate === todayStr ? "Today" : task.dueDate ? format(parseISO(task.dueDate), "EEE, MMM d") : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Habits today + Spotify */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold">Habits Today</p>
              <Link href="/habits" className="text-[10px] text-stone-300 hover:text-nude-500 transition-colors">Manage →</Link>
            </div>
            {habits.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {habits.map(habit => {
                  const done = todayDoneSet.has(habit.id);
                  return (
                    <button key={habit.id} onClick={() => toggleHabit(habit.id, new Date())}
                      title={habit.name}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105 ${
                        done ? "border-transparent text-white" : "border-stone-200 text-stone-500 bg-stone-50"
                      }`}
                      style={done ? { backgroundColor: habit.color, borderColor: habit.color } : {}}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: done ? "rgba(255,255,255,0.7)" : habit.color }} />
                      {habit.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-300">No habits set up yet</p>
            )}
          </div>

          {/* Spotify */}
          <div className="bg-white rounded-3xl p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold">Spotify</p>
              </div>
              {spotifyEmbedUrl && !spotifyEditing && (
                <button onClick={() => setSpotifyEditing(true)}
                  className="text-[10px] text-stone-300 hover:text-nude-500 transition-colors">Change</button>
              )}
            </div>
            {spotifyEmbedUrl && !spotifyEditing ? (
              <iframe src={spotifyEmbedUrl} width="100%" height="152" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" className="rounded-2xl" />
            ) : (
              <form onSubmit={handleSpotifySubmit} className="space-y-2">
                <p className="text-xs text-stone-400">Paste a Spotify playlist, album, or track link</p>
                <input type="text" value={spotifyInput} onChange={e => setSpotifyInput(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-nude-200 text-stone-700 placeholder:text-stone-300" />
                <div className="flex gap-2">
                  <button type="submit"
                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-xl transition-colors">
                    Add
                  </button>
                  {spotifyEditing && (
                    <button type="button" onClick={() => { setSpotifyEditing(false); setSpotifyInput(""); }}
                      className="text-xs text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-xl border border-stone-100 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── LIFE SNAPSHOT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link href="/goals" className="bg-drose-500 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-drose-100 font-semibold flex items-center gap-2">
              <Star className="w-3.5 h-3.5" /> Q{currentQ} {currentYear} Goals
            </p>
            <span className="text-[10px] text-drose-100/70 group-hover:text-drose-100 transition-colors">View all →</span>
          </div>
          {activeGoals.length > 0 ? (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-white">{completedGoals.length}</span>
                <span className="text-drose-100/80 mb-1">/ {activeGoals.length} complete</span>
              </div>
              <div className="w-full rounded-full h-1.5 bg-white/20">
                <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${avgProgress}%` }} />
              </div>
              <p className="text-[11px] text-drose-100/70 mt-2">{avgProgress}% average progress</p>
            </>
          ) : (
            <p className="text-sm text-drose-100/80">No goals set for Q{currentQ} yet</p>
          )}
        </Link>

        <Link href="/declutter" className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-nude-400" /> Declutter
            </p>
            <span className="text-[10px] text-stone-300 group-hover:text-nude-500 transition-colors">View all →</span>
          </div>
          {totalRooms > 0 ? (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-stone-900">{doneRooms}</span>
                <span className="text-stone-400 mb-1">/ {totalRooms} rooms cleared</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-nude-400 transition-all"
                  style={{ width: `${totalRooms > 0 ? Math.round((doneRooms / totalRooms) * 100) : 0}%` }} />
              </div>
              {totalItems > 0 && <p className="text-[11px] text-stone-400 mt-2">{totalItems} items tracked</p>}
            </>
          ) : (
            <p className="text-sm text-stone-400">No rooms tracked yet</p>
          )}
        </Link>
      </div>

      {/* ── BRAIN DUMP ── */}
      <div className="bg-cream-50 rounded-3xl p-6 shadow-sm border border-cream-200">
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-sage-500" /> Brain Dump
        </p>
        <textarea
          value={brainDumpDraft}
          onChange={(e) => setBrainDumpDraft(e.target.value)}
          onBlur={saveBrainDump}
          placeholder="Get it out of your head — random thoughts, ideas, reminders..."
          rows={4}
          className="w-full text-sm text-stone-700 placeholder:text-stone-300 border border-cream-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-nude-200 resize-none"
        />
        {brainDumpSaving && <p className="text-[10px] text-stone-300 mt-2">Saving…</p>}
      </div>

      {/* ── CRAFT JOURNAL ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-drose-400" /> Craft Journal
          </p>
          <a href="https://craft-journal-kayla-adams.vercel.app" target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-stone-300 hover:text-nude-500 transition-colors">Open full app →</a>
        </div>
        <iframe src="https://craft-journal-kayla-adams.vercel.app" loading="lazy"
          className="w-full rounded-2xl border border-cream-200" style={{ height: 600 }} />
      </div>

      {/* ── MINI CALENDAR ── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-sage-500" /> {format(calendarMonth, "MMMM yyyy")}
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCalendarMonth(m => subMonths(m, 1))}
              className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button onClick={() => setCalendarMonth(m => addMonths(m, 1))}
              className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
              <ChevronRight className="w-3 h-3" />
            </button>
            <Link href="/calendar" className="text-[10px] text-stone-300 hover:text-nude-500 transition-colors ml-1">
              View full →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[9px] font-bold uppercase text-stone-300 text-center">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const inMonth = isSameMonth(day, calendarMonth);
            const today = isToday(day);
            const hasEvents = eventsForMonthDay(day).length > 0;
            return (
              <div key={day.toISOString()}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs ${
                  today ? "bg-sage-400 text-white font-bold" : inMonth ? "text-stone-600" : "text-sage-200"
                }`}>
                {format(day, "d")}
                {hasEvents && !today && <span className="w-1 h-1 rounded-full bg-sage-400 mt-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── QUICK NAV ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Daily", items: [
              { href: "/tasks",    icon: <CheckSquare className="w-4 h-4" />,  label: "Tasks" },
              { href: "/habits",   icon: <Target className="w-4 h-4" />,       label: "Habits" },
              { href: "/journal",  icon: <BookMarked className="w-4 h-4" />,   label: "Journal" },
              { href: "/calendar", icon: <CalendarDays className="w-4 h-4" />, label: "Calendar" },
            ],
          },
          {
            title: "Goals & Growth", items: [
              { href: "/goals",          icon: <Star className="w-4 h-4" />,         label: "Goals" },
              { href: "/monthly-review", icon: <CalendarCheck className="w-4 h-4" />, label: "Monthly Review" },
              { href: "/focus",          icon: <Timer className="w-4 h-4" />,        label: "Focus Timer" },
            ],
          },
          {
            title: "Wellness & Creative", items: [
              { href: "/fitness",    icon: <Dumbbell className="w-4 h-4" />,     label: "Fitness" },
              { href: "/reading",    icon: <BookOpen className="w-4 h-4" />,     label: "Reading" },
              { href: "/watchlist",  icon: <Clapperboard className="w-4 h-4" />, label: "Watchlist" },
              { href: "/crochet",    icon: <Scissors className="w-4 h-4" />,     label: "Crochet & Knitting" },
              { href: "/yarn-stash", icon: <Archive className="w-4 h-4" />,      label: "Yarn Stash" },
              { href: "/tools",      icon: <Wrench className="w-4 h-4" />,       label: "Tools" },
              { href: "/notes",      icon: <FileText className="w-4 h-4" />,     label: "Notes" },
            ],
          },
          {
            title: "Home & Money", items: [
              { href: "/budget",     icon: <DollarSign className="w-4 h-4" />, label: "Budget" },
              { href: "/declutter",  icon: <Package className="w-4 h-4" />,    label: "Declutter" },
            ],
          },
        ].map(group => (
          <div key={group.title} className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-3">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-cream-50 transition-colors text-sm">
                  <span className="text-nude-400">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── OVERDUE ── */}
      {overdueTasks.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-drose-500 font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Overdue
          </p>
          <div className="flex flex-wrap gap-2">
            {overdueTasks.map(task => (
              <button key={task.id} onClick={() => toggleTask(task.id, task.status)}
                className="flex items-center gap-1.5 text-xs bg-drose-50 rounded-xl px-3 py-1.5 text-drose-700 hover:bg-drose-100 transition-colors">
                <Circle className="w-3 h-3 flex-shrink-0" />
                {task.title}
                {task.dueDate && <span className="text-drose-400 font-medium">{format(parseISO(task.dueDate), "MMM d")}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TODAY'S SCHEDULE ── */}
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4 flex items-center gap-2">
          <Clock3 className="w-3.5 h-3.5 text-nude-400" /> Today's Schedule
        </p>
        <div className="max-h-[420px] overflow-y-auto pr-1 space-y-0.5">
          {SCHEDULE_HOURS.map(hour => (
            <div key={hour} className="flex items-center gap-3 py-1 px-2 rounded-lg hover:bg-stone-50 transition-colors">
              <span className="text-xs font-semibold text-stone-400 w-12 flex-shrink-0">{hour}</span>
              <input
                type="text"
                value={scheduleDraft[hour] ?? ""}
                onChange={(e) => setScheduleDraft(d => ({ ...d, [hour]: e.target.value }))}
                onBlur={() => saveScheduleHour(hour)}
                placeholder="—"
                className="flex-1 text-sm text-stone-700 placeholder:text-stone-300 border border-transparent focus:border-cream-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-nude-200"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── WEEKLY PLANNER ── */}
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold">Weekly Planner</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
              className="w-7 h-7 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="h-7 px-3 rounded-xl bg-stone-50 text-stone-600 text-xs font-semibold hover:bg-stone-100 transition-colors">
              Today
            </button>
            <span className="text-xs font-medium text-stone-500 min-w-[148px] text-center">{weekLabel}</span>
            <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
              className="w-7 h-7 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-300">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayTasks = tasks.filter(t => t.dueDate === dateStr);
              const dayDoneSet = doneHabitsForDay(day);
              const today = isToday(day);
              const isAdding = addingDay === dateStr;
              const doneCount = dayTasks.filter(t => t.status === "done").length;
              const dayEvents = eventsForDay(day);

              return (
                <div key={dateStr}
                  className={`rounded-2xl flex flex-col min-h-[320px] overflow-hidden transition-shadow hover:shadow-sm ${
                    today ? "shadow-sm" : ""
                  }`}
                  style={today
                    ? { background: "linear-gradient(to bottom, #fef8ee 0%, #fff 80px)", border: "1.5px solid #e0a858" }
                    : { background: "#fafaf9", border: "1.5px solid #f0ede8" }
                  }>

                  <div className={`px-3 pt-3 pb-2 border-b ${today ? "border-nude-200" : "border-stone-100"}`}>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${today ? "text-nude-500" : "text-stone-400"}`}>
                      {format(day, "EEE")}
                    </p>
                    <div className="flex items-end justify-between mt-0.5">
                      <span className={`text-2xl font-bold leading-none ${today ? "text-nude-600" : "text-stone-700"}`}>
                        {format(day, "d")}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[9px] text-stone-400 font-medium mb-0.5">{doneCount}/{dayTasks.length}</span>
                      )}
                    </div>
                  </div>

                  {dayEvents.length > 0 && (
                    <div className="px-2 pt-2 space-y-0.5">
                      {dayEvents.map(ev => (
                        <div key={ev.id} className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-lg"
                          style={{ backgroundColor: ev.color + "20", color: ev.color }}>
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 p-2 space-y-0.5">
                    {dayTasks.length === 0 && dayEvents.length === 0 && !isAdding && (
                      <p className="text-[10px] text-stone-300 px-1 pt-1">No tasks</p>
                    )}
                    {dayTasks.map(task => {
                      const catColor = task.category && task.category in CATEGORY_META
                        ? CATEGORY_META[task.category as TaskCategory].color : null;
                      return (
                        <div key={task.id} className="flex items-start gap-1.5 group py-1 px-1.5 rounded-lg hover:bg-white/80 transition-colors">
                          {catColor && <span className="w-1 self-stretch rounded-full flex-shrink-0 opacity-70" style={{ backgroundColor: catColor }} />}
                          <button onClick={() => toggleTask(task.id, task.status)} className="mt-0.5 flex-shrink-0">
                            {task.status === "done"
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-sage-400" />
                              : <Circle className={`w-3.5 h-3.5 transition-colors ${today ? "text-nude-300 hover:text-nude-500" : "text-stone-300 hover:text-nude-400"}`} />
                            }
                          </button>
                          <span className={`text-xs flex-1 leading-snug break-words min-w-0 ${task.status === "done" ? "line-through text-stone-300" : "text-stone-700"}`}>
                            {task.title}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-2 pb-2">
                    {isAdding ? (
                      <form onSubmit={e => addTask(e, day)} className="space-y-1.5">
                        <input type="text" value={addTitle} onChange={e => setAddTitle(e.target.value)}
                          placeholder="Task name..." autoFocus
                          className={`w-full text-xs px-2 py-1.5 rounded-lg border bg-white focus:outline-none focus:ring-1 ${today ? "border-nude-200 focus:ring-nude-300" : "border-stone-200 focus:ring-nude-200"}`}
                          onKeyDown={e => e.key === "Escape" && setAddingDay(null)} />
                        <div className="flex items-center gap-1 flex-wrap">
                          <select value={addPriority} onChange={e => setAddPriority(e.target.value as "low" | "medium" | "high")}
                            className="text-xs border border-stone-200 rounded-lg px-1.5 py-1 bg-white text-stone-500 focus:outline-none">
                            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                          </select>
                          <select value={addCategory} onChange={e => setAddCategory(e.target.value as TaskCategory | "")}
                            className="text-xs border border-stone-200 rounded-lg px-1.5 py-1 bg-white focus:outline-none"
                            style={addCategory && addCategory in CATEGORY_META ? { color: CATEGORY_META[addCategory as TaskCategory].color } : { color: "#a8a29e" }}>
                            <option value="">Category</option>
                            {TASK_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
                          </select>
                          <button type="submit" disabled={saving}
                            className="text-xs text-white bg-nude-500 hover:bg-nude-600 font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-60">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                          </button>
                          <button type="button" onClick={() => setAddingDay(null)} className="text-stone-400 hover:text-stone-600 p-1">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => { setAddingDay(dateStr); setAddTitle(""); }}
                        className={`w-full text-left text-xs py-1 px-1 rounded-lg transition-colors flex items-center gap-1 ${today ? "text-nude-300 hover:text-nude-500 hover:bg-nude-50/60" : "text-stone-300 hover:text-stone-500 hover:bg-white/60"}`}>
                        <Plus className="w-3 h-3" /> Add task
                      </button>
                    )}
                  </div>

                  {habits.length > 0 && (
                    <div className={`px-3 py-2 border-t flex gap-1.5 flex-wrap ${today ? "border-nude-100 bg-nude-50/30" : "border-stone-100 bg-white/40"}`}>
                      {habits.map(habit => {
                        const done = dayDoneSet.has(habit.id);
                        return (
                          <button key={habit.id} onClick={() => toggleHabit(habit.id, day)} title={habit.name}
                            className={`w-3 h-3 rounded-full transition-all hover:scale-125 ${done ? "opacity-100 ring-1 ring-offset-1 ring-white" : "opacity-20 hover:opacity-50"}`}
                            style={{ backgroundColor: habit.color }} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── HABIT GRID ── */}
      {habits.length > 0 && !loading && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold">Habits this week</p>
            <Link href="/habits" className="text-[10px] text-stone-300 hover:text-nude-500 transition-colors">Manage →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left pb-2 pr-6 min-w-[130px]" />
                  {days.map(day => (
                    <th key={format(day, "yyyy-MM-dd")} className="text-center pb-2 px-1 w-9">
                      <span className={`block text-[9px] font-bold uppercase tracking-widest ${isToday(day) ? "text-nude-500" : "text-stone-400"}`}>{format(day, "EEE")}</span>
                      <span className={`block text-sm font-bold ${isToday(day) ? "text-nude-600" : "text-stone-600"}`}>{format(day, "d")}</span>
                    </th>
                  ))}
                  <th className="pb-2 pl-3 text-left" />
                </tr>
              </thead>
              <tbody>
                {habits.map(habit => {
                  const habitDates = logs.filter(l => l.habitId === habit.id).map(l => l.completedDate);
                  const streak = calcStreak(habitDates);
                  return (
                    <tr key={habit.id}>
                      <td className="pr-6 py-1">
                        <span className="flex items-center gap-1.5 text-xs text-stone-700 font-medium whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                          {habit.name}
                        </span>
                      </td>
                      {days.map(day => {
                        const ds = format(day, "yyyy-MM-dd");
                        const done = logs.some(l => l.habitId === habit.id && l.completedDate === ds);
                        const todayCol = isToday(day);
                        return (
                          <td key={ds} className="py-1 px-1 text-center">
                            <button onClick={() => toggleHabit(habit.id, day)}
                              className={`w-7 h-7 rounded-xl mx-auto flex items-center justify-center transition-all hover:scale-110 ${todayCol && !done ? "ring-2 ring-offset-1 ring-nude-200" : ""} ${todayCol && done ? "ring-2 ring-offset-1 ring-nude-300" : ""}`}
                              style={done ? { backgroundColor: habit.color } : { backgroundColor: "#f0ede8" }}>
                              {done && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="pl-3 py-1">
                        {streak > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold whitespace-nowrap">
                            <Flame className="w-3 h-3" />{streak}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── WATER ── */}
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-sky-400" /> Water Today
          </p>
          <span className={`text-xs font-semibold ${waterCups >= 8 ? "text-sage-500" : "text-stone-400"}`}>
            {waterCups}/8 {waterCups >= 8 ? "🎉" : ""}
          </span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 8 }, (_, i) => {
            const filled = i < waterCups;
            return (
              <button key={i} onClick={() => toggleWaterCup(i)}
                className={`flex-1 h-9 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                  filled ? "border-sky-200 bg-sky-50" : "border-stone-100 bg-stone-50 hover:border-sky-100 hover:bg-sky-50/50"
                }`}>
                <Droplets className={`w-4 h-4 ${filled ? "text-sky-400" : "text-stone-300"}`} />
              </button>
            );
          })}
        </div>
        {!waterLoading && waterCups < 8 && (
          <p className="text-xs text-stone-300 mt-2.5 text-center">{8 - waterCups} more to reach your goal</p>
        )}
      </div>

      {/* ── BACKLOG ── */}
      {backlogTasks.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4">Backlog — no due date</p>
          <div className="flex flex-wrap gap-2">
            {backlogTasks.map(task => (
              <button key={task.id} onClick={() => toggleTask(task.id, task.status)}
                className="flex items-center gap-1.5 text-xs bg-stone-50 rounded-xl px-3 py-1.5 text-stone-600 hover:bg-stone-100 transition-colors">
                <Circle className="w-3 h-3 text-stone-300 flex-shrink-0" />
                {task.title}
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
