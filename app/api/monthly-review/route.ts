import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthlyReviews } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });
    const [row] = await db
      .select()
      .from(monthlyReviews)
      .where(eq(monthlyReviews.month, month));
    return NextResponse.json(row ?? null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { month, wins, lessons, checkIn, gratitude, theme, mantra, megaGoalFocus, miniGoalFocus, topProjects } = await request.json();
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });

    const fields = {
      wins: wins ?? "",
      lessons: lessons ?? "",
      checkIn: checkIn ?? "",
      gratitude: gratitude ?? "",
      theme: theme ?? "",
      mantra: mantra ?? "",
      megaGoalFocus: megaGoalFocus ?? "",
      miniGoalFocus: miniGoalFocus ?? "",
      topProjects: topProjects ?? "",
    };

    const [row] = await db
      .insert(monthlyReviews)
      .values({ month, ...fields })
      .onConflictDoUpdate({
        target: monthlyReviews.month,
        set: { ...fields, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
