"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const TABS = [
  {
    key: "tracker",
    label: "📋 Progress Tracker",
    src: "/blooming-tee-tracker.html",
    desc: "Track every section of your Blooming Tee — raglan increases, yoke chart, body rounds, neckline, and sleeves. Progress saves automatically.",
  },
  {
    key: "chart",
    label: "🗺️ Filet Chart",
    src: "/blooming-tee-chart.html",
    desc: "Interactive 60×70 filet chart. Tap any square to mark your position — row and column highlighted instantly.",
  },
];

export default function BloomingTeePage() {
  const [tab, setTab] = useState("tracker");
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-cream-200 px-6 py-3 flex items-center gap-4">
        <Link
          href="/crochet"
          className="flex items-center gap-1.5 text-sm text-nude-600 hover:text-nude-800 font-medium shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Crochet
        </Link>

        <div className="h-4 w-px bg-cream-200" />

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-stone-900 text-sm leading-tight">Blooming Tee</h1>
          <p className="text-stone-400 text-xs">{current.desc}</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-cream-50 border border-cream-200 rounded-xl p-1 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key
                  ? "bg-nude-500 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700 hover:bg-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* iframe — full remaining height */}
      <div className="flex-1 min-h-0">
        {TABS.map((t) => (
          <iframe
            key={t.key}
            src={t.src}
            className={`w-full h-full border-0 ${tab === t.key ? "block" : "hidden"}`}
            title={t.label}
          />
        ))}
      </div>
    </div>
  );
}
