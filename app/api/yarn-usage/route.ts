import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yarnUsage, yarnStash, crochetProjects } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const yarnId = searchParams.get("yarnId");
    const projectId = searchParams.get("projectId");

    const conditions = [];
    if (yarnId) conditions.push(eq(yarnUsage.yarnId, parseInt(yarnId)));
    if (projectId) conditions.push(eq(yarnUsage.projectId, parseInt(projectId)));

    const rows = await db
      .select({
        id: yarnUsage.id,
        yarnId: yarnUsage.yarnId,
        projectId: yarnUsage.projectId,
        skeinsUsed: yarnUsage.skeinsUsed,
        dateUsed: yarnUsage.dateUsed,
        notes: yarnUsage.notes,
        createdAt: yarnUsage.createdAt,
        projectName: crochetProjects.name,
        yarnName: yarnStash.name,
        yarnBrand: yarnStash.brand,
        yarnColorway: yarnStash.colorway,
        yarnColorHex: yarnStash.colorHex,
      })
      .from(yarnUsage)
      .leftJoin(crochetProjects, eq(yarnUsage.projectId, crochetProjects.id))
      .leftJoin(yarnStash, eq(yarnUsage.yarnId, yarnStash.id))
      .where(conditions.length > 0 ? and(...conditions as [ReturnType<typeof eq>]) : undefined)
      .orderBy(desc(yarnUsage.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch yarn usage" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { yarnId, projectId, skeinsUsed, dateUsed, notes } = await req.json();
    if (!yarnId) return NextResponse.json({ error: "yarnId required" }, { status: 400 });

    const used = skeinsUsed ?? 1;

    const [row] = await db.insert(yarnUsage).values({
      yarnId,
      projectId: projectId ?? null,
      skeinsUsed: used,
      dateUsed: dateUsed ?? format(new Date(), "yyyy-MM-dd"),
      notes: notes ?? "",
    }).returning();

    // Decrement skeins remaining
    const [yarn] = await db.select({ skeinsRemaining: yarnStash.skeinsRemaining })
      .from(yarnStash).where(eq(yarnStash.id, yarnId));
    await db.update(yarnStash).set({
      skeinsRemaining: Math.max(0, (yarn?.skeinsRemaining ?? 0) - used),
      updatedAt: new Date(),
    }).where(eq(yarnStash.id, yarnId));

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to log yarn usage" }, { status: 500 });
  }
}
