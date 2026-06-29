import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { books } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(books).orderBy(desc(books.createdAt));
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, author, coverUrl, olKey, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [book] = await db
      .insert(books)
      .values({
        title: title.trim(),
        author: author || "",
        coverUrl: coverUrl || "",
        olKey: olKey || "",
        status: status || "want_to_read",
      })
      .returning();

    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
