import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { crochetProjects } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, status, patternName, patternUrl, yarnBrand, yarnColor, hookSize, notes, progressPercent, imageUrl } = body;

    const [project] = await db
      .update(crochetProjects)
      .set({
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(patternName !== undefined && { patternName }),
        ...(patternUrl !== undefined && { patternUrl }),
        ...(yarnBrand !== undefined && { yarnBrand }),
        ...(yarnColor !== undefined && { yarnColor }),
        ...(hookSize !== undefined && { hookSize }),
        ...(notes !== undefined && { notes }),
        ...(progressPercent !== undefined && { progressPercent }),
        ...(imageUrl !== undefined && { imageUrl }),
        updatedAt: new Date(),
      })
      .where(eq(crochetProjects.id, id))
      .returning();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(crochetProjects).where(eq(crochetProjects.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
