"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Plus, Trash2, X, Loader2, ExternalLink, ChevronLeft, FileText } from "lucide-react";
import type { CrochetProject } from "@/lib/schema";

type Status = "all" | "wishlist" | "in_progress" | "completed" | "frogged";

const STATUS_META: Record<
  string,
  { label: string; color: string; textColor: string; bg: string; placeholderBg: string }
> = {
  wishlist:    { label: "Wishlist",    color: "#c9888c", textColor: "#8a4a50", bg: "#f8eced", placeholderBg: "#c9888c" },
  in_progress: { label: "In Progress", color: "#6fa8a3", textColor: "#2e6b67", bg: "#e4f2f0", placeholderBg: "#6fa8a3" },
  completed:   { label: "Completed",   color: "#5aaa66", textColor: "#2d6e3a", bg: "#e2f3e4", placeholderBg: "#5aaa66" },
  frogged:     { label: "Frogged 🐸",  color: "#c4b08a", textColor: "#6b5c40", bg: "#f5efe3", placeholderBg: "#c4b08a" },
};

const TABS: { label: string; value: Status }[] = [
  { label: "All", value: "all" },
  { label: "Wishlist", value: "wishlist" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Frogged", value: "frogged" },
];

const EMPTY_FORM = {
  name: "",
  status: "wishlist" as CrochetProject["status"],
  patternName: "",
  patternUrl: "",
  yarnBrand: "",
  yarnColor: "",
  hookSize: "",
  notes: "",
  progressPercent: 0,
  imageUrl: "",
};

function YarnPlaceholder({ status }: { status: string }) {
  const bg = STATUS_META[status]?.placeholderBg || STATUS_META.wishlist.placeholderBg;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bg }}>
      <svg viewBox="0 0 64 64" className="w-14 h-14 opacity-35" fill="none">
        <circle cx="32" cy="32" r="22" stroke="white" strokeWidth="3" />
        <path d="M14 26 Q32 18 50 26" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M12 34 Q32 24 52 34" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M14 42 Q32 32 50 42" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M32 10 Q42 32 32 54" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M32 10 Q22 32 32 54" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: meta.bg, color: meta.textColor }}
    >
      {meta.label}
    </span>
  );
}

