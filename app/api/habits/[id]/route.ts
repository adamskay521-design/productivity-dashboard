import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { habits } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(habits).where(eq(habits.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
