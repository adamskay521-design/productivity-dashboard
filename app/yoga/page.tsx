"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Check, Flame, Clock, Plus, ArrowLeft } from "lucide-react";
import { YOGA_FLOWS, estimateCalories, type YogaFlow } from "@/lib/yogaFlows";
import type { WeightLog } from "@/lib/schema";

const INTENSITY_META: Record<YogaFlow["intensity"], { label: string; className: string }> = {
  gentle:   { label: "Gentle",   className: "bg-sage-100 text-sage-700" },
  moderate: { label: "Moderate", className: "bg-nude-100 text-nude-700" },
  power:    { label: "Power",    className: "bg-drose-100 text-drose-700" },
};

export default function YogaPage() {
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [bodyweight, setBodyweight] = useState(150);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    fetch("/api/weight").then((r) => r.json()).then((data: WeightLog[]) => {
      if (Array.isArray(data) && data.length > 0) setBodyweight(data[0].weight);
    }).catch(() => {});
  }, []);

  function selectFlow(id: string) {
    setActiveFlowId(id);
    setDoneSteps(new Set());
    setLogged(false);
  }

  function toggleStep(i: number) {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function logFlow(flow: YogaFlow) {
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: flow.name,
        type: "yoga",
        date: format(new Date(), "yyyy-MM-dd"),
        durationMins: flow.durationMins,
        notes: flow.steps.map((s) => `${s.pose} — ${s.duration}`).join("\n"),
        exercises: [],
      }),
    });
    setLogged(true);
  }

  const activeFlow = YOGA_FLOWS.find((f) => f.id === activeFlowId) ?? null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Yoga &amp; Mobility</h1>
        <p className="text-stone-400 text-sm mt-0.5">Guided flows with step-by-step instructions and photos</p>
      </div>

      {!activeFlow ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {YOGA_FLOWS.map((flow) => {
            const cal = estimateCalories(flow.met, flow.durationMins, bodyweight);
            return (
              <button key={flow.id} onClick={() => selectFlow(flow.id)}
                className="text-left bg-white rounded-2xl border border-cream-200 shadow-sm p-5 hover:shadow-md hover:border-nude-200 transition-all overflow-hidden"
              >
                {flow.steps[0]?.image && (
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-cream-100">
                    <img src={flow.steps[0].image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="font-semibold text-stone-900">{flow.name}</h2>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0 ${INTENSITY_META[flow.intensity].className}`}>
                    {INTENSITY_META[flow.intensity].label}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mb-3">{flow.description}</p>
                <div className="flex items-center gap-4 text-xs text-stone-400">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {flow.durationLabel}</span>
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> ~{cal} cal</span>
                  <span>{flow.steps.length} poses</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <button onClick={() => setActiveFlowId(null)}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All flows
          </button>

          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <h2 className="text-xl font-semibold text-stone-900">{activeFlow.name}</h2>
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${INTENSITY_META[activeFlow.intensity].className}`}>
                {INTENSITY_META[activeFlow.intensity].label}
              </span>
            </div>
            <p className="text-sm text-stone-500 mb-3">{activeFlow.description}</p>
            <div className="flex items-center gap-4 text-xs text-stone-400 mb-4">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeFlow.durationLabel}</span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> ~{estimateCalories(activeFlow.met, activeFlow.durationMins, bodyweight)} cal
                <span className="text-stone-300">(est. at {bodyweight} lbs)</span>
              </span>
              <span>{doneSteps.size}/{activeFlow.steps.length} done</span>
            </div>

            <div className="space-y-3">
              {activeFlow.steps.map((step, i) => (
                <button key={i} type="button" onClick={() => toggleStep(i)}
                  className={`w-full flex items-stretch gap-4 text-left rounded-xl border overflow-hidden transition-all ${
                    doneSteps.has(i) ? "bg-sage-50 border-sage-200" : "bg-cream-50 border-cream-200 hover:border-nude-200"
                  }`}
                >
                  {step.image && (
                    <img src={step.image} alt={step.pose} className="w-24 h-24 object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 py-3 pr-4 flex items-start gap-3">
                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      doneSteps.has(i) ? "bg-sage-500 border-sage-500" : "border-cream-300"
                    }`}>
                      {doneSteps.has(i) && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${doneSteps.has(i) ? "text-sage-700 line-through" : "text-stone-800"}`}>
                          {i + 1}. {step.pose}
                        </span>
                        <span className="text-xs text-stone-400 font-medium">{step.duration}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{step.cue}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => logFlow(activeFlow)} disabled={logged}
              className="mt-5 flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              {logged ? <><Check className="w-3.5 h-3.5" /> Logged to Fitness</> : <><Plus className="w-3.5 h-3.5" /> Log this flow</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
