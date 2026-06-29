import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { title, description, date, endDate, startTime, endTime, allDay, color } = body;

    const [event] = await db
      .update(events)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date }),
        ...(endDate !== undefined && { endDate }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(allDay !== undefined && { allDay }),
        ...(color !== undefined && { color }),
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(event);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(events).where(eq(events.id, parseInt(params.id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
