"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Trash2, X, Loader2, FileText } from "lucide-react";
import type { Note } from "@/lib/schema";

// cycles through the earthy palette for note card accents
const NOTE_ACCENTS = ["#b89060", "#c9888c", "#6fa8a3", "#c9913a", "#7c5cba", "#3d8c6a"];

function noteColor(id: number) {
  return NOTE_ACCENTS[id % NOTE_ACCENTS.length];
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [form, setForm] = useState({ title: "", content: "" });
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  // ref keeps the latest values so the debounce callback never reads stale state
  const editFormRef = useRef({ title: "", content: "" });
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  async function load() {
    const data = await fetch("/api/notes").then((r) => r.json());
    setNotes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createNote(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", content: "" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  function openEdit(note: Note) {
    const initial = { title: note.title, content: note.content };
    editFormRef.current = initial;
    setEditForm(initial);
    setEditing(note);
    setSaveStatus("idle");
  }

  function handleEditChange(field: "title" | "content", value: string) {
    editFormRef.current = { ...editFormRef.current, [field]: value };
    setEditForm({ ...editFormRef.current });
    setSaveStatus("saving");
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!editing) return;
      await fetch(`/api/notes/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormRef.current),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 800);
  }

  async function deleteNote(id: number) {
    if (editing?.id === id) setEditing(null);
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    load();
  }

  function leaveEdit() {
    clearTimeout(saveTimeout.current);
    setEditing(null);
    load();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Notes</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* New note form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-stone-800">New Note</h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={createNote} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 font-medium"
              autoFocus
              required
            />
            <textarea
              placeholder="Write your note..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none"
              rows={4}
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Note
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

      {loading ? (
        <div className="flex items-center justify-center py-12 text-stone-300">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-xl border border-cream-100 shadow-sm py-16 text-center">
          <FileText className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">No notes yet. Write your first one!</p>
        </div>
      ) : editing ? (
        /* Edit view */
        <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div
            className="h-1 w-full"
            style={{ backgroundColor: noteColor(editing.id) }}
          />
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-100">
            <button
              onClick={leaveEdit}
              className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
            >
              ← Back to notes
            </button>
            <div className="flex items-center gap-3">
              {saveStatus === "saving" && (
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs text-sage-500 font-medium">Saved</span>
              )}
              <button
                onClick={() => deleteNote(editing.id)}
                className="text-stone-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => handleEditChange("title", e.target.value)}
              className="w-full text-xl font-semibold text-stone-900 border-0 outline-none mb-4 placeholder-stone-300 bg-transparent"
              placeholder="Untitled"
            />
            <textarea
              value={editForm.content}
              onChange={(e) => handleEditChange("content", e.target.value)}
              className="w-full text-sm text-stone-700 border-0 outline-none resize-none min-h-[400px] placeholder-stone-300 leading-relaxed bg-transparent"
              placeholder="Start writing..."
            />
          </div>
          <div className="px-6 py-3 border-t border-cream-100 text-xs text-stone-400 bg-cream-50">
            Updated {format(new Date(editing.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const accent = noteColor(note.id);
            return (
              <div
                key={note.id}
                className="bg-white rounded-xl border border-cream-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group relative"
                onClick={() => openEdit(note)}
              >
                {/* Colored top strip */}
                <div className="h-1" style={{ backgroundColor: accent }} />
                <div className="p-5">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h3 className="font-semibold text-stone-800 text-sm mb-2 pr-6 line-clamp-1">
                    {note.title}
                  </h3>
                  <p className="text-xs text-stone-400 line-clamp-4 leading-relaxed">
                    {note.content || "No content"}
                  </p>
                  <p className="text-xs text-stone-300 mt-3">
                    {format(new Date(note.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
