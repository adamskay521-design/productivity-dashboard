"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

type Mode = "focus" | "short" | "long";

const MODES: { key: Mode; label: string; minutes: number }[] = [
  { key: "focus", label: "Focus",       minutes: 25 },
  { key: "short", label: "Short Break", minutes: 5  },
  { key: "long",  label: "Long Break",  minutes: 15 },
];

const MODE_COLORS: Record<Mode, { ring: string; accent: string; bg: string; bgLight: string }> = {
  focus: { ring: "#b89060", accent: "text-nude-500", bg: "bg-nude-500", bgLight: "bg-nude-50"  },
  short: { ring: "#6fa8a3", accent: "text-sage-500",  bg: "bg-sage-400",  bgLight: "bg-sage-50"  },
  long:  { ring: "#c9888c", accent: "text-drose-500", bg: "bg-drose-500", bgLight: "bg-drose-50" },
};

const TIPS: Record<Mode, { headline: string; body: string }> = {
  focus: { headline: "Stay focused",        body: "Close distracting tabs. One task at a time."            },
  short: { headline: "Short break",         body: "Step away, stretch, and breathe. You earned it."        },
  long:  { headline: "Long break",          body: "Rest properly — walk around, get water, relax your eyes." },
};

export default function FocusPage() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const totalSeconds = MODES.find((m) => m.key === mode)!.minutes * 60;
  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const colors = MODE_COLORS[mode];

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSecondsLeft(MODES.find((m) => m.key === mode)!.minutes * 60);
  }, [mode]);

  function switchMode(m: Mode) {
    clearInterval(intervalRef.current);
    setRunning(false);
    setMode(m);
    setSecondsLeft(MODES.find((x) => x.key === m)!.minutes * 60);
  }

  function skip() {
    clearInterval(intervalRef.current);
    setRunning(false);
    if (mode === "focus") {
      setSessions((s) => s + 1);
      const next = sessions > 0 && (sessions + 1) % 4 === 0 ? "long" : "short";
      switchMode(next);
    } else {
      switchMode("focus");
    }
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "focus") {
              setSessions((prev) => prev + 1);
              const next = (sessions + 1) % 4 === 0 ? "long" : "short";
              switchMode(next);
            } else {
              switchMode("focus");
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  useEffect(() => { reset(); }, [mode]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const tip = TIPS[mode];

  return (
    <div className="p-8 flex flex-col items-center max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Focus Timer</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          {sessions} session{sessions !== 1 ? "s" : ""} completed today
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 bg-white rounded-lg border border-cream-200 p-1 shadow-sm mb-10">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === key
                ? `${MODE_COLORS[key].bg} text-white`
                : "text-stone-500 hover:text-stone-700 hover:bg-cream-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative w-72 h-72 mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={radius} stroke="#f5e4cc" strokeWidth="10" fill="none" />
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke={colors.ring}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-stone-900 tabular-nums tracking-tight">
            {mins}:{secs}
          </span>
          <span className={`text-sm font-medium mt-1 ${colors.accent}`}>
            {MODES.find((m) => m.key === mode)!.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="w-11 h-11 rounded-full bg-white border border-cream-300 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-cream-50 transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setRunning((r) => !r)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md transition-all hover:scale-105 active:scale-95 ${colors.bg}`}
        >
          {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        <button
          onClick={skip}
          className="w-11 h-11 rounded-full bg-white border border-cream-300 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-cream-50 transition-colors shadow-sm"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Session dots */}
      <div className="flex gap-2 mt-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < sessions % 4 ? colors.bg : "bg-cream-300"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-stone-400 mt-2">
        {4 - (sessions % 4)} session{4 - (sessions % 4) !== 1 ? "s" : ""} until long break
      </p>

      {/* Tip card */}
      <div className={`mt-10 rounded-xl border shadow-sm p-5 w-full max-w-sm text-center ${colors.bgLight}`}
        style={{ borderColor: colors.ring + "30" }}
      >
        <p className="text-sm font-medium text-stone-700 mb-1">{tip.headline}</p>
        <p className="text-xs text-stone-400">{tip.body}</p>
      </div>
    </div>
  );
}
