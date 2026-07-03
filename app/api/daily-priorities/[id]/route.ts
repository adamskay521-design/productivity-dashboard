import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyPriorities } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { text, completed } = await request.json();

    const [row] = await db
      .update(dailyPriorities)
      .set({
        ...(text !== undefined && { text }),
        ...(completed !== undefined && { completed }),
      })
      .where(eq(dailyPriorities.id, id))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update priority" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(dailyPriorities).where(eq(dailyPriorities.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete priority" }, { status: 500 });
  }
}
