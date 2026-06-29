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
