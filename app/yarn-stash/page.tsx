"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import {
  Plus, Trash2, ChevronLeft, Loader2, X, Upload, Package,
} from "lucide-react";
import type { YarnStash, CrochetProject } from "@/lib/schema";
import { YARN_WEIGHTS, YARN_WEIGHT_META } from "@/lib/schema";

type UsageRow = {
  id: number;
  yarnId: number;
  projectId: number | null;
  skeinsUsed: number;
  dateUsed: string;
  notes: string;
  projectName: string | null;
};

type WeightFilter = "all" | (typeof YARN_WEIGHTS)[number];

function YarnSwatch({ yarn, size = "lg" }: { yarn: Partial<YarnStash>; size?: "sm" | "lg" }) {
  const h = size === "lg" ? "h-44" : "h-36";
  return (
    <div
      className={`w-full ${h} relative overflow-hidden flex items-center justify-center`}
      style={{ backgroundColor: yarn.colorHex || "#c8a882" }}
    >
      {yarn.imageUrl ? (
        <img src={yarn.imageUrl} alt={yarn.name} className="w-full h-full object-cover" />
      ) : (
        <svg viewBox="0 0 64 64" className="w-14 h-14 opacity-25" fill="none">
          <circle cx="32" cy="32" r="22" stroke="white" strokeWidth="3" />
          <path d="M14 26 Q32 18 50 26" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M12 34 Q32 24 52 34" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M14 42 Q32 32 50 42" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M32 10 Q42 32 32 54" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M32 10 Q22 32 32 54" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

function WeightBadge({ weight }: { weight: string }) {
  const meta = YARN_WEIGHT_META[weight as keyof typeof YARN_WEIGHT_META];
  if (!meta) return null;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: meta.color, color: meta.textColor }}
    >
      {meta.label}
    </span>
  );
}

const EMPTY_FORM = {
  name: "",
  brand: "",
  colorway: "",
  weight: "worsted" as (typeof YARN_WEIGHTS)[number],
  fiber: "",
  yardage: "",
  grams: "",
  colorHex: "#c8a882",
  totalSkeins: "1",
  imageUrl: "",
  notes: "",
};

export default function YarnStashPage() {
  const [yarns, setYarns] = useState<YarnStash[]>([]);
  const [projects, setProjects] = useState<CrochetProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WeightFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);
  const [editing, setEditing] = useState<YarnStash | null>(null);
  const [editForm, setEditForm] = useState<Partial<YarnStash>>({});
  const editFormRef = useRef<Partial<YarnStash>>({});
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [usageForm, setUsageForm] = useState({ projectId: "", skeinsUsed: "1", dateUsed: format(new Date(), "yyyy-MM-dd"), notes: "" });
  const [usageSaving, setUsageSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [yarnData, projectData] = await Promise.all([
      fetch("/api/yarn-stash").then(r => r.json()),
      fetch("/api/crochet").then(r => r.json()),
    ]);
    setYarns(Array.isArray(yarnData) ? yarnData : []);
    setProjects(Array.isArray(projectData) ? projectData : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const loadUsage = useCallback(async (yarnId: number) => {
    const data = await fetch(`/api/yarn-usage?yarnId=${yarnId}`).then(r => r.json());
    setUsage(Array.isArray(data) ? data : []);
  }, []);

  const filtered = filter === "all" ? yarns : yarns.filter(y => y.weight === filter);

  const totalSkeins = yarns.reduce((s, y) => s + y.skeinsRemaining, 0);
  const totalYards = yarns.reduce((s, y) => s + (y.yardage ?? 0) * y.skeinsRemaining, 0);

  async function createYarn(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setFormSaving(true);
    await fetch("/api/yarn-stash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        yardage: form.yardage ? parseInt(form.yardage) : null,
        grams: form.grams ? parseInt(form.grams) : null,
        totalSkeins: parseFloat(form.totalSkeins) || 1,
      }),
    });
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
    setFormSaving(false);
    load();
  }

  function openEdit(yarn: YarnStash) {
    editFormRef.current = { ...yarn };
    setEditForm({ ...yarn });
    setEditing(yarn);
    setSaveStatus("idle");
    loadUsage(yarn.id);
    setUsageForm({ projectId: "", skeinsUsed: "1", dateUsed: format(new Date(), "yyyy-MM-dd"), notes: "" });
  }

  function handleEditChange(field: keyof YarnStash, value: string | number | null) {
    editFormRef.current = { ...editFormRef.current, [field]: value };
    setEditForm({ ...editFormRef.current });
    setSaveStatus("saving");
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!editing) return;
      await fetch(`/api/yarn-stash/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormRef.current),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 700);
  }

  async function uploadFile(file: File, isAdd = false) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      if (isAdd) {
        setForm(f => ({ ...f, imageUrl: data.url }));
      } else {
        handleEditChange("imageUrl", data.url);
      }
    } else {
      alert(data.error || "Upload failed. Paste an image URL instead.");
    }
  }

  async function deleteYarn() {
    if (!editing) return;
    if (!confirm("Delete this yarn from your stash?")) return;
    await fetch(`/api/yarn-stash/${editing.id}`, { method: "DELETE" });
    setEditing(null);
    load();
  }

  async function leaveEdit() {
    clearTimeout(saveTimeout.current);
    if (editing) {
      await fetch(`/api/yarn-stash/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormRef.current),
      });
    }
    setEditing(null);
    load();
  }

  async function logUsage(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setUsageSaving(true);
    await fetch("/api/yarn-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yarnId: editing.id,
        projectId: usageForm.projectId ? parseInt(usageForm.projectId) : null,
        skeinsUsed: parseFloat(usageForm.skeinsUsed) || 1,
        dateUsed: usageForm.dateUsed,
        notes: usageForm.notes,
      }),
    });
    setUsageForm({ projectId: "", skeinsUsed: "1", dateUsed: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setUsageSaving(false);
    loadUsage(editing.id);
    // Refresh yarn to update skeins_remaining in edit form
    const data = await fetch("/api/yarn-stash").then(r => r.json());
    const updated = (Array.isArray(data) ? data : []).find((y: YarnStash) => y.id === editing.id);
    if (updated) {
      editFormRef.current = { ...editFormRef.current, skeinsRemaining: updated.skeinsRemaining };
      setEditForm(f => ({ ...f, skeinsRemaining: updated.skeinsRemaining }));
    }
    setYarns(Array.isArray(data) ? data : []);
  }

  async function deleteUsage(id: number) {
    await fetch(`/api/yarn-usage/${id}`, { method: "DELETE" });
    loadUsage(editing!.id);
    const data = await fetch("/api/yarn-stash").then(r => r.json());
    const updated = (Array.isArray(data) ? data : []).find((y: YarnStash) => y.id === editing!.id);
    if (updated) {
      editFormRef.current = { ...editFormRef.current, skeinsRemaining: updated.skeinsRemaining };
      setEditForm(f => ({ ...f, skeinsRemaining: updated.skeinsRemaining }));
    }
    setYarns(Array.isArray(data) ? data : []);
  }

  // ── Detail / Edit view ────────────────────────────────────────────────────
  if (editing) {
    const weightMeta = YARN_WEIGHT_META[editForm.weight as keyof typeof YARN_WEIGHT_META];
    const totalYd = (editForm.yardage ?? 0) * (editForm.totalSkeins ?? 1);
    const remainYd = (editForm.yardage ?? 0) * (editForm.skeinsRemaining ?? 0);

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button onClick={leaveEdit} className="flex items-center gap-1.5 text-sm text-nude-600 hover:text-nude-800 font-medium">
            <ChevronLeft className="w-4 h-4" /> Back to stash
          </button>
          <button onClick={deleteYarn} className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          {/* Swatch / image */}
          <div className="relative">
            <YarnSwatch yarn={editForm} size="lg" />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploading ? "Uploading…" : "Upload photo"}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Name */}
            <input
              type="text"
              value={editForm.name || ""}
              onChange={e => handleEditChange("name", e.target.value)}
              className="w-full text-2xl font-bold text-stone-900 border-0 outline-none placeholder-stone-300 bg-transparent"
              placeholder="Yarn name"
            />

            {/* Brand + colorway */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Brand</label>
                <input
                  type="text"
                  value={editForm.brand || ""}
                  onChange={e => handleEditChange("brand", e.target.value)}
                  placeholder="Lion Brand, Paintbox…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Colorway</label>
                <input
                  type="text"
                  value={editForm.colorway || ""}
                  onChange={e => handleEditChange("colorway", e.target.value)}
                  placeholder="Dusty Rose, Sage Green…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
            </div>

            {/* Weight + fiber */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Weight</label>
                <select
                  value={editForm.weight || "worsted"}
                  onChange={e => handleEditChange("weight", e.target.value)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                >
                  {YARN_WEIGHTS.map(w => (
                    <option key={w} value={w}>{YARN_WEIGHT_META[w].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Fiber content</label>
                <input
                  type="text"
                  value={editForm.fiber || ""}
                  onChange={e => handleEditChange("fiber", e.target.value)}
                  placeholder="100% wool, 80/20 cotton…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
            </div>

            {/* Yardage + grams + skeins */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Yds/skein</label>
                <input
                  type="number" min="0"
                  value={editForm.yardage ?? ""}
                  onChange={e => handleEditChange("yardage", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="220"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">g/skein</label>
                <input
                  type="number" min="0"
                  value={editForm.grams ?? ""}
                  onChange={e => handleEditChange("grams", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="100"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Total skeins</label>
                <input
                  type="number" min="0" step="0.5"
                  value={editForm.totalSkeins ?? 1}
                  onChange={e => handleEditChange("totalSkeins", parseFloat(e.target.value) || 0)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Remaining</label>
                <input
                  type="number" min="0" step="0.5"
                  value={editForm.skeinsRemaining ?? 0}
                  onChange={e => handleEditChange("skeinsRemaining", parseFloat(e.target.value) || 0)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
            </div>

            {totalYd > 0 && (
              <div className="flex items-center gap-4 text-sm text-stone-500 bg-cream-50 rounded-xl px-4 py-3 border border-cream-200">
                <span><span className="font-semibold text-stone-700">{remainYd.toLocaleString()}</span> yds remaining</span>
                <span className="text-stone-300">·</span>
                <span><span className="font-semibold text-stone-700">{totalYd.toLocaleString()}</span> yds total</span>
              </div>
            )}

            {/* Color picker + image URL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editForm.colorHex || "#c8a882"}
                    onChange={e => handleEditChange("colorHex", e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border border-cream-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={editForm.colorHex || "#c8a882"}
                    onChange={e => handleEditChange("colorHex", e.target.value)}
                    className="flex-1 border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Image URL</label>
                <input
                  type="url"
                  value={editForm.imageUrl || ""}
                  onChange={e => handleEditChange("imageUrl", e.target.value)}
                  placeholder="https://…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Notes</label>
              <textarea
                value={editForm.notes || ""}
                onChange={e => handleEditChange("notes", e.target.value)}
                placeholder="Dye lot, where you bought it, care instructions…"
                rows={3}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none bg-white leading-relaxed"
              />
            </div>
          </div>

          <div className="px-6 py-3 border-t border-cream-200 bg-cream-50 flex items-center justify-end">
            <span className="text-xs">
              {saveStatus === "saving" && <span className="text-stone-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
              {saveStatus === "saved" && <span className="text-emerald-500 font-medium">Saved</span>}
            </span>
          </div>

          {/* Usage history */}
          <div className="px-6 pb-6 pt-2 border-t border-cream-100">
            <h3 className="text-sm font-semibold text-stone-600 mb-3 mt-4">Usage History</h3>
            {usage.length === 0 ? (
              <p className="text-sm text-stone-400 mb-4">No usage logged yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {usage.map(u => (
                  <div key={u.id} className="flex items-center gap-3 bg-cream-50 rounded-xl px-4 py-2.5 group border border-cream-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700">
                        {u.skeinsUsed} skein{u.skeinsUsed !== 1 ? "s" : ""}
                        {u.projectName && <span className="text-stone-400 font-normal"> · {u.projectName}</span>}
                      </p>
                      <p className="text-xs text-stone-400">{format(parseISO(u.dateUsed), "MMM d, yyyy")}{u.notes && ` · ${u.notes}`}</p>
                    </div>
                    <button
                      onClick={() => deleteUsage(u.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-sm font-semibold text-stone-600 mb-3">Log Usage</h3>
            <form onSubmit={logUsage} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Project (optional)</label>
                  <select
                    value={usageForm.projectId}
                    onChange={e => setUsageForm(f => ({ ...f, projectId: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  >
                    <option value="">No project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Skeins used</label>
                  <input
                    type="number" min="0.1" step="0.5"
                    value={usageForm.skeinsUsed}
                    onChange={e => setUsageForm(f => ({ ...f, skeinsUsed: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={usageForm.dateUsed}
                    onChange={e => setUsageForm(f => ({ ...f, dateUsed: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Note (optional)</label>
                  <input
                    type="text"
                    value={usageForm.notes}
                    onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Gauge swatch, sleeve..."
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={usageSaving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {usageSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Log usage
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Grid view ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Yarn Stash</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {yarns.length} yarn{yarns.length !== 1 ? "s" : ""} ·{" "}
            {totalSkeins.toLocaleString(undefined, { maximumFractionDigits: 1 })} skeins remaining
            {totalYards > 0 && ` · ${Math.round(totalYards).toLocaleString()} yds`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Yarn
        </button>
      </div>

      {/* Add yarn form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">New Yarn</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
          </div>
          <form onSubmit={createYarn} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-stone-500 mb-1 block">Yarn name *</label>
                <input
                  type="text" autoFocus required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Wool-Ease Thick & Quick"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Weight</label>
                <select
                  value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value as typeof form.weight }))}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                >
                  {YARN_WEIGHTS.map(w => (
                    <option key={w} value={w}>{YARN_WEIGHT_META[w].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Brand</label>
                <input
                  type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="Lion Brand"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Colorway</label>
                <input
                  type="text" value={form.colorway} onChange={e => setForm(f => ({ ...f, colorway: e.target.value }))}
                  placeholder="Dusty Rose"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Fiber content</label>
                <input
                  type="text" value={form.fiber} onChange={e => setForm(f => ({ ...f, fiber: e.target.value }))}
                  placeholder="100% wool"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Yds/skein</label>
                <input
                  type="number" min="0" value={form.yardage} onChange={e => setForm(f => ({ ...f, yardage: e.target.value }))}
                  placeholder="220"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">g/skein</label>
                <input
                  type="number" min="0" value={form.grams} onChange={e => setForm(f => ({ ...f, grams: e.target.value }))}
                  placeholder="100"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Total skeins</label>
                <input
                  type="number" min="0" step="0.5" value={form.totalSkeins} onChange={e => setForm(f => ({ ...f, totalSkeins: e.target.value }))}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color" value={form.colorHex} onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))}
                    className="w-10 h-9 rounded cursor-pointer border border-cream-300 p-0.5"
                  />
                  <span className="text-xs text-stone-400 font-mono">{form.colorHex}</span>
                </div>
              </div>
            </div>

            {/* Image upload / URL for add form */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-stone-500 mb-1 block">Image URL (optional)</label>
                <input
                  type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div className="pt-5">
                <input ref={addFileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], true)} />
                <button type="button" onClick={() => addFileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 border border-cream-300 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-cream-50 transition-colors">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload
                </button>
              </div>
            </div>

            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="h-24 w-24 object-cover rounded-xl border border-cream-200" />
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={formSaving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {formSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add to Stash
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weight filters */}
      <div className="flex gap-1 mb-5 bg-white rounded-lg border border-cream-200 p-1 w-fit shadow-sm flex-wrap">
        {(["all", ...YARN_WEIGHTS] as WeightFilter[]).map(w => (
          <button
            key={w}
            onClick={() => setFilter(w)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === w ? "bg-nude-500 text-white" : "text-stone-500 hover:text-stone-700 hover:bg-cream-100"
            }`}
          >
            {w === "all" ? "All" : YARN_WEIGHT_META[w].label}
            <span className="ml-1 opacity-60">
              {w === "all" ? yarns.length : yarns.filter(y => y.weight === w).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm py-20 text-center">
          <Package className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">No yarn here yet.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-nude-500 hover:text-nude-700 text-sm font-medium">
            Add your first skein
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(yarn => {
            const pct = yarn.totalSkeins > 0 ? (yarn.skeinsRemaining / yarn.totalSkeins) * 100 : 0;
            return (
              <div
                key={yarn.id}
                onClick={() => openEdit(yarn)}
                className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              >
                <YarnSwatch yarn={yarn} size="sm" />
                <div className="p-3">
                  <h3 className="font-semibold text-stone-800 text-sm truncate">{yarn.name}</h3>
                  {(yarn.brand || yarn.colorway) && (
                    <p className="text-xs text-stone-400 truncate mt-0.5">
                      {[yarn.brand, yarn.colorway].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <WeightBadge weight={yarn.weight} />
                  </div>
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-400">
                        {yarn.skeinsRemaining % 1 === 0 ? yarn.skeinsRemaining : yarn.skeinsRemaining.toFixed(1)}/
                        {yarn.totalSkeins % 1 === 0 ? yarn.totalSkeins : yarn.totalSkeins.toFixed(1)} skeins
                      </span>
                      {yarn.yardage && (
                        <span className="text-xs text-stone-400">{yarn.yardage}yds</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: yarn.colorHex || "#c8a882" }}
                      />
                    </div>
                  </div>
                  {yarn.fiber && (
                    <p className="text-[10px] text-stone-400 mt-1.5 truncate">{yarn.fiber}</p>
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
