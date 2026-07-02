import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weeklyReviews } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");
    if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });
    const [row] = await db
      .select()
      .from(weeklyReviews)
      .where(eq(weeklyReviews.weekStart, weekStart));
    return NextResponse.json(row ?? null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { weekStart, wins, challenges, focusNext, gratitude } = await request.json();
    if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });
    const [row] = await db
      .insert(weeklyReviews)
      .values({
        weekStart,
        wins: wins ?? "",
        challenges: challenges ?? "",
        focusNext: focusNext ?? "",
        gratitude: gratitude ?? "",
      })
      .onConflictDoUpdate({
        target: weeklyReviews.weekStart,
        set: {
          wins: wins ?? "",
          challenges: challenges ?? "",
          focusNext: focusNext ?? "",
          gratitude: gratitude ?? "",
          updatedAt: new Date(),
        },
      })
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
