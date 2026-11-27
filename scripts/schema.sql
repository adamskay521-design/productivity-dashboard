-- Run this in your Neon SQL Editor to create the database tables.

CREATE TABLE IF NOT EXISTS tasks (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  description TEXT DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date   DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id             SERIAL PRIMARY KEY,
  habit_id       INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, completed_date)
);

CREATE TABLE IF NOT EXISTS notes (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Pattern + Row Tracker
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patterns (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER REFERENCES crochet_projects(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  craft_type   TEXT NOT NULL DEFAULT 'crochet' CHECK (craft_type IN ('crochet','knitting')),
  source_type  TEXT NOT NULL DEFAULT 'text' CHECK (source_type IN ('text','image','pdf')),
  source_url   TEXT NOT NULL DEFAULT '',
  raw_text     TEXT NOT NULL DEFAULT '',
  notes        TEXT NOT NULL DEFAULT '',
  current_row  INTEGER NOT NULL DEFAULT 0,
  parsed_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pattern_rows (
  id            SERIAL PRIMARY KEY,
  pattern_id    INTEGER NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  section       TEXT NOT NULL DEFAULT '',
  label         TEXT NOT NULL DEFAULT '',
  instruction   TEXT NOT NULL DEFAULT '',
  stitch_count  INTEGER,
  repeat_target INTEGER NOT NULL DEFAULT 1,
  repeat_done   INTEGER NOT NULL DEFAULT 0,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pattern_rows_pattern_id_idx ON pattern_rows(pattern_id);
