"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, ChevronLeft, Loader2, X, Upload, Clapperboard, Star, Tv,
} from "lucide-react";
import type { Watchlist, MediaType, WatchStatus } from "@/lib/schema";
import { MEDIA_TYPES, WATCH_STATUSES, WATCH_STATUS_META } from "@/lib/schema";

type Filter = "all" | WatchStatus;

function Poster({ item, size = "lg" }: { item: Partial<Watchlist>; size?: "sm" | "lg" }) {
  const h = size === "lg" ? "h-64" : "aspect-[2/3]";
  return (
    <div className={`w-full ${h} relative overflow-hidden flex items-center justify-center bg-cream-100`}>
      {item.posterUrl ? (
        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
      ) : item.mediaType === "tv" ? (
        <Tv className="w-10 h-10 text-cream-300" />
      ) : (
        <Clapperboard className="w-10 h-10 text-cream-300" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = WATCH_STATUS_META[status as WatchStatus];
  if (!meta) return null;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: meta.color + "20", color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star
            className="w-5 h-5 transition-colors"
            fill={value && n <= value ? "#c9913a" : "none"}
            stroke={value && n <= value ? "#c9913a" : "#d4a872"}
          />
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  mediaType: "movie" as MediaType,
  posterUrl: "",
  status: "want_to_watch" as WatchStatus,
};

export default function WatchlistPage() {
  const [items, setItems] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);
  const [editing, setEditing] = useState<Watchlist | null>(null);
  const [editForm, setEditForm] = useState<Partial<Watchlist>>({});
  const editFormRef = useRef<Partial<Watchlist>>({});
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await fetch("/api/watchlist").then((r) => r.json());
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setFormSaving(true);
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
    setFormSaving(false);
    load();
  }

  function openEdit(item: Watchlist) {
    editFormRef.current = { ...item };
    setEditForm({ ...item });
    setEditing(item);
    setSaveStatus("idle");
  }

  function handleEditChange(field: keyof Watchlist, value: string | number | null) {
    editFormRef.current = { ...editFormRef.current, [field]: value };
    setEditForm({ ...editFormRef.current });
    setSaveStatus("saving");
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!editing) return;
      await fetch(`/api/watchlist/${editing.id}`, {
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
    fd.append("folder", "watchlist");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      if (isAdd) setForm((f) => ({ ...f, posterUrl: data.url }));
      else handleEditChange("posterUrl", data.url);
    } else {
      alert(data.error || "Upload failed. Paste an image URL instead.");
    }
  }

  async function deleteItem() {
    if (!editing) return;
    if (!confirm("Remove this from your watchlist?")) return;
    await fetch(`/api/watchlist/${editing.id}`, { method: "DELETE" });
    setEditing(null);
    load();
  }

  async function leaveEdit() {
    clearTimeout(saveTimeout.current);
    if (editing) {
      await fetch(`/api/watchlist/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormRef.current),
      });
    }
    setEditing(null);
    load();
  }

  if (editing) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button onClick={leaveEdit} className="flex items-center gap-1.5 text-sm text-nude-600 hover:text-nude-800 font-medium">
            <ChevronLeft className="w-4 h-4" /> Back to watchlist
          </button>
          <button onClick={deleteItem} className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="relative">
            <Poster item={editForm} size="lg" />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploading ? "Uploading…" : "Upload poster"}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <input
              type="text"
              value={editForm.title || ""}
              onChange={(e) => handleEditChange("title", e.target.value)}
              className="w-full text-2xl font-bold text-stone-900 border-0 outline-none placeholder-stone-300 bg-transparent"
              placeholder="Title"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Type</label>
                <div className="flex gap-2">
                  {MEDIA_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => handleEditChange("mediaType", t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        editForm.mediaType === t ? "bg-nude-500 text-white" : "bg-cream-50 text-stone-500 hover:bg-cream-100"
                      }`}
                    >
                      {t === "tv" ? "TV" : "Movie"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Status</label>
                <select
                  value={editForm.status || "want_to_watch"}
                  onChange={(e) => handleEditChange("status", e.target.value)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                >
                  {WATCH_STATUSES.map((s) => (
                    <option key={s} value={s}>{WATCH_STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Rating</label>
              <StarRating value={editForm.rating ?? null} onChange={(v) => handleEditChange("rating", v)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Poster URL</label>
              <input
                type="url"
                value={editForm.posterUrl || ""}
                onChange={(e) => handleEditChange("posterUrl", e.target.value)}
                placeholder="https://…"
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Notes</label>
              <textarea
                value={editForm.notes || ""}
                onChange={(e) => handleEditChange("notes", e.target.value)}
                placeholder="Thoughts, where to find it, who recommended it…"
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
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Watchlist</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {items.length} title{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Title
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">New Title</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
          </div>
          <form onSubmit={createItem} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-stone-500 mb-1 block">Title *</label>
                <input
                  type="text" autoFocus required
                  value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Movie or show name"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Type</label>
                <div className="flex gap-2">
                  {MEDIA_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm((f) => ({ ...f, mediaType: t }))}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        form.mediaType === t ? "bg-nude-500 text-white" : "bg-cream-50 text-stone-500 hover:bg-cream-100"
                      }`}
                    >
                      {t === "tv" ? "TV" : "Movie"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Status</label>
              <select
                value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as WatchStatus }))}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              >
                {WATCH_STATUSES.map((s) => (
                  <option key={s} value={s}>{WATCH_STATUS_META[s].label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="url" value={form.posterUrl} onChange={(e) => setForm((f) => ({ ...f, posterUrl: e.target.value }))}
                  placeholder="Poster URL (optional)"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <input ref={addFileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], true)} />
              <button type="button" onClick={() => addFileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 border border-cream-300 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-cream-50 transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload
              </button>
            </div>

            {form.posterUrl && (
              <img src={form.posterUrl} alt="preview" className="h-32 w-24 object-cover rounded-xl border border-cream-200" />
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={formSaving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {formSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add Title
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-1 mb-5 bg-white rounded-lg border border-cream-200 p-1 w-fit shadow-sm flex-wrap">
        {(["all", ...WATCH_STATUSES] as Filter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === s ? "bg-nude-500 text-white" : "text-stone-500 hover:text-stone-700 hover:bg-cream-100"
            }`}
          >
            {s === "all" ? "All" : WATCH_STATUS_META[s].label}
            <span className="ml-1 opacity-60">
              {s === "all" ? items.length : items.filter((x) => x.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm py-20 text-center">
          <Clapperboard className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Nothing here yet.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-nude-500 hover:text-nude-700 text-sm font-medium">
            Add your first title
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => openEdit(item)}
              className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            >
              <Poster item={item} size="sm" />
              <div className="p-3">
                <h3 className="font-semibold text-stone-800 text-sm line-clamp-2 mb-1">{item.title}</h3>
                <div className="flex items-center justify-between">
                  <StatusBadge status={item.status} />
                  {item.rating != null && (
                    <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                      <Star className="w-3 h-3" fill="#c9913a" stroke="#c9913a" /> {item.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
