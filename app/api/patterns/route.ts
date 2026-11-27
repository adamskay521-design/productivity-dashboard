import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patterns, patternRows } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/patterns            → all patterns (newest first)
// GET /api/patterns?projectId=5 → patterns linked to a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const rows = projectId
      ? await db
          .select()
          .from(patterns)
          .where(eq(patterns.projectId, parseInt(projectId, 10)))
          .orderBy(desc(patterns.updatedAt))
      : await db.select().from(patterns).orderBy(desc(patterns.updatedAt));

    // Attach a lightweight row count / progress summary for the list view.
    const withCounts = await Promise.all(
      rows.map(async (p) => {
        const prows = await db
          .select()
          .from(patternRows)
          .where(eq(patternRows.patternId, p.id));
        const total = prows.length;
        const done = prows.filter((r) => r.completed).length;
        return { ...p, totalRows: total, completedRows: done };
      })
    );

    return NextResponse.json(withCounts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch patterns" }, { status: 500 });
  }
}

// POST /api/patterns — create a pattern and its rows in one shot.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      craftType,
      projectId,
      sourceType,
      sourceUrl,
      rawText,
      notes,
      parsedByAi,
      rows,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [pattern] = await db
      .insert(patterns)
      .values({
        name: name.trim(),
        craftType: craftType || "crochet",
        projectId: projectId ? parseInt(String(projectId), 10) : null,
        sourceType: sourceType || "text",
        sourceUrl: sourceUrl || "",
        rawText: rawText || "",
        notes: notes || "",
        parsedByAi: Boolean(parsedByAi),
        currentRow: 0,
      })
      .returning();

    const incoming = Array.isArray(rows) ? rows : [];
    let insertedRows: (typeof patternRows.$inferSelect)[] = [];
    if (incoming.length > 0) {
      insertedRows = await db
        .insert(patternRows)
        .values(
          incoming.map((r: any, i: number) => ({
            patternId: pattern.id,
            position: i,
            section: String(r.section ?? ""),
            label: String(r.label ?? `Row ${i + 1}`),
            instruction: String(r.instruction ?? ""),
            stitchCount:
              r.stitchCount === null || r.stitchCount === undefined || r.stitchCount === ""
                ? null
                : parseInt(String(r.stitchCount), 10),
            repeatTarget: Math.max(1, parseInt(String(r.repeatTarget ?? 1), 10) || 1),
            repeatDone: 0,
            completed: false,
          }))
        )
        .returning();
    }

    return NextResponse.json({ ...pattern, rows: insertedRows }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create pattern" }, { status: 500 });
  }
}
