import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { goalMilestones } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get("goalId");
    if (!goalId) return NextResponse.json({ error: "goalId required" }, { status: 400 });
    const rows = await db
      .select()
      .from(goalMilestones)
      .where(eq(goalMilestones.goalId, parseInt(goalId)))
      .orderBy(asc(goalMilestones.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { goalId, title, dueDate, reward } = await request.json();
    if (!goalId || !title?.trim()) {
      return NextResponse.json({ error: "goalId and title required" }, { status: 400 });
    }
    const [row] = await db
      .insert(goalMilestones)
      .values({ goalId, title: title.trim(), dueDate: dueDate || null, reward: reward || "", completed: false })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}
