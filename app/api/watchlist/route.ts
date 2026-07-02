import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(watchlist).orderBy(desc(watchlist.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, mediaType, posterUrl, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [row] = await db
      .insert(watchlist)
      .values({
        title: title.trim(),
        mediaType: mediaType === "tv" ? "tv" : "movie",
        posterUrl: posterUrl || "",
        status: status || "want_to_watch",
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create watchlist item" }, { status: 500 });
  }
}
