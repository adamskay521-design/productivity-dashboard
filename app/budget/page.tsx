"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Loader2, TrendingUp, TrendingDown, DollarSign, X } from "lucide-react";
import type { BudgetTransaction, ExpenseCategory, IncomeCategory } from "@/lib/schema";
import { EXPENSE_CATEGORY_META, EXPENSE_CATEGORIES, INCOME_CATEGORY_META, INCOME_CATEGORIES } from "@/lib/schema";

type TxType = "income" | "expense";

function getMonth() {
  return format(new Date(), "yyyy-MM");
}

function getCategoryMeta(type: TxType, category: string) {
  if (type === "income") {
    return INCOME_CATEGORY_META[category as keyof typeof INCOME_CATEGORY_META] ?? { label: category, emoji: "💰", color: "#3d8c6a" };
  }
  return EXPENSE_CATEGORY_META[category as keyof typeof EXPENSE_CATEGORY_META] ?? { label: category, emoji: "📦", color: "#8a8070" };
}

export default function BudgetPage() {
  const [month, setMonth] = useState(getMonth());
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    type: "expense" as TxType,
    category: "food",
    description: "",
  });

  async function load() {
    setLoading(true);
    const data = await fetch(`/api/budget?month=${month}`).then((r) => r.json());
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setForm({ date: format(new Date(), "yyyy-MM-dd"), amount: "", type: "expense", category: "food", description: "" });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/budget/${id}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function changeMonth(dir: -1 | 1) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(format(d, "yyyy-MM"));
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: transactions.filter((t) => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0),
  })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);

  const categoryChoices = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Budget</h1>
          <p className="text-stone-400 text-sm mt-0.5">Track income and expenses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add transaction
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg border border-cream-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors text-sm font-bold">‹</button>
        <span className="font-semibold text-stone-700 min-w-[120px] text-center">
          {format(parseISO(`${month}-01`), "MMMM yyyy")}
        </span>
        <button onClick={() => changeMonth(1)} disabled={month >= getMonth()} className="w-8 h-8 rounded-lg border border-cream-200 bg-white flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors text-sm font-bold">›</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-sage-500" />
            <p className="text-xs uppercase tracking-[0.15em] text-stone-400 font-semibold">Income</p>
          </div>
          <p className="text-2xl font-bold text-sage-600">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-drose-400" />
            <p className="text-xs uppercase tracking-[0.15em] text-stone-400 font-semibold">Expenses</p>
          </div>
          <p className="text-2xl font-bold text-drose-500">${totalExpense.toFixed(2)}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-5 ${balance >= 0 ? "bg-sage-50 border-sage-200" : "bg-drose-50 border-drose-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className={`w-4 h-4 ${balance >= 0 ? "text-sage-500" : "text-drose-400"}`} />
            <p className={`text-xs uppercase tracking-[0.15em] font-semibold ${balance >= 0 ? "text-sage-600" : "text-drose-500"}`}>Balance</p>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-sage-700" : "text-drose-600"}`}>
            {balance >= 0 ? "+" : ""}${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">New transaction</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-400" /></button>
          </div>
          <form onSubmit={create} className="space-y-4">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(["expense", "income"] as TxType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      type: t,
                      category: t === "income" ? "salary" : "food",
                    }));
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.type === t
                      ? t === "income" ? "bg-sage-500 text-white" : "bg-drose-400 text-white"
                      : "bg-cream-50 text-stone-500 hover:bg-cream-100"
                  }`}
                >
                  {t === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Amount ($)</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  placeholder="0.00" required autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
                <input
                  type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {categoryChoices.map((cat) => {
                  const meta = form.type === "income"
                    ? INCOME_CATEGORY_META[cat as keyof typeof INCOME_CATEGORY_META]
                    : EXPENSE_CATEGORY_META[cat as keyof typeof EXPENSE_CATEGORY_META];
                  const active = form.category === cat;
                  return (
                    <button
                      key={cat} type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${active ? "text-white" : "bg-cream-50 text-stone-500 hover:bg-cream-100"}`}
                      style={active ? { backgroundColor: meta.color } : {}}
                    >
                      {meta.emoji} {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Description (optional)</label>
              <input
                type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                placeholder="e.g. Grocery run, Netflix, etc."
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Add
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-stone-500 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cream-100 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction list */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-stone-600 mb-3">Transactions</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-stone-300" /></div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-cream-100 py-12 text-center">
              <DollarSign className="w-8 h-8 text-stone-200 mx-auto mb-2" />
              <p className="text-stone-400 text-sm">No transactions for {format(parseISO(`${month}-01`), "MMMM yyyy")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const meta = getCategoryMeta(tx.type as TxType, tx.category);
                return (
                  <div key={tx.id} className="bg-white rounded-xl border border-cream-200 shadow-sm px-4 py-3 flex items-center gap-3 group">
                    <span className="text-lg w-8 text-center">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {tx.description || meta.label}
                      </p>
                      <p className="text-xs text-stone-400">
                        {format(parseISO(tx.date), "MMM d")} · {meta.label}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-sage-600" : "text-drose-500"}`}>
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </p>
                    <button
                      onClick={() => remove(tx.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spending by category */}
        <div>
          <h2 className="text-sm font-semibold text-stone-600 mb-3">By Category</h2>
          {expenseByCategory.length === 0 ? (
            <div className="bg-white rounded-xl border border-cream-100 py-8 text-center">
              <p className="text-stone-300 text-xs">No expenses yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenseByCategory.map(({ cat, total }) => {
                const meta = EXPENSE_CATEGORY_META[cat as ExpenseCategory];
                const pct = totalExpense > 0 ? (total / totalExpense) * 100 : 0;
                return (
                  <div key={cat} className="bg-white rounded-xl border border-cream-200 shadow-sm px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-stone-700">{meta.emoji} {meta.label}</span>
                      <span className="text-xs font-semibold text-stone-800">${total.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">{pct.toFixed(0)}% of expenses</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
