import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const source = searchParams.get("source") || "ol";

  if (!q) return NextResponse.json([]);

  try {
    if (source === "isbn") {
      // Normalize: strip hyphens and spaces
      const isbn = q.replace(/[-\s]/g, "");
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      );
      const data = await res.json();
      const entry = data[`ISBN:${isbn}`];
      if (!entry) return NextResponse.json([]);
      const result = {
        id: entry.key || `isbn:${isbn}`,
        title: entry.title || "",
        author: entry.authors?.[0]?.name || "",
        coverUrl: entry.cover?.medium || entry.cover?.small || "",
      };
      return NextResponse.json([result]);
    } else {
      // General Open Library search
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,cover_i`
      );
      const data = await res.json();
      const results = (data.docs || []).map((d: {
        key: string;
        title: string;
        author_name?: string[];
        cover_i?: number;
      }) => ({
        id: d.key,
        title: d.title,
        author: d.author_name?.[0] || "",
        coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "",
      }));
      return NextResponse.json(results);
    }
  } catch {
    return NextResponse.json([]);
  }
}
