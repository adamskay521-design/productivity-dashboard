import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgetTransactions } from "@/lib/schema";
import { and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // "YYYY-MM"
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });
    const start = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;
    const rows = await db
      .select()
      .from(budgetTransactions)
      .where(and(gte(budgetTransactions.date, start), lte(budgetTransactions.date, end)))
      .orderBy(desc(budgetTransactions.date));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, amount, type, category, description } = await request.json();
    if (!date || !amount || !type) {
      return NextResponse.json({ error: "date, amount, type required" }, { status: 400 });
    }
    const [row] = await db
      .insert(budgetTransactions)
      .values({ date, amount: parseFloat(amount), type, category: category || "other", description: description || "" })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
