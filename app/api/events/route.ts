import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { desc, and, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const conditions = [];
    if (start) conditions.push(gte(events.date, start));
    if (end) conditions.push(lte(events.date, end));

    const rows = await db
      .select()
      .from(events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(events.date, events.startTime);

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, date, endDate, startTime, endTime, allDay, color } = body;

    if (!title?.trim() || !date) {
      return NextResponse.json({ error: "title and date are required" }, { status: 400 });
    }

    const [event] = await db
      .insert(events)
      .values({
        title: title.trim(),
        description: description || "",
        date,
        endDate: endDate || null,
        startTime: startTime || "",
        endTime: endTime || "",
        allDay: allDay !== false,
        color: color || "#b89060",
      })
      .returning();

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
