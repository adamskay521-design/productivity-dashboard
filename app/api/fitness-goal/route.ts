import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fitnessGoals } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const [row] = await db.select().from(fitnessGoals).orderBy(desc(fitnessGoals.createdAt)).limit(1);
    return NextResponse.json(row ?? null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch fitness goal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startWeight, goalWeight, unit, targetDate } = body;
    if (!startWeight || !goalWeight) {
      return NextResponse.json({ error: "startWeight and goalWeight required" }, { status: 400 });
    }
    const [row] = await db
      .insert(fitnessGoals)
      .values({ startWeight, goalWeight, unit: unit || "lbs", targetDate: targetDate || null })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create fitness goal" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, startWeight, goalWeight, unit, targetDate } = body;
    const [row] = await db
      .update(fitnessGoals)
      .set({
        ...(startWeight !== undefined && { startWeight }),
        ...(goalWeight !== undefined && { goalWeight }),
        ...(unit !== undefined && { unit }),
        ...(targetDate !== undefined && { targetDate }),
        updatedAt: new Date(),
      })
      .where(eq(fitnessGoals.id, id))
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update fitness goal" }, { status: 500 });
  }
}
