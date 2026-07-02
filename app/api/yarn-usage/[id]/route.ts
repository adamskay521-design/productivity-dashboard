import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yarnUsage, yarnStash } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    const [usage] = await db.select().from(yarnUsage).where(eq(yarnUsage.id, id));
    if (!usage) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [yarn] = await db.select({ skeinsRemaining: yarnStash.skeinsRemaining, totalSkeins: yarnStash.totalSkeins })
      .from(yarnStash).where(eq(yarnStash.id, usage.yarnId));

    await db.update(yarnStash).set({
      skeinsRemaining: Math.min(yarn?.totalSkeins ?? 999, (yarn?.skeinsRemaining ?? 0) + usage.skeinsUsed),
      updatedAt: new Date(),
    }).where(eq(yarnStash.id, usage.yarnId));

    await db.delete(yarnUsage).where(eq(yarnUsage.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete usage" }, { status: 500 });
  }
}
