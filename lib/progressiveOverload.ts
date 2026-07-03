export type LoggedSet = {
  date: string;
  sets: number;
  reps: number;
  weight: number;
  unit: string;
};

export type ProgressionAdvice = {
  status: "increase" | "hold" | "not-enough-data";
  message: string;
  suggestedWeight?: number;
  delta?: number;
};

function roundIncrement(weight: number, unit: string): number {
  const raw = weight * 0.05;
  if (unit === "kg") return Math.max(1, Math.round(raw / 1) * 1);
  return Math.max(2.5, Math.round(raw / 2.5) * 2.5);
}

/** entries must be sorted most-recent-first */
export function getProgressionAdvice(entries: LoggedSet[]): ProgressionAdvice {
  if (entries.length === 0) {
    return { status: "not-enough-data", message: "No history yet." };
  }
  const [latest, prev] = entries;

  if (!prev) {
    return {
      status: "not-enough-data",
      message: `Logged once so far at ${latest.weight} ${latest.unit}. Log it again at the same weight to get a recommendation.`,
    };
  }

  if (latest.weight !== prev.weight) {
    return {
      status: "not-enough-data",
      message: `You changed weight since last time — log one more session at ${latest.weight} ${latest.unit} to see a trend.`,
    };
  }

  if (latest.reps >= prev.reps) {
    if (latest.weight === 0) {
      return {
        status: "increase",
        message: `Solid reps two sessions in a row at bodyweight (${prev.reps} → ${latest.reps}). Try adding a few more reps, or add light resistance next time.`,
      };
    }
    const delta = roundIncrement(latest.weight, latest.unit);
    const suggestedWeight = latest.weight + delta;
    return {
      status: "increase",
      message: `Matched or beat your reps two sessions in a row at ${latest.weight} ${latest.unit} (${prev.reps} → ${latest.reps}). Try ${suggestedWeight} ${latest.unit} next time.`,
      suggestedWeight,
      delta,
    };
  }

  return {
    status: "hold",
    message: `Reps dipped from ${prev.reps} to ${latest.reps} at ${latest.weight} ${latest.unit}. Hold this weight and aim to match ${prev.reps} reps again before going up.`,
  };
}
