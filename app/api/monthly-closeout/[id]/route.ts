import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthlyCloseoutItems } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { completed } = await request.json();
    const [row] = await db
      .update(monthlyCloseoutItems)
      .set({ completed: !!completed })
      .where(eq(monthlyCloseoutItems.id, parseInt(params.id)))
      .returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
