import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waterLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

    const [row] = await db.select().from(waterLogs).where(eq(waterLogs.date, dateParam));
    if (row) return NextResponse.json(row);

    // Return default (not yet stored)
    return NextResponse.json({ date: dateParam, cups: 0, goalCups: 8, id: null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch water log" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, cups, goalCups } = body;

    // Upsert by date
    const existing = await db.select().from(waterLogs).where(eq(waterLogs.date, date));
    if (existing.length > 0) {
      const [row] = await db
        .update(waterLogs)
        .set({ cups: Math.max(0, cups), ...(goalCups !== undefined && { goalCups }), updatedAt: new Date() })
        .where(eq(waterLogs.date, date))
        .returning();
      return NextResponse.json(row);
    }

    const [row] = await db
      .insert(waterLogs)
      .values({ date, cups: Math.max(0, cups ?? 0), goalCups: goalCups ?? 8 })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update water log" }, { status: 500 });
  }
}
