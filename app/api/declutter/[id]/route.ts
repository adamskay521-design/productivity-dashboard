import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { declutterAreas } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { room, area, status, itemsCount, notes } = body;

    const [row] = await db
      .update(declutterAreas)
      .set({
        ...(room !== undefined && { room }),
        ...(area !== undefined && { area }),
        ...(status !== undefined && { status }),
        ...(itemsCount !== undefined && { itemsCount: Math.max(0, itemsCount) }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(declutterAreas.id, id))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update area" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(declutterAreas).where(eq(declutterAreas.id, parseInt(params.id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete area" }, { status: 500 });
  }
}
