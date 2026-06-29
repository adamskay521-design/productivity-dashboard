import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(notes).orderBy(desc(notes.updatedAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [note] = await db
      .insert(notes)
      .values({ title: title.trim(), content: content || "" })
      .returning();

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
