// AI-powered pattern parsing with Claude. Reads a photo or PDF of a knitting /
// crochet pattern (or messy pasted text) and returns the same ParsedRow shape
// the heuristic parser produces, so the rest of the app doesn't care which
// engine was used.
//
// Requires ANTHROPIC_API_KEY. The caller is responsible for falling back to the
// heuristic parser when no key is configured.

import Anthropic from "@anthropic-ai/sdk";
import type { ParsedRow } from "./patternParser";

// Default to the current flagship model. Override with PATTERN_PARSE_MODEL
// (e.g. "claude-haiku-5-5") to trade a little accuracy for lower cost.
const MODEL = process.env.PATTERN_PARSE_MODEL || "claude-opus-5-5";

const SYSTEM_PROMPT = `You are a meticulous assistant that converts knitting and crochet patterns into a structured, row-by-row tracker.

You will be given a pattern as text, a photo, or a PDF. Extract every working row/round in order.

Rules:
- Return ONE entry per row or round that the maker actually works, in order from start to finish.
- Expand explicit numeric ranges into individual rows when the span is 60 or fewer (e.g. "Rows 3-6: knit" becomes four entries: Row 3, Row 4, Row 5, Row 6, each with the same instruction). For larger ranges, use a single entry and set repeatTarget to the number of rows.
- For "repeat rows X-Y N times" style instructions, create ONE entry with repeatTarget set to the total number of times that block is worked.
- Preserve the maker's abbreviations exactly (sc, dc, k2tog, yo, etc.). Do not rewrite or "helpfully" expand them.
- "label" is the short name shown on the counter, e.g. "Row 1", "Round 5", "Rnds 7-12", or "Setup". Keep it short.
- "section" groups rows under a heading like "Body", "Sleeve", "Yoke". Use "" if the pattern has no sections.
- "stitchCount" is the stitch count at the end of a row when the pattern states one (the number in parentheses, or after "="). Use null when none is given.
- "repeatTarget" is how many times this single entry is worked; default 1.
- Ignore materials lists, gauge notes, abbreviation keys, and finishing prose that isn't a worked row — UNLESS it's a genuine working step, in which case include it with label "Step".
- If the image/PDF is unreadable or clearly not a pattern, return an empty array.

Respond with ONLY a JSON object of the form:
{"rows": [{"section": "", "label": "Row 1", "instruction": "ch 2, sc in each st across", "stitchCount": 24, "repeatTarget": 1}]}
No markdown, no commentary.`;

type AiInput =
  | { kind: "text"; text: string }
  | { kind: "image"; base64: string; mediaType: string }
  | { kind: "pdf"; base64: string };

export function hasAiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function coerceRows(parsed: unknown): ParsedRow[] {
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as any).rows)
      ? (parsed as any).rows
      : [];
  const rows: ParsedRow[] = [];
  for (const r of list) {
    if (!r || typeof r !== "object") continue;
    const instruction = String((r as any).instruction ?? "").trim();
    const label = String((r as any).label ?? "").trim() || "Row";
    if (!instruction && label === "Row") continue;
    const rawCount = (r as any).stitchCount;
    const stitchCount =
      rawCount === null || rawCount === undefined || rawCount === ""
        ? null
        : Number.isFinite(Number(rawCount))
          ? Math.trunc(Number(rawCount))
          : null;
    const repeatTarget = Math.max(1, Math.trunc(Number((r as any).repeatTarget) || 1));
    rows.push({
      section: String((r as any).section ?? "").trim(),
      label,
      instruction,
      stitchCount,
      repeatTarget,
    });
  }
  return rows;
}

// Strip accidental markdown fences and grab the first JSON object/array.
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    return [];
  }
}

export async function parsePatternWithAi(input: AiInput): Promise<ParsedRow[]> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const content: Anthropic.MessageParam["content"] = [];
  if (input.kind === "text") {
    content.push({ type: "text", text: `Here is the pattern:\n\n${input.text}` });
  } else if (input.kind === "image") {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.mediaType as any, data: input.base64 },
    });
    content.push({ type: "text", text: "Extract the rows from this pattern image." });
  } else {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.base64 },
    });
    content.push({ type: "text", text: "Extract the rows from this pattern PDF." });
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The pattern couldn't be read (the request was declined). Try pasting the text instead.");
  }

  const textOut = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return coerceRows(extractJson(textOut));
}
