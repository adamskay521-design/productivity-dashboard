"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Loader2, X, Package, Sparkles } from "lucide-react";
import type { DeclutterArea } from "@/lib/schema";

const STATUS_META = {
  not_started: { label: "Not started", color: "#c4b08a", bg: "bg-cream-100", text: "text-stone-500" },
  in_progress:  { label: "In progress", color: "#6fa8a3", bg: "bg-sage-50",  text: "text-sage-700" },
  done:         { label: "Done! ✓",     color: "#5aaa66", bg: "bg-green-50", text: "text-green-700" },
};

const STATUS_CYCLE: Array<keyof typeof STATUS_META> = ["not_started", "in_progress", "done"];

const ROOM_EMOJIS: Record<string, string> = {
  bedroom: "🛏️",
  "living room": "🛋️",
  kitchen: "🍳",
  office: "💻",
  bathroom: "🚿",
  garage: "🚗",
  basement: "📦",
  attic: "🏠",
  "dining room": "🍽️",
};

function roomEmoji(room: string) {
  return ROOM_EMOJIS[room.toLowerCase()] ?? "🏠";
}

export default function DeclutterPage() {
  const [areas, setAreas] = useState<DeclutterArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ room: "", area: "", notes: "" });
  const [celebrate, setCelebrate] = useState(false);
  const saveTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  async function load() {
    const data = await fetch("/api/declutter").then((r) => r.json());
    setAreas(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createArea(e: React.FormEvent) {
    e.preventDefault();
    if (!form.room.trim()) return;
    setSaving(true);
    await fetch("/api/declutter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ room: "", area: "", notes: "" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function updateArea(id: number, updates: Partial<DeclutterArea>) {
    await fetch(`/api/declutter/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  function cycleStatus(area: DeclutterArea) {
    const idx = STATUS_CYCLE.indexOf(area.status as keyof typeof STATUS_META);
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const wasNotDone = area.status !== "done";
    const willBeDone = nextStatus === "done";

    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, status: nextStatus } : a));
    updateArea(area.id, { status: nextStatus });

    if (wasNotDone && willBeDone) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3000);
    }
  }

  function adjustItems(area: DeclutterArea, delta: number) {
    const newCount = Math.max(0, area.itemsCount + delta);
    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, itemsCount: newCount } : a));
    clearTimeout(saveTimeouts.current[area.id]);
    saveTimeouts.current[area.id] = setTimeout(() => {
      updateArea(area.id, { itemsCount: newCount });
    }, 600);
  }

  async function deleteArea(id: number) {
    await fetch(`/api/declutter/${id}`, { method: "DELETE" });
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }

  const totalItems = areas.reduce((s, a) => s + a.itemsCount, 0);
  const doneRooms = areas.filter((a) => a.status === "done").length;
  const inProgressRooms = areas.filter((a) => a.status === "in_progress").length;

  // Group by room
  const roomGroups: Record<string, DeclutterArea[]> = {};
  areas.forEach((a) => {
    if (!roomGroups[a.room]) roomGroups[a.room] = [];
    roomGroups[a.room].push(a);
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Celebration */}
      {celebrate && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-sage-300 rounded-2xl shadow-lg px-8 py-5 flex items-center gap-4 animate-bounce">
          <Sparkles className="w-8 h-8 text-sage-500" />
          <div>
            <p className="font-bold text-stone-900 text-lg">Room done! 🎉</p>
            <p className="text-stone-500 text-sm">Your space is getting clearer and calmer!</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Declutter Tracker</h1>
          <p className="text-stone-400 text-sm mt-0.5">Clear your space, clear your mind</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add room/area
        </button>
      </div>

      {/* Stats */}
      {areas.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-nude-600">{totalItems}</p>
            <p className="text-xs text-stone-400 mt-1">Items cleared out</p>
            {totalItems >= 10 && <p className="text-xs text-nude-400 mt-1 font-medium">Amazing work! 🎉</p>}
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-sage-600">{doneRooms}</p>
            <p className="text-xs text-stone-400 mt-1">Rooms complete</p>
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-stone-700">{inProgressRooms}</p>
            <p className="text-xs text-stone-400 mt-1">In progress</p>
          </div>
        </div>
      )}

      {/* Add area form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Add room or area</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
          </div>
          <form onSubmit={createArea} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Room</label>
                <input
                  type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  placeholder="Bedroom, Kitchen..." required autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Specific area (optional)</label>
                <input
                  type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  placeholder="Closet, Under bed..."
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Notes (optional)</label>
              <input
                type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                placeholder="What needs to happen here?"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add area
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-stone-500 hover:text-stone-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
        </div>
      ) : areas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-100 shadow-sm py-16 text-center">
          <Package className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Add rooms and areas to track your decluttering progress</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(roomGroups).map(([room, roomAreas]) => {
            const totalRoomItems = roomAreas.reduce((s, a) => s + a.itemsCount, 0);
            const doneCount = roomAreas.filter((a) => a.status === "done").length;
            const roomDone = doneCount === roomAreas.length;

            return (
              <div key={room} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                roomDone ? "border-sage-200" : "border-cream-200"
              }`}>
                {/* Room header */}
                <div className={`px-5 py-3 flex items-center justify-between ${roomDone ? "bg-sage-50" : "bg-cream-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{roomEmoji(room)}</span>
                    <div>
                      <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                        {room}
                        {roomDone && <span className="text-xs text-sage-600 font-medium">All done! ✓</span>}
                      </h3>
                      <p className="text-xs text-stone-400">{totalRoomItems} items cleared · {doneCount}/{roomAreas.length} areas complete</p>
                    </div>
                  </div>
                  {/* Overall room progress bar */}
                  <div className="w-24">
                    <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(doneCount / roomAreas.length) * 100}%`,
                          backgroundColor: roomDone ? "#5aaa66" : "#6fa8a3",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Area rows */}
                <div className="divide-y divide-cream-50">
                  {roomAreas.map((area) => {
                    const statusMeta = STATUS_META[area.status as keyof typeof STATUS_META];
                    return (
                      <div key={area.id} className="px-5 py-3.5 flex items-center gap-4">
                        {/* Status toggle */}
                        <button
                          onClick={() => cycleStatus(area)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95 shrink-0 ${statusMeta.bg} ${statusMeta.text}`}
                          title="Click to cycle status"
                        >
                          {statusMeta.label}
                        </button>

                        {/* Area name */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium text-stone-700 ${area.status === "done" ? "line-through text-stone-400" : ""}`}>
                            {area.area || room}
                          </p>
                          {area.notes && <p className="text-xs text-stone-400 mt-0.5">{area.notes}</p>}
                        </div>

                        {/* Item counter */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => adjustItems(area, -1)} disabled={area.itemsCount === 0}
                            className="w-7 h-7 rounded-lg bg-cream-100 hover:bg-cream-200 disabled:opacity-40 text-stone-600 text-sm font-bold transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
                          >−</button>
                          <span className="text-sm font-semibold text-stone-700 w-8 text-center">{area.itemsCount}</span>
                          <button
                            onClick={() => adjustItems(area, 1)}
                            className="w-7 h-7 rounded-lg bg-nude-100 hover:bg-nude-200 text-nude-700 text-sm font-bold transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
                          >+</button>
                          <span className="text-xs text-stone-300 w-12">items</span>
                        </div>

                        <button onClick={() => deleteArea(area.id)}
                          className="text-stone-200 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
