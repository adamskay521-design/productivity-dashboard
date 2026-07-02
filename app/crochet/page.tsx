"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import {
  Plus, Trash2, X, Loader2, ExternalLink, ChevronLeft, FileText,
  Minus, Upload, Images, LayoutGrid,
} from "lucide-react";
import type { CrochetProject, YarnStash, CraftType, NeedleType, ProjectJournalEntry, GaugeSwatch } from "@/lib/schema";
import { CRAFT_TYPES, CRAFT_TYPE_META, NEEDLE_TYPES, NEEDLE_TYPE_META } from "@/lib/schema";

type Status = "all" | "wishlist" | "in_progress" | "completed" | "frogged";

function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(",").map(t => t.trim()).filter(Boolean);
}

const CRAFT_TABS: { label: string; value: "all" | CraftType }[] = [
  { label: "All Crafts", value: "all" },
  ...CRAFT_TYPES.map(c => ({ label: CRAFT_TYPE_META[c].label, value: c })),
];

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
  craftType: "crochet" as CraftType,
  patternName: "",
  patternUrl: "",
  yarnBrand: "",
  yarnColor: "",
  hookSize: "",
  needleSize: "",
  needleType: "" as NeedleType | "",
  tags: "",
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
  const [stashYarns, setStashYarns] = useState<YarnStash[]>([]);
  const [projectUsage, setProjectUsage] = useState<{
    id: number; yarnId: number; skeinsUsed: number; dateUsed: string; notes: string;
    yarnName: string | null; yarnBrand: string | null; yarnColorway: string | null; yarnColorHex: string | null;
  }[]>([]);
  const [usageForm, setUsageForm] = useState({ yarnId: "", skeinsUsed: "1", dateUsed: format(new Date(), "yyyy-MM-dd"), notes: "" });
  const [usageSaving, setUsageSaving] = useState(false);

  const [journalEntries, setJournalEntries] = useState<ProjectJournalEntry[]>([]);
  const [journalForm, setJournalForm] = useState({ entryDate: format(new Date(), "yyyy-MM-dd"), content: "", photoUrl: "", minutesSpent: "" });
  const [journalSaving, setJournalSaving] = useState(false);
  const [journalUploading, setJournalUploading] = useState(false);
  const journalFileInputRef = useRef<HTMLInputElement>(null);

  const [gaugeSwatchList, setGaugeSwatchList] = useState<GaugeSwatch[]>([]);
  const [gaugeForm, setGaugeForm] = useState({ swatchDate: format(new Date(), "yyyy-MM-dd"), stitchesPer4In: "", rowsPer4In: "", hookNeedleSize: "", notes: "" });
  const [gaugeSaving, setGaugeSaving] = useState(false);

  const [craftTab, setCraftTab] = useState<"all" | CraftType>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");

  // ref always holds the latest form values so the auto-save timeout never reads stale state
  const editFormRef = useRef<Partial<CrochetProject>>({});
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [form, setForm] = useState({ ...EMPTY_FORM });

  async function load() {
    const [projectData, stashData] = await Promise.all([
      fetch("/api/crochet").then(r => r.json()),
      fetch("/api/yarn-stash").then(r => r.json()),
    ]);
    setProjects(Array.isArray(projectData) ? projectData : []);
    setStashYarns(Array.isArray(stashData) ? stashData : []);
    setLoading(false);
  }

  const loadProjectUsage = useCallback(async (projectId: number) => {
    const data = await fetch(`/api/yarn-usage?projectId=${projectId}`).then(r => r.json());
    setProjectUsage(Array.isArray(data) ? data : []);
  }, []);

  const loadJournalEntries = useCallback(async (projectId: number) => {
    const data = await fetch(`/api/journal-entries?projectId=${projectId}`).then(r => r.json());
    setJournalEntries(Array.isArray(data) ? data : []);
  }, []);

  const loadGaugeSwatches = useCallback(async (projectId: number) => {
    const data = await fetch(`/api/gauge-swatches?projectId=${projectId}`).then(r => r.json());
    setGaugeSwatchList(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, []);

  const allTags = Array.from(new Set(projects.flatMap(p => splitTags(p.tags)))).sort();

  const filtered = projects.filter(p =>
    (tab === "all" || p.status === tab) &&
    (craftTab === "all" || p.craftType === craftTab) &&
    (!tagFilter || splitTags(p.tags).includes(tagFilter))
  );

  const galleryProjects = projects.filter(p => p.status === "completed");

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
    setUsageForm({ yarnId: "", skeinsUsed: "1", dateUsed: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setJournalForm({ entryDate: format(new Date(), "yyyy-MM-dd"), content: "", photoUrl: "", minutesSpent: "" });
    setGaugeForm({ swatchDate: format(new Date(), "yyyy-MM-dd"), stitchesPer4In: "", rowsPer4In: "", hookNeedleSize: "", notes: "" });
    loadProjectUsage(project.id);
    loadJournalEntries(project.id);
    loadGaugeSwatches(project.id);
  }

  async function uploadJournalPhoto(file: File) {
    setJournalUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "journal");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setJournalUploading(false);
    if (data.url) setJournalForm(f => ({ ...f, photoUrl: data.url }));
    else alert(data.error || "Upload failed. Paste an image URL instead.");
  }

  async function addJournalEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!journalForm.content.trim() && !journalForm.photoUrl.trim()) return;
    setJournalSaving(true);
    await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: editing.id,
        entryDate: journalForm.entryDate,
        content: journalForm.content,
        photoUrl: journalForm.photoUrl,
        minutesSpent: journalForm.minutesSpent ? parseInt(journalForm.minutesSpent) : null,
      }),
    });
    setJournalForm({ entryDate: format(new Date(), "yyyy-MM-dd"), content: "", photoUrl: "", minutesSpent: "" });
    setJournalSaving(false);
    loadJournalEntries(editing.id);
  }

  async function deleteJournalEntry(id: number) {
    if (!editing) return;
    await fetch(`/api/journal-entries/${id}`, { method: "DELETE" });
    loadJournalEntries(editing.id);
  }

  async function addGaugeSwatch(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setGaugeSaving(true);
    await fetch("/api/gauge-swatches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: editing.id,
        swatchDate: gaugeForm.swatchDate,
        stitchesPer4In: gaugeForm.stitchesPer4In ? parseInt(gaugeForm.stitchesPer4In) : null,
        rowsPer4In: gaugeForm.rowsPer4In ? parseInt(gaugeForm.rowsPer4In) : null,
        hookNeedleSize: gaugeForm.hookNeedleSize,
        notes: gaugeForm.notes,
      }),
    });
    setGaugeForm({ swatchDate: format(new Date(), "yyyy-MM-dd"), stitchesPer4In: "", rowsPer4In: "", hookNeedleSize: "", notes: "" });
    setGaugeSaving(false);
    loadGaugeSwatches(editing.id);
  }

  async function deleteGaugeSwatch(id: number) {
    if (!editing) return;
    await fetch(`/api/gauge-swatches/${id}`, { method: "DELETE" });
    loadGaugeSwatches(editing.id);
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

            {/* Craft type + Status + progress */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                  Craft
                </label>
                <select
                  value={editForm.craftType || "crochet"}
                  onChange={(e) => handleEditChange("craftType", e.target.value)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm bg-cream-50 focus:outline-none focus:ring-2 focus:ring-nude-300"
                >
                  {CRAFT_TYPES.map(c => (
                    <option key={c} value={c}>{CRAFT_TYPE_META[c].label}</option>
                  ))}
                </select>
              </div>
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

            {/* Row / Round counter */}
            <div className="flex items-center justify-between bg-cream-50 border border-cream-200 rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                {editForm.craftType === "knitting" ? "Round" : "Row"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleEditChange("currentRow", Math.max(0, (editForm.currentRow ?? 0) - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-cream-300 text-stone-500 hover:bg-cream-100 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-lg font-semibold text-stone-800 w-8 text-center">{editForm.currentRow ?? 0}</span>
                <button
                  type="button"
                  onClick={() => handleEditChange("currentRow", (editForm.currentRow ?? 0) + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-cream-300 text-stone-500 hover:bg-cream-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
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

            {/* Yarn + hook/needle */}
            <div className={`grid gap-4 ${editForm.craftType === "knitting" ? "grid-cols-4" : "grid-cols-3"}`}>
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
              {editForm.craftType === "knitting" ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                      Needle Size
                    </label>
                    <input
                      type="text"
                      value={editForm.needleSize || ""}
                      onChange={(e) => handleEditChange("needleSize", e.target.value)}
                      placeholder="US 7 / 4.5mm..."
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                      Needle Type
                    </label>
                    <select
                      value={editForm.needleType || ""}
                      onChange={(e) => handleEditChange("needleType", e.target.value)}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    >
                      <option value="">—</option>
                      {NEEDLE_TYPES.map(nt => (
                        <option key={nt} value={nt}>{NEEDLE_TYPE_META[nt].label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
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
              )}
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
                placeholder="Modifications, where you left off..."
                rows={4}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none bg-white leading-relaxed"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">
                Tags
              </label>
              <input
                type="text"
                value={editForm.tags || ""}
                onChange={(e) => handleEditChange("tags", e.target.value)}
                placeholder="sweater, gift, amigurumi..."
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              />
              {splitTags(editForm.tags).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {splitTags(editForm.tags).map(t => (
                    <span key={t} className="text-xs font-medium px-2 py-0.5 rounded-full bg-nude-50 text-nude-700 border border-nude-100">
                      {t}
                    </span>
                  ))}
                </div>
              )}
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

          {/* Journal */}
          <div className="px-6 pb-6 pt-2 border-t border-cream-100">
            <h3 className="text-sm font-semibold text-stone-600 mt-4 mb-3">Journal</h3>
            {journalEntries.length === 0 ? (
              <p className="text-sm text-stone-400 mb-4">No journal entries yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {journalEntries.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 group border border-cream-100 bg-cream-50">
                    {entry.photoUrl && (
                      <img src={entry.photoUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-400">
                        {format(parseISO(entry.entryDate), "MMM d, yyyy")}
                        {entry.minutesSpent != null && ` · ${entry.minutesSpent} min`}
                      </p>
                      {entry.content && (
                        <p className="text-sm text-stone-700 whitespace-pre-wrap">{entry.content}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteJournalEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={addJournalEntry} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={journalForm.entryDate}
                    onChange={e => setJournalForm(f => ({ ...f, entryDate: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Minutes spent (optional)</label>
                  <input
                    type="number" min="0"
                    value={journalForm.minutesSpent}
                    onChange={e => setJournalForm(f => ({ ...f, minutesSpent: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
              </div>
              <textarea
                value={journalForm.content}
                onChange={e => setJournalForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Row counts, what you worked on, where you left off..."
                rows={2}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none bg-white"
              />
              <div className="flex items-center gap-3">
                <input
                  ref={journalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && uploadJournalPhoto(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => journalFileInputRef.current?.click()}
                  disabled={journalUploading}
                  className="flex items-center gap-1.5 border border-cream-300 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-cream-50 transition-colors"
                >
                  {journalUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Photo
                </button>
                {journalForm.photoUrl && (
                  <img src={journalForm.photoUrl} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
                )}
                <button
                  type="submit"
                  disabled={journalSaving || (!journalForm.content.trim() && !journalForm.photoUrl.trim())}
                  className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ml-auto"
                >
                  {journalSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Entry
                </button>
              </div>
            </form>
          </div>

          {/* Gauge Swatches */}
          <div className="px-6 pb-6 pt-2 border-t border-cream-100">
            <h3 className="text-sm font-semibold text-stone-600 mt-4 mb-3">Gauge Swatches</h3>
            {gaugeSwatchList.length === 0 ? (
              <p className="text-sm text-stone-400 mb-4">No gauge swatches logged yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {gaugeSwatchList.map(sw => (
                  <div key={sw.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 group border border-cream-100 bg-cream-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700">
                        {sw.stitchesPer4In != null && `${sw.stitchesPer4In} sts`}
                        {sw.stitchesPer4In != null && sw.rowsPer4In != null && " × "}
                        {sw.rowsPer4In != null && `${sw.rowsPer4In} rows`}
                        {(sw.stitchesPer4In != null || sw.rowsPer4In != null) && " per 4in"}
                        {sw.hookNeedleSize && <span className="text-stone-400 font-normal"> · {sw.hookNeedleSize}</span>}
                      </p>
                      <p className="text-xs text-stone-400">
                        {format(parseISO(sw.swatchDate), "MMM d, yyyy")}{sw.notes && ` · ${sw.notes}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteGaugeSwatch(sw.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={addGaugeSwatch} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={gaugeForm.swatchDate}
                    onChange={e => setGaugeForm(f => ({ ...f, swatchDate: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Stitches / 4in</label>
                  <input
                    type="number" min="0"
                    value={gaugeForm.stitchesPer4In}
                    onChange={e => setGaugeForm(f => ({ ...f, stitchesPer4In: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Rows / 4in</label>
                  <input
                    type="number" min="0"
                    value={gaugeForm.rowsPer4In}
                    onChange={e => setGaugeForm(f => ({ ...f, rowsPer4In: e.target.value }))}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Hook/needle size used"
                  value={gaugeForm.hookNeedleSize}
                  onChange={e => setGaugeForm(f => ({ ...f, hookNeedleSize: e.target.value }))}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={gaugeForm.notes}
                  onChange={e => setGaugeForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <button
                type="submit" disabled={gaugeSaving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {gaugeSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Log Swatch
              </button>
            </form>
          </div>

          {/* Yarn from Stash */}
          <div className="px-6 pb-6 pt-2 border-t border-cream-100">
            <h3 className="text-sm font-semibold text-stone-600 mt-4 mb-3">Yarn from Stash</h3>
            {projectUsage.length === 0 ? (
              <p className="text-sm text-stone-400 mb-4">No stash yarn linked yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {projectUsage.map(u => (
                  <div key={u.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 group border border-cream-100 bg-cream-50">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 border border-white/60 shadow-sm"
                      style={{ backgroundColor: u.yarnColorHex || "#c8a882" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">
                        {u.yarnName || "Unknown yarn"}
                        {u.yarnBrand && <span className="text-stone-400 font-normal"> · {u.yarnBrand}</span>}
                      </p>
                      <p className="text-xs text-stone-400">
                        {u.skeinsUsed} skein{u.skeinsUsed !== 1 ? "s" : ""} · {format(parseISO(u.dateUsed), "MMM d, yyyy")}
                        {u.notes && ` · ${u.notes}`}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch(`/api/yarn-usage/${u.id}`, { method: "DELETE" });
                        loadProjectUsage(editing.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {stashYarns.length > 0 && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!usageForm.yarnId) return;
                  setUsageSaving(true);
                  await fetch("/api/yarn-usage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      yarnId: parseInt(usageForm.yarnId),
                      projectId: editing.id,
                      skeinsUsed: parseFloat(usageForm.skeinsUsed) || 1,
                      dateUsed: usageForm.dateUsed,
                      notes: usageForm.notes,
                    }),
                  });
                  setUsageForm({ yarnId: "", skeinsUsed: "1", dateUsed: format(new Date(), "yyyy-MM-dd"), notes: "" });
                  setUsageSaving(false);
                  loadProjectUsage(editing.id);
                  const stashData = await fetch("/api/yarn-stash").then(r => r.json());
                  setStashYarns(Array.isArray(stashData) ? stashData : []);
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Select yarn from stash</label>
                    <select
                      value={usageForm.yarnId}
                      onChange={e => setUsageForm(f => ({ ...f, yarnId: e.target.value }))}
                      required
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    >
                      <option value="">Choose yarn…</option>
                      {stashYarns.map(y => (
                        <option key={y.id} value={y.id}>
                          {y.name}{y.colorway ? ` (${y.colorway})` : ""} — {y.skeinsRemaining} left
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Skeins used</label>
                    <input
                      type="number" min="0.1" step="0.5" required
                      value={usageForm.skeinsUsed}
                      onChange={e => setUsageForm(f => ({ ...f, skeinsUsed: e.target.value }))}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Date used</label>
                    <input
                      type="date" required
                      value={usageForm.dateUsed}
                      onChange={e => setUsageForm(f => ({ ...f, dateUsed: e.target.value }))}
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Note (optional)</label>
                    <input
                      type="text"
                      value={usageForm.notes}
                      onChange={e => setUsageForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Body, sleeves..."
                      className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={usageSaving || !usageForm.yarnId}
                  className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {usageSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Mark yarn used
                </button>
              </form>
            )}

            {stashYarns.length === 0 && (
              <p className="text-sm text-stone-400">
                <a href="/yarn-stash" className="text-nude-500 hover:underline">Add yarn to your stash</a> to link it here.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Crochet & Knitting</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""} ·{" "}
            {projects.filter((p) => p.status === "in_progress").length} in progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white rounded-lg border border-cream-200 p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              title="Project list"
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-nude-500 text-white" : "text-stone-400 hover:text-stone-600 hover:bg-cream-100"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("gallery")}
              title="Finished object gallery"
              className={`p-1.5 rounded-md transition-colors ${viewMode === "gallery" ? "bg-nude-500 text-white" : "text-stone-400 hover:text-stone-600 hover:bg-cream-100"}`}
            >
              <Images className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
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
                value={form.craftType}
                onChange={(e) => setForm({ ...form, craftType: e.target.value as CraftType })}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              >
                {CRAFT_TYPES.map(c => (
                  <option key={c} value={c}>{CRAFT_TYPE_META[c].label}</option>
                ))}
              </select>
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
              {form.craftType === "knitting" ? (
                <input
                  type="text"
                  placeholder="Needle size (e.g. US 7)"
                  value={form.needleSize}
                  onChange={(e) => setForm({ ...form, needleSize: e.target.value })}
                  className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Hook size (e.g. 5mm)"
                  value={form.hookSize}
                  onChange={(e) => setForm({ ...form, hookSize: e.target.value })}
                  className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              )}
            </div>
            {form.craftType === "knitting" && (
              <select
                value={form.needleType}
                onChange={(e) => setForm({ ...form, needleType: e.target.value as NeedleType | "" })}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              >
                <option value="">Needle type (optional)</option>
                {NEEDLE_TYPES.map(nt => (
                  <option key={nt} value={nt}>{NEEDLE_TYPE_META[nt].label}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
            />
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

      {viewMode === "list" ? (
        <>
          {/* Status tabs */}
          <div className="flex gap-1 mb-3 bg-white rounded-lg border border-cream-200 p-1 w-fit shadow-sm flex-wrap">
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

          {/* Craft type tabs */}
          <div className="flex gap-1 mb-3 bg-white rounded-lg border border-cream-200 p-1 w-fit shadow-sm flex-wrap">
            {CRAFT_TABS.map(({ label, value }) => {
              const count =
                value === "all" ? projects.length : projects.filter((p) => p.craftType === value).length;
              return (
                <button
                  key={value}
                  onClick={() => setCraftTab(value)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    craftTab === value
                      ? "bg-nude-500 text-white"
                      : "text-stone-500 hover:text-stone-700 hover:bg-cream-100"
                  }`}
                >
                  {label}
                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Tag filter chips */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {allTags.map(t => (
                <button
                  key={t}
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    tagFilter === t
                      ? "bg-nude-500 border-nude-500 text-white"
                      : "bg-white border-cream-200 text-stone-500 hover:border-nude-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

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
                const projectTags = splitTags(project.tags);
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
                      <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                        <span
                          className="text-[10px] font-semibold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: CRAFT_TYPE_META[project.craftType as CraftType]?.color }}
                        >
                          {CRAFT_TYPE_META[project.craftType as CraftType]?.label}
                        </span>
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
                        {project.craftType === "knitting" ? (
                          project.needleSize && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-stone-500">Needle:</span>
                              <span>
                                {project.needleSize}
                                {project.needleType && ` (${NEEDLE_TYPE_META[project.needleType as NeedleType].label})`}
                              </span>
                            </div>
                          )
                        ) : (
                          project.hookSize && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-stone-500">Hook:</span>
                              <span>{project.hookSize}</span>
                            </div>
                          )
                        )}
                        {project.currentRow > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-stone-500">
                              {project.craftType === "knitting" ? "Round:" : "Row:"}
                            </span>
                            <span>{project.currentRow}</span>
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

                      {projectTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {projectTags.slice(0, 3).map(t => (
                            <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-nude-50 text-nude-700 border border-nude-100">
                              {t}
                            </span>
                          ))}
                          {projectTags.length > 3 && (
                            <span className="text-[10px] text-stone-400">+{projectTags.length - 3} more</span>
                          )}
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
        </>
      ) : (
        <>
          {/* Finished Object Gallery */}
          {galleryProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm py-16 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-stone-400 text-sm">No finished objects yet — completed projects will show up here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => openEdit(project)}
                  className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-square relative">
                    {project.imageUrl ? (
                      <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <YarnPlaceholder status={project.status} />
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className="text-[10px] font-semibold px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: CRAFT_TYPE_META[project.craftType as CraftType]?.color }}
                      >
                        {CRAFT_TYPE_META[project.craftType as CraftType]?.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-stone-800 text-sm line-clamp-1">{project.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
