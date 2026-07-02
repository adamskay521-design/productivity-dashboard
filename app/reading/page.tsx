"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Star, Loader2, X, Plus, Trash2, Target, Pencil } from "lucide-react";
import type { Book, BookStatus } from "@/lib/schema";
import { BOOK_STATUS_META, BOOK_STATUSES } from "@/lib/schema";

interface SearchResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
}

type SearchSource = "ol" | "isbn" | "manual";

const STATUS_TABS: (BookStatus | "all")[] = ["all", "reading", "want_to_read", "read", "dnf"];

function StarRating({
  value,
  onChange,
  size = "sm",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  size?: "sm" | "md";
}) {
  const cls = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(value === s ? null : s)} type="button">
          <Star
            className={cls}
            fill={value && value >= s ? "#c9913a" : "none"}
            stroke={value && value >= s ? "#c9913a" : "#d4a872"}
          />
        </button>
      ))}
    </div>
  );
}

function BookCover({ url, title }: { url: string; title: string }) {
  if (url) {
    return <img src={url} alt={title} className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full bg-cream-200 flex items-center justify-center">
      <BookOpen className="w-6 h-6 text-cream-400" />
    </div>
  );
}

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BookStatus | "all">("all");

  const [showSearch, setShowSearch] = useState(false);
  const [searchSource, setSearchSource] = useState<SearchSource>("ol");
  const [isbnNotFound, setIsbnNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingStatus, setAddingStatus] = useState<Record<string, BookStatus>>({});
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualCover, setManualCover] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [yearGoal, setYearGoal] = useState<number | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const currentYear = new Date().getFullYear();

  async function loadBooks() {
    const data = await fetch("/api/books").then((r) => r.json());
    setBooks(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadGoal() {
    const data = await fetch(`/api/reading-goal?year=${currentYear}`).then((r) => r.json());
    setYearGoal(data?.goalCount ?? null);
  }

  async function saveGoal(count: number) {
    await fetch("/api/reading-goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: currentYear, goalCount: count }),
    });
    setYearGoal(count);
    setEditingGoal(false);
  }

  useEffect(() => {
    loadBooks();
    loadGoal();
  }, []);

  async function searchBooks(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      setIsbnNotFound(false);
      const res = await fetch(
        `/api/books-search?q=${encodeURIComponent(searchQuery)}&source=${searchSource}`
      );
      const results: SearchResult[] = await res.json();
      setSearchResults(results);
      if (searchSource === "isbn" && results.length === 0) setIsbnNotFound(true);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }

  async function addBook(result: SearchResult, status: BookStatus) {
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: result.title,
        author: result.author,
        coverUrl: result.coverUrl,
        olKey: result.id,
        status,
      }),
    });
    setSearchResults((prev) => prev.filter((r) => r.id !== result.id));
    loadBooks();
  }

  async function addManual(status: BookStatus) {
    if (!manualTitle.trim()) return;
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: manualTitle.trim(),
        author: manualAuthor.trim(),
        coverUrl: manualCover.trim(),
        olKey: null,
        status,
      }),
    });
    setManualTitle(""); setManualAuthor(""); setManualCover("");
    loadBooks();
  }

  async function updateBook(
    id: number,
    updates: Partial<{ status: BookStatus; rating: number | null; notes: string; totalPages: number; dateFinished: string | null }>
  ) {
    setSaving(true);
    await fetch(`/api/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    loadBooks();
  }

  async function deleteBook(id: number) {
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    setExpandedId(null);
    loadBooks();
  }

  const filtered = tab === "all" ? books : books.filter((b) => b.status === tab);
  const expandedBook = books.find((b) => b.id === expandedId) ?? null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Reading</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {books.length} book{books.length !== 1 ? "s" : ""} on your shelf
          </p>
        </div>
        <button
          onClick={() => {
            setShowSearch((s) => !s);
            setSearchResults([]);
            setSearchQuery("");
          }}
          className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
          Find a book
        </button>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="bg-white rounded-xl border border-cream-200 shadow-sm p-5 mb-6">
          {/* Source tabs */}
          <div className="flex gap-1 mb-4 bg-cream-50 rounded-lg p-1 w-fit border border-cream-200">
            {([["ol", "Search by Title / Author"], ["isbn", "Search by ISBN"], ["manual", "Add Manually"]] as [SearchSource, string][]).map(([src, label]) => (
              <button
                key={src}
                onClick={() => { setSearchSource(src); setSearchResults([]); setSearchQuery(""); setIsbnNotFound(false); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  searchSource === src
                    ? "bg-nude-500 text-white"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >{label}</button>
            ))}
          </div>

          {searchSource !== "manual" ? (
            <>
              <form onSubmit={searchBooks} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchSource === "isbn" ? "Enter ISBN (e.g. 9780735224292)…" : "Search by title or author…"}
                  className="flex-1 border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="flex items-center gap-2 bg-nude-500 hover:bg-nude-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </form>
              {searchSource === "ol" && (
                <p className="text-xs text-stone-400 mb-3 -mt-2">Can&apos;t find it? Try the <button className="text-nude-500 underline" onClick={() => setSearchSource("isbn")}>ISBN lookup</button> (printed on the back of the book) or <button className="text-nude-500 underline" onClick={() => setSearchSource("manual")}>add manually</button>.</p>
              )}
              {searchSource === "isbn" && (
                <p className="text-xs text-stone-400 mb-3 -mt-2">Find the barcode on the back of the book — the ISBN is the 10 or 13-digit number. Hyphens are fine.{isbnNotFound ? <span className="text-drose-500 ml-1">ISBN not found. Try <button className="underline" onClick={() => setSearchSource("manual")}>adding manually</button>.</span> : ""}</p>
              )}
            </>
          ) : (
            <div className="space-y-3 max-w-md">
              <p className="text-xs text-stone-400">Add a book that isn&apos;t in any database.</p>
              <input
                type="text"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="Title *"
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <input
                type="text"
                value={manualAuthor}
                onChange={e => setManualAuthor(e.target.value)}
                placeholder="Author (optional)"
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <input
                type="text"
                value={manualCover}
                onChange={e => setManualCover(e.target.value)}
                placeholder="Cover image URL (optional)"
                className="w-full border border-cream-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
              />
              <div className="flex items-center gap-2">
                <select
                  defaultValue="want_to_read"
                  id="manual-status"
                  className="text-xs border border-cream-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none text-stone-600"
                >
                  {BOOK_STATUSES.map(s => (
                    <option key={s} value={s}>{BOOK_STATUS_META[s].label}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const sel = document.getElementById("manual-status") as HTMLSelectElement;
                    addManual(sel.value as BookStatus);
                  }}
                  disabled={!manualTitle.trim()}
                  className="flex items-center gap-1.5 bg-nude-500 hover:bg-nude-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to shelf
                </button>
              </div>
            </div>
          )}

          {searching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-2">
              {searchResults.map((result) => {
                const status: BookStatus = addingStatus[result.id] || "want_to_read";
                const alreadyAdded = books.some((b) => b.olKey === result.id);
                return (
                  <div key={result.id} className="flex flex-col">
                    <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-cream-100 mb-2 shadow-sm">
                      {result.coverUrl ? (
                        <img src={result.coverUrl} alt={result.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-7 h-7 text-cream-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-stone-800 line-clamp-2 leading-tight mb-0.5">{result.title}</p>
                    <p className="text-xs text-stone-400 mb-2 truncate">{result.author}</p>
                    {alreadyAdded ? (
                      <span className="text-xs text-stone-400 italic">On shelf</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={status}
                          onChange={(e) => setAddingStatus((prev) => ({ ...prev, [result.id]: e.target.value as BookStatus }))}
                          className="text-xs border border-cream-200 rounded-md px-1.5 py-1 bg-white focus:outline-none"
                          style={{ color: BOOK_STATUS_META[status].color }}
                        >
                          {BOOK_STATUSES.map((s) => (
                            <option key={s} value={s}>{BOOK_STATUS_META[s].label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => addBook(result, status)}
                          className="text-xs bg-nude-500 hover:bg-nude-600 text-white font-medium px-2 py-1 rounded-md transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add to shelf
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!searching && searchResults.length === 0 && searchQuery && searchSource === "ol" && (
            <p className="text-xs text-stone-400 py-2">No results. Try the <button className="text-nude-500 underline" onClick={() => { setSearchSource("isbn"); setSearchQuery(""); }}>ISBN lookup</button> or <button className="text-nude-500 underline" onClick={() => setSearchSource("manual")}>add manually</button>.</p>
          )}
        </div>
      )}

      {/* Reading Stats */}
      {(() => {
        const thisYear = new Date().getFullYear();
        const booksReadThisYear = books.filter(
          (b) => b.status === "read" && b.dateFinished && b.dateFinished.startsWith(String(thisYear))
        ).length;
        const currentlyReading = books.filter((b) => b.status === "reading").length;
        const rated = books.filter((b) => b.rating !== null);
        const avgRating = rated.length > 0
          ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1)
          : null;
        const goalPct = yearGoal && booksReadThisYear > 0 ? Math.min(100, Math.round((booksReadThisYear / yearGoal) * 100)) : 0;

        return (
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-semibold">{thisYear} Stats</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Books read this year / goal */}
              <div>
                <p className="text-2xl font-bold text-stone-900">{booksReadThisYear}</p>
                <p className="text-xs text-stone-400 mt-0.5">books read</p>
                {yearGoal && (
                  <>
                    <div className="mt-2 h-1.5 bg-cream-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-nude-500 transition-all" style={{ width: `${goalPct}%` }} />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">of {yearGoal} goal ({goalPct}%)</p>
                  </>
                )}
                {!yearGoal && (
                  <button onClick={() => { setEditingGoal(true); setGoalInput(""); }}
                    className="text-[10px] text-nude-400 hover:text-nude-600 mt-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Set a goal
                  </button>
                )}
              </div>

              {/* Goal input */}
              {editingGoal && (
                <div className="flex items-center gap-2 col-span-1">
                  <input type="number" min="1" max="365" value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-20 border border-cream-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && goalInput) saveGoal(parseInt(goalInput)); }}
                  />
                  <button onClick={() => goalInput && saveGoal(parseInt(goalInput))}
                    className="text-xs bg-nude-500 hover:bg-nude-600 text-white px-2 py-1 rounded-lg">Set</button>
                  <button onClick={() => setEditingGoal(false)} className="text-stone-400 hover:text-stone-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {yearGoal && !editingGoal && (
                <div>
                  <p className="text-2xl font-bold text-stone-900">{yearGoal}</p>
                  <p className="text-xs text-stone-400 mt-0.5">book goal</p>
                  <button onClick={() => { setEditingGoal(true); setGoalInput(String(yearGoal)); }}
                    className="text-[10px] text-nude-400 hover:text-nude-600 mt-1 flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>
              )}

              <div>
                <p className="text-2xl font-bold text-stone-900">{currentlyReading}</p>
                <p className="text-xs text-stone-400 mt-0.5">reading now</p>
              </div>

              {avgRating && (
                <div>
                  <p className="text-2xl font-bold text-stone-900">{avgRating}</p>
                  <p className="text-xs text-stone-400 mt-0.5">avg rating</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className="w-2.5 h-2.5"
                        fill={parseFloat(avgRating) >= s ? "#c9913a" : "none"}
                        stroke={parseFloat(avgRating) >= s ? "#c9913a" : "#d4a872"} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Status tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-cream-200 p-1 shadow-sm mb-5 flex-wrap w-fit">
        {STATUS_TABS.map((s) => {
          const count = s === "all" ? books.length : books.filter((b) => b.status === s).length;
          const label = s === "all" ? "All" : BOOK_STATUS_META[s].label;
          const active = tab === s;
          const color = s === "all" ? "#8a3f18" : BOOK_STATUS_META[s as BookStatus].color;
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: color, color: "white" }
                  : { color: "#78716c" }
              }
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Book grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-cream-100 shadow-sm py-16 text-center">
          <BookOpen className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 text-sm">
            {tab === "all"
              ? "No books on your shelf yet"
              : `No ${BOOK_STATUS_META[tab as BookStatus]?.label} books`}
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="mt-3 text-xs text-nude-500 hover:text-nude-600 font-medium"
          >
            Search for a book →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {filtered.map((book) => {
            const meta = BOOK_STATUS_META[book.status];
            const isExpanded = expandedId === book.id;
            return (
              <div key={book.id} className="flex flex-col">
                <div
                  className={`group relative w-full aspect-[2/3] rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow mb-2 ${
                    isExpanded ? "ring-2 ring-nude-400 ring-offset-1" : ""
                  }`}
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(book.id);
                      setEditNotes(book.notes || "");
                    }
                  }}
                >
                  <BookCover url={book.coverUrl} title={book.title} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <p className="text-xs font-medium text-stone-800 line-clamp-2 leading-tight">
                  {book.title}
                </p>
                <p className="text-xs text-stone-400 truncate">{book.author}</p>
                <span
                  className="mt-1 text-[10px] font-semibold self-start px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: meta.color + "20", color: meta.color }}
                >
                  {meta.label}
                </span>
                <div className="mt-1">
                  <StarRating
                    value={book.rating}
                    onChange={(v) => updateBook(book.id, { rating: v })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded book edit panel */}
      {expandedBook && (
        <div className="mt-5 bg-white rounded-xl border border-cream-200 shadow-sm p-5">
          <div className="flex items-start gap-5">
            <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-cream-100 shadow-sm">
              <BookCover url={expandedBook.coverUrl} title={expandedBook.title} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-stone-800">{expandedBook.title}</h3>
                  {expandedBook.author && (
                    <p className="text-sm text-stone-400">{expandedBook.author}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteBook(expandedBook.id)}
                    className="text-stone-300 hover:text-red-400 transition-colors"
                    title="Remove from shelf"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-stone-300 hover:text-stone-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status picker */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {BOOK_STATUSES.map((s) => {
                  const m = BOOK_STATUS_META[s];
                  const active = expandedBook.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => updateBook(expandedBook.id, { status: s })}
                      className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                      style={
                        active
                          ? { backgroundColor: m.color, color: "white", borderColor: m.color }
                          : {
                              borderColor: m.color + "60",
                              color: m.color,
                              backgroundColor: m.color + "12",
                            }
                      }
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-stone-400 font-medium">Rating</span>
                <StarRating
                  value={expandedBook.rating}
                  onChange={(v) => updateBook(expandedBook.id, { rating: v })}
                  size="md"
                />
                {expandedBook.rating && (
                  <span className="text-xs text-stone-400">{expandedBook.rating}/5</span>
                )}
              </div>

              {/* Pages + date finished */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 font-medium block mb-1">Total pages</label>
                  <input
                    type="number" min="0"
                    defaultValue={expandedBook.totalPages || ""}
                    placeholder="e.g. 320"
                    onBlur={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) updateBook(expandedBook.id, { totalPages: v });
                    }}
                    className="w-full border border-cream-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                  />
                </div>
                {expandedBook.status === "read" && (
                  <div className="flex-1">
                    <label className="text-xs text-stone-400 font-medium block mb-1">Date finished</label>
                    <input
                      type="date"
                      defaultValue={expandedBook.dateFinished ?? ""}
                      onBlur={(e) => updateBook(expandedBook.id, { dateFinished: e.target.value || null })}
                      className="w-full border border-cream-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-nude-300"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes, thoughts, favourite quotes..."
                className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-nude-300 resize-none"
                rows={3}
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => updateBook(expandedBook.id, { notes: editNotes })}
                  disabled={saving}
                  className="text-sm text-nude-500 hover:text-nude-600 font-medium disabled:opacity-60 flex items-center gap-1"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link href="/" className="text-xs text-stone-400 hover:text-nude-500 transition-colors">
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}
