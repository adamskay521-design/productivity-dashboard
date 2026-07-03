import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brainDumps } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
    const [row] = await db.select().from(brainDumps).where(eq(brainDumps.date, date));
    return NextResponse.json(row ?? null);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch brain dump" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, content } = await request.json();
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const fields = { content: content ?? "" };

    const [row] = await db
      .insert(brainDumps)
      .values({ date, ...fields })
      .onConflictDoUpdate({
        target: brainDumps.date,
        set: { ...fields, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save brain dump" }, { status: 500 });
  }
}
