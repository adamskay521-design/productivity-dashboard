import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { craftTools } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const { name, toolType, size, material, brand, quantity, imageUrl, notes } = await req.json();

    const [row] = await db.update(craftTools).set({
      ...(name !== undefined && { name }),
      ...(toolType !== undefined && { toolType }),
      ...(size !== undefined && { size }),
      ...(material !== undefined && { material }),
      ...(brand !== undefined && { brand }),
      ...(quantity !== undefined && { quantity }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
    }).where(eq(craftTools.id, id)).returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(craftTools).where(eq(craftTools.id, parseInt(params.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
  }
}
