import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gaugeSwatches } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const rows = projectId
      ? await db.select().from(gaugeSwatches)
          .where(eq(gaugeSwatches.projectId, parseInt(projectId)))
          .orderBy(desc(gaugeSwatches.swatchDate))
      : await db.select().from(gaugeSwatches).orderBy(desc(gaugeSwatches.swatchDate));

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch gauge swatches" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { projectId, swatchDate, stitchesPer4In, rowsPer4In, hookNeedleSize, notes, imageUrl } = await req.json();
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const [row] = await db.insert(gaugeSwatches).values({
      projectId,
      swatchDate: swatchDate || format(new Date(), "yyyy-MM-dd"),
      stitchesPer4In: stitchesPer4In ?? null,
      rowsPer4In: rowsPer4In ?? null,
      hookNeedleSize: hookNeedleSize ?? "",
      notes: notes ?? "",
      imageUrl: imageUrl ?? "",
    }).returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create gauge swatch" }, { status: 500 });
  }
}