export default function CrochetPage() {
  const [projects, setProjects] = useState<CrochetProject[]>([]);
  const [tab, setTab] = useState<Status>("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CrochetProject | null>(null);
  const [editForm, setEditForm] = useState<Partial<CrochetProject>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ref always holds the latest form values so the auto-save timeout never reads stale state
  const editFormRef = useRef<Partial<CrochetProject>>({});
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [form, setForm] = useState({ ...EMPTY_FORM });

  async function load() {
    const data = await fetch("/api/crochet").then((r) => r.json());
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = tab === "all" ? projects : projects.filter((p) => p.status === tab);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/crochet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
    setSaving(false);
    load();
  }

  function openEdit(project: CrochetProject) {
    const initial = { ...project };
    editFormRef.current = initial;
    setEditForm(initial);
    setEditing(project);
    setSaveStatus("idle");
  }

  function handleEditChange(field: keyof CrochetProject, value: string | number) {
    // keep ref in sync first — the timeout callback reads from ref, never from stale closure
    editFormRef.current = { ...editFormRef.current, [field]: value };
    setEditForm({ ...editFormRef.current });

    setSaveStatus("saving");
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!editing) return;
      await fetch(`/api/crochet/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormRef.current),
      });
      setSaveStatus("saved");
      // brief "saved" indicator, then go idle
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 600);
  }

  async function deleteProject(id: number) {
    if (editing?.id === id) setEditing(null);
    await fetch(`/api/crochet/${id}`, { method: "DELETE" });
    load();
  }

  async function leaveEdit() {
    clearTimeout(saveTimeout.current);
    // Flush any unsaved changes immediately before navigating away
    if (editing) {
      await fetch(`/api/crochet/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormRef.current),
      });
    }
    setEditing(null);
    load();
  }

  if (editing) {
    const meta = STATUS_META[editForm.status || "wishlist"];
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={leaveEdit}
            className="flex items-center gap-1.5 text-sm text-nude-600 hover:text-nude-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back to projects
          </button>
          <button
            onClick={() => deleteProject(editing.id)}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
          {/* Image header */}
          <div className="h-48 relative">
            {editForm.imageUrl ? (
              <img
                src={editForm.imageUrl}
                alt={editForm.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <YarnPlaceholder status={editForm.status || "wishlist"} />
            )}
            <div className="absolute bottom-3 right-3">
              <StatusBadge status={editForm.status || "wishlist"} />
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Name */}
            <input
              type="text"
              value={editForm.name || ""}
              onChange={(e) => handleEditChange("name", e.target.value)}
              className="w-full text-2xl font-bold text-stone-900 border-0 outline-none placeholder-stone-300 bg-transparent"
              placeholder="Project name"
            />

            {/* Status + progress */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                  Status
                </label>
                <select
                  value={editForm.status || "wishlist"}
                  onChange={(e) => handleEditChange("status", e.target.value)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm bg-cream-50 focus:outline-none focus:ring-2 focus:ring-nude-300"
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="frogged">Frogged 🐸</option>
                </select>
              </div>
              {(editForm.status === "in_progress" || editForm.status === "completed") && (
                <div className="flex-1">
                  <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                    Progress ({editForm.progressPercent ?? 0}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={editForm.progressPercent ?? 0}
                    onChange={(e) => handleEditChange("progressPercent", parseInt(e.target.value))}
                    className="w-full accent-nude-500"
                  />
                </div>
              )}
            </div>

            {/* Pattern */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                    Pattern Name
                  </label>
                  <input
                    type="text"
                    value={editForm.patternName || ""}
                    onChange={(e) => handleEditChange("patternName", e.target.value)}
                    placeholder="Pattern name"
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                    Pattern URL
                  </label>
                  <input
                    type="url"
                    value={editForm.patternUrl || ""}
                    onChange={(e) => handleEditChange("patternUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
              </div>
              {editForm.patternUrl && (
                <a
                  href={editForm.patternUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-nude-50 hover:bg-nude-100 border border-nude-200 text-nude-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.01] w-fit"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open pattern in new tab
                  {editForm.patternName && <span className="text-nude-400">· {editForm.patternName}</span>}
                </a>
              )}
            </div>

            {/* Yarn + hook */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                  Yarn Brand
                </label>
                <input
                  type="text"
                  value={editForm.yarnBrand || ""}
                  onChange={(e) => handleEditChange("yarnBrand", e.target.value)}
                  placeholder="Lion Brand..."
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                  Yarn Color
                </label>
                <input
                  type="text"
                  value={editForm.yarnColor || ""}
                  onChange={(e) => handleEditChange("yarnColor", e.target.value)}
                  placeholder="Dusty Rose..."
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                  Hook Size
                </label>
                <input
                  type="text"
                  value={editForm.hookSize || ""}
                  onChange={(e) => handleEditChange("hookSize", e.target.value)}
                  placeholder="5mm / H-8..."
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={editForm.imageUrl || ""}
                onChange={(e) => handleEditChange("imageUrl", e.target.value)}
                placeholder="https://..."
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                Notes
              </label>
              <textarea
                value={editForm.notes || ""}
                onChange={(e) => handleEditChange("notes", e.target.value)}
                placeholder="Row counts, modifications, where you left off..."
                rows={4}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none bg-white leading-relaxed"
              />
            </div>
          </div>

          <div className="px-6 py-3 border-t border-cream-200 bg-cream-50 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              Last saved {format(new Date(editing.updatedAt), "MMM d 'at' h:mm a")}
            </span>
            <span className="text-xs">
              {saveStatus === "saving" && (
                <span className="text-stone-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-emerald-500 font-medium">Saved</span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Crochet Projects</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""} ·{" "}
            {projects.filter((p) => p.status === "in_progress").length} in progress
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* New project form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-cream-300 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800">New Crochet Project</h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={createProject} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Project name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="flex-1 border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                autoFocus
                required
              />
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as CrochetProject["status"] })
                }
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              >
                <option value="wishlist">Wishlist</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="frogged">Frogged 🐸</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Pattern name"
                value={form.patternName}
                onChange={(e) => setForm({ ...form, patternName: e.target.value })}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <input
                type="text"
                placeholder="Yarn brand"
                value={form.yarnBrand}
                onChange={(e) => setForm({ ...form, yarnBrand: e.target.value })}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <input
                type="text"
                placeholder="Hook size (e.g. 5mm)"
                value={form.hookSize}
                onChange={(e) => setForm({ ...form, hookSize: e.target.value })}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Add Project
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

      {/* Pattern pages */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Pattern Pages</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/crochet/blooming-tee"
            className="flex items-center gap-3 bg-white border border-cream-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:border-nude-200 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-nude-50 border border-nude-100 flex items-center justify-center text-lg shrink-0">
              🌸
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 group-hover:text-nude-700 transition-colors">
                Blooming Tee
              </p>
              <p className="text-xs text-stone-400">Progress tracker · Filet chart</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-300 group-hover:text-nude-400 ml-2 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-lg border border-cream-200 p-1 w-fit shadow-sm flex-wrap">
        {TABS.map(({ label, value }) => {
          const count =
            value === "all"
              ? projects.length
              : projects.filter((p) => p.status === value).length;
          return (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                tab === value
                  ? "bg-nude-500 text-white"
                  : "text-stone-500 hover:text-stone-700 hover:bg-cream-100"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-300">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm py-16 text-center">
          <div className="text-5xl mb-3">🧶</div>
          <p className="text-stone-400 text-sm">No projects here yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const meta = STATUS_META[project.status];
            return (
              <div
                key={project.id}
                onClick={() => openEdit(project)}
                className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="h-40 relative">
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <YarnPlaceholder status={project.status} />
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={project.status} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-stone-800 text-sm mb-2 line-clamp-1">
                    {project.name}
                  </h3>

                  <div className="space-y-1 text-xs text-stone-400">
                    {project.patternName && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-stone-500">Pattern:</span>
                        <span className="truncate">{project.patternName}</span>
                        {project.patternUrl && (
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        )}
                      </div>
                    )}
                    {(project.yarnBrand || project.yarnColor) && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-stone-500">Yarn:</span>
                        <span className="truncate">
                          {[project.yarnBrand, project.yarnColor].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    )}
                    {project.hookSize && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-stone-500">Hook:</span>
                        <span>{project.hookSize}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(project.status === "in_progress" || project.status === "completed") &&
                    (project.progressPercent ?? 0) > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-stone-400">Progress</span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: meta.textColor }}
                          >
                            {project.progressPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${project.progressPercent}%`,
                              backgroundColor: meta.color,
                            }}
                          />
                        </div>
                      </div>
                    )}

                  {project.notes && (
                    <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                      {project.notes}
                    </p>
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
