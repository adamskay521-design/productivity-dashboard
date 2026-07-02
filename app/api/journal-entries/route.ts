import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectJournalEntries } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const rows = projectId
      ? await db.select().from(projectJournalEntries)
          .where(eq(projectJournalEntries.projectId, parseInt(projectId)))
          .orderBy(desc(projectJournalEntries.entryDate), desc(projectJournalEntries.createdAt))
      : await db.select().from(projectJournalEntries)
          .orderBy(desc(projectJournalEntries.entryDate), desc(projectJournalEntries.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { projectId, entryDate, content, photoUrl, minutesSpent } = await req.json();
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
    if (!content?.trim() && !photoUrl?.trim()) {
      return NextResponse.json({ error: "Entry needs content or a photo" }, { status: 400 });
    }

    const [row] = await db.insert(projectJournalEntries).values({
      projectId,
      entryDate: entryDate || format(new Date(), "yyyy-MM-dd"),
      content: content ?? "",
      photoUrl: photoUrl ?? "",
      minutesSpent: minutesSpent ?? null,
    }).returning();

    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
