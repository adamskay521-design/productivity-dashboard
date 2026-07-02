"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { format, parseISO, subDays } from "date-fns";
import { BookOpen, Plus, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { JournalEntry } from "@/lib/schema";

function formatDateLabel(dateStr: string) {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return format(parseISO(dateStr), "EEE, MMM d");
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  async function loadEntries() {
    const data = await fetch("/api/journal").then((r) => r.json());
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadEntries(); }, []);

  useEffect(() => {
    const entry = entries.find((e) => e.date === selectedDate);
    setContent(entry?.content ?? "");
    setSaved(false);
  }, [selectedDate, entries]);

  const saveEntry = useCallback(async (text: string) => {
    setSaving(true);
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, content: text }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadEntries();
  }, [selectedDate]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveEntry(val), 1200);
  }

  async function deleteEntry(date: string) {
    await fetch(`/api/journal/${date}`, { method: "DELETE" });
    if (date === selectedDate) {
      setContent("");
      setSelectedDate(todayStr);
    }
    loadEntries();
  }

  function newEntry() {
    setSelectedDate(todayStr);
  }

  const hasEntries = entries.length > 0;
  const currentEntry = entries.find((e) => e.date === selectedDate);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-cream-200 bg-cream-50 flex flex-col h-full">
        <div className="p-5 border-b border-cream-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-stone-800">Journal</h1>
              <p className="text-xs text-stone-400 mt-0.5">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
            </div>
            <button
              onClick={newEntry}
              className="w-8 h-8 rounded-full bg-nude-500 hover:bg-nude-600 text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Today entry (always show as option even if empty) */}
          {!entries.find((e) => e.date === todayStr) && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                selectedDate === todayStr
                  ? "bg-white border-r-2 border-nude-400"
                  : "hover:bg-cream-100"
              }`}
            >
              <p className="text-sm font-medium text-nude-600">Today</p>
              <p className="text-xs text-stone-400 mt-0.5 italic">Start writing…</p>
            </button>
          )}
          {entries.map((entry) => (
            <div
              key={entry.date}
              className={`relative group transition-colors ${
                selectedDate === entry.date
                  ? "bg-white border-r-2 border-nude-400"
                  : "hover:bg-cream-100"
              }`}
            >
              <button
                onClick={() => setSelectedDate(entry.date)}
                className="w-full text-left px-4 py-3"
              >
                <p className={`text-sm font-medium ${selectedDate === entry.date ? "text-stone-900" : "text-stone-700"}`}>
                  {formatDateLabel(entry.date)}
                </p>
                {entry.date !== todayStr && (
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {format(parseISO(entry.date), "MMMM d, yyyy")}
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                  {entry.content ? entry.content.trim().split("\n")[0].slice(0, 50) || "—" : "—"}
                </p>
              </button>
              <button
                onClick={() => deleteEntry(entry.date)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Date navigator */}
        <div className="p-4 border-t border-cream-200 flex items-center justify-between">
          <button
            onClick={() => {
              const d = parseISO(selectedDate);
              setSelectedDate(format(subDays(d, 1), "yyyy-MM-dd"));
            }}
            className="text-stone-400 hover:text-stone-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-stone-400 font-medium">
            {format(parseISO(selectedDate), "MMM d, yyyy")}
          </span>
          <button
            onClick={() => {
              const d = parseISO(selectedDate);
              const next = format(new Date(d.getTime() + 86400000), "yyyy-MM-dd");
              if (next <= todayStr) setSelectedDate(next);
            }}
            disabled={selectedDate >= todayStr}
            className="text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="px-10 py-6 border-b border-cream-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nude-400">
              {format(parseISO(selectedDate), "EEEE")}
            </p>
            <h2 className="font-serif text-2xl text-stone-900 mt-0.5">
              {format(parseISO(selectedDate), "MMMM d, yyyy")}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-300">
            {saving && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
            {saved && !saving && <span className="text-sage-500">Saved</span>}
            {content && !saving && !saved && (
              <button
                onClick={() => {
                  if (saveTimer.current) clearTimeout(saveTimer.current);
                  saveEntry(content);
                }}
                className="text-nude-400 hover:text-nude-600 font-medium"
              >
                Save now
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={handleChange}
              placeholder={`What's on your mind today?\n\nThis is your private space — no formatting, no pressure. Just write.`}
              className="w-full h-full min-h-[500px] text-stone-700 text-base leading-relaxed resize-none focus:outline-none placeholder:text-stone-300 font-sans"
              style={{ fontFamily: "var(--font-inter), system-ui" }}
            />
          )}
        </div>

        {!hasEntries && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <BookOpen className="w-12 h-12 text-stone-100 mb-4" />
            <p className="text-stone-300 text-sm">Your journal is empty — start writing above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
