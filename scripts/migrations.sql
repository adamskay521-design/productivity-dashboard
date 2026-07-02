-- Run this in your Neon SQL Editor to add new feature tables.

-- Books: page count + date finished
ALTER TABLE books ADD COLUMN IF NOT EXISTS total_pages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS date_finished DATE;

-- Mood logs (one entry per day)
CREATE TABLE IF NOT EXISTS mood_logs (
  id          SERIAL PRIMARY KEY,
  date        DATE NOT NULL UNIQUE,
  mood        INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal entries (one entry per day)
CREATE TABLE IF NOT EXISTS journal_entries (
  id          SERIAL PRIMARY KEY,
  date        DATE NOT NULL UNIQUE,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budget transactions
CREATE TABLE IF NOT EXISTS budget_transactions (
  id          SERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  amount      REAL NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category    TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goal milestones
CREATE TABLE IF NOT EXISTS goal_milestones (
  id         SERIAL PRIMARY KEY,
  goal_id    INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly reviews (one entry per week, keyed by Monday date)
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id          SERIAL PRIMARY KEY,
  week_start  DATE NOT NULL UNIQUE,
  wins        TEXT NOT NULL DEFAULT '',
  challenges  TEXT NOT NULL DEFAULT '',
  focus_next  TEXT NOT NULL DEFAULT '',
  gratitude   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Yearly reading goals
CREATE TABLE IF NOT EXISTS reading_goals (
  id          SERIAL PRIMARY KEY,
  year        INTEGER NOT NULL UNIQUE,
  goal_count  INTEGER NOT NULL DEFAULT 12,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMART goals: measurable criteria, target date, reward
ALTER TABLE goals ADD COLUMN IF NOT EXISTS measurable TEXT NOT NULL DEFAULT '';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS reward TEXT NOT NULL DEFAULT '';

-- Milestones: due date + reward
ALTER TABLE goal_milestones ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE goal_milestones ADD COLUMN IF NOT EXISTS reward TEXT NOT NULL DEFAULT '';

-- Yarn stash + usage log (backfilled here for parity with lib/schema.ts)
CREATE TABLE IF NOT EXISTS yarn_stash (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  brand             TEXT NOT NULL DEFAULT '',
  colorway          TEXT NOT NULL DEFAULT '',
  weight            TEXT NOT NULL DEFAULT 'worsted',
  fiber             TEXT NOT NULL DEFAULT '',
  yardage           INTEGER,
  grams             INTEGER,
  color_hex         TEXT NOT NULL DEFAULT '#c8a882',
  total_skeins      REAL NOT NULL DEFAULT 1,
  skeins_remaining  REAL NOT NULL DEFAULT 1,
  image_url         TEXT NOT NULL DEFAULT '',
  notes             TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yarn_usage (
  id           SERIAL PRIMARY KEY,
  yarn_id      INTEGER NOT NULL REFERENCES yarn_stash(id) ON DELETE CASCADE,
  project_id   INTEGER REFERENCES crochet_projects(id) ON DELETE SET NULL,
  skeins_used  REAL NOT NULL DEFAULT 1,
  date_used    DATE NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crochet & Knitting journal: craft type, needles, tags, row counter
ALTER TABLE crochet_projects ADD COLUMN IF NOT EXISTS craft_type TEXT NOT NULL DEFAULT 'crochet';
ALTER TABLE crochet_projects ADD COLUMN IF NOT EXISTS needle_size TEXT DEFAULT '';
ALTER TABLE crochet_projects ADD COLUMN IF NOT EXISTS needle_type TEXT;
ALTER TABLE crochet_projects ADD COLUMN IF NOT EXISTS current_row INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crochet_projects ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT '';

-- Journal entries per project (dated, optional photo + time spent)
CREATE TABLE IF NOT EXISTS project_journal_entries (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES crochet_projects(id) ON DELETE CASCADE,
  entry_date    DATE NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  photo_url     TEXT NOT NULL DEFAULT '',
  minutes_spent INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gauge swatches per project
CREATE TABLE IF NOT EXISTS gauge_swatches (
  id                SERIAL PRIMARY KEY,
  project_id        INTEGER NOT NULL REFERENCES crochet_projects(id) ON DELETE CASCADE,
  swatch_date       DATE NOT NULL,
  stitches_per_4in  INTEGER,
  rows_per_4in      INTEGER,
  hook_needle_size  TEXT NOT NULL DEFAULT '',
  notes             TEXT NOT NULL DEFAULT '',
  image_url         TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tool inventory (hooks/needles owned) — project-independent
CREATE TABLE IF NOT EXISTS craft_tools (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  tool_type  TEXT NOT NULL DEFAULT 'hook' CHECK (tool_type IN ('hook','needle')),
  size       TEXT NOT NULL DEFAULT '',
  material   TEXT NOT NULL DEFAULT '',
  brand      TEXT NOT NULL DEFAULT '',
  quantity   INTEGER NOT NULL DEFAULT 1,
  image_url  TEXT NOT NULL DEFAULT '',
  notes      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
