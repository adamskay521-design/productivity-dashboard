import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habitLogs } from "@/lib/schema";
import { and, eq, gte } from "drizzle-orm";
import { format, subDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get("habitId");
    const days = parseInt(searchParams.get("days") || "30");

    const since = format(subDays(new Date(), days), "yyyy-MM-dd");

    const query = habitId
      ? db
          .select()
          .from(habitLogs)
          .where(
            and(
              eq(habitLogs.habitId, parseInt(habitId)),
              gte(habitLogs.completedDate, since)
            )
          )
      : db
          .select()
          .from(habitLogs)
          .where(gte(habitLogs.completedDate, since));

    const rows = await query;
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch habit logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { habitId, completedDate } = body;

    if (!habitId || !completedDate) {
      return NextResponse.json(
        { error: "habitId and completedDate are required" },
        { status: 400 }
      );
    }

    // Toggle: if log exists for this date, delete it; otherwise create it
    const existing = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.completedDate, completedDate)
        )
      );

    if (existing.length > 0) {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing[0].id));
      return NextResponse.json({ toggled: false });
    }

    const [log] = await db
      .insert(habitLogs)
      .values({ habitId, completedDate })
      .returning();

    return NextResponse.json({ toggled: true, log }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to toggle habit log" }, { status: 500 });
  }
}
