import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weightLogs } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const rows = await db.select().from(weightLogs).orderBy(desc(weightLogs.date)).limit(limit);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch weight logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weight, unit, date, notes } = body;
    if (!weight || !date) {
      return NextResponse.json({ error: "weight and date required" }, { status: 400 });
    }
    const [row] = await db
      .insert(weightLogs)
      .values({ weight, unit: unit || "lbs", date, notes: notes || "" })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to log weight" }, { status: 500 });
  }
}
