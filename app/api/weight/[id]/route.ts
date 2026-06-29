import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weightLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(weightLogs).where(eq(weightLogs.id, parseInt(params.id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete weight log" }, { status: 500 });
  }
}
