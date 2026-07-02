import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthlyCloseoutItems, CLOSEOUT_ITEMS, CLOSEOUT_CATEGORIES } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });

    const existing = await db
      .select()
      .from(monthlyCloseoutItems)
      .where(eq(monthlyCloseoutItems.month, month));

    const existingKeys = new Set(existing.map((r) => `${r.category}::${r.label}`));

    const missing = CLOSEOUT_CATEGORIES.flatMap((category) =>
      CLOSEOUT_ITEMS[category]
        .filter((label) => !existingKeys.has(`${category}::${label}`))
        .map((label) => ({ month, category, label }))
    );

    if (missing.length > 0) {
      await db.insert(monthlyCloseoutItems).values(missing).onConflictDoNothing();
    }

    const rows = missing.length > 0
      ? await db.select().from(monthlyCloseoutItems).where(eq(monthlyCloseoutItems.month, month))
      : existing;

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch checklist" }, { status: 500 });
  }
}
