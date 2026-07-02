import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yarnStash } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(yarnStash).orderBy(desc(yarnStash.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch yarn stash" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, brand, colorway, weight, fiber, yardage, grams, colorHex, totalSkeins, imageUrl, notes } = body;
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const skeins = totalSkeins ?? 1;
    const [row] = await db.insert(yarnStash).values({
      name: name.trim(),
      brand: brand ?? "",
      colorway: colorway ?? "",
      weight: weight ?? "worsted",
      fiber: fiber ?? "",
      yardage: yardage ?? null,
      grams: grams ?? null,
      colorHex: colorHex ?? "#c8a882",
      totalSkeins: skeins,
      skeinsRemaining: skeins,
      imageUrl: imageUrl ?? "",
      notes: notes ?? "",
    }).returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create yarn" }, { status: 500 });
  }
}
