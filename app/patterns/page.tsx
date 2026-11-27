"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Trash2, X, Loader2, ChevronLeft, ChevronRight, Upload, FileText,
  Sparkles, Check, RotateCcw, Minus, ClipboardList, Wand2, PenLine, GripVertical,
} from "lucide-react";
import {
  CRAFT_TYPES, CRAFT_TYPE_META, type CraftType, type Pattern, type PatternRow, type CrochetProject,
} from "@/lib/schema";

type PatternListItem = Pattern & { totalRows: number; completedRows: number };
type PatternDetail = Pattern & { rows: PatternRow[] };
type DraftRow = {
  section: string;
  label: string;
  instruction: string;
  stitchCount: number | null;
  repeatTarget: number;
};

const CRAFT_BADGE: Record<CraftType, { bg: string; color: string }> = {
  crochet: { bg: "#f8eced", color: "#8a4a50" },
  knitting: { bg: "#e4f2f0", color: "#2e6b67" },
};

const inputCls =
  "w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white";

export default function PatternsPage() {
  const [view, setView] = useState<"list" | "new" | "tracker">("list");
  const [list, setList] = useState<PatternListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<CrochetProject[]>([]);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [active, setActive] = useState<PatternDetail | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patterns");
      setList(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    fetch("/api/crochet").then((r) => (r.ok ? r.json() : [])).then(setProjects).catch(() => {});
  }, [loadList]);

  async function openTracker(id: number) {
    const res = await fetch(`/api/patterns/${id}`);
    if (res.ok) {
      setActive(await res.json());
      setView("tracker");
    }
  }

  return (
    <div className="min-h-screen px-6 py-8 md:px-10">
      <div className="max-w-5xl mx-auto">
        {view === "list" && (
          <PatternList
            list={list}
            loading={loading}
            projects={projects}
            onNew={() => setView("new")}
            onOpen={openTracker}
          />
        )}
        {view === "new" && (
          <NewPattern
            projects={projects}
            aiAvailable={aiAvailable}
            setAiAvailable={setAiAvailable}
            onCancel={() => setView("list")}
            onCreated={async (p) => {
              await loadList();
              setActive(p);
              setView("tracker");
            }}
          />
        )}
        {view === "tracker" && active && (
          <Tracker
            pattern={active}
            projects={projects}
            onBack={() => {
              loadList();
              setView("list");
            }}
            onDeleted={() => {
              loadList();
              setActive(null);
              setView("list");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ List --- */

function PatternList({
  list, loading, projects, onNew, onOpen,
}: {
  list: PatternListItem[];
  loading: boolean;
  projects: CrochetProject[];
  onNew: () => void;
  onOpen: (id: number) => void;
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-nude-500 uppercase mb-1">
            Knitting & Crochet
          </p>
          <h1 className="font-serif text-3xl text-stone-900">Pattern Tracker</h1>
          <p className="text-sm text-stone-500 mt-1.5 max-w-lg">
            Upload a photo or PDF, or paste your pattern, and keep your place row by row.
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New pattern
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-stone-400 py-20 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : list.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-nude-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-nude-500" />
          </div>
          <h2 className="font-serif text-xl text-stone-900 mb-1.5">No patterns yet</h2>
          <p className="text-sm text-stone-500 mb-5 max-w-sm mx-auto">
            Add your first pattern and we’ll build a row-by-row tracker so you always know where
            you are — even after a long break.
          </p>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add a pattern
          </button>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {list.map((p) => {
            const pct = p.totalRows > 0 ? Math.round((p.completedRows / p.totalRows) * 100) : 0;
            const project = projects.find((pr) => pr.id === p.projectId);
            const badge = CRAFT_BADGE[p.craftType];
            return (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="card p-5 text-left hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {CRAFT_TYPE_META[p.craftType].label}
                  </span>
                  {p.parsedByAi && (
                    <span className="text-[11px] text-nude-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg text-stone-900 leading-snug mb-1 group-hover:text-nude-700 transition-colors">
                  {p.name}
                </h3>
                {project && (
                  <p className="text-xs text-stone-400 mb-3">Linked to {project.name}</p>
                )}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                    <span>
                      {p.completedRows} / {p.totalRows} rows
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-nude-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------- New pattern --- */

function NewPattern({
  projects, aiAvailable, setAiAvailable, onCancel, onCreated,
}: {
  projects: CrochetProject[];
  aiAvailable: boolean;
  setAiAvailable: (b: boolean) => void;
  onCancel: () => void;
  onCreated: (p: PatternDetail) => void;
}) {
  const [name, setName] = useState("");
  const [craftType, setCraftType] = useState<CraftType>("crochet");
  const [projectId, setProjectId] = useState<string>("");
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [text, setText] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const [draft, setDraft] = useState<DraftRow[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedByAi, setParsedByAi] = useState(false);
  const [message, setMessage] = useState<{ kind: "warn" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function handleParse() {
    setParsing(true);
    setMessage(null);
    try {
      let payload: any;
      if (mode === "upload") {
        if (!file) {
          setMessage({ kind: "error", text: "Choose a photo or PDF first." });
          setParsing(false);
          return;
        }
        // Try to store the original via the blob upload route (optional), then
        // ask the AI parser to read it. If upload isn't configured, send bytes inline.
        let fileUrl = "";
        try {
          const form = new FormData();
          form.append("file", file);
          form.append("folder", "patterns");
          const up = await fetch("/api/upload", { method: "POST", body: form });
          if (up.ok) {
            fileUrl = (await up.json()).url || "";
            setSourceUrl(fileUrl);
          }
        } catch {
          /* upload optional */
        }
        payload = { engine: "ai", mediaType: file.type };
        if (fileUrl) payload.fileUrl = fileUrl;
        else payload.fileBase64 = await fileToBase64(file);
      } else {
        if (!text.trim()) {
          setMessage({ kind: "error", text: "Paste your pattern text first." });
          setParsing(false);
          return;
        }
        payload = { engine: useAi ? "ai" : "heuristic", text };
      }

      const res = await fetch("/api/pattern-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) setAiAvailable(false);
        setMessage({ kind: "error", text: data.error || "Couldn't parse that pattern." });
        setParsing(false);
        return;
      }
      setDraft(data.rows || []);
      setParsedByAi(Boolean(data.parsedByAi));
      if (data.warning) setMessage({ kind: "warn", text: data.warning });
      // Prefill a name from the file if empty.
      if (!name && file) setName(file.name.replace(/\.[^.]+$/, ""));
    } catch (e: any) {
      setMessage({ kind: "error", text: e?.message || "Something went wrong parsing the pattern." });
    } finally {
      setParsing(false);
    }
  }

  function updateDraftRow(i: number, patch: Partial<DraftRow>) {
    setDraft((d) => (d ? d.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) : d));
  }
  function removeDraftRow(i: number) {
    setDraft((d) => (d ? d.filter((_, idx) => idx !== i) : d));
  }
  function addDraftRow() {
    setDraft((d) => [
      ...(d || []),
      { section: "", label: `Row ${(d?.length || 0) + 1}`, instruction: "", stitchCount: null, repeatTarget: 1 },
    ]);
  }
  function moveDraftRow(i: number, dir: -1 | 1) {
    setDraft((d) => {
      if (!d) return d;
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const copy = [...d];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  async function handleCreate() {
    if (!name.trim()) {
      setMessage({ kind: "error", text: "Give your pattern a name." });
      return;
    }
    if (!draft || draft.length === 0) {
      setMessage({ kind: "error", text: "There are no rows to track yet." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          craftType,
          projectId: projectId || null,
          sourceType: mode === "upload" ? (file?.type === "application/pdf" ? "pdf" : "image") : "text",
          sourceUrl,
          rawText: mode === "paste" ? text : "",
          parsedByAi,
          rows: draft,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        onCreated(created);
      } else {
        setMessage({ kind: "error", text: "Couldn't save the pattern. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-nude-600 mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to patterns
      </button>

      <h1 className="font-serif text-2xl text-stone-900 mb-5">New pattern</h1>

      <div className="card p-6 space-y-5">
        {/* Name + craft + project */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Pattern name</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blooming Tee"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Craft</label>
            <select className={inputCls} value={craftType} onChange={(e) => setCraftType(e.target.value as CraftType)}>
              {CRAFT_TYPES.map((c) => (
                <option key={c} value={c}>{CRAFT_TYPE_META[c].label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">
            Link to a project <span className="text-stone-300">(optional)</span>
          </label>
          <select className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— none —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Input mode tabs */}
        <div className="flex gap-1 p-1 bg-cream-100 rounded-lg w-fit">
          {([["paste", "Paste text", PenLine], ["upload", "Upload photo / PDF", Upload]] as const).map(
            ([val, label, Icon]) => (
              <button
                key={val}
                onClick={() => { setMode(val); setDraft(null); setMessage(null); }}
                className={`flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-md transition-colors ${
                  mode === val ? "bg-white text-nude-700 shadow-sm" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            )
          )}
        </div>

        {mode === "paste" ? (
          <div>
            <textarea
              className={inputCls + " resize-none leading-relaxed font-mono text-[13px]"}
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Row 1: ch 2, sc in each st across (24)\nRow 2: sc in each st around\nRows 3-6: repeat Row 2\nRow 7: *sc 2, inc* around (32)"}
            />
            <label className="flex items-center gap-2 mt-3 text-sm text-stone-600 select-none cursor-pointer">
              <input
                type="checkbox"
                className="accent-nude-500 w-4 h-4"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                disabled={!aiAvailable}
              />
              <Wand2 className="w-4 h-4 text-nude-500" />
              Use AI for messy or unusually formatted patterns
              {!aiAvailable && <span className="text-xs text-stone-400">(not configured)</span>}
            </label>
          </div>
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setDraft(null); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-cream-300 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-nude-300 hover:bg-cream-50 transition-colors"
            >
              {file ? (
                <>
                  <FileText className="w-7 h-7 text-nude-500" />
                  <span className="text-sm text-stone-700">{file.name}</span>
                  <span className="text-xs text-stone-400">Tap to choose a different file</span>
                </>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-stone-300" />
                  <span className="text-sm text-stone-600">Choose a photo or PDF of your pattern</span>
                  <span className="text-xs text-stone-400">Claude reads it into rows for you ✨</span>
                </>
              )}
            </button>
            {!aiAvailable && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">
                Photo/PDF reading needs an ANTHROPIC_API_KEY. Until then, paste the pattern text instead.
              </p>
            )}
          </div>
        )}

        {message && (
          <div
            className={`text-sm rounded-lg px-3 py-2 ${
              message.kind === "error" ? "text-rose-700 bg-rose-50" : "text-amber-800 bg-amber-50"
            }`}
          >
            {message.text}
          </div>
        )}

        {draft === null ? (
          <button
            onClick={handleParse}
            disabled={parsing}
            className="flex items-center justify-center gap-2 w-full bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {parsing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {mode === "upload" ? "Reading your pattern…" : "Finding rows…"}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {mode === "upload" ? "Read pattern" : "Find rows"}</>
            )}
          </button>
        ) : (
          <DraftEditor
            draft={draft}
            parsedByAi={parsedByAi}
            onUpdate={updateDraftRow}
            onRemove={removeDraftRow}
            onAdd={addDraftRow}
            onMove={moveDraftRow}
            onReparse={() => { setDraft(null); setMessage(null); }}
            onCreate={handleCreate}
            saving={saving}
          />
        )}
      </div>
    </>
  );
}

function DraftEditor({
  draft, parsedByAi, onUpdate, onRemove, onAdd, onMove, onReparse, onCreate, saving,
}: {
  draft: DraftRow[];
  parsedByAi: boolean;
  onUpdate: (i: number, patch: Partial<DraftRow>) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onReparse: () => void;
  onCreate: () => void;
  saving: boolean;
}) {
  return (
    <div className="border-t border-cream-200 pt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-serif text-lg text-stone-900">
            {draft.length} {draft.length === 1 ? "row" : "rows"} found
          </h3>
          <p className="text-xs text-stone-500">
            Tweak anything below, then create your tracker.
            {parsedByAi && <span className="ml-1 text-nude-500">Read with AI ✨</span>}
          </p>
        </div>
        <button onClick={onReparse} className="text-xs text-stone-500 hover:text-nude-600 underline">
          start over
        </button>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
        {draft.map((r, i) => (
          <div key={i} className="flex gap-2 items-start bg-cream-50 rounded-lg p-2.5">
            <div className="flex flex-col pt-1">
              <button onClick={() => onMove(i, -1)} className="text-stone-300 hover:text-stone-500 leading-none" aria-label="Move up">
                <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
              </button>
              <button onClick={() => onMove(i, 1)} className="text-stone-300 hover:text-stone-500 leading-none" aria-label="Move down">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  className="w-24 border border-cream-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-nude-300"
                  value={r.label}
                  onChange={(e) => onUpdate(i, { label: e.target.value })}
                  placeholder="Row 1"
                />
                <input
                  className="flex-1 border border-cream-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-nude-300"
                  value={r.instruction}
                  onChange={(e) => onUpdate(i, { instruction: e.target.value })}
                  placeholder="instruction…"
                />
              </div>
              <div className="flex gap-1.5 items-center">
                <input
                  className="w-24 border border-cream-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-nude-300"
                  value={r.section}
                  onChange={(e) => onUpdate(i, { section: e.target.value })}
                  placeholder="section"
                />
                <span className="text-xs text-stone-400">sts</span>
                <input
                  type="number"
                  className="w-16 border border-cream-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-nude-300"
                  value={r.stitchCount ?? ""}
                  onChange={(e) => onUpdate(i, { stitchCount: e.target.value === "" ? null : parseInt(e.target.value, 10) })}
                  placeholder="—"
                />
                <span className="text-xs text-stone-400">×</span>
                <input
                  type="number"
                  min={1}
                  className="w-14 border border-cream-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-nude-300"
                  value={r.repeatTarget}
                  onChange={(e) => onUpdate(i, { repeatTarget: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  title="How many times this row is worked"
                />
              </div>
            </div>
            <button onClick={() => onRemove(i)} className="text-stone-300 hover:text-rose-500 pt-1" aria-label="Remove row">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button onClick={onAdd} className="flex items-center gap-1.5 text-sm text-nude-600 hover:text-nude-700 mt-3">
        <Plus className="w-4 h-4" /> Add a row
      </button>

      <button
        onClick={onCreate}
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors mt-4"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Check className="w-4 h-4" /> Create tracker</>}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- Tracker --- */

function Tracker({
  pattern, projects, onBack, onDeleted,
}: {
  pattern: PatternDetail;
  projects: CrochetProject[];
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [rows, setRows] = useState<PatternRow[]>(pattern.rows);
  const [current, setCurrent] = useState(Math.min(pattern.currentRow, Math.max(0, pattern.rows.length - 1)));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const total = rows.length;
  const completedCount = rows.filter((r) => r.completed).length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const currentRow = rows[current];
  const project = projects.find((p) => p.id === pattern.projectId);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const persistRow = useCallback((id: number, patch: Partial<PatternRow>) => {
    fetch(`/api/pattern-rows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const persistPattern = useCallback((patch: Partial<Pattern>) => {
    fetch(`/api/patterns/${pattern.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, [pattern.id]);

  const setRowLocal = (id: number, patch: Partial<PatternRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const goToRow = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, total - 1));
    setCurrent(clamped);
    persistPattern({ currentRow: clamped });
    rowRefs.current[clamped]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [total, persistPattern]);

  // Advance: for repeat rows, bump the repeat tally first; only move on once the
  // row has been worked the full number of times.
  const advance = useCallback(() => {
    const row = rows[current];
    if (!row) return;
    if (row.repeatTarget > 1 && row.repeatDone + 1 < row.repeatTarget) {
      const next = row.repeatDone + 1;
      setRowLocal(row.id, { repeatDone: next });
      persistRow(row.id, { repeatDone: next });
      return;
    }
    setRowLocal(row.id, { completed: true, repeatDone: row.repeatTarget });
    persistRow(row.id, { completed: true, repeatDone: row.repeatTarget });
    if (current < total - 1) goToRow(current + 1);
    else persistPattern({ currentRow: current });
  }, [rows, current, total, persistRow, persistPattern, goToRow]);

  const goPrev = useCallback(() => {
    if (current === 0) return;
    const target = rows[current - 1];
    setRowLocal(target.id, { completed: false, repeatDone: 0 });
    persistRow(target.id, { completed: false, repeatDone: 0 });
    goToRow(current - 1);
  }, [current, rows, persistRow, goToRow]);

  const bumpRepeat = useCallback((delta: 1 | -1) => {
    const row = rows[current];
    if (!row || row.repeatTarget <= 1) return;
    const next = Math.max(0, Math.min(row.repeatTarget, row.repeatDone + delta));
    setRowLocal(row.id, { repeatDone: next });
    persistRow(row.id, { repeatDone: next });
  }, [rows, current, persistRow]);

  // Jump straight to a row (e.g. tapping it in the list). Everything before it
  // counts as done, everything from it onward as not-yet-done.
  const jumpTo = useCallback((idx: number) => {
    setRows((rs) =>
      rs.map((r, i) => {
        const shouldComplete = i < idx;
        if (r.completed !== shouldComplete || (!shouldComplete && r.repeatDone !== 0)) {
          persistRow(r.id, { completed: shouldComplete, repeatDone: shouldComplete ? r.repeatTarget : 0 });
          return { ...r, completed: shouldComplete, repeatDone: shouldComplete ? r.repeatTarget : 0 };
        }
        return r;
      })
    );
    goToRow(idx);
  }, [persistRow, goToRow]);

  const reset = useCallback(() => {
    setRows((rs) => rs.map((r) => ({ ...r, completed: false, repeatDone: 0 })));
    rows.forEach((r) => persistRow(r.id, { completed: false, repeatDone: 0 }));
    goToRow(0);
  }, [rows, persistRow, goToRow]);

  async function doDelete() {
    await fetch(`/api/patterns/${pattern.id}`, { method: "DELETE" });
    onDeleted();
  }

  // Space / Enter advance; arrows move.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); advance(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); advance(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, goPrev]);

  const allDone = completedCount === total && total > 0;

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-nude-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> All patterns
        </button>
        <div className="flex items-center gap-3">
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600" title="Reset progress">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={() => setConfirmDelete(true)} className="text-stone-300 hover:text-rose-500" title="Delete pattern">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: CRAFT_BADGE[pattern.craftType].bg, color: CRAFT_BADGE[pattern.craftType].color }}>
          {CRAFT_TYPE_META[pattern.craftType].label}
        </span>
        {project && <span className="text-xs text-stone-400">· {project.name}</span>}
      </div>
      <h1 className="font-serif text-2xl text-stone-900 mb-5">{pattern.name}</h1>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm text-stone-500 mb-1.5">
          <span>{completedCount} of {total} rows done</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-cream-200 overflow-hidden">
          <div className="h-full rounded-full bg-nude-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Current row hero */}
      {allDone ? (
        <div className="card p-8 text-center mb-6 bg-gradient-to-b from-white to-cream-50">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl text-stone-900 mb-1">Finished! 🎉</h2>
          <p className="text-sm text-stone-500 mb-4">Every row is done. Beautiful work.</p>
          <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-nude-600 hover:text-nude-700">
            <RotateCcw className="w-4 h-4" /> Track it again
          </button>
        </div>
      ) : currentRow ? (
        <div className="card p-6 md:p-8 mb-6">
          {currentRow.section && (
            <p className="text-[11px] font-semibold tracking-[0.2em] text-nude-500 uppercase mb-2">{currentRow.section}</p>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif text-xl text-nude-700">{currentRow.label}</span>
            {currentRow.stitchCount != null && (
              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-cream-100 text-stone-600">
                {currentRow.stitchCount} sts
              </span>
            )}
          </div>
          <p className="text-lg md:text-xl text-stone-800 leading-relaxed mb-5">
            {currentRow.instruction || <span className="text-stone-300">—</span>}
          </p>

          {currentRow.repeatTarget > 1 && (
            <div className="flex items-center gap-3 mb-5 bg-cream-50 rounded-lg px-4 py-2.5 w-fit">
              <span className="text-sm text-stone-500">Repeat</span>
              <button onClick={() => bumpRepeat(-1)} className="w-7 h-7 rounded-full bg-white border border-cream-300 flex items-center justify-center hover:bg-cream-100">
                <Minus className="w-3.5 h-3.5 text-stone-500" />
              </button>
              <span className="font-serif text-lg text-stone-800 tabular-nums">
                {currentRow.repeatDone} / {currentRow.repeatTarget}
              </span>
              <button onClick={() => bumpRepeat(1)} className="w-7 h-7 rounded-full bg-white border border-cream-300 flex items-center justify-center hover:bg-cream-100">
                <Plus className="w-3.5 h-3.5 text-stone-500" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <button
              onClick={goPrev}
              disabled={current === 0}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 disabled:opacity-30 px-3 py-3"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={advance}
              className="flex-1 flex items-center justify-center gap-2 bg-nude-500 hover:bg-nude-600 text-white font-medium px-4 py-3.5 rounded-xl transition-colors text-base shadow-sm"
            >
              <Check className="w-5 h-5" />
              {currentRow.repeatTarget > 1 && currentRow.repeatDone + 1 < currentRow.repeatTarget
                ? `Count this repeat (${currentRow.repeatDone + 1}/${currentRow.repeatTarget})`
                : "Done — next row"}
            </button>
          </div>
          <p className="text-[11px] text-stone-300 text-center mt-3">Tip: press the space bar to advance</p>
        </div>
      ) : null}

      {/* Full row list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-cream-200">
          <h3 className="text-sm font-medium text-stone-600">All rows</h3>
        </div>
        <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
          {rows.map((r, i) => {
            const showSection = r.section && (i === 0 || rows[i - 1].section !== r.section);
            const isCurrent = i === current && !allDone;
            return (
              <div key={r.id}>
                {showSection && (
                  <div className="px-5 pt-3 pb-1 text-[11px] font-semibold tracking-[0.18em] text-nude-500 uppercase bg-cream-50/60">
                    {r.section}
                  </div>
                )}
                <button
                  ref={(el) => { rowRefs.current[i] = el; }}
                  onClick={() => jumpTo(i)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-2.5 border-b border-cream-100 last:border-0 transition-colors ${
                    isCurrent ? "bg-nude-50" : "hover:bg-cream-50"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                      r.completed ? "bg-nude-400 border-nude-400" : isCurrent ? "border-nude-400" : "border-cream-300"
                    }`}
                  >
                    {r.completed && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className={`text-xs font-semibold w-20 flex-shrink-0 ${isCurrent ? "text-nude-700" : "text-stone-500"}`}>
                    {r.label}
                  </span>
                  <span className={`text-sm flex-1 truncate ${r.completed ? "text-stone-400 line-through" : "text-stone-700"}`}>
                    {r.instruction || "—"}
                  </span>
                  {r.repeatTarget > 1 && (
                    <span className="text-[11px] text-stone-400 flex-shrink-0">×{r.repeatTarget}</span>
                  )}
                  {r.stitchCount != null && (
                    <span className="text-[11px] text-stone-400 flex-shrink-0 tabular-nums">{r.stitchCount}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-stone-900/30 flex items-center justify-center p-4 z-50" onClick={() => setConfirmDelete(false)}>
          <div className="card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-stone-900 mb-1.5">Delete this pattern?</h3>
            <p className="text-sm text-stone-500 mb-5">“{pattern.name}” and its row progress will be removed. This can’t be undone.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-cream-300 text-stone-600 hover:bg-cream-50">
                Keep it
              </button>
              <button onClick={doDelete} className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
