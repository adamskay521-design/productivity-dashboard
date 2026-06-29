import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workouts, exerciseSets } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(workouts).where(eq(workouts.id, parseInt(params.id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, type, date, durationMins, notes } = body;

    const [workout] = await db
      .update(workouts)
      .set({
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(date !== undefined && { date }),
        ...(durationMins !== undefined && { durationMins }),
        ...(notes !== undefined && { notes }),
      })
      .where(eq(workouts.id, id))
      .returning();

    return NextResponse.json(workout);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update workout" }, { status: 500 });
  }
}
