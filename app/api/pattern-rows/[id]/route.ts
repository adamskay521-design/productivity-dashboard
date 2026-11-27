import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patternRows } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// PATCH /api/pattern-rows/[id] → update a single row's progress or text.
// Accepts: completed, repeatDone, section, label, instruction, stitchCount, repeatTarget.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { completed, repeatDone, section, label, instruction, stitchCount, repeatTarget } = body;

    const [row] = await db
      .update(patternRows)
      .set({
        ...(completed !== undefined && { completed: Boolean(completed) }),
        ...(repeatDone !== undefined && { repeatDone: Math.max(0, parseInt(String(repeatDone), 10) || 0) }),
        ...(section !== undefined && { section: String(section) }),
        ...(label !== undefined && { label: String(label) }),
        ...(instruction !== undefined && { instruction: String(instruction) }),
        ...(stitchCount !== undefined && {
          stitchCount:
            stitchCount === null || stitchCount === "" ? null : parseInt(String(stitchCount), 10),
        }),
        ...(repeatTarget !== undefined && {
          repeatTarget: Math.max(1, parseInt(String(repeatTarget), 10) || 1),
        }),
      })
      .where(eq(patternRows.id, id))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update row" }, { status: 500 });
  }
}
