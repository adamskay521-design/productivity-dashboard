"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import {
  Plus, Trash2, ChevronLeft, Loader2, X, Upload, Wrench,
} from "lucide-react";
import type { CraftTool, ToolType } from "@/lib/schema";
import { TOOL_TYPES, TOOL_TYPE_META } from "@/lib/schema";

type Filter = "all" | ToolType;

function ToolThumb({ tool, size = "lg" }: { tool: Partial<CraftTool>; size?: "sm" | "lg" }) {
  const h = size === "lg" ? "h-44" : "h-32";
  return (
    <div className={`w-full ${h} relative overflow-hidden flex items-center justify-center bg-cream-100`}>
      {tool.imageUrl ? (
        <img src={tool.imageUrl} alt={tool.name} className="w-full h-full object-cover" />
      ) : (
        <Wrench className="w-10 h-10 text-cream-300" />
      )}
    </div>
  );
}

function ToolTypeBadge({ toolType }: { toolType: string }) {
  const meta = TOOL_TYPE_META[toolType as ToolType];
  if (!meta) return null;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-nude-50 text-nude-700 border border-nude-100">
      {meta.label}
    </span>
  );
}

const EMPTY_FORM = {
  name: "",
  toolType: "hook" as ToolType,
  size: "",
  material: "",
  brand: "",
  quantity: "1",
  imageUrl: "",
  notes: "",
};

export default function ToolsPage() {
  const [tools, setTools] = useState<CraftTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formSaving, setFormSaving] = useState(false);
  const [editing, setEditing] = useState<CraftTool | null>(null);
  const [editForm, setEditForm] = useState<Partial<CraftTool>>({});
  const editFormRef = useRef<Partial<CraftTool>>({});
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await fetch("/api/tools").then(r => r.json());
    setTools(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? tools : tools.filter(t => t.toolType === filter);

  async function createTool(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setFormSaving(true);
    await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: parseInt(form.quantity) || 1,
      }),
    });
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
    setFormSaving(false);
    load();
  }

  function openEdit(tool: CraftTool) {
    editFormRef.current = { ...tool };
    setEditForm({ ...tool });
    setEditing(tool);
    setSaveStatus("idle");
  }

  function handleEditChange(field: keyof CraftTool, value: string | number) {
    editFormRef.current = { ...editFormRef.current, [field]: value };
    setEditForm({ ...editFormRef.current });
    setSaveStatus("saving");
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!editing) return;
      await fetch(`/api/tools/${editing.id}`, {
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
    fd.append("folder", "tools");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      if (isAdd) setForm(f => ({ ...f, imageUrl: data.url }));
      else handleEditChange("imageUrl", data.url);
    } else {
      alert(data.error || "Upload failed. Paste an image URL instead.");
    }
  }

  async function deleteTool() {
    if (!editing) return;
    if (!confirm("Delete this tool from your inventory?")) return;
    await fetch(`/api/tools/${editing.id}`, { method: "DELETE" });
    setEditing(null);
    load();
  }

  async function leaveEdit() {
    clearTimeout(saveTimeout.current);
    if (editing) {
      await fetch(`/api/tools/${editing.id}`, {
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
            <ChevronLeft className="w-4 h-4" /> Back to tools
          </button>
          <button onClick={deleteTool} className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="relative">
            <ToolThumb tool={editForm} size="lg" />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-medium bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {uploading ? "Uploading…" : "Upload photo"}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <input
              type="text"
              value={editForm.name || ""}
              onChange={e => handleEditChange("name", e.target.value)}
              className="w-full text-2xl font-bold text-stone-900 border-0 outline-none placeholder-stone-300 bg-transparent"
              placeholder="Tool name"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Type</label>
                <select
                  value={editForm.toolType || "hook"}
                  onChange={e => handleEditChange("toolType", e.target.value)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                >
                  {TOOL_TYPES.map(t => (
                    <option key={t} value={t}>{TOOL_TYPE_META[t].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Size</label>
                <input
                  type="text"
                  value={editForm.size || ""}
                  onChange={e => handleEditChange("size", e.target.value)}
                  placeholder="5mm / US 7…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Material</label>
                <input
                  type="text"
                  value={editForm.material || ""}
                  onChange={e => handleEditChange("material", e.target.value)}
                  placeholder="Bamboo, aluminum…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Brand</label>
                <input
                  type="text"
                  value={editForm.brand || ""}
                  onChange={e => handleEditChange("brand", e.target.value)}
                  placeholder="Addi, Clover…"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Quantity</label>
                <input
                  type="number" min="0"
                  value={editForm.quantity ?? 1}
                  onChange={e => handleEditChange("quantity", parseInt(e.target.value) || 0)}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Image URL</label>
              <input
                type="url"
                value={editForm.imageUrl || ""}
                onChange={e => handleEditChange("imageUrl", e.target.value)}
                placeholder="https://…"
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide block mb-1">Notes</label>
              <textarea
                value={editForm.notes || ""}
                onChange={e => handleEditChange("notes", e.target.value)}
                placeholder="Where you got it, condition, set contents…"
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
          <h1 className="text-2xl font-semibold text-stone-900">Tools</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {tools.length} tool{tools.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Tool
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">New Tool</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
          </div>
          <form onSubmit={createTool} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-stone-500 mb-1 block">Tool name *</label>
                <input
                  type="text" autoFocus required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Addi Turbo circular"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Type</label>
                <select
                  value={form.toolType} onChange={e => setForm(f => ({ ...f, toolType: e.target.value as ToolType }))}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300 bg-white"
                >
                  {TOOL_TYPES.map(t => (
                    <option key={t} value={t}>{TOOL_TYPE_META[t].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <input
                type="text" placeholder="Size" value={form.size}
                onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <input
                type="text" placeholder="Material" value={form.material}
                onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <input
                type="text" placeholder="Brand" value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <input
                type="number" min="0" placeholder="Qty" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="Image URL (optional)"
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                />
              </div>
              <input ref={addFileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], true)} />
              <button type="button" onClick={() => addFileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 border border-cream-300 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-cream-50 transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload
              </button>
            </div>

            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="h-24 w-24 object-cover rounded-xl border border-cream-200" />
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={formSaving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {formSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add Tool
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
        {(["all", ...TOOL_TYPES] as Filter[]).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === t ? "bg-nude-500 text-white" : "text-stone-500 hover:text-stone-700 hover:bg-cream-100"
            }`}
          >
            {t === "all" ? "All" : TOOL_TYPE_META[t].label}
            <span className="ml-1 opacity-60">
              {t === "all" ? tools.length : tools.filter(x => x.toolType === t).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm py-20 text-center">
          <Wrench className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">No tools here yet.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-nude-500 hover:text-nude-700 text-sm font-medium">
            Add your first tool
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(tool => (
            <div
              key={tool.id}
              onClick={() => openEdit(tool)}
              className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            >
              <ToolThumb tool={tool} size="sm" />
              <div className="p-3">
                <h3 className="font-semibold text-stone-800 text-sm truncate">{tool.name}</h3>
                {(tool.brand || tool.size) && (
                  <p className="text-xs text-stone-400 truncate mt-0.5">
                    {[tool.brand, tool.size].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <ToolTypeBadge toolType={tool.toolType} />
                  {tool.quantity > 1 && (
                    <span className="text-xs text-stone-400">×{tool.quantity}</span>
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
