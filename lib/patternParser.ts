// Heuristic knitting / crochet pattern parser.
//
// Turns a blob of pasted pattern text into an ordered list of trackable rows,
// with no external service required. It recognises the shapes real patterns use:
//
//   Row 1: ch 2, sc in each st across (24)
//   Round 5 – sc in each st around
//   Rows 3-6: knit every row
//   Rnds 7 to 12: sc around
//   Repeat rows 3-6 four more times
//   Section headers like "BODY" or "Sleeve (make 2):"
//
// Anything it can't confidently classify is still kept as its own step, so you
// never silently lose a line of your pattern.

export type ParsedRow = {
  section: string;
  label: string;
  instruction: string;
  stitchCount: number | null;
  repeatTarget: number;
};

// Spelled-out numbers that show up in "repeat ... three times".
const WORD_NUMBERS: Record<string, number> = {
  once: 1, twice: 2, thrice: 3,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

// How many individual rows we'll expand a numeric range into before collapsing
// it to a single "worked N times" counter row (keeps "Rows 1-200" from exploding).
const MAX_RANGE_EXPANSION = 60;

function toNumber(word: string): number | null {
  const n = parseInt(word, 10);
  if (!Number.isNaN(n)) return n;
  const w = WORD_NUMBERS[word.toLowerCase()];
  return w ?? null;
}

// Pull a stitch count out of the end of an instruction: "(24)", "(24 sts)",
// "= 24 sts", "— 24 sc". Returns the number and the instruction with the
// trailing count removed (so it can be shown separately as a chip).
function extractStitchCount(text: string): { instruction: string; stitchCount: number | null } {
  const patterns: RegExp[] = [
    /[\s—–-]*\((\d{1,4})\s*(?:sts?|stitches|sc|dc|hdc|tr|dtr|st)?\.?\)\s*$/i, // (24) / (24 sts)
    /\s*[=—–]\s*(\d{1,4})\s*(?:sts?|stitches|sc|dc|hdc|tr|dtr)\b\.?\s*$/i,     // = 24 sts
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      return { instruction: text.replace(re, "").trim(), stitchCount: parseInt(m[1], 10) };
    }
  }
  return { instruction: text.trim(), stitchCount: null };
}

