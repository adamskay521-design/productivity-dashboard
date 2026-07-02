import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetTransactions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(budgetTransactions).where(eq(budgetTransactions.id, parseInt(params.id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
