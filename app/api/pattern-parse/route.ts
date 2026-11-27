import { NextResponse } from "next/server";
import { parsePattern } from "@/lib/patternParser";
import { parsePatternWithAi, hasAiKey } from "@/lib/aiPatternParser";

export const runtime = "nodejs";
export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// POST /api/pattern-parse
// Body (JSON):
//   { engine: "heuristic", text }                     → local text parser
//   { engine: "ai", text }                            → Claude reads messy text
//   { engine: "ai", fileUrl, mediaType }              → Claude reads an uploaded photo/PDF
//   { engine: "ai", fileBase64, mediaType }           → Claude reads inline base64
// Returns: { rows, parsedByAi, warning? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const engine = body.engine === "ai" ? "ai" : "heuristic";
    const text: string = typeof body.text === "string" ? body.text : "";
    const mediaType: string = typeof body.mediaType === "string" ? body.mediaType : "";

    // --- AI engine ----------------------------------------------------------
    if (engine === "ai") {
      if (!hasAiKey()) {
        // No key configured: fall back to the heuristic parser for text, and
        // tell the caller why if they sent a file.
        if (text.trim()) {
          return NextResponse.json({
            rows: parsePattern(text),
            parsedByAi: false,
            warning: "AI parsing isn't configured, so I used the built-in text parser. Add ANTHROPIC_API_KEY to read photos and PDFs.",
          });
        }
        return NextResponse.json(
          { error: "AI parsing isn't configured. Add ANTHROPIC_API_KEY, or paste the pattern text instead." },
          { status: 503 }
        );
      }

      try {
        // Resolve the file bytes, if a file was provided.
        let base64 = typeof body.fileBase64 === "string" ? body.fileBase64 : "";
        if (!base64 && typeof body.fileUrl === "string" && body.fileUrl) {
          const res = await fetch(body.fileUrl);
          if (!res.ok) throw new Error(`Couldn't fetch the uploaded file (${res.status})`);
          const buf = Buffer.from(await res.arrayBuffer());
          base64 = buf.toString("base64");
        }

        let rows;
        if (base64 && mediaType === "application/pdf") {
          rows = await parsePatternWithAi({ kind: "pdf", base64 });
        } else if (base64 && IMAGE_TYPES.includes(mediaType)) {
          rows = await parsePatternWithAi({ kind: "image", base64, mediaType });
        } else if (text.trim()) {
          rows = await parsePatternWithAi({ kind: "text", text });
        } else {
          return NextResponse.json({ error: "Nothing to parse." }, { status: 400 });
        }

        // If the AI came back empty (unreadable image, etc.) but we have text,
        // fall back so the user still gets something to edit.
        if ((!rows || rows.length === 0) && text.trim()) {
          return NextResponse.json({
            rows: parsePattern(text),
            parsedByAi: false,
            warning: "I couldn't read any rows with AI, so I used the built-in text parser instead.",
          });
        }
        if (!rows || rows.length === 0) {
          return NextResponse.json({
            rows: [],
            parsedByAi: true,
            warning: "I couldn't find any rows in that file. Try a clearer photo, or paste the pattern text.",
          });
        }
        return NextResponse.json({ rows, parsedByAi: true });
      } catch (aiErr: any) {
        console.error("AI parse failed:", aiErr);
        // Any AI failure gracefully degrades to the text parser when possible.
        if (text.trim()) {
          return NextResponse.json({
            rows: parsePattern(text),
            parsedByAi: false,
            warning: "AI parsing hit a snag, so I used the built-in text parser instead.",
          });
        }
        return NextResponse.json(
          { error: aiErr?.message || "AI parsing failed. Try pasting the pattern text." },
          { status: 502 }
        );
      }
    }

    // --- Heuristic engine ---------------------------------------------------
    if (!text.trim()) {
      return NextResponse.json({ error: "No pattern text provided." }, { status: 400 });
    }
    return NextResponse.json({ rows: parsePattern(text), parsedByAi: false });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to parse pattern" }, { status: 500 });
  }
}
