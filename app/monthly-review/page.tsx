"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import type { MonthlyCloseoutItem } from "@/lib/schema";
import { CLOSEOUT_CATEGORIES, CLOSEOUT_CATEGORY_META } from "@/lib/schema";

function getMonth() {
  return format(new Date(), "yyyy-MM");
}

const EMPTY_REVIEW = {
  wins: "", lessons: "", checkIn: "", gratitude: "",
  theme: "", mantra: "", megaGoalFocus: "", miniGoalFocus: "", topProjects: "",
};

type ReviewFields = typeof EMPTY_REVIEW;

const RECAP_FIELDS: { key: keyof ReviewFields; label: string; placeholder: string }[] = [
  {
    key: "wins", label: "Wins & Milestones",
    placeholder: "What did I accomplish that I am proud of? Which Mega Goals did I make steps towards? Which Mini Goals did I hit or exceed?",
  },
  {
    key: "lessons", label: "Lessons Learned",
    placeholder: "What worked well for me this month? What didn't work or drained my energy? What can I do differently next time?",
  },
  {
    key: "checkIn", label: "Self Check-In",
    placeholder: "Mood/energy/mental state · physical health & fitness · relationships & connections · creativity & inspiration",
  },
  {
    key: "gratitude", label: "Closing Gratitude",
    placeholder: "3 things I'm deeply grateful for this month",
  },
];

const RESET_FIELDS: { key: keyof ReviewFields; label: string; placeholder: string }[] = [
  { key: "theme", label: "Theme of the Month", placeholder: "One word or phrase to set the tone" },
  { key: "mantra", label: "Quote / Mantra / Affirmation", placeholder: "Something to guide me this month" },
  {
    key: "megaGoalFocus", label: "Big Picture Alignment (Mega Goals)",
    placeholder: "Which mega goals to move closer to · picture executing the goal (major milestones along the way) · break the current milestone into action items · how to integrate into day-to-day",
  },
  {
    key: "miniGoalFocus", label: "Focused Achievements (Mini Goals)",
    placeholder: "Specific measurable mini goals this month · actions to schedule on calendar",
  },
  { key: "topProjects", label: "Top 3 Projects / Focus Areas for the Month", placeholder: "..." },
];

export default function MonthlyReviewPage() {
  const [month, setMonth] = useState(getMonth());
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<ReviewFields>({ ...EMPTY_REVIEW });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [closeout, setCloseout] = useState<MonthlyCloseoutItem[]>([]);

  const reviewFormRef = useRef<ReviewFields>({ ...EMPTY_REVIEW });
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const currentMonthRef = useRef(month);

  async function load(m: string) {
    setLoading(true);
    const [reviewData, closeoutData] = await Promise.all([
      fetch(`/api/monthly-review?month=${m}`).then((r) => r.json()),
      fetch(`/api/monthly-closeout?month=${m}`).then((r) => r.json()),
    ]);
    const next = { ...EMPTY_REVIEW, ...(reviewData ?? {}) };
    reviewFormRef.current = next;
    setReview(next);
    setCloseout(Array.isArray(closeoutData) ? closeoutData : []);
    setSaveStatus("idle");
    setLoading(false);
  }

  useEffect(() => {
    currentMonthRef.current = month;
    load(month);
  }, [month]);

  function handleFieldChange(key: keyof ReviewFields, value: string) {
    reviewFormRef.current = { ...reviewFormRef.current, [key]: value };
    setReview({ ...reviewFormRef.current });

    setSaveStatus("saving");
    clearTimeout(saveTimeout.current);
    const monthAtEdit = currentMonthRef.current;
    saveTimeout.current = setTimeout(async () => {
      await fetch("/api/monthly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthAtEdit, ...reviewFormRef.current }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 600);
  }

  async function toggleCloseoutItem(id: number, completed: boolean) {
    setCloseout((prev) => prev.map((i) => (i.id === id ? { ...i, completed } : i)));
    await fetch(`/api/monthly-closeout/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  }

  function changeMonth(dir: -1 | 1) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(format(d, "yyyy-MM"));
  }

  const monthLabel = format(parseISO(`${month}-01`), "MMMM yyyy");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Monthly Review</h1>
          <p className="text-stone-400 text-sm mt-0.5">Recap the month, reset intentions, close it out</p>
        </div>
        {saveStatus !== "idle" && (
          <span className="text-xs text-stone-400 flex items-center gap-1.5 mt-1">
            {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin" />}
            {saveStatus === "saving" ? "Saving…" : "Saved"}
          </span>
        )}
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg border border-cream-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-sm font-bold">‹</button>
        <span className="font-semibold text-stone-700 min-w-[140px] text-center">{monthLabel}</span>
        <button onClick={() => changeMonth(1)} disabled={month >= getMonth()} className="w-8 h-8 rounded-lg border border-cream-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors text-sm font-bold">›</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Monthly Recap */}
          <section className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">Monthly Recap</h2>
            <div className="space-y-4">
              {RECAP_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">{f.label}</label>
                  <textarea
                    value={review[f.key]}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none placeholder:text-stone-300"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* New Month Reset */}
          <section className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">New Month Reset</h2>
            <div className="space-y-4">
              {RESET_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">{f.label}</label>
                  <textarea
                    value={review[f.key]}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={f.key === "theme" || f.key === "mantra" ? 2 : 3}
                    className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none placeholder:text-stone-300"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Month-End Close-Out */}
          <section className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">Month-End Close-Out</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {CLOSEOUT_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <p className="text-sm font-semibold text-stone-700 mb-2">{CLOSEOUT_CATEGORY_META[cat].label}</p>
                  <div className="space-y-1.5">
                    {closeout.filter((i) => i.category === cat).map((item) => (
                      <label key={item.id} className="flex items-start gap-2 text-sm text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => toggleCloseoutItem(item.id, e.target.checked)}
                          className="mt-0.5 accent-nude-500"
                        />
                        <span className={item.completed ? "line-through text-stone-400" : ""}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
