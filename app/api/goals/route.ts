import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { goals } from "@/lib/schema";
import { and, eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get("quarter");
    const year = searchParams.get("year");

    const conditions = [];
    if (quarter) conditions.push(eq(goals.quarter, parseInt(quarter)));
    if (year) conditions.push(eq(goals.year, parseInt(year)));

    const rows = await db
      .select()
      .from(goals)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(goals.category, desc(goals.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, goalType, quarter, year, description, measurable, targetDate, reward } = body;
    if (!title?.trim() || !quarter || !year) {
      return NextResponse.json({ error: "title, quarter, year required" }, { status: 400 });
    }
    const [row] = await db
      .insert(goals)
      .values({
        title: title.trim(),
        category: category || "personal",
        goalType: goalType === "mega" ? "mega" : "mini",
        quarter,
        year,
        description: description || "",
        measurable: measurable || "",
        targetDate: targetDate || null,
        reward: reward || "",
        status: "active",
        progressPercent: 0,
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
