import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: { date: string } }
) {
  try {
    await db.delete(moodLogs).where(eq(moodLogs.date, params.date));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete mood log" }, { status: 500 });
  }
}
