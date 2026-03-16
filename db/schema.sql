-- Workout sessions
CREATE TABLE IF NOT EXISTS workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  phase INTEGER NOT NULL CHECK (phase IN (1, 2, 3)),
  day_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX idx_workout_logs_date ON workout_logs(date);

-- Individual exercise sets within a workout
CREATE TABLE IF NOT EXISTS exercise_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL REFERENCES workout_logs(id),
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  reps INTEGER NOT NULL,
  is_top_set INTEGER NOT NULL DEFAULT 0,
  UNIQUE(workout_id, exercise_id, set_number)
);

CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id);

-- Tracks which exercises are explicitly finished (vs just auto-saved)
CREATE TABLE IF NOT EXISTS exercise_completions (
  workout_id INTEGER NOT NULL REFERENCES workout_logs(id),
  exercise_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (workout_id, exercise_id)
);

-- Daily body weight tracking
CREATE TABLE IF NOT EXISTS body_weight (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL
);

-- Daily walking pad tracking
CREATE TABLE IF NOT EXISTS walking_pad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  duration_minutes INTEGER NOT NULL,
  distance_km REAL NOT NULL
);
