import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yarnStash } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { name, brand, colorway, weight, fiber, yardage, grams, colorHex, totalSkeins, skeinsRemaining, imageUrl, notes } = body;
    const [row] = await db.update(yarnStash).set({
      ...(name !== undefined && { name }),
      ...(brand !== undefined && { brand }),
      ...(colorway !== undefined && { colorway }),
      ...(weight !== undefined && { weight }),
      ...(fiber !== undefined && { fiber }),
      ...(yardage !== undefined && { yardage }),
      ...(grams !== undefined && { grams }),
      ...(colorHex !== undefined && { colorHex }),
      ...(totalSkeins !== undefined && { totalSkeins }),
      ...(skeinsRemaining !== undefined && { skeinsRemaining }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
    }).where(eq(yarnStash.id, id)).returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update yarn" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(yarnStash).where(eq(yarnStash.id, parseInt(params.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete yarn" }, { status: 500 });
  }
}
