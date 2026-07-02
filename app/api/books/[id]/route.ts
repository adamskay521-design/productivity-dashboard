import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { books } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { status, rating, notes, totalPages, dateFinished } = body;

    const [book] = await db
      .update(books)
      .set({
        ...(status !== undefined && { status }),
        ...(rating !== undefined && { rating: rating ?? null }),
        ...(notes !== undefined && { notes }),
        ...(totalPages !== undefined && { totalPages }),
        ...(dateFinished !== undefined && { dateFinished: dateFinished ?? null }),
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning();

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(books).where(eq(books.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
