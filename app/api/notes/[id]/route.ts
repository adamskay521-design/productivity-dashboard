import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { title, content } = body;

    const [note] = await db
      .update(notes)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id))
      .returning();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(notes).where(eq(notes.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
