import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectJournalEntries } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const { entryDate, content, photoUrl, minutesSpent } = await req.json();

    const [row] = await db.update(projectJournalEntries).set({
      ...(entryDate !== undefined && { entryDate }),
      ...(content !== undefined && { content }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(minutesSpent !== undefined && { minutesSpent }),
    }).where(eq(projectJournalEntries.id, id)).returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update journal entry" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(projectJournalEntries).where(eq(projectJournalEntries.id, parseInt(params.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete journal entry" }, { status: 500 });
  }
}
