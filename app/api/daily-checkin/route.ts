import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyCheckins } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const [row] = await db.select().from(dailyCheckins).where(eq(dailyCheckins.date, date));
    return NextResponse.json(row ?? null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch check-in" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, gratitude, affirmation } = await request.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const fields = {
      gratitude: gratitude ?? "",
      affirmation: affirmation ?? "",
    };

    const [row] = await db
      .insert(dailyCheckins)
      .values({ date, ...fields })
      .onConflictDoUpdate({
        target: dailyCheckins.date,
        set: { ...fields, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }
}
