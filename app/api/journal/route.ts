import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.date));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, content } = await request.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const [row] = await db
      .insert(journalEntries)
      .values({ date, content: content ?? "" })
      .onConflictDoUpdate({
        target: journalEntries.date,
        set: { content: content ?? "", updatedAt: new Date() },
      })
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save journal entry" }, { status: 500 });
  }
}
