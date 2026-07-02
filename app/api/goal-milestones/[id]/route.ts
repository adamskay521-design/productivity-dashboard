import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { goalMilestones } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { completed, title, dueDate, reward } = await request.json();
    const [row] = await db
      .update(goalMilestones)
      .set({
        ...(completed !== undefined && { completed }),
        ...(title !== undefined && { title }),
        ...(dueDate !== undefined && { dueDate: dueDate || null }),
        ...(reward !== undefined && { reward }),
      })
      .where(eq(goalMilestones.id, id))
      .returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(goalMilestones).where(eq(goalMilestones.id, parseInt(params.id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
