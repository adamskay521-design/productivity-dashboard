import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habits } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(habits).orderBy(desc(habits.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color, timeOfDay } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [habit] = await db
      .insert(habits)
      .values({ name: name.trim(), description, color: color || "#6366f1", timeOfDay: timeOfDay || "anytime" })
      .returning();

    return NextResponse.json(habit, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}
