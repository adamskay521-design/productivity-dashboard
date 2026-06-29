import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { declutterAreas } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(declutterAreas).orderBy(asc(declutterAreas.room), asc(declutterAreas.area));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch declutter areas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room, area, notes } = body;
    if (!room?.trim()) return NextResponse.json({ error: "room required" }, { status: 400 });

    const [row] = await db
      .insert(declutterAreas)
      .values({ room: room.trim(), area: area?.trim() || "", notes: notes || "" })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create area" }, { status: 500 });
  }
}
