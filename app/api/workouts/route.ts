import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workouts, exerciseSets } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");

    const rows = await db.select().from(workouts).orderBy(desc(workouts.date)).limit(limit);

    // Attach exercise sets
    const withSets = await Promise.all(
      rows.map(async (w) => {
        const sets = await db.select().from(exerciseSets).where(eq(exerciseSets.workoutId, w.id));
        return { ...w, exercises: sets };
      })
    );

    return NextResponse.json(withSets);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch workouts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, date, durationMins, notes, exercises } = body;

    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const [workout] = await db
      .insert(workouts)
      .values({
        name: name || "",
        type: type || "strength",
        date,
        durationMins: durationMins || 0,
        notes: notes || "",
      })
      .returning();

    const sets = [];
    if (exercises?.length) {
      for (const ex of exercises) {
        const [s] = await db
          .insert(exerciseSets)
          .values({
            workoutId: workout.id,
            exercise: ex.exercise,
            sets: ex.sets || 1,
            reps: ex.reps || 0,
            weight: ex.weight || 0,
            unit: ex.unit || "lbs",
          })
          .returning();
        sets.push(s);
      }
    }

    return NextResponse.json({ ...workout, exercises: sets }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create workout" }, { status: 500 });
  }
}
