import { pgTable, text, timestamp, integer, serial, date, boolean, real } from "drizzle-orm/pg-core";

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

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  color: text("color").default("#b89060").notNull(),
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

export const crochetProjects = pgTable("crochet_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["wishlist", "in_progress", "completed", "frogged"] })
    .default("wishlist")
    .notNull(),
  patternName: text("pattern_name").default(""),
  patternUrl: text("pattern_url").default(""),
  yarnBrand: text("yarn_brand").default(""),
  yarnColor: text("yarn_color").default(""),
  hookSize: text("hook_size").default(""),
  notes: text("notes").default(""),
  progressPercent: integer("progress_percent").default(0),
  imageUrl: text("image_url").default(""),
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

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category", { enum: GOAL_CATEGORIES }).default("personal").notNull(),
  quarter: integer("quarter").notNull(),
  year: integer("year").notNull(),
  description: text("description").default("").notNull(),
  status: text("status", { enum: ["active", "completed", "paused"] }).default("active").notNull(),
  progressPercent: integer("progress_percent").default(0).notNull(),
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
