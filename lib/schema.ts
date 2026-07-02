import { pgTable, text, timestamp, integer, serial, date, boolean, real, numeric } from "drizzle-orm/pg-core";

export const TASK_CATEGORIES = [
  "house",
  "projects",
  "graduate_school",
  "mentoring",
  "work",
  "personal",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const CATEGORY_META: Record<TaskCategory, { label: string; color: string }> = {
  house:           { label: "House",       color: "#c9913a" },
  projects:        { label: "Projects",    color: "#b89060" },
  graduate_school: { label: "Grad School", color: "#7c5cba" },
  mentoring:       { label: "Mentoring",   color: "#3d8c6a" },
  work:            { label: "Work",        color: "#4a7a8c" },
  personal:        { label: "Personal",    color: "#c45a7a" },
};

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status", { enum: ["todo", "in_progress", "done"] })
    .default("todo")
    .notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .default("medium")
    .notNull(),
  category: text("category", { enum: TASK_CATEGORIES }),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const HABIT_TIMES = ["morning", "evening", "anytime"] as const;
export type HabitTime = (typeof HABIT_TIMES)[number];

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  color: text("color").default("#b89060").notNull(),
  timeOfDay: text("time_of_day", { enum: HABIT_TIMES }).default("anytime").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id")
    .references(() => habits.id, { onDelete: "cascade" })
    .notNull(),
  completedDate: date("completed_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const CRAFT_TYPES = ["crochet", "knitting"] as const;
export type CraftType = (typeof CRAFT_TYPES)[number];

export const CRAFT_TYPE_META: Record<CraftType, { label: string; color: string }> = {
  crochet:  { label: "Crochet",  color: "#c9888c" },
  knitting: { label: "Knitting", color: "#7c9cba" },
};

export const NEEDLE_TYPES = ["straight", "circular", "dpn"] as const;
export type NeedleType = (typeof NEEDLE_TYPES)[number];

export const NEEDLE_TYPE_META: Record<NeedleType, { label: string }> = {
  straight: { label: "Straight" },
  circular: { label: "Circular" },
  dpn:      { label: "Double-Pointed (DPN)" },
};

export const crochetProjects = pgTable("crochet_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["wishlist", "in_progress", "completed", "frogged"] })
    .default("wishlist")
    .notNull(),
  craftType: text("craft_type", { enum: CRAFT_TYPES }).default("crochet").notNull(),
  patternName: text("pattern_name").default(""),
  patternUrl: text("pattern_url").default(""),
  yarnBrand: text("yarn_brand").default(""),
  yarnColor: text("yarn_color").default(""),
  hookSize: text("hook_size").default(""),
  needleSize: text("needle_size").default(""),
  needleType: text("needle_type", { enum: NEEDLE_TYPES }),
  currentRow: integer("current_row").default(0).notNull(),
  tags: text("tags").default("").notNull(),
  notes: text("notes").default(""),
  progressPercent: integer("progress_percent").default(0),
  imageUrl: text("image_url").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectJournalEntries = pgTable("project_journal_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => crochetProjects.id, { onDelete: "cascade" })
    .notNull(),
  entryDate: date("entry_date").notNull(),
  content: text("content").default("").notNull(),
  photoUrl: text("photo_url").default("").notNull(),
  minutesSpent: integer("minutes_spent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gaugeSwatches = pgTable("gauge_swatches", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => crochetProjects.id, { onDelete: "cascade" })
    .notNull(),
  swatchDate: date("swatch_date").notNull(),
  stitchesPer4In: integer("stitches_per_4in"),
  rowsPer4In: integer("rows_per_4in"),
  hookNeedleSize: text("hook_needle_size").default("").notNull(),
  notes: text("notes").default("").notNull(),
  imageUrl: text("image_url").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const TOOL_TYPES = ["hook", "needle"] as const;
export type ToolType = (typeof TOOL_TYPES)[number];

export const TOOL_TYPE_META: Record<ToolType, { label: string }> = {
  hook:   { label: "Hook" },
  needle: { label: "Needle" },
};

export const craftTools = pgTable("craft_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  toolType: text("tool_type", { enum: TOOL_TYPES }).default("hook").notNull(),
  size: text("size").default("").notNull(),
  material: text("material").default("").notNull(),
  brand: text("brand").default("").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  imageUrl: text("image_url").default("").notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const BOOK_STATUSES = ["want_to_read", "reading", "read", "dnf"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const BOOK_STATUS_META: Record<BookStatus, { label: string; color: string }> = {
  want_to_read: { label: "Want to Read", color: "#c9913a" },
  reading:      { label: "Reading",      color: "#b89060" },
  read:         { label: "Read",         color: "#3d8c6a" },
  dnf:          { label: "DNF",          color: "#8c6a5a" },
};

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").default("").notNull(),
  coverUrl: text("cover_url").default("").notNull(),
  olKey: text("ol_key").default("").notNull(),
  status: text("status", { enum: BOOK_STATUSES }).default("want_to_read").notNull(),
  rating: integer("rating"),
  notes: text("notes").default("").notNull(),
  totalPages: integer("total_pages").default(0).notNull(),
  dateFinished: date("date_finished"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Watchlist (Movies/TV) ─────────────────────────────────────────────────────

export const MEDIA_TYPES = ["movie", "tv"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const WATCH_STATUSES = ["want_to_watch", "watching", "watched", "dropped"] as const;
export type WatchStatus = (typeof WATCH_STATUSES)[number];

export const WATCH_STATUS_META: Record<WatchStatus, { label: string; color: string }> = {
  want_to_watch: { label: "Want to Watch", color: "#c9913a" },
  watching:      { label: "Watching",      color: "#b89060" },
  watched:       { label: "Watched",       color: "#3d8c6a" },
  dropped:       { label: "Dropped",       color: "#8c6a5a" },
};

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mediaType: text("media_type", { enum: MEDIA_TYPES }).default("movie").notNull(),
  posterUrl: text("poster_url").default("").notNull(),
  status: text("status", { enum: WATCH_STATUSES }).default("want_to_watch").notNull(),
  rating: integer("rating"),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Daily Meals ────────────────────────────────────────────────────────────────

export const dailyMeals = pgTable("daily_meals", {
  id: serial("id").primaryKey(),
  date: text("date").unique().notNull(), // "yyyy-MM-dd"
  breakfast: text("breakfast").default("").notNull(),
  lunch: text("lunch").default("").notNull(),
  dinner: text("dinner").default("").notNull(),
  snacks: text("snacks").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Daily Check-In (gratitude + affirmation) ───────────────────────────────────

export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  date: text("date").unique().notNull(),
  gratitude: text("gratitude").default("").notNull(),
  affirmation: text("affirmation").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Events ──────────────────────────────────────────────────────────────────

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  date: date("date").notNull(),
  endDate: date("end_date"),
  startTime: text("start_time").default("").notNull(),
  endTime: text("end_time").default("").notNull(),
  allDay: boolean("all_day").default(true).notNull(),
  color: text("color").default("#b89060").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Water ───────────────────────────────────────────────────────────────────

export const waterLogs = pgTable("water_logs", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  cups: integer("cups").default(0).notNull(),
  goalCups: integer("goal_cups").default(8).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Fitness ─────────────────────────────────────────────────────────────────

export const fitnessGoals = pgTable("fitness_goals", {
  id: serial("id").primaryKey(),
  startWeight: real("start_weight").notNull(),
  goalWeight: real("goal_weight").notNull(),
  unit: text("unit").default("lbs").notNull(),
  targetDate: date("target_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  weight: real("weight").notNull(),
  unit: text("unit").default("lbs").notNull(),
  date: date("date").notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const WORKOUT_TYPES = ["strength", "cardio", "yoga", "hiit", "walk", "other"] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_TYPE_META: Record<WorkoutType, { label: string; emoji: string; color: string }> = {
  strength: { label: "Strength",  emoji: "🏋️", color: "#b89060" },
  cardio:   { label: "Cardio",    emoji: "🏃", color: "#6fa8a3" },
  yoga:     { label: "Yoga",      emoji: "🧘", color: "#c9888c" },
  hiit:     { label: "HIIT",      emoji: "⚡", color: "#c9913a" },
  walk:     { label: "Walk",      emoji: "🚶", color: "#3d8c6a" },
  other:    { label: "Other",     emoji: "✨", color: "#7c5cba" },
};

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").default("").notNull(),
  type: text("type", { enum: WORKOUT_TYPES }).default("strength").notNull(),
  date: date("date").notNull(),
  durationMins: integer("duration_mins").default(0).notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exerciseSets = pgTable("exercise_sets", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .references(() => workouts.id, { onDelete: "cascade" })
    .notNull(),
  exercise: text("exercise").notNull(),
  sets: integer("sets").default(1).notNull(),
  reps: integer("reps").default(0).notNull(),
  weight: real("weight").default(0).notNull(),
  unit: text("unit").default("lbs").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Goals ───────────────────────────────────────────────────────────────────

export const GOAL_CATEGORIES = [
  "relationships", "fitness", "home", "career",
  "personal", "creative", "financial", "social",
] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_CATEGORY_META: Record<GoalCategory, { label: string; color: string; emoji: string }> = {
  relationships: { label: "Relationships", color: "#c9888c", emoji: "💕" },
  fitness:       { label: "Fitness",       color: "#6fa8a3", emoji: "💪" },
  home:          { label: "Home",          color: "#c9913a", emoji: "🏠" },
  career:        { label: "Career",        color: "#4a7a8c", emoji: "💼" },
  personal:      { label: "Personal",      color: "#7c5cba", emoji: "✨" },
  creative:      { label: "Creative",      color: "#b89060", emoji: "🎨" },
  financial:     { label: "Financial",     color: "#3d8c6a", emoji: "💰" },
  social:        { label: "Social",        color: "#c45a7a", emoji: "🌸" },
};

export const GOAL_TYPES = ["mega", "mini"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_TYPE_META: Record<GoalType, { label: string; color: string; emoji: string }> = {
  mega: { label: "Mega Goal", color: "#8a5a3a", emoji: "🌟" },
  mini: { label: "Mini Goal", color: "#6fa8a3", emoji: "🎯" },
};

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category", { enum: GOAL_CATEGORIES }).default("personal").notNull(),
  goalType: text("goal_type", { enum: GOAL_TYPES }).default("mini").notNull(),
  quarter: integer("quarter").notNull(),
  year: integer("year").notNull(),
  description: text("description").default("").notNull(),
  measurable: text("measurable").default("").notNull(),
  targetDate: date("target_date"),
  reward: text("reward").default("").notNull(),
  status: text("status", { enum: ["active", "completed", "paused"] }).default("active").notNull(),
  progressPercent: integer("progress_percent").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Mood ─────────────────────────────────────────────────────────────────────

export const MOOD_META: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "Rough",   emoji: "😞", color: "#e05050" },
  2: { label: "Low",     emoji: "😕", color: "#e08050" },
  3: { label: "Okay",    emoji: "😐", color: "#c9913a" },
  4: { label: "Good",    emoji: "🙂", color: "#6fa8a3" },
  5: { label: "Great",   emoji: "😊", color: "#3d8c6a" },
};

export const moodLogs = pgTable("mood_logs", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  mood: integer("mood").notNull(),
  note: text("note").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Journal ──────────────────────────────────────────────────────────────────

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  content: text("content").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Budget ───────────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  "food", "transport", "shopping", "entertainment",
  "health", "bills", "housing", "education", "travel", "care", "other",
] as const;
export const INCOME_CATEGORIES = [
  "salary", "freelance", "gift", "investment", "other_income",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  food:          { label: "Food & Dining",   emoji: "🍽️",  color: "#c9913a" },
  transport:     { label: "Transport",        emoji: "🚗",  color: "#4a7a8c" },
  shopping:      { label: "Shopping",         emoji: "🛍️", color: "#c45a7a" },
  entertainment: { label: "Entertainment",    emoji: "🎬",  color: "#7c5cba" },
  health:        { label: "Health",           emoji: "💊",  color: "#3d8c6a" },
  bills:         { label: "Bills",            emoji: "💡",  color: "#b89060" },
  housing:       { label: "Housing",          emoji: "🏠",  color: "#8a6a1a" },
  education:     { label: "Education",        emoji: "📚",  color: "#5a7ab8" },
  travel:        { label: "Travel",           emoji: "✈️", color: "#6fa8a3" },
  care:          { label: "Personal Care",    emoji: "✨",  color: "#c88890" },
  other:         { label: "Other",            emoji: "📦",  color: "#8a8070" },
};

export const INCOME_CATEGORY_META: Record<IncomeCategory, { label: string; emoji: string; color: string }> = {
  salary:       { label: "Salary",       emoji: "💼", color: "#3d8c6a" },
  freelance:    { label: "Freelance",    emoji: "💻", color: "#4a7a8c" },
  gift:         { label: "Gift",         emoji: "🎁", color: "#c45a7a" },
  investment:   { label: "Investment",   emoji: "📈", color: "#7c5cba" },
  other_income: { label: "Other Income", emoji: "💰", color: "#b89060" },
};

export const budgetTransactions = pgTable("budget_transactions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  amount: real("amount").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  category: text("category").notNull().default("other"),
  description: text("description").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Goal Milestones ──────────────────────────────────────────────────────────

export const goalMilestones = pgTable("goal_milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id")
    .references(() => goals.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  dueDate: date("due_date"),
  reward: text("reward").default("").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Weekly Review ────────────────────────────────────────────────────────────

export const weeklyReviews = pgTable("weekly_reviews", {
  id: serial("id").primaryKey(),
  weekStart: date("week_start").notNull(),
  wins: text("wins").default("").notNull(),
  challenges: text("challenges").default("").notNull(),
  focusNext: text("focus_next").default("").notNull(),
  gratitude: text("gratitude").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Monthly Review ───────────────────────────────────────────────────────────

export const CLOSEOUT_CATEGORIES = ["finance", "todo", "home", "brain_dump"] as const;
export type CloseoutCategory = (typeof CLOSEOUT_CATEGORIES)[number];

export const CLOSEOUT_CATEGORY_META: Record<CloseoutCategory, { label: string }> = {
  finance:    { label: "Finance" },
  todo:       { label: "To-Do List Review" },
  home:       { label: "Home Management" },
  brain_dump: { label: "Brain Dump & Idea Bank" },
};

// Fixed template — identical every month, lazily seeded per-month by the API route.
export const CLOSEOUT_ITEMS: Record<CloseoutCategory, string[]> = {
  finance: [
    "Reconcile bank statements/spending for the month",
    "Record income and current account balances",
    "Review budget vs. actual spending",
    "Pay any outstanding bills for the month",
    "Double-check subscriptions, cancel any unnecessary or unused",
  ],
  todo: [
    "Review running task list and adjust priority",
    "Schedule important tasks in calendar",
  ],
  home: [
    "Block cleaning tasks on calendar",
    "Complete digital and physical filing (mail sorting, email sorting)",
    "Grocery Plan & Schedule Shop",
  ],
  brain_dump: [
    "Review and file brain dump",
    "Review monthly tik tok saves and schedule, action, or file",
    "Review monthly pinterest saves and schedule, action, or file",
    "Notes app cleanup",
    "iPhone app clean up",
    "Camera Roll clean up",
  ],
};

export const monthlyReviews = pgTable("monthly_reviews", {
  id: serial("id").primaryKey(),
  month: text("month").unique().notNull(), // "YYYY-MM"
  wins: text("wins").default("").notNull(),
  lessons: text("lessons").default("").notNull(),
  checkIn: text("check_in").default("").notNull(),
  gratitude: text("gratitude").default("").notNull(),
  theme: text("theme").default("").notNull(),
  mantra: text("mantra").default("").notNull(),
  megaGoalFocus: text("mega_goal_focus").default("").notNull(),
  miniGoalFocus: text("mini_goal_focus").default("").notNull(),
  topProjects: text("top_projects").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const monthlyCloseoutItems = pgTable("monthly_closeout_items", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // matches monthlyReviews.month by value, no FK
  category: text("category", { enum: CLOSEOUT_CATEGORIES }).notNull(),
  label: text("label").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Reading Goal ─────────────────────────────────────────────────────────────

export const readingGoals = pgTable("reading_goals", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  goalCount: integer("goal_count").notNull().default(12),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Declutter ───────────────────────────────────────────────────────────────

export const declutterAreas = pgTable("declutter_areas", {
  id: serial("id").primaryKey(),
  room: text("room").notNull(),
  area: text("area").default("").notNull(),
  status: text("status", { enum: ["not_started", "in_progress", "done"] }).default("not_started").notNull(),
  itemsCount: integer("items_count").default(0).notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Yarn Stash ───────────────────────────────────────────────────────────────

export const YARN_WEIGHTS = ["lace", "fingering", "sport", "dk", "worsted", "aran", "bulky", "super-bulky"] as const;
export type YarnWeight = (typeof YARN_WEIGHTS)[number];

export const YARN_WEIGHT_META: Record<YarnWeight, { label: string; color: string; textColor: string }> = {
  "lace":        { label: "Lace",        color: "#f0eaf5", textColor: "#7a4a9a" },
  "fingering":   { label: "Fingering",   color: "#e8f0fa", textColor: "#3a5a8a" },
  "sport":       { label: "Sport",       color: "#e8f5ec", textColor: "#2e6e4a" },
  "dk":          { label: "DK",          color: "#f5f0e8", textColor: "#7a5a2a" },
  "worsted":     { label: "Worsted",     color: "#fae8e8", textColor: "#8a3a3a" },
  "aran":        { label: "Aran",        color: "#faf0e0", textColor: "#7a5a1a" },
  "bulky":       { label: "Bulky",       color: "#e8f5f0", textColor: "#2a6a5a" },
  "super-bulky": { label: "Super Bulky", color: "#f5e8f0", textColor: "#7a2a5a" },
};

export const yarnStash = pgTable("yarn_stash", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").default("").notNull(),
  colorway: text("colorway").default("").notNull(),
  weight: text("weight").default("worsted").notNull(),
  fiber: text("fiber").default("").notNull(),
  yardage: integer("yardage"),
  grams: integer("grams"),
  colorHex: text("color_hex").default("#c8a882").notNull(),
  totalSkeins: real("total_skeins").default(1).notNull(),
  skeinsRemaining: real("skeins_remaining").default(1).notNull(),
  imageUrl: text("image_url").default("").notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const yarnUsage = pgTable("yarn_usage", {
  id: serial("id").primaryKey(),
  yarnId: integer("yarn_id")
    .references(() => yarnStash.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id")
    .references(() => crochetProjects.id, { onDelete: "set null" }),
  skeinsUsed: real("skeins_used").default(1).notNull(),
  dateUsed: date("date_used").notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitLog = typeof habitLogs.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type CrochetProject = typeof crochetProjects.$inferSelect;
export type NewCrochetProject = typeof crochetProjects.$inferInsert;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type CalendarEvent = typeof events.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;
export type FitnessGoal = typeof fitnessGoals.$inferSelect;
export type WeightLog = typeof weightLogs.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type DeclutterArea = typeof declutterAreas.$inferSelect;
export type MoodLog = typeof moodLogs.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type BudgetTransaction = typeof budgetTransactions.$inferSelect;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;
export type MonthlyReview = typeof monthlyReviews.$inferSelect;
export type MonthlyCloseoutItem = typeof monthlyCloseoutItems.$inferSelect;
export type ReadingGoal = typeof readingGoals.$inferSelect;
export type YarnStash = typeof yarnStash.$inferSelect;
export type YarnUsage = typeof yarnUsage.$inferSelect;
export type ProjectJournalEntry = typeof projectJournalEntries.$inferSelect;
export type GaugeSwatch = typeof gaugeSwatches.$inferSelect;
export type CraftTool = typeof craftTools.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type DailyMeal = typeof dailyMeals.$inferSelect;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
