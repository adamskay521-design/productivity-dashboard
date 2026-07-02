import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { title, mediaType, posterUrl, status, rating, notes } = body;

    const [row] = await db
      .update(watchlist)
      .set({
        ...(title !== undefined && { title }),
        ...(mediaType !== undefined && { mediaType }),
        ...(posterUrl !== undefined && { posterUrl }),
        ...(status !== undefined && { status }),
        ...(rating !== undefined && { rating: rating ?? null }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(watchlist.id, id))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update watchlist item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(watchlist).where(eq(watchlist.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete watchlist item" }, { status: 500 });
  }
}
