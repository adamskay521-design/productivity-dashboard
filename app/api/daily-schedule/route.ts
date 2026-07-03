import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyScheduleBlocks } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const rows = await db
      .select()
      .from(dailyScheduleBlocks)
      .where(eq(dailyScheduleBlocks.date, date));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, hour, task } = await request.json();
    if (!date || !hour) {
      return NextResponse.json({ error: "date and hour required" }, { status: 400 });
    }

    const [row] = await db
      .insert(dailyScheduleBlocks)
      .values({ date, hour, task: task ?? "" })
      .onConflictDoUpdate({
        target: [dailyScheduleBlocks.date, dailyScheduleBlocks.hour],
        set: { task: task ?? "", updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save schedule block" }, { status: 500 });
  }
}
