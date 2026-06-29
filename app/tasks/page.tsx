"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Circle, CheckCircle2, Clock, X, Loader2 } from "lucide-react";
import type { Task, TaskCategory } from "@/lib/schema";
import { CATEGORY_META, TASK_CATEGORIES } from "@/lib/schema";

type StatusFilter = "all" | "todo" | "in_progress" | "done";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All",         value: "all" },
  { label: "To Do",       value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "Done",        value: "done" },
];

function CategoryBadge({ category }: { category: string | null | undefined }) {
  if (!category || !(category in CATEGORY_META)) return null;
  const meta = CATEGORY_META[category as TaskCategory];
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{
        backgroundColor: meta.color + "20",
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high:   "text-red-500 bg-red-50",
    medium: "text-amber-600 bg-amber-50",
    low:    "text-stone-400 bg-stone-50",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[priority] || map.medium}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    todo:        "text-stone-500 bg-stone-100",
    in_progress: "text-nude-600 bg-nude-50",
    done:        "text-sage-600 bg-sage-50",
  };
  const labels: Record<string, string> = {
    todo: "To Do", in_progress: "In Progress", done: "Done",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "" as TaskCategory | "",
    dueDate: "",
  });

  async function loadTasks() {
    const data = await fetch("/api/tasks").then((r) => r.json());
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadTasks(); }, []);

  const filtered = tasks
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .filter((t) => categoryFilter === "all" || t.category === categoryFilter);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, category: form.category || null }),
    });
    setForm({ title: "", description: "", priority: "medium", category: "", dueDate: "" });
    setShowForm(false);
    setSaving(false);
    loadTasks();
  }

  async function cycleStatus(id: number, status: string) {
    const next =
      status === "todo" ? "in_progress" : status === "in_progress" ? "done" : "todo";
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    loadTasks();
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  }

  const countForStatus = (s: StatusFilter) =>
    s === "all" ? tasks.length : tasks.filter((t) => t.status === s).length;

  const countForCategory = (c: TaskCategory) =>
    tasks.filter((t) => t.category === c && (statusFilter === "all" || t.status === statusFilter)).length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Tasks</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {tasks.filter((t) => t.status !== "done").length} remaining
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800">New Task</h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={createTask} className="space-y-3">
            <input
              type="text"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              autoFocus
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Category */}
              <div className="col-span-2">
                <label className="text-xs text-stone-400 font-medium block mb-1">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, category: "" })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.category === ""
                        ? "bg-stone-700 text-white border-stone-700"
                        : "border-cream-300 text-stone-500 hover:bg-cream-50"
                    }`}
                  >
                    None
                  </button>
                  {TASK_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat })}
                        className="text-xs px-2.5 py-1 rounded-full border transition-all"
                        style={
                          active
                            ? { backgroundColor: meta.color, color: "white", borderColor: meta.color }
                            : { borderColor: meta.color + "60", color: meta.color, backgroundColor: meta.color + "10" }
                        }
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-stone-400 font-medium block mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as "low" | "medium" | "high" })}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="text-xs text-stone-400 font-medium block mb-1">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Create Task
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

      {/* Status tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-cream-200 p-1 w-fit shadow-sm mb-3">
        {STATUS_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === value
                ? "bg-nude-500 text-white"
                : "text-stone-500 hover:text-stone-700 hover:bg-cream-50"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-70">{countForStatus(value)}</span>
          </button>
        ))}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            categoryFilter === "all"
              ? "bg-stone-700 text-white border-stone-700"
              : "border-cream-300 text-stone-500 bg-white hover:bg-cream-50"
          }`}
        >
          All categories
        </button>
        {TASK_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const active = categoryFilter === cat;
          const count = countForCategory(cat);
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(active ? "all" : cat)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all flex items-center gap-1.5"
              style={
                active
                  ? { backgroundColor: meta.color, color: "white", borderColor: meta.color }
                  : {
                      borderColor: meta.color + "50",
                      color: meta.color,
                      backgroundColor: meta.color + "12",
                    }
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: active ? "white" : meta.color }}
              />
              {meta.label}
              <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-stone-300">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-cream-100 shadow-sm py-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">No tasks here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-cream-100 shadow-sm px-5 py-4 flex items-start gap-4 group"
              style={
                task.category && task.category in CATEGORY_META
                  ? { borderLeftWidth: 3, borderLeftColor: CATEGORY_META[task.category as TaskCategory].color }
                  : {}
              }
            >
              {/* Status toggle */}
              <button
                onClick={() => cycleStatus(task.id, task.status)}
                className="mt-0.5 flex-shrink-0"
                title="Cycle status"
              >
                {task.status === "done" ? (
                  <CheckCircle2 className="w-5 h-5 text-sage-400" />
                ) : task.status === "in_progress" ? (
                  <Circle className="w-5 h-5 text-nude-400 fill-nude-100" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-300 hover:text-nude-400 transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    task.status === "done" ? "text-stone-400 line-through" : "text-stone-800"
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{task.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <CategoryBadge category={task.category} />
                  {task.dueDate && (
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(task.dueDate), "MMM d")}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
