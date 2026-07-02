import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { goals } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { title, category, description, measurable, targetDate, reward, status, progressPercent } = body;

    const [row] = await db
      .update(goals)
      .set({
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(measurable !== undefined && { measurable }),
        ...(targetDate !== undefined && { targetDate: targetDate || null }),
        ...(reward !== undefined && { reward }),
        ...(status !== undefined && { status }),
        ...(progressPercent !== undefined && { progressPercent }),
        updatedAt: new Date(),
      })
      .where(eq(goals.id, id))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(goals).where(eq(goals.id, parseInt(params.id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
