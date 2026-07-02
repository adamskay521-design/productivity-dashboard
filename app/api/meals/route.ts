import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyMeals } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const [row] = await db.select().from(dailyMeals).where(eq(dailyMeals.date, date));
    return NextResponse.json(row ?? null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, breakfast, lunch, dinner, snacks } = await request.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const fields = {
      breakfast: breakfast ?? "",
      lunch: lunch ?? "",
      dinner: dinner ?? "",
      snacks: snacks ?? "",
    };

    const [row] = await db
      .insert(dailyMeals)
      .values({ date, ...fields })
      .onConflictDoUpdate({
        target: dailyMeals.date,
        set: { ...fields, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save meals" }, { status: 500 });
  }
}
