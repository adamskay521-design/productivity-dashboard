import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query = db.select().from(tasks).orderBy(desc(tasks.createdAt));
    const rows = status
      ? await db
          .select()
          .from(tasks)
          .where(eq(tasks.status, status as "todo" | "in_progress" | "done"))
          .orderBy(desc(tasks.createdAt))
      : await query;

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, dueDate, category } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [task] = await db
      .insert(tasks)
      .values({
        title: title.trim(),
        description,
        priority,
        dueDate: dueDate || null,
        category: category || null,
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
