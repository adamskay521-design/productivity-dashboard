import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readingGoals } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const [row] = await db.select().from(readingGoals).where(eq(readingGoals.year, year));
    return NextResponse.json(row ?? null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch reading goal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { year, goalCount } = await request.json();
    if (!year || !goalCount) return NextResponse.json({ error: "year and goalCount required" }, { status: 400 });
    const [row] = await db
      .insert(readingGoals)
      .values({ year, goalCount })
      .onConflictDoUpdate({
        target: readingGoals.year,
        set: { goalCount, updatedAt: new Date() },
      })
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save reading goal" }, { status: 500 });
  }
}
