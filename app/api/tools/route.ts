import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { craftTools } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const toolType = searchParams.get("toolType");

    const rows = toolType
      ? await db.select().from(craftTools)
          .where(eq(craftTools.toolType, toolType as "hook" | "needle"))
          .orderBy(desc(craftTools.createdAt))
      : await db.select().from(craftTools).orderBy(desc(craftTools.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, toolType, size, material, brand, quantity, imageUrl, notes } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    const [row] = await db.insert(craftTools).values({
      name: name.trim(),
      toolType: toolType || "hook",
      size: size ?? "",
      material: material ?? "",
      brand: brand ?? "",
      quantity: quantity ?? 1,
      imageUrl: imageUrl ?? "",
      notes: notes ?? "",
    }).returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
  }
}
