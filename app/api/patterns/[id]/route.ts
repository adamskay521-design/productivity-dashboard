import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patterns, patternRows, crochetProjects } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/patterns/[id] → the pattern plus its ordered rows.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const [pattern] = await db.select().from(patterns).where(eq(patterns.id, id));
    if (!pattern) {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }
    const rows = await db
      .select()
      .from(patternRows)
      .where(eq(patternRows.patternId, id))
      .orderBy(asc(patternRows.position));
    return NextResponse.json({ ...pattern, rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch pattern" }, { status: 500 });
  }
}

// PATCH /api/patterns/[id] → update pattern fields (name, notes, currentRow,
// projectId, craftType). When currentRow + progress change and the pattern is
// linked to a project, mirror the progress onto that project too.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { name, notes, currentRow, projectId, craftType } = body;

    const [pattern] = await db
      .update(patterns)
      .set({
        ...(name !== undefined && { name }),
        ...(notes !== undefined && { notes }),
        ...(currentRow !== undefined && { currentRow }),
        ...(craftType !== undefined && { craftType }),
        ...(projectId !== undefined && {
          projectId: projectId === null || projectId === "" ? null : parseInt(String(projectId), 10),
        }),
        updatedAt: new Date(),
      })
      .where(eq(patterns.id, id))
      .returning();

    if (!pattern) {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }

    // Keep the linked project's row + progress in sync with the tracker.
    if (pattern.projectId) {
      const rows = await db.select().from(patternRows).where(eq(patternRows.patternId, id));
      const total = rows.length;
      const done = rows.filter((r) => r.completed).length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      await db
        .update(crochetProjects)
        .set({ currentRow: pattern.currentRow, progressPercent: progress, updatedAt: new Date() })
        .where(eq(crochetProjects.id, pattern.projectId));
    }

    return NextResponse.json(pattern);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update pattern" }, { status: 500 });
  }
}

// DELETE /api/patterns/[id] → removes the pattern (rows cascade).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    await db.delete(patterns).where(eq(patterns.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete pattern" }, { status: 500 });
  }
}
