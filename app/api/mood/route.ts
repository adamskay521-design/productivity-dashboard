import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodLogs } from "@/lib/schema";
import { desc, gte } from "drizzle-orm";
import { format, subDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const since = format(subDays(new Date(), days), "yyyy-MM-dd");
    const rows = await db
      .select()
      .from(moodLogs)
      .where(gte(moodLogs.date, since))
      .orderBy(desc(moodLogs.date));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch mood logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, mood, note } = await request.json();
    if (!date || !mood) {
      return NextResponse.json({ error: "date and mood required" }, { status: 400 });
    }
    const [row] = await db
      .insert(moodLogs)
      .values({ date, mood, note: note ?? "" })
      .onConflictDoUpdate({
        target: moodLogs.date,
        set: { mood, note: note ?? "", updatedAt: new Date() },
      })
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
  }
}
