import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS tasks (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    description TEXT DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
    priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    due_date   DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS habits (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    color       TEXT NOT NULL DEFAULT '#6366f1',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS habit_logs (
    id             SERIAL PRIMARY KEY,
    habit_id       INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(habit_id, completed_date)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS notes (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS crochet_projects (
    id               SERIAL PRIMARY KEY,
    name             TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'wishlist'
                       CHECK (status IN ('wishlist','in_progress','completed','frogged')),
    pattern_name     TEXT DEFAULT '',
    pattern_url      TEXT DEFAULT '',
    yarn_brand       TEXT DEFAULT '',
    yarn_color       TEXT DEFAULT '',
    hook_size        TEXT DEFAULT '',
    notes            TEXT DEFAULT '',
    progress_percent INTEGER DEFAULT 0,
    image_url        TEXT DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT
`;

await sql`
  CREATE TABLE IF NOT EXISTS books (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    author      TEXT NOT NULL DEFAULT '',
    cover_url   TEXT NOT NULL DEFAULT '',
    ol_key      TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'want_to_read'
                  CHECK (status IN ('want_to_read','reading','read','dnf')),
    rating      INTEGER,
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date        DATE NOT NULL,
    end_date    DATE,
    start_time  TEXT NOT NULL DEFAULT '',
    end_time    TEXT NOT NULL DEFAULT '',
    all_day     BOOLEAN NOT NULL DEFAULT true,
    color       TEXT NOT NULL DEFAULT '#b89060',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS water_logs (
    id         SERIAL PRIMARY KEY,
    date       DATE NOT NULL UNIQUE,
    cups       INTEGER NOT NULL DEFAULT 0,
    goal_cups  INTEGER NOT NULL DEFAULT 8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS fitness_goals (
    id           SERIAL PRIMARY KEY,
    start_weight REAL NOT NULL,
    goal_weight  REAL NOT NULL,
    unit         TEXT NOT NULL DEFAULT 'lbs',
    target_date  DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS weight_logs (
    id         SERIAL PRIMARY KEY,
    weight     REAL NOT NULL,
    unit       TEXT NOT NULL DEFAULT 'lbs',
    date       DATE NOT NULL,
    notes      TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS workouts (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL DEFAULT '',
    type          TEXT NOT NULL DEFAULT 'strength'
                    CHECK (type IN ('strength','cardio','yoga','hiit','walk','other')),
    date          DATE NOT NULL,
    duration_mins INTEGER NOT NULL DEFAULT 0,
    notes         TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS exercise_sets (
    id         SERIAL PRIMARY KEY,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise   TEXT NOT NULL,
    sets       INTEGER NOT NULL DEFAULT 1,
    reps       INTEGER NOT NULL DEFAULT 0,
    weight     REAL NOT NULL DEFAULT 0,
    unit       TEXT NOT NULL DEFAULT 'lbs',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS goals (
    id               SERIAL PRIMARY KEY,
    title            TEXT NOT NULL,
    category         TEXT NOT NULL DEFAULT 'personal',
    quarter          INTEGER NOT NULL,
    year             INTEGER NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','completed','paused')),
    progress_percent INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS declutter_areas (
    id          SERIAL PRIMARY KEY,
    room        TEXT NOT NULL,
    area        TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'not_started'
                  CHECK (status IN ('not_started','in_progress','done')),
    items_count INTEGER NOT NULL DEFAULT 0,
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

console.log("✓ All tables created");
