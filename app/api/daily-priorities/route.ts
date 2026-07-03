import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyPriorities } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const rows = await db
      .select()
      .from(dailyPriorities)
      .where(eq(dailyPriorities.date, date))
      .orderBy(asc(dailyPriorities.position));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch priorities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, text, position } = await request.json();
    if (!date || !text?.trim()) {
      return NextResponse.json({ error: "date and text required" }, { status: 400 });
    }

    const [row] = await db
      .insert(dailyPriorities)
      .values({ date, text: text.trim(), position: position ?? 0 })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create priority" }, { status: 500 });
  }
}
