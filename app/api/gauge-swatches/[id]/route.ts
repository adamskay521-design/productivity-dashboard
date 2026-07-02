import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gaugeSwatches } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(gaugeSwatches).where(eq(gaugeSwatches.id, parseInt(params.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete gauge swatch" }, { status: 500 });
  }
}