// Detect an explicit "repeat ... N times" instruction. Returns the repeat count
// (the number of TOTAL times the referenced rows are worked) or null.
function detectRepeatTimes(text: string): number | null {
  // "repeat ... 4 more times" / "rep rows 3-6 x4" / "repeat from * twice"
  const m =
    text.match(/\b(?:repeat|rep)\b[^.]*?\b(?:x\s*)?(\d+|once|twice|thrice|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(more\s*)?times?\b/i) ||
    text.match(/\b(?:repeat|rep)\b[^.]*?\bx\s*(\d+)\b/i);
  if (!m) return null;
  const base = toNumber(m[1]);
  if (base == null) return null;
  // "N more times" means the first working already happened, so total = N + 1.
  const more = /more/i.test(m[2] || "") || /\bmore\b/i.test(text);
  return more ? base + 1 : base;
}

// Does this line look like a section header rather than a row?
// e.g. "BODY", "Sleeve (make 2):", "Yoke". Short, no row keyword, title-ish.
function looksLikeSection(line: string): boolean {
  const t = line.trim();
  if (t.length === 0 || t.length > 48) return false;
  if (/\b(row|round|rnd|rnds|rows|rounds)\b/i.test(t)) return false;
  if (/[,;]/.test(t)) return false; // instructions almost always have commas
  // ALL CAPS short line, or a Title Case phrase optionally ending in ":" / "(make 2)"
  const allCaps = /^[A-Z0-9 &'/()-]+$/.test(t) && /[A-Z]{2,}/.test(t);
  const titleColon = /^[A-Z][A-Za-z0-9 &'/()-]*:?$/.test(t) && t.split(/\s+/).length <= 5;
  return allCaps || (titleColon && /[:：]$/.test(t)) || (titleColon && /\(make/i.test(t));
}

const ROW_WORD = "(?:rows?|rounds?|rnds?|rnd)";

/**
 * Parse pattern text into ordered rows.
 */
export function parsePattern(raw: string): ParsedRow[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: ParsedRow[] = [];
  let section = "";

  const rangeRe = new RegExp(`^${ROW_WORD}\\s*(\\d+)\\s*(?:-|–|—|to|through|thru)\\s*(\\d+)\\s*[:.\\)\\-–—]?\\s*(.*)$`, "i");
  const singleRe = new RegExp(`^${ROW_WORD}\\s*(\\d+)\\s*[:.\\)\\-–—]?\\s*(.*)$`, "i");
  const repeatLineRe = /^(?:repeat|rep)\b/i;

  for (const line of lines) {
    // 1) Section header?
    if (looksLikeSection(line)) {
      section = line.replace(/[:：]\s*$/, "").trim();
      continue;
    }

    // 2) A standalone "repeat rows X-Y N times" line → one counter row.
    if (repeatLineRe.test(line)) {
      const times = detectRepeatTimes(line) ?? 2;
      const { instruction, stitchCount } = extractStitchCount(line);
      rows.push({
        section,
        label: "Repeat",
        instruction: instruction || line,
        stitchCount,
        repeatTarget: Math.max(1, times),
      });
      continue;
    }

    // 3) A numeric range: "Rows 3-6: ...", "Rnds 7 to 12: ...".
    const range = line.match(rangeRe);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = parseInt(range[2], 10);
      const body = range[3] || "";
      const { instruction, stitchCount } = extractStitchCount(body);
      const span = Math.abs(end - start) + 1;
      const inlineTimes = detectRepeatTimes(body);

      if (inlineTimes && inlineTimes > 1) {
        // "Rows 3-6 four times" → a single counter row.
        rows.push({ section, label: `${titleCaseRowWord(line)} ${start}-${end}`, instruction, stitchCount, repeatTarget: inlineTimes });
      } else if (span <= MAX_RANGE_EXPANSION) {
        // Expand into individual rows so "current row" is always a real row.
        const step = end >= start ? 1 : -1;
        for (let n = start; step > 0 ? n <= end : n >= end; n += step) {
          rows.push({ section, label: `${singularRowWord(line)} ${n}`, instruction, stitchCount, repeatTarget: 1 });
        }
      } else {
        // Too big to expand — collapse to one counter row covering the span.
        rows.push({ section, label: `${titleCaseRowWord(line)} ${start}-${end}`, instruction, stitchCount, repeatTarget: span });
      }
      continue;
    }

    // 4) A single numbered row: "Row 1: ...", "Round 5 – ...".
    const single = line.match(singleRe);
    if (single) {
      const n = parseInt(single[1], 10);
      const body = single[2] || "";
      const { instruction, stitchCount } = extractStitchCount(body);
      const inlineTimes = detectRepeatTimes(body);
      rows.push({
        section,
        label: `${singularRowWord(line)} ${n}`,
        instruction,
        stitchCount,
        repeatTarget: inlineTimes && inlineTimes > 1 ? inlineTimes : 1,
      });
      continue;
    }

    // 5) Fallback: an unlabelled instruction line. Keep it as its own step so
    //    nothing from the pattern is dropped.
    const { instruction, stitchCount } = extractStitchCount(line);
    rows.push({ section, label: "Step", instruction, stitchCount, repeatTarget: 1 });
  }

  return rows;
}

// "Round 5" → "Round"; "Rnd" → "Rnd"; default "Row".
function singularRowWord(line: string): string {
  const m = line.match(/^(rounds?|rnds?|rnd|rows?)/i);
  if (!m) return "Row";
  const w = m[1].toLowerCase();
  if (w.startsWith("round")) return "Round";
  if (w.startsWith("rnd")) return "Rnd";
  return "Row";
}
function titleCaseRowWord(line: string): string {
  const w = singularRowWord(line);
  return w === "Row" ? "Rows" : w === "Round" ? "Rounds" : "Rnds";
}
