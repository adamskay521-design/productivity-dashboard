import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { crochetProjects } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(crochetProjects).orderBy(desc(crochetProjects.updatedAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, status, craftType, patternName, patternUrl, yarnBrand, yarnColor,
      hookSize, needleSize, needleType, currentRow, tags, notes, progressPercent, imageUrl,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [project] = await db
      .insert(crochetProjects)
      .values({
        name: name.trim(),
        status: status || "wishlist",
        craftType: craftType || "crochet",
        patternName,
        patternUrl,
        yarnBrand,
        yarnColor,
        hookSize,
        needleSize,
        needleType: needleType || null,
        currentRow: currentRow ?? 0,
        tags: tags ?? "",
        notes,
        progressPercent: progressPercent ?? 0,
        imageUrl,
      })
      .returning();

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
