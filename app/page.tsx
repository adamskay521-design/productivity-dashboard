"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  format, isToday, isPast, startOfWeek, addDays, addWeeks, subWeeks,
  subDays, eachDayOfInterval, parseISO,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Circle, CheckCircle2, Plus, X, Loader2,
  Clock, CalendarDays, CheckSquare, Target, Flame, Droplets, Dumbbell,
  Star, Package, BookOpen, Scissors, FileText, Music2,
} from "lucide-react";
import type { Task, Habit, HabitLog, TaskCategory, CalendarEvent, Goal, DeclutterArea } from "@/lib/schema";
import { CATEGORY_META, TASK_CATEGORIES } from "@/lib/schema";

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

  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
  const currentYear = new Date().getFullYear();

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
  }

  useEffect(() => { load(); }, [weekStart]);

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

        <Link href="/habits" className="rounded-3xl p-5 shadow-sm hover:shadow-md transition-all" style={{ background: "#2a1508" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-nude-400 font-semibold mb-4">Habits</p>
          <p className="text-4xl font-bold text-cream-100 leading-none mb-1.5">{todayHabitsDone}</p>
          <p className="text-xs text-nude-400/80">of {habits.length} today</p>
        </Link>

        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold mb-4">Water</p>
          <p className="text-4xl font-bold text-stone-900 leading-none mb-1.5">{waterCups}</p>
          <p className="text-xs text-stone-400">of 8 cups today</p>
        </div>

        <Link href="/goals" className="rounded-3xl p-5 shadow-sm hover:shadow-md transition-all" style={{ background: "#b07020" }}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-nude-100 font-semibold mb-4">Q{currentQ} Goals</p>
          <p className="text-4xl font-bold text-white leading-none mb-1.5">{completedGoals.length}</p>
          <p className="text-xs text-nude-100/80">of {activeGoals.length} complete</p>
        </Link>
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
        <Link href="/goals" className="rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group" style={{ background: "#1a0d05" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-nude-400 font-semibold flex items-center gap-2">
              <Star className="w-3.5 h-3.5" /> Q{currentQ} {currentYear} Goals
            </p>
            <span className="text-[10px] text-nude-400/60 group-hover:text-nude-400 transition-colors">View all →</span>
          </div>
          {activeGoals.length > 0 ? (
            <>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-cream-100">{completedGoals.length}</span>
                <span className="text-stone-400 mb-1">/ {activeGoals.length} complete</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-1.5 rounded-full bg-nude-400 transition-all" style={{ width: `${avgProgress}%` }} />
              </div>
              <p className="text-[11px] text-nude-400/60 mt-2">{avgProgress}% average progress</p>
            </>
          ) : (
            <p className="text-sm text-stone-500">No goals set for Q{currentQ} yet</p>
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

      {/* ── QUICK NAV ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {[
          { href: "/tasks",     icon: <CheckSquare className="w-5 h-5" />, label: "Tasks",     color: "text-nude-500" },
          { href: "/habits",    icon: <Target className="w-5 h-5" />,      label: "Habits",    color: "text-sage-500" },
          { href: "/calendar",  icon: <CalendarDays className="w-5 h-5" />,label: "Calendar",  color: "text-blue-400" },
          { href: "/fitness",   icon: <Dumbbell className="w-5 h-5" />,    label: "Fitness",   color: "text-orange-400" },
          { href: "/goals",     icon: <Star className="w-5 h-5" />,        label: "Goals",     color: "text-amber-400" },
          { href: "/declutter", icon: <Package className="w-5 h-5" />,     label: "Declutter", color: "text-purple-400" },
          { href: "/reading",   icon: <BookOpen className="w-5 h-5" />,    label: "Reading",   color: "text-teal-500" },
          { href: "/crochet",   icon: <Scissors className="w-5 h-5" />,    label: "Crochet",   color: "text-drose-400" },
          { href: "/notes",     icon: <FileText className="w-5 h-5" />,    label: "Notes",     color: "text-stone-400" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-all text-center group flex flex-col items-center gap-1.5">
            <div className={`${item.color} transition-transform group-hover:scale-110`}>{item.icon}</div>
            <p className="text-xs font-semibold text-stone-600 group-hover:text-stone-900 leading-tight">{item.label}</p>
          </Link>
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
