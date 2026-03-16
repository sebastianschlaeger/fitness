# Fitness App Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal fitness dashboard that tracks gym workouts, body weight, and walking pad usage, with motivation features (streaks, Mammutmarsch countdown).

**Architecture:** Vite + React + TypeScript SPA on Cloudflare Pages, with Cloudflare D1 (SQLite) as database accessed through Pages Functions (Workers). Single-user, no auth. Training plan is static data in code; all tracking data persists in D1.

**Tech Stack:** Vite, React 18, TypeScript, TailwindCSS, Recharts, React Router v6, Cloudflare Pages, Cloudflare D1, Wrangler CLI

**Spec:** `docs/superpowers/specs/2026-03-16-fitness-app-design.md`

---

## File Structure

```
fitness/
  src/
    data/
      training-plan.ts          # Static training plan data (phases, days, exercises)
    lib/
      dates.ts                  # Phase calculation, week number, date utilities
      api.ts                    # Fetch wrapper for /api/* calls
    components/
      TabBar.tsx                # Bottom 5-tab navigation
      StreakWidget.tsx           # Streak counter display
      CountdownWidget.tsx        # Mammutmarsch countdown
      PhaseProgress.tsx          # Phase progress bar
      WeekView.tsx              # 7-day activity boxes (Nie-Null)
      ExerciseCard.tsx          # Exercise row in training list
      SetInput.tsx              # Weight/reps input row for a single set
      WeightChart.tsx           # Line chart for body weight
      WalkingChart.tsx          # Bar chart for walking pad km/day
    pages/
      Dashboard.tsx             # Home screen with widgets
      Training.tsx              # Today's workout exercise list
      ExerciseDetail.tsx        # Set-by-set logging for one exercise
      Weight.tsx                # Body weight entry + chart
      Walking.tsx               # Walking pad entry + stats
      Plan.tsx                  # Full training plan reference
    App.tsx                     # Router + layout
    main.tsx                    # Entry point
    index.css                   # Tailwind imports + custom dark theme
  functions/
    api/
      workouts/
        index.ts                # GET list, POST create
        today.ts                # GET today's workout
        [id].ts                 # PATCH complete
      exercises/
        index.ts                # POST log sets (UPSERT)
        [exerciseId]/
          last.ts               # GET last logged sets
      weight/
        index.ts                # GET range, POST log
        latest.ts               # GET latest
      walking/
        index.ts                # GET range, POST log
        stats.ts                # GET aggregated stats
      dashboard.ts              # GET aggregated dashboard data
  public/
    images/
      equipment/                # Equipment photos (downloaded from web)
  db/
    schema.sql                  # D1 schema (all tables)
  wrangler.toml                 # Cloudflare config + D1 binding
  vite.config.ts
  tsconfig.json
  package.json
```

---

## Chunk 1: Project Setup + Data Layer

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `wrangler.toml`, `.gitignore`

- [ ] **Step 1: Initialize git and create `.gitignore`**

```bash
cd c:/Programmierung/Claude/fitness
git init
```

Create `.gitignore`:

```
node_modules/
dist/
.wrangler/
.superpowers/
.dev.vars
bun.lockb
```

- [ ] **Step 2: Initialize project with Vite**

```bash
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, choose to overwrite (the docs/ directory will be preserved).

- [ ] **Step 3: Install dependencies**

```bash
npm install react-router-dom recharts
npm install -D tailwindcss @tailwindcss/vite wrangler
```

- [ ] **Step 4: Set up `src/index.css` with Tailwind v4 theme**

Tailwind v4 uses CSS-based configuration (no `tailwind.config.ts`). Define custom colors via `@theme`:

```css
@import 'tailwindcss';

@theme {
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-surface2: #242836;
  --color-border: #2e3345;
  --color-text-primary: #e4e6f0;
  --color-text-dim: #8b90a5;
  --color-accent: #6366f1;
  --color-accent-light: #818cf8;
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}
```

- [ ] **Step 6: Update `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 7: Create minimal `src/App.tsx`**

```tsx
export default function App() {
  return <div className="min-h-screen bg-bg text-text-primary p-4">
    <h1 className="text-2xl font-bold">Fitness App</h1>
    <p className="text-text-dim">Setup works!</p>
  </div>
}
```

- [ ] **Step 8: Create `wrangler.toml`**

```toml
name = "fitness"
compatibility_date = "2024-12-01"
pages_build_output_dir = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "fitness-db"
database_id = "" # Will be filled after creating the D1 database
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: App opens at http://localhost:5173 showing "Fitness App" on dark background.

- [ ] **Step 10: Commit**

```bash
git add .gitignore package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/ wrangler.toml
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind project"
```

---

### Task 2: D1 Database Schema

**Files:**
- Create: `db/schema.sql`

- [ ] **Step 1: Write the schema**

Create `db/schema.sql`:

```sql
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
```

- [ ] **Step 2: Create D1 database**

```bash
npx wrangler d1 create fitness-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`.

- [ ] **Step 3: Apply schema to local D1**

```bash
npx wrangler d1 execute fitness-db --local --file=db/schema.sql
```

Expected: "Executed N queries" without errors.

- [ ] **Step 4: Apply schema to remote D1**

```bash
npx wrangler d1 execute fitness-db --remote --file=db/schema.sql
```

- [ ] **Step 5: Commit**

```bash
git add db/schema.sql wrangler.toml
git commit -m "feat: add D1 database schema for workout, weight, and walking tracking"
```

---

### Task 3: Training Plan Static Data

**Files:**
- Create: `src/data/training-plan.ts`

- [ ] **Step 1: Define TypeScript types and all training plan data**

Create `src/data/training-plan.ts`. This file contains the full training plan across all 3 phases. It's a large file because it contains all exercise data, but it has one clear responsibility: static plan data.

```typescript
export type Exercise = {
  id: string
  name: string
  equipment: string
  equipmentImage: string
  sets: number
  hints?: string
  shoulderWarning?: string
}

export type TrainingDay = {
  daysOfWeek: number[] // 1=Mon, 2=Tue, ..., 5=Fri
  name: string
  exercises: Exercise[]
}

export type Phase = {
  phase: 1 | 2 | 3
  name: string
  weeks: [number, number] // [start, end] inclusive
  gymDaysPerWeek: number
  days: TrainingDay[]
}

export const PLAN_START_DATE = '2026-03-16'
export const MAMMUTMARSCH_DATE = '2026-09-05'
export const START_WEIGHT_KG = 94
export const GOAL_WEIGHT_KG = 80

export const phases: Phase[] = [
  {
    phase: 1,
    name: 'Wiedereinstieg',
    weeks: [1, 4],
    gymDaysPerWeek: 3,
    days: [
      {
        daysOfWeek: [1, 3, 5], // Mo, Mi, Fr
        name: 'Ganzkörper',
        exercises: [
          {
            id: 'beinpresse-technogym',
            name: 'Beinpresse',
            equipment: 'Technogym Leg Press',
            equipmentImage: '/images/equipment/technogym-leg-press.jpg',
            sets: 3,
            hints: 'Füße schulterbreit, nicht zu tief',
          },
          {
            id: 'beinbeuger-l030',
            name: 'Beinbeuger liegend',
            equipment: 'L030',
            equipmentImage: '/images/equipment/bh-l030-lying-leg-curl.jpg',
            sets: 3,
            hints: 'Kontrolliert, kein Schwung',
          },
          {
            id: 'brustpresse-technogym',
            name: 'Brustpresse',
            equipment: 'Technogym Chest Press',
            equipmentImage: '/images/equipment/technogym-chest-press.jpg',
            sets: 3,
            hints: 'Nicht zu tief absenken',
            shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve',
          },
          {
            id: 'rudermaschine-pl300',
            name: 'Rudermaschine',
            equipment: 'PL300 Seated Row',
            equipmentImage: '/images/equipment/bh-pl300-seated-row.jpg',
            sets: 3,
            hints: 'Schulterblätter zusammen, Ellbogen nah am Körper',
          },
          {
            id: 'latzug-pl110',
            name: 'Latzug',
            equipment: 'PL110',
            equipmentImage: '/images/equipment/bh-pl110-lat-pulley.jpg',
            sets: 3,
            hints: 'Weiter Griff, zur Brust ziehen (nicht Nacken!)',
          },
          {
            id: 'bauchmaschine-technogym',
            name: 'Bauchmaschine',
            equipment: 'Technogym Abdominal Crunch',
            equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg',
            sets: 3,
            hints: 'Langsam und kontrolliert',
          },
          {
            id: 'rueckenstrecker-technogym',
            name: 'Rückenstrecker',
            equipment: 'Technogym Lower Back',
            equipmentImage: '/images/equipment/technogym-lower-back.jpg',
            sets: 3,
            hints: 'Kein Überstrecken',
          },
        ],
      },
    ],
  },
  {
    phase: 2,
    name: 'Aufbau',
    weeks: [5, 12],
    gymDaysPerWeek: 4,
    days: [
      {
        daysOfWeek: [1, 4], // Mo, Do
        name: 'Unterkörper',
        exercises: [
          { id: 'beinpresse-pl700', name: 'Beinpresse', equipment: 'PL700 (Plate Loaded)', equipmentImage: '/images/equipment/bh-pl700-leg-press.jpg', sets: 4, hints: 'Hauptübung, hier darfst du schwer gehen' },
          { id: 'hack-squat-pl200', name: 'Hack Squat', equipment: 'PL200', equipmentImage: '/images/equipment/bh-pl200-hack-squat.jpg', sets: 3 },
          { id: 'beinstrecker-technogym', name: 'Beinstrecker', equipment: 'Technogym Leg Extension', equipmentImage: '/images/equipment/technogym-leg-extension.jpg', sets: 3 },
          { id: 'beinbeuger-l030', name: 'Beinbeuger liegend', equipment: 'L030', equipmentImage: '/images/equipment/bh-l030-lying-leg-curl.jpg', sets: 3 },
          { id: 'hip-thrust-pl340', name: 'Hip Thrust', equipment: 'PL340', equipmentImage: '/images/equipment/bh-pl340-hip-thrust.jpg', sets: 3 },
          { id: 'waden-pl210', name: 'Waden', equipment: 'PL210 Seated Calf', equipmentImage: '/images/equipment/bh-pl210-seated-calf.jpg', sets: 3 },
          { id: 'adduktoren-technogym', name: 'Adduktoren', equipment: 'Technogym Adductor', equipmentImage: '/images/equipment/technogym-adductor.jpg', sets: 3 },
          { id: 'abduktoren-technogym', name: 'Abduktoren', equipment: 'Technogym Abductor', equipmentImage: '/images/equipment/technogym-abductor.jpg', sets: 3 },
        ],
      },
      {
        daysOfWeek: [2, 5], // Di, Fr
        name: 'Oberkörper',
        exercises: [
          { id: 'brustpresse-technogym', name: 'Brustpresse', equipment: 'Technogym Chest Press', equipmentImage: '/images/equipment/technogym-chest-press.jpg', sets: 4, shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve' },
          { id: 'rudermaschine-pl300', name: 'Rudermaschine', equipment: 'PL300 Seated Row', equipmentImage: '/images/equipment/bh-pl300-seated-row.jpg', sets: 4 },
          { id: 'latzug-technogym', name: 'Latzug', equipment: 'Technogym Vertical Traction', equipmentImage: '/images/equipment/technogym-vertical-traction.jpg', sets: 3 },
          { id: 'butterfly-technogym', name: 'Butterfly', equipment: 'Technogym Pectoral', equipmentImage: '/images/equipment/technogym-pectoral.jpg', sets: 3, hints: 'Nicht zu weit öffnen' },
          { id: 'hintere-schulter-l410', name: 'Hintere Schulter', equipment: 'L410 Rear Deltoid', equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg', sets: 3, hints: 'Leichtes Gewicht, schulter-safe' },
          { id: 'oberer-ruecken-technogym', name: 'Oberer Rücken', equipment: 'Technogym Upper Back', equipmentImage: '/images/equipment/technogym-upper-back.jpg', sets: 3 },
          { id: 'bauchmaschine-technogym', name: 'Bauchmaschine', equipment: 'Technogym Abdominal Crunch', equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg', sets: 3 },
          { id: 'rueckenstrecker-technogym', name: 'Rückenstrecker', equipment: 'Technogym Lower Back', equipmentImage: '/images/equipment/technogym-lower-back.jpg', sets: 3 },
        ],
      },
    ],
  },
  {
    phase: 3,
    name: 'Leistung',
    weeks: [13, 24],
    gymDaysPerWeek: 5,
    days: [
      {
        daysOfWeek: [1], // Mo
        name: 'Push',
        exercises: [
          { id: 'brustpresse-technogym', name: 'Brustpresse', equipment: 'Technogym Chest Press', equipmentImage: '/images/equipment/technogym-chest-press.jpg', sets: 4, shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve' },
          { id: 'schraegbrustpresse-l080', name: 'Schrägbrustpresse', equipment: 'L080', equipmentImage: '/images/equipment/bh-l080-chest-shoulder.jpg', sets: 3 },
          { id: 'butterfly-technogym', name: 'Butterfly', equipment: 'Technogym Pectoral', equipmentImage: '/images/equipment/technogym-pectoral.jpg', sets: 3 },
          { id: 'kabelzug-trizeps-l480', name: 'Kabelzug Trizeps', equipment: 'L480 Multifunktionsturm', equipmentImage: '/images/equipment/bh-l480-multistation.jpg', sets: 3 },
          { id: 'bauchmaschine-technogym', name: 'Bauch', equipment: 'Technogym Abdominal Crunch', equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg', sets: 4 },
        ],
      },
      {
        daysOfWeek: [2], // Di
        name: 'Pull',
        exercises: [
          { id: 'latzug-pl110', name: 'Latzug', equipment: 'PL110', equipmentImage: '/images/equipment/bh-pl110-lat-pulley.jpg', sets: 4 },
          { id: 'rudermaschine-pl300', name: 'Rudern', equipment: 'PL300 Seated Row', equipmentImage: '/images/equipment/bh-pl300-seated-row.jpg', sets: 4 },
          { id: 'oberer-ruecken-technogym', name: 'Oberer Rücken', equipment: 'Technogym Upper Back', equipmentImage: '/images/equipment/technogym-upper-back.jpg', sets: 3 },
          { id: 'hintere-schulter-l410', name: 'Hintere Schulter', equipment: 'L410 Rear Deltoid', equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg', sets: 3 },
          { id: 'kabelzug-bizeps-l480', name: 'Kabelzug Bizeps', equipment: 'L480 Multifunktionsturm', equipmentImage: '/images/equipment/bh-l480-multistation.jpg', sets: 3 },
          { id: 'rueckenstrecker-technogym', name: 'Rückenstrecker', equipment: 'Technogym Lower Back', equipmentImage: '/images/equipment/technogym-lower-back.jpg', sets: 3 },
        ],
      },
      {
        daysOfWeek: [3], // Mi
        name: 'Legs',
        exercises: [
          { id: 'hack-squat-pl200', name: 'Hack Squat', equipment: 'PL200', equipmentImage: '/images/equipment/bh-pl200-hack-squat.jpg', sets: 4 },
          { id: 'belt-squat-pl320', name: 'Belt Squat', equipment: 'PL320', equipmentImage: '/images/equipment/bh-pl320-belt-squat.jpg', sets: 3 },
          { id: 'beinbeuger-l030', name: 'Beinbeuger', equipment: 'L030', equipmentImage: '/images/equipment/bh-l030-lying-leg-curl.jpg', sets: 4 },
          { id: 'beinstrecker-technogym', name: 'Beinstrecker', equipment: 'Technogym Leg Extension', equipmentImage: '/images/equipment/technogym-leg-extension.jpg', sets: 3 },
          { id: 'hip-thrust-pl340', name: 'Hip Thrust', equipment: 'PL340', equipmentImage: '/images/equipment/bh-pl340-hip-thrust.jpg', sets: 3 },
          { id: 'waden-pl210', name: 'Waden', equipment: 'PL210', equipmentImage: '/images/equipment/bh-pl210-seated-calf.jpg', sets: 4 },
        ],
      },
      {
        daysOfWeek: [4], // Do
        name: 'Upper',
        exercises: [
          { id: 'rudern-technogym', name: 'Rudern', equipment: 'Technogym Low Row', equipmentImage: '/images/equipment/technogym-low-row.jpg', sets: 4 },
          { id: 'brustpresse-technogym', name: 'Brustpresse', equipment: 'Technogym Chest Press', equipmentImage: '/images/equipment/technogym-chest-press.jpg', sets: 3, shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve' },
          { id: 'latzug-technogym', name: 'Latzug', equipment: 'Technogym Vertical Traction', equipmentImage: '/images/equipment/technogym-vertical-traction.jpg', sets: 3 },
          { id: 'butterfly-technogym', name: 'Butterfly', equipment: 'Technogym Pectoral', equipmentImage: '/images/equipment/technogym-pectoral.jpg', sets: 3 },
          { id: 'hintere-schulter-l410', name: 'Hintere Schulter', equipment: 'L410', equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg', sets: 3 },
          { id: 'kabelzug-trizeps-l480', name: 'Kabelzug Trizeps + Bizeps', equipment: 'L480', equipmentImage: '/images/equipment/bh-l480-multistation.jpg', sets: 3 },
          { id: 'bauch-ruecken-technogym', name: 'Bauch + Rücken', equipment: 'Technogym Abdominal + Lower Back', equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg', sets: 3 },
        ],
      },
      {
        daysOfWeek: [5], // Fr
        name: 'Lower',
        exercises: [
          { id: 'beinpresse-technogym', name: 'Beinpresse', equipment: 'Technogym Leg Press', equipmentImage: '/images/equipment/technogym-leg-press.jpg', sets: 4 },
          { id: 'beinbeuger-technogym', name: 'Beinbeuger', equipment: 'Technogym Leg Curl', equipmentImage: '/images/equipment/technogym-leg-curl.jpg', sets: 3 },
          { id: 'beinstrecker-l010', name: 'Beinstrecker', equipment: 'L010', equipmentImage: '/images/equipment/bh-l010-leg-extension.jpg', sets: 3 },
          { id: 'adduktoren-technogym', name: 'Adduktoren', equipment: 'Technogym Adductor', equipmentImage: '/images/equipment/technogym-adductor.jpg', sets: 3 },
          { id: 'abduktoren-technogym', name: 'Abduktoren', equipment: 'Technogym Abductor', equipmentImage: '/images/equipment/technogym-abductor.jpg', sets: 3 },
          { id: 'rear-kick-pl330', name: 'Rear Kick', equipment: 'PL330', equipmentImage: '/images/equipment/bh-pl330-rear-kick.jpg', sets: 3 },
          { id: 'waden-pl210', name: 'Waden', equipment: 'PL210', equipmentImage: '/images/equipment/bh-pl210-seated-calf.jpg', sets: 3 },
        ],
      },
    ],
  },
]
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit src/data/training-plan.ts
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/training-plan.ts
git commit -m "feat: add complete training plan data for all 3 phases"
```

---

### Task 4: Date Utilities

**Files:**
- Create: `src/lib/dates.ts`

- [ ] **Step 1: Implement date utility functions**

Create `src/lib/dates.ts`:

```typescript
import { phases, PLAN_START_DATE, MAMMUTMARSCH_DATE, type Phase, type TrainingDay } from '../data/training-plan'

/** Get ISO date string for today (YYYY-MM-DD) */
export function today(): string {
  return new Date().toISOString().split('T')[0]
}

/** Calculate week number since plan start (1-based) */
export function getWeekNumber(date: string = today()): number {
  const start = new Date(PLAN_START_DATE)
  const current = new Date(date)
  const diffMs = current.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

/** Get current phase based on date */
export function getCurrentPhase(date: string = today()): Phase {
  const week = getWeekNumber(date)
  for (const phase of phases) {
    if (week >= phase.weeks[0] && week <= phase.weeks[1]) {
      return phase
    }
  }
  // After plan ends, stay on phase 3
  return phases[2]
}

/** Get day of week (1=Mon, 7=Sun) */
export function getDayOfWeek(date: string = today()): number {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  return day === 0 ? 7 : day
}

/** Get today's training day (or null if rest day) */
export function getTodaysTraining(date: string = today()): TrainingDay | null {
  const phase = getCurrentPhase(date)
  const dow = getDayOfWeek(date)
  for (const day of phase.days) {
    if (day.daysOfWeek.includes(dow)) {
      return day
    }
  }
  return null
}

/** Days until Mammutmarsch */
export function daysUntilMammutmarsch(date: string = today()): number {
  const target = new Date(MAMMUTMARSCH_DATE)
  const current = new Date(date)
  const diffMs = target.getTime() - current.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

/** Get Monday of the week containing the given date */
export function getWeekStart(date: string = today()): string {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

/** Get all 7 dates (Mon-Sun) for the week containing the given date */
export function getWeekDates(date: string = today()): string[] {
  const monday = new Date(getWeekStart(date))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

/** Week progress within current phase (e.g., week 3 of 4) */
export function getPhaseWeekProgress(date: string = today()): { current: number; total: number } {
  const phase = getCurrentPhase(date)
  const week = getWeekNumber(date)
  const current = week - phase.weeks[0] + 1
  const total = phase.weeks[1] - phase.weeks[0] + 1
  return { current: Math.min(current, total), total }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/dates.ts
git commit -m "feat: add date utility functions for phase calculation and week tracking"
```

---

### Task 5: API Client

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Implement fetch wrapper**

Create `src/lib/api.ts`:

```typescript
const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// --- Workouts ---

export type WorkoutLog = {
  id: number
  date: string
  phase: number
  day_name: string
  started_at: string
  completed_at: string | null
}

export function getWorkouts(from: string, to: string) {
  return request<WorkoutLog[]>(`/workouts?from=${from}&to=${to}`)
}

export function getTodaysWorkout() {
  return request<WorkoutLog | null>('/workouts/today')
}

export function startWorkout(data: { date: string; phase: number; day_name: string }) {
  return request<WorkoutLog>('/workouts', { method: 'POST', body: JSON.stringify(data) })
}

export function completeWorkout(id: number) {
  return request<WorkoutLog>(`/workouts/${id}`, { method: 'PATCH' })
}

// --- Exercise Logs ---

export type ExerciseLog = {
  id: number
  workout_id: number
  exercise_id: string
  set_number: number
  weight_kg: number
  reps: number
  is_top_set: number
}

export function getLastExerciseSets(exerciseId: string) {
  return request<ExerciseLog[]>(`/exercises/${exerciseId}/last`)
}

export function getWorkoutExercises(workoutId: number) {
  return request<ExerciseLog[]>(`/exercises?workout_id=${workoutId}`)
}

export function logExerciseSets(sets: Omit<ExerciseLog, 'id'>[]) {
  return request<{ success: boolean }>('/exercises', { method: 'POST', body: JSON.stringify({ sets }) })
}

// --- Body Weight ---

export type BodyWeightEntry = {
  id: number
  date: string
  weight_kg: number
}

export function getWeightEntries(from: string, to: string) {
  return request<BodyWeightEntry[]>(`/weight?from=${from}&to=${to}`)
}

export function logWeight(date: string, weight_kg: number) {
  return request<BodyWeightEntry>('/weight', { method: 'POST', body: JSON.stringify({ date, weight_kg }) })
}

export function getLatestWeight() {
  return request<BodyWeightEntry | null>('/weight/latest')
}

// --- Walking Pad ---

export type WalkingEntry = {
  id: number
  date: string
  duration_minutes: number
  distance_km: number
}

export type WalkingStats = {
  thisWeek: { km: number; minutes: number }
  thisMonth: { km: number; minutes: number }
  total: { km: number; minutes: number }
}

export function getWalkingEntries(from: string, to: string) {
  return request<WalkingEntry[]>(`/walking?from=${from}&to=${to}`)
}

export function logWalking(date: string, duration_minutes: number, distance_km: number) {
  return request<WalkingEntry>('/walking', { method: 'POST', body: JSON.stringify({ date, duration_minutes, distance_km }) })
}

export function getWalkingStats() {
  return request<WalkingStats>('/walking/stats')
}

// --- Dashboard ---

export type DashboardData = {
  streak: number
  phase: { phase: number; name: string; weekCurrent: number; weekTotal: number }
  mammutmarschDays: number
  latestWeight: { weight_kg: number; delta: number } | null
  walkingThisWeek: { km: number; minutes: number }
  walkingTotal: { km: number }
  weekActivity: { date: string; type: 'gym' | 'walking' | 'rest' | 'future' }[]
  todaysTraining: { name: string } | null
}

export function getDashboard() {
  return request<DashboardData>('/dashboard')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add typed API client for all endpoints"
```

---

### Task 6: Placeholder Equipment Image

**Files:**
- Create: `public/images/equipment/placeholder.svg`

- [ ] **Step 1: Create placeholder SVG**

Create `public/images/equipment/placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#242836"/>
  <text x="200" y="200" fill="#8b90a5" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">Gerätebild</text>
</svg>
```

This placeholder is used during development until real equipment images are downloaded in Task 19.

- [ ] **Step 2: Commit**

```bash
git add public/images/equipment/placeholder.svg
git commit -m "feat: add placeholder equipment image"
```

---

## Chunk 2: Backend API (Cloudflare Pages Functions)

### Task 7: Workout API Endpoints

**Files:**
- Create: `functions/api/workouts/index.ts`, `functions/api/workouts/today.ts`, `functions/api/workouts/[id].ts`

- [ ] **Step 1: Create D1 type helper**

Create `functions/api/_db.ts` (shared helper):

```typescript
export interface Env {
  DB: D1Database
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 2: Implement `functions/api/workouts/index.ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const from = url.searchParams.get('from') || '2026-01-01'
  const to = url.searchParams.get('to') || '2099-12-31'

  const result = await env.DB.prepare(
    'SELECT * FROM workout_logs WHERE date >= ? AND date <= ? ORDER BY date DESC'
  ).bind(from, to).all()

  return jsonResponse(result.results)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ date: string; phase: number; day_name: string }>()

  const result = await env.DB.prepare(
    'INSERT INTO workout_logs (date, phase, day_name, started_at) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(body.date, body.phase, body.day_name, new Date().toISOString()).first()

  return jsonResponse(result, 201)
}
```

- [ ] **Step 3: Implement `functions/api/workouts/today.ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date().toISOString().split('T')[0]

  const result = await env.DB.prepare(
    'SELECT * FROM workout_logs WHERE date = ? ORDER BY id DESC LIMIT 1'
  ).bind(today).first()

  return jsonResponse(result || null)
}
```

- [ ] **Step 4: Implement `functions/api/workouts/[id].ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestPatch: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id

  const result = await env.DB.prepare(
    'UPDATE workout_logs SET completed_at = ? WHERE id = ? RETURNING *'
  ).bind(new Date().toISOString(), id).first()

  if (!result) return jsonResponse({ error: 'Not found' }, 404)
  return jsonResponse(result)
}
```

- [ ] **Step 5: Commit**

```bash
git add functions/
git commit -m "feat: add workout CRUD API endpoints"
```

---

### Task 8: Exercise Logs API

**Files:**
- Create: `functions/api/exercises/index.ts`, `functions/api/exercises/[exerciseId]/last.ts`

- [ ] **Step 1: Implement `functions/api/exercises/index.ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const workoutId = url.searchParams.get('workout_id')
  if (!workoutId) return jsonResponse({ error: 'workout_id required' }, 400)

  const result = await env.DB.prepare(
    `SELECT DISTINCT exercise_id FROM exercise_logs WHERE workout_id = ?`
  ).bind(workoutId).all()

  return jsonResponse(result.results)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ sets: { workout_id: number; exercise_id: string; set_number: number; weight_kg: number; reps: number; is_top_set: number }[] }>()

  const stmt = env.DB.prepare(
    `INSERT INTO exercise_logs (workout_id, exercise_id, set_number, weight_kg, reps, is_top_set)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(workout_id, exercise_id, set_number) DO UPDATE SET
       weight_kg = excluded.weight_kg,
       reps = excluded.reps,
       is_top_set = excluded.is_top_set`
  )

  const batch = body.sets.map(s =>
    stmt.bind(s.workout_id, s.exercise_id, s.set_number, s.weight_kg, s.reps, s.is_top_set)
  )

  await env.DB.batch(batch)
  return jsonResponse({ success: true })
}
```

- [ ] **Step 2: Implement `functions/api/exercises/[exerciseId]/last.ts`**

```typescript
import { type Env, jsonResponse } from '../../_db'

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const exerciseId = params.exerciseId

  const result = await env.DB.prepare(
    `SELECT el.* FROM exercise_logs el
     JOIN workout_logs wl ON el.workout_id = wl.id
     WHERE el.exercise_id = ?
     ORDER BY wl.date DESC, el.set_number ASC
     LIMIT 10`
  ).bind(exerciseId).all()

  // Get only the sets from the most recent workout
  const sets = result.results
  if (sets.length === 0) return jsonResponse([])

  const latestWorkoutId = (sets[0] as { workout_id: number }).workout_id
  const latestSets = sets.filter((s: any) => s.workout_id === latestWorkoutId)

  return jsonResponse(latestSets)
}
```

- [ ] **Step 3: Commit**

```bash
git add functions/api/exercises/
git commit -m "feat: add exercise logging API with UPSERT and last-sets lookup"
```

---

### Task 9: Weight + Walking + Dashboard APIs

**Files:**
- Create: `functions/api/weight/index.ts`, `functions/api/weight/latest.ts`, `functions/api/walking/index.ts`, `functions/api/walking/stats.ts`, `functions/api/dashboard.ts`

- [ ] **Step 1: Implement `functions/api/weight/index.ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const from = url.searchParams.get('from') || '2026-01-01'
  const to = url.searchParams.get('to') || '2099-12-31'

  const result = await env.DB.prepare(
    'SELECT * FROM body_weight WHERE date >= ? AND date <= ? ORDER BY date ASC'
  ).bind(from, to).all()

  return jsonResponse(result.results)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ date: string; weight_kg: number }>()

  const result = await env.DB.prepare(
    `INSERT INTO body_weight (date, weight_kg) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg
     RETURNING *`
  ).bind(body.date, body.weight_kg).first()

  return jsonResponse(result, 201)
}
```

- [ ] **Step 2: Implement `functions/api/weight/latest.ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.DB.prepare(
    'SELECT * FROM body_weight ORDER BY date DESC LIMIT 1'
  ).first()

  return jsonResponse(result || null)
}
```

- [ ] **Step 3: Implement `functions/api/walking/index.ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const from = url.searchParams.get('from') || '2026-01-01'
  const to = url.searchParams.get('to') || '2099-12-31'

  const result = await env.DB.prepare(
    'SELECT * FROM walking_pad WHERE date >= ? AND date <= ? ORDER BY date ASC'
  ).bind(from, to).all()

  return jsonResponse(result.results)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ date: string; duration_minutes: number; distance_km: number }>()

  const result = await env.DB.prepare(
    `INSERT INTO walking_pad (date, duration_minutes, distance_km) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET duration_minutes = excluded.duration_minutes, distance_km = excluded.distance_km
     RETURNING *`
  ).bind(body.date, body.duration_minutes, body.distance_km).first()

  return jsonResponse(result, 201)
}
```

- [ ] **Step 4: Implement `functions/api/walking/stats.ts`**

```typescript
import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  const weekStart = monday.toISOString().split('T')[0]

  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [weekResult, monthResult, totalResult] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(SUM(distance_km), 0) as km, COALESCE(SUM(duration_minutes), 0) as minutes FROM walking_pad WHERE date >= ?').bind(weekStart).first(),
    env.DB.prepare('SELECT COALESCE(SUM(distance_km), 0) as km, COALESCE(SUM(duration_minutes), 0) as minutes FROM walking_pad WHERE date >= ?').bind(monthStart).first(),
    env.DB.prepare('SELECT COALESCE(SUM(distance_km), 0) as km, COALESCE(SUM(duration_minutes), 0) as minutes FROM walking_pad').first(),
  ])

  return jsonResponse({
    thisWeek: { km: (weekResult as any).km, minutes: (weekResult as any).minutes },
    thisMonth: { km: (monthResult as any).km, minutes: (monthResult as any).minutes },
    total: { km: (totalResult as any).km, minutes: (totalResult as any).minutes },
  })
}
```

- [ ] **Step 5: Implement `functions/api/dashboard.ts`**

```typescript
import { type Env, jsonResponse } from './_db'

const PLAN_START = '2026-03-16'
const MAMMUTMARSCH = '2026-09-05'
const START_WEIGHT = 94

function getPhaseInfo(today: Date) {
  const start = new Date(PLAN_START)
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1

  if (week <= 4) return { phase: 1, name: 'Wiedereinstieg', weekCurrent: week, weekTotal: 4, minVisits: 3 }
  if (week <= 12) return { phase: 2, name: 'Aufbau', weekCurrent: week - 4, weekTotal: 8, minVisits: 4 }
  return { phase: 3, name: 'Leistung', weekCurrent: Math.min(week - 12, 12), weekTotal: 12, minVisits: 5 }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const phaseInfo = getPhaseInfo(today)

  // Week start (Monday)
  const dayOfWeek = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  const weekStart = monday.toISOString().split('T')[0]

  // Streak: count consecutive qualifying weeks going backwards
  let streak = 0
  let checkDate = new Date(monday)
  checkDate.setDate(checkDate.getDate() - 7) // Start from last completed week

  while (streak < 52) { // Safety bound: max 52 weeks
    const ws = checkDate.toISOString().split('T')[0]
    const we = new Date(checkDate)
    we.setDate(we.getDate() + 6)
    const weStr = we.toISOString().split('T')[0]

    const pi = getPhaseInfo(checkDate)
    const count = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM workout_logs WHERE date >= ? AND date <= ? AND completed_at IS NOT NULL'
    ).bind(ws, weStr).first()

    if ((count as any).c >= pi.minVisits) {
      streak++
      checkDate.setDate(checkDate.getDate() - 7)
    } else {
      break
    }
  }

  // Latest weight
  const latestWeight = await env.DB.prepare(
    'SELECT * FROM body_weight ORDER BY date DESC LIMIT 1'
  ).first()

  // Walking this week + total
  const [walkWeek, walkTotal] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(SUM(distance_km),0) as km, COALESCE(SUM(duration_minutes),0) as minutes FROM walking_pad WHERE date >= ?').bind(weekStart).first(),
    env.DB.prepare('SELECT COALESCE(SUM(distance_km),0) as km FROM walking_pad').first(),
  ])

  // Week activity (Mon-Sun)
  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(d.toISOString().split('T')[0])
  }

  const [workouts, walkingEntries] = await Promise.all([
    env.DB.prepare(`SELECT date FROM workout_logs WHERE date >= ? AND date <= ? AND completed_at IS NOT NULL`).bind(weekStart, weekDates[6]).all(),
    env.DB.prepare(`SELECT date FROM walking_pad WHERE date >= ? AND date <= ?`).bind(weekStart, weekDates[6]).all(),
  ])

  const gymDates = new Set((workouts.results as any[]).map(w => w.date))
  const walkDates = new Set((walkingEntries.results as any[]).map(w => w.date))

  const weekActivity = weekDates.map(date => {
    if (date > todayStr) return { date, type: 'future' as const }
    if (gymDates.has(date)) return { date, type: 'gym' as const }
    if (walkDates.has(date)) return { date, type: 'walking' as const }
    return { date, type: 'rest' as const }
  })

  // Today's training name (from phase/day-of-week mapping)
  const dow = today.getDay() || 7
  const phaseData = [
    { days: [{ daysOfWeek: [1,3,5], name: 'Ganzkörper' }] },
    { days: [{ daysOfWeek: [1,4], name: 'Unterkörper' }, { daysOfWeek: [2,5], name: 'Oberkörper' }] },
    { days: [{ daysOfWeek: [1], name: 'Push' }, { daysOfWeek: [2], name: 'Pull' }, { daysOfWeek: [3], name: 'Legs' }, { daysOfWeek: [4], name: 'Upper' }, { daysOfWeek: [5], name: 'Lower' }] },
  ]
  const currentPhaseData = phaseData[phaseInfo.phase - 1]
  const todaysDay = currentPhaseData.days.find(d => d.daysOfWeek.includes(dow))

  const daysUntil = Math.max(0, Math.ceil((new Date(MAMMUTMARSCH).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  return jsonResponse({
    streak,
    phase: { phase: phaseInfo.phase, name: phaseInfo.name, weekCurrent: phaseInfo.weekCurrent, weekTotal: phaseInfo.weekTotal },
    mammutmarschDays: daysUntil,
    latestWeight: latestWeight ? { weight_kg: (latestWeight as any).weight_kg, delta: (latestWeight as any).weight_kg - START_WEIGHT } : null,
    walkingThisWeek: { km: (walkWeek as any).km, minutes: (walkWeek as any).minutes },
    walkingTotal: { km: (walkTotal as any).km },
    weekActivity,
    todaysTraining: todaysDay ? { name: todaysDay.name } : null,
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add functions/
git commit -m "feat: add weight, walking, and dashboard API endpoints"
```

---

## Chunk 3: Frontend — App Shell + Dashboard

### Task 10: App Shell with Router + TabBar

**Files:**
- Create: `src/App.tsx`, `src/components/TabBar.tsx`, placeholder pages

- [ ] **Step 1: Implement TabBar component**

Create `src/components/TabBar.tsx`:

```tsx
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Dashboard', icon: '⬛' },
  { to: '/training', label: 'Training', icon: '🏋️' },
  { to: '/weight', label: 'Gewicht', icon: '⚖️' },
  { to: '/walking', label: 'Walking', icon: '🚶' },
  { to: '/plan', label: 'Plan', icon: '📋' },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface2 border-t border-border flex z-50">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              isActive ? 'text-accent-light bg-accent/10' : 'text-text-dim'
            }`
          }
        >
          <span className="text-lg mb-0.5">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Update App.tsx with router**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import Dashboard from './pages/Dashboard'
import Training from './pages/Training'
import ExerciseDetail from './pages/ExerciseDetail'
import Weight from './pages/Weight'
import Walking from './pages/Walking'
import Plan from './pages/Plan'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text-primary pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/training" element={<Training />} />
          <Route path="/training/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/weight" element={<Weight />} />
          <Route path="/walking" element={<Walking />} />
          <Route path="/plan" element={<Plan />} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Create placeholder pages**

Create each of these files with a simple placeholder:

`src/pages/Dashboard.tsx`:
```tsx
export default function Dashboard() {
  return <div className="p-4"><h1 className="text-xl font-bold">Dashboard</h1></div>
}
```

Do the same for `Training.tsx`, `ExerciseDetail.tsx`, `Weight.tsx`, `Walking.tsx`, `Plan.tsx` — each with their respective title.

- [ ] **Step 4: Verify navigation works**

```bash
npm run dev
```

Open http://localhost:5173 — verify all 5 tabs navigate correctly and the tab bar highlights the active tab.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: add app shell with React Router and bottom tab navigation"
```

---

### Task 11: Dashboard Page

**Files:**
- Create: `src/components/StreakWidget.tsx`, `src/components/CountdownWidget.tsx`, `src/components/PhaseProgress.tsx`, `src/components/WeekView.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create StreakWidget**

Create `src/components/StreakWidget.tsx`:

```tsx
export default function StreakWidget({ weeks }: { weeks: number }) {
  return (
    <div className="bg-surface2 rounded-xl p-4 text-center flex-1">
      <div className="text-xs text-text-dim uppercase tracking-wider">Streak</div>
      <div className="text-3xl font-extrabold text-accent-light">{weeks}</div>
      <div className="text-xs text-text-dim">Wochen</div>
    </div>
  )
}
```

- [ ] **Step 2: Create CountdownWidget**

Create `src/components/CountdownWidget.tsx`:

```tsx
export default function CountdownWidget({ days }: { days: number }) {
  return (
    <div className="bg-surface2 rounded-xl p-4 text-center flex-1">
      <div className="text-xs text-text-dim uppercase tracking-wider">Mammutmarsch</div>
      <div className="text-3xl font-extrabold text-accent-light">{days}</div>
      <div className="text-xs text-text-dim">Tage</div>
    </div>
  )
}
```

- [ ] **Step 3: Create PhaseProgress**

Create `src/components/PhaseProgress.tsx`:

```tsx
export default function PhaseProgress({ phase, name, weekCurrent, weekTotal }: {
  phase: number; name: string; weekCurrent: number; weekTotal: number
}) {
  const pct = Math.min(100, Math.round((weekCurrent / weekTotal) * 100))
  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim">Phase {phase} — {name} · Woche {weekCurrent}/{weekTotal}</div>
      <div className="bg-white/10 rounded h-1.5 mt-2">
        <div className="bg-accent-light rounded h-1.5 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create WeekView**

Create `src/components/WeekView.tsx`:

```tsx
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const COLORS = {
  gym: 'bg-success text-white',
  walking: 'bg-accent text-white',
  rest: 'bg-surface border border-border text-text-dim',
  future: 'bg-surface2 border border-border text-text-dim',
}

export default function WeekView({ activity }: {
  activity: { date: string; type: 'gym' | 'walking' | 'rest' | 'future' }[]
}) {
  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim mb-2">Nie-Null-Regel</div>
      <div className="flex gap-1">
        {activity.map((day, i) => (
          <div
            key={day.date}
            className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold ${COLORS[day.type]}`}
          >
            {DAY_LABELS[i]}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement Dashboard page**

Update `src/pages/Dashboard.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard, type DashboardData } from '../lib/api'
import StreakWidget from '../components/StreakWidget'
import CountdownWidget from '../components/CountdownWidget'
import PhaseProgress from '../components/PhaseProgress'
import WeekView from '../components/WeekView'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-text-dim">Laden...</div>
  if (!data) return <div className="p-4 text-danger">Fehler beim Laden</div>

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        <StreakWidget weeks={data.streak} />
        <CountdownWidget days={data.mammutmarschDays} />
        <div className="bg-surface2 rounded-xl p-4 text-center flex-1">
          <div className="text-xs text-text-dim uppercase tracking-wider">Gewicht</div>
          <div className="text-3xl font-extrabold text-accent-light">
            {data.latestWeight ? data.latestWeight.weight_kg.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-text-dim">
            {data.latestWeight ? `kg (${data.latestWeight.delta > 0 ? '+' : ''}${data.latestWeight.delta.toFixed(1)})` : 'kg'}
          </div>
        </div>
      </div>

      <PhaseProgress
        phase={data.phase.phase}
        name={data.phase.name}
        weekCurrent={data.phase.weekCurrent}
        weekTotal={data.phase.weekTotal}
      />

      <div className="bg-surface2 rounded-xl p-4">
        <div className="text-xs text-text-dim">Walking Pad diese Woche</div>
        <div className="flex justify-between items-baseline mt-1">
          <span className="text-xl font-bold text-success">{data.walkingThisWeek.km.toFixed(1)} km</span>
          <span className="text-xs text-text-dim">{(data.walkingThisWeek.minutes / 60).toFixed(1)}h · Gesamt: {data.walkingTotal.km.toFixed(0)} km</span>
        </div>
      </div>

      <WeekView activity={data.weekActivity} />

      {data.todaysTraining && (
        <button
          onClick={() => navigate('/training')}
          className="w-full bg-accent rounded-xl p-4 text-center font-semibold text-white text-lg active:bg-accent/80 transition-colors"
        >
          Training starten: {data.todaysTraining.name}
        </button>
      )}

      {!data.todaysTraining && (
        <div className="bg-surface2 rounded-xl p-4 text-center text-text-dim">
          Heute: Ruhetag 🧘
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: implement Dashboard page with streak, countdown, phase progress, and week view"
```

---

## Chunk 4: Frontend — Training + Exercise Detail

### Task 12: Training Page (Exercise List)

**Files:**
- Create: `src/components/ExerciseCard.tsx`
- Modify: `src/pages/Training.tsx`

- [ ] **Step 1: Create ExerciseCard component**

Create `src/components/ExerciseCard.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import type { Exercise } from '../data/training-plan'

type Status = 'completed' | 'current' | 'upcoming'

export default function ExerciseCard({ exercise, status, topSet }: {
  exercise: Exercise
  status: Status
  topSet?: { weight_kg: number; reps: number }
}) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/training/${exercise.id}`)}
      className={`flex items-center gap-3 bg-surface2 rounded-xl p-3 cursor-pointer transition-all active:scale-[0.98] ${
        status === 'completed' ? 'opacity-50' :
        status === 'current' ? 'border border-accent' :
        'opacity-60'
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
        status === 'completed' ? 'bg-success text-white' : 'border-2 border-border'
      }`}>
        {status === 'completed' && '✓'}
      </div>

      <img
        src={exercise.equipmentImage}
        alt={exercise.equipment}
        className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-surface"
        onError={(e) => { (e.target as HTMLImageElement).src = '/images/equipment/placeholder.svg' }}
      />

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{exercise.name}</div>
        <div className="text-xs text-text-dim truncate">{exercise.equipment}</div>
      </div>

      <div className="text-right flex-shrink-0">
        {topSet ? (
          <>
            <div className="text-sm font-bold text-accent-light">{topSet.weight_kg} kg × {topSet.reps}</div>
            <div className="text-xs text-text-dim">Top-Satz</div>
          </>
        ) : (
          <div className="text-xs text-text-dim">—</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement Training page**

Update `src/pages/Training.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { getCurrentPhase, getTodaysTraining, today, getDayOfWeek } from '../lib/dates'
import { getTodaysWorkout, startWorkout, completeWorkout, getLastExerciseSets, getWorkoutExercises, type WorkoutLog, type ExerciseLog } from '../lib/api'
import ExerciseCard from '../components/ExerciseCard'

const DAY_NAMES = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function Training() {
  const phase = getCurrentPhase()
  const trainingDay = getTodaysTraining()
  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
  const [topSets, setTopSets] = useState<Record<string, { weight_kg: number; reps: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const w = await getTodaysWorkout()
        setWorkout(w)

        if (trainingDay) {
          // Load last top sets for each exercise
          const sets: Record<string, { weight_kg: number; reps: number }> = {}
          await Promise.all(trainingDay.exercises.map(async (ex) => {
            const lastSets = await getLastExerciseSets(ex.id)
            const topSet = lastSets.find(s => s.is_top_set)
            if (topSet) sets[ex.id] = { weight_kg: topSet.weight_kg, reps: topSet.reps }
          }))
          setTopSets(sets)

          // Check which exercises are completed in today's workout
          if (w) {
            const completed = new Set<string>()
            const workoutExercises = await getWorkoutExercises(w.id)
            workoutExercises.forEach(ex => completed.add(ex.exercise_id))
            setCompletedExercises(completed)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-4 text-text-dim">Laden...</div>

  if (!trainingDay) {
    return (
      <div className="p-4 text-center">
        <div className="text-6xl mb-4">🧘</div>
        <h1 className="text-xl font-bold mb-2">Heute: Ruhetag</h1>
        <p className="text-text-dim">Walking Pad nicht vergessen!</p>
      </div>
    )
  }

  const allDone = trainingDay.exercises.every(ex => completedExercises.has(ex.id))
  const doneCount = completedExercises.size
  const totalCount = trainingDay.exercises.length

  async function handleStart() {
    const w = await startWorkout({ date: today(), phase: phase.phase, day_name: trainingDay!.name })
    setWorkout(w)
  }

  async function handleComplete() {
    if (workout) {
      await completeWorkout(workout.id)
      setWorkout({ ...workout, completed_at: new Date().toISOString() })
    }
  }

  return (
    <div className="p-4">
      <div className="text-xs text-text-dim uppercase tracking-wider mb-1">
        Phase {phase.phase} · {DAY_NAMES[getDayOfWeek()]}: {trainingDay.name}
      </div>

      {!workout && (
        <button onClick={handleStart} className="w-full bg-accent rounded-xl p-3 text-center font-semibold text-white mb-4 active:bg-accent/80">
          Training starten
        </button>
      )}

      <div className="space-y-2">
        {trainingDay.exercises.map((ex, i) => {
          const isCompleted = completedExercises.has(ex.id)
          const firstUncompleted = trainingDay.exercises.findIndex(e => !completedExercises.has(e.id))
          const status = isCompleted ? 'completed' as const : i === firstUncompleted ? 'current' as const : 'upcoming' as const

          return <ExerciseCard key={ex.id} exercise={ex} status={status} topSet={topSets[ex.id]} />
        })}
      </div>

      {workout && !workout.completed_at && (
        <button
          onClick={handleComplete}
          disabled={!allDone}
          className={`w-full rounded-xl p-3 text-center font-semibold text-white mt-4 transition-colors ${
            allDone ? 'bg-success active:bg-success/80' : 'bg-success/30 cursor-not-allowed'
          }`}
        >
          Training abschließen ({doneCount}/{totalCount})
        </button>
      )}

      {workout?.completed_at && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center text-success font-semibold mt-4">
          Training abgeschlossen ✓
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat: implement Training page with exercise list and workout flow"
```

---

### Task 13: Exercise Detail Page (Set-by-Set Logging)

**Files:**
- Create: `src/components/SetInput.tsx`
- Modify: `src/pages/ExerciseDetail.tsx`

- [ ] **Step 1: Create SetInput component**

Create `src/components/SetInput.tsx`:

```tsx
type SetData = { weight_kg: number; reps: number; completed: boolean }

export default function SetInput({ setNumber, totalSets, data, isTopSet, onChange, onComplete }: {
  setNumber: number
  totalSets: number
  data: SetData
  isTopSet: boolean
  onChange: (field: 'weight_kg' | 'reps', value: number) => void
  onComplete: () => void
}) {
  const labels = ['Aufwärmen', 'Mittel', 'Top-Satz']
  const label = setNumber === totalSets ? 'Top-Satz' :
                setNumber === 1 ? 'Aufwärmen' : 'Mittel'

  return (
    <div className={`flex items-center gap-3 py-3 px-3 rounded-lg ${
      isTopSet ? 'bg-accent/10' : ''
    } ${data.completed ? 'opacity-50' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isTopSet ? 'bg-accent text-white' : 'bg-surface2 text-text-dim'
      }`}>
        {setNumber}
      </div>

      <div className="flex-shrink-0 w-16">
        <div className={`text-xs ${isTopSet ? 'text-accent-light font-semibold' : 'text-text-dim'}`}>{label}</div>
      </div>

      <input
        type="number"
        inputMode="decimal"
        value={data.weight_kg || ''}
        onChange={e => onChange('weight_kg', parseFloat(e.target.value) || 0)}
        className={`w-16 bg-surface2 border rounded-lg px-2 py-1.5 text-center text-sm font-semibold ${
          isTopSet ? 'border-accent' : 'border-border'
        }`}
        disabled={data.completed}
      />
      <span className="text-xs text-text-dim">kg</span>

      <input
        type="number"
        inputMode="numeric"
        value={data.reps || ''}
        onChange={e => onChange('reps', parseInt(e.target.value) || 0)}
        className={`w-14 bg-surface2 border rounded-lg px-2 py-1.5 text-center text-sm font-semibold ${
          isTopSet ? 'border-accent' : 'border-border'
        }`}
        disabled={data.completed}
      />
      <span className="text-xs text-text-dim">Wdh</span>

      <button
        onClick={onComplete}
        disabled={data.completed}
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ml-auto flex-shrink-0 ${
          data.completed ? 'bg-success text-white' : 'border-2 border-border hover:border-success'
        }`}
      >
        {data.completed && '✓'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Implement ExerciseDetail page**

Update `src/pages/ExerciseDetail.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCurrentPhase, getTodaysTraining, today } from '../lib/dates'
import { getTodaysWorkout, startWorkout, getLastExerciseSets, logExerciseSets, type WorkoutLog } from '../lib/api'
import SetInput from '../components/SetInput'

type SetData = { weight_kg: number; reps: number; completed: boolean }

export default function ExerciseDetail() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const phase = getCurrentPhase()
  const trainingDay = getTodaysTraining()
  const exercise = trainingDay?.exercises.find(e => e.id === exerciseId)

  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [sets, setSets] = useState<SetData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!exercise) return

      // Ensure workout exists
      let w = await getTodaysWorkout()
      if (!w) {
        w = await startWorkout({ date: today(), phase: phase.phase, day_name: trainingDay!.name })
      }
      setWorkout(w)

      // Pre-fill from last session
      const lastSets = await getLastExerciseSets(exercise.id)
      const prefilled: SetData[] = Array.from({ length: exercise.sets }, (_, i) => {
        const last = lastSets.find(s => s.set_number === i + 1)
        return {
          weight_kg: last?.weight_kg || 0,
          reps: last?.reps || 0,
          completed: false,
        }
      })
      setSets(prefilled)
      setLoading(false)
    }
    load()
  }, [exerciseId])

  if (!exercise) return <div className="p-4 text-danger">Übung nicht gefunden</div>
  if (loading) return <div className="p-4 text-text-dim">Laden...</div>

  function updateSet(index: number, field: 'weight_kg' | 'reps', value: number) {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function completeSet(index: number) {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, completed: true } : s))
  }

  const allDone = sets.every(s => s.completed)

  async function handleFinish() {
    if (!workout) return

    const exerciseSets = sets.map((s, i) => ({
      workout_id: workout.id,
      exercise_id: exercise!.id,
      set_number: i + 1,
      weight_kg: s.weight_kg,
      reps: s.reps,
      is_top_set: i === sets.length - 1 ? 1 : 0,
    }))

    await logExerciseSets(exerciseSets)
    navigate('/training')
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate('/training')} className="text-accent-light text-sm mb-3 flex items-center gap-1">
        ← Zurück
      </button>

      <img
        src={exercise.equipmentImage}
        alt={exercise.equipment}
        className="w-full h-40 object-cover rounded-xl mb-3 bg-surface"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />

      <h1 className="text-xl font-bold">{exercise.name}</h1>
      <p className="text-sm text-text-dim mb-2">{exercise.equipment}</p>

      {exercise.hints && (
        <p className="text-xs text-text-dim mb-2">{exercise.hints}</p>
      )}

      {exercise.shoulderWarning && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-danger font-semibold">⚠️ {exercise.shoulderWarning}</p>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border p-3 mb-4">
        <h3 className="text-sm font-bold mb-2">{exercise.sets} Sätze (Pyramide)</h3>
        <div className="space-y-1">
          {sets.map((set, i) => (
            <SetInput
              key={i}
              setNumber={i + 1}
              totalSets={exercise.sets}
              data={set}
              isTopSet={i === sets.length - 1}
              onChange={(field, value) => updateSet(i, field, value)}
              onComplete={() => completeSet(i)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleFinish}
        disabled={!allDone}
        className={`w-full rounded-xl p-3 text-center font-semibold text-white transition-colors ${
          allDone ? 'bg-accent active:bg-accent/80' : 'bg-accent/30 cursor-not-allowed'
        }`}
      >
        Übung abschließen
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat: implement ExerciseDetail page with set-by-set logging and pre-filled weights"
```

---

## Chunk 5: Frontend — Weight, Walking, Plan Pages

### Task 14: Weight Page

**Files:**
- Create: `src/components/WeightChart.tsx`
- Modify: `src/pages/Weight.tsx`

- [ ] **Step 1: Create WeightChart component**

Create `src/components/WeightChart.tsx`:

```tsx
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import { START_WEIGHT_KG, GOAL_WEIGHT_KG } from '../data/training-plan'

export default function WeightChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  const formatted = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    kg: d.weight_kg,
  }))

  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim mb-2">Gewichtsverlauf</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b90a5' }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8b90a5' }} width={35} />
          <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2e3345', borderRadius: 8 }} />
          <ReferenceLine y={START_WEIGHT_KG} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Start', fill: '#ef4444', fontSize: 10 }} />
          <ReferenceLine y={GOAL_WEIGHT_KG} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Ziel', fill: '#22c55e', fontSize: 10 }} />
          <Line type="monotone" dataKey="kg" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Implement Weight page**

Update `src/pages/Weight.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { getWeightEntries, logWeight, type BodyWeightEntry } from '../lib/api'
import { today } from '../lib/dates'
import WeightChart from '../components/WeightChart'

export default function Weight() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await getWeightEntries('2026-01-01', '2099-12-31')
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(input)
    if (!val) return
    await logWeight(today(), val)
    setInput('')
    await load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Gewicht</h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="z.B. 92.5"
          className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 text-lg font-semibold"
        />
        <button type="submit" className="bg-accent rounded-xl px-6 py-3 font-semibold text-white active:bg-accent/80">
          Eintragen
        </button>
      </form>

      {!loading && entries.length > 0 && <WeightChart data={entries} />}

      <div className="space-y-2">
        {entries.slice().reverse().slice(0, 20).map(e => (
          <div key={e.id} className="flex justify-between bg-surface2 rounded-lg px-4 py-2 text-sm">
            <span className="text-text-dim">{new Date(e.date).toLocaleDateString('de-DE')}</span>
            <span className="font-semibold">{e.weight_kg.toFixed(1)} kg</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat: implement Weight page with chart and quick entry"
```

---

### Task 15: Walking Pad Page

**Files:**
- Create: `src/components/WalkingChart.tsx`
- Modify: `src/pages/Walking.tsx`

- [ ] **Step 1: Create WalkingChart component**

Create `src/components/WalkingChart.tsx`:

```tsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function WalkingChart({ data }: { data: { date: string; distance_km: number }[] }) {
  const formatted = data.map(d => ({
    day: new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short' }),
    km: d.distance_km,
  }))

  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim mb-2">Walking Pad diese Woche</div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={formatted}>
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8b90a5' }} />
          <YAxis tick={{ fontSize: 10, fill: '#8b90a5' }} width={30} />
          <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2e3345', borderRadius: 8 }} />
          <Bar dataKey="km" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Implement Walking page**

Update `src/pages/Walking.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { getWalkingEntries, getWalkingStats, logWalking, type WalkingEntry, type WalkingStats } from '../lib/api'
import { today, getWeekStart } from '../lib/dates'
import WalkingChart from '../components/WalkingChart'

export default function Walking() {
  const [entries, setEntries] = useState<WalkingEntry[]>([])
  const [stats, setStats] = useState<WalkingStats | null>(null)
  const [minutes, setMinutes] = useState('')
  const [km, setKm] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const weekStart = getWeekStart()
    const [e, s] = await Promise.all([
      getWalkingEntries(weekStart, today()),
      getWalkingStats(),
    ])
    setEntries(e)
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const m = parseInt(minutes)
    const k = parseFloat(km)
    if (!m || !k) return
    await logWalking(today(), m, k)
    setMinutes('')
    setKm('')
    await load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Walking Pad</h1>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            placeholder="Minuten"
            className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 font-semibold"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={km}
            onChange={e => setKm(e.target.value)}
            placeholder="km"
            className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 font-semibold"
          />
        </div>
        <button type="submit" className="w-full bg-accent rounded-xl px-6 py-3 font-semibold text-white active:bg-accent/80">
          Eintragen
        </button>
      </form>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-xs text-text-dim">Diese Woche</div>
            <div className="text-lg font-bold text-success">{stats.thisWeek.km.toFixed(1)} km</div>
            <div className="text-xs text-text-dim">{(stats.thisWeek.minutes / 60).toFixed(1)}h</div>
          </div>
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-xs text-text-dim">Dieser Monat</div>
            <div className="text-lg font-bold text-accent-light">{stats.thisMonth.km.toFixed(1)} km</div>
          </div>
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-xs text-text-dim">Gesamt</div>
            <div className="text-lg font-bold text-text-primary">{stats.total.km.toFixed(0)} km</div>
          </div>
        </div>
      )}

      {entries.length > 0 && <WalkingChart data={entries} />}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "feat: implement Walking Pad page with stats and weekly chart"
```

---

### Task 16: Plan Page

**Files:**
- Modify: `src/pages/Plan.tsx`

- [ ] **Step 1: Implement Plan page**

Update `src/pages/Plan.tsx`:

```tsx
import { useState } from 'react'
import { phases } from '../data/training-plan'
import { getCurrentPhase } from '../lib/dates'

const SHOULDER_FORBIDDEN = [
  'L490 — Seitheben-Maschine',
  'PL090 — Shoulder Press',
  'L450 — Dip-Funktion',
  'Aufrechtes Rudern',
  'Nackendrücken',
]

const SHOULDER_ALLOWED = [
  'Brustpresse — ROM auf 90° begrenzen',
  'L410 — Hintere Schulter (leichtes Gewicht, 15+ Wdh)',
  'Face Pulls am L480 Kabelzug',
  'Außenrotation am Kabelzug (L480)',
]

export default function Plan() {
  const currentPhase = getCurrentPhase()
  const [selectedPhase, setSelectedPhase] = useState(currentPhase.phase)
  const phase = phases.find(p => p.phase === selectedPhase)!

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Trainingsplan</h1>

      <div className="flex gap-2">
        {phases.map(p => (
          <button
            key={p.phase}
            onClick={() => setSelectedPhase(p.phase)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              p.phase === selectedPhase ? 'bg-accent text-white' :
              p.phase === currentPhase.phase ? 'bg-accent/20 text-accent-light border border-accent/30' :
              'bg-surface2 text-text-dim'
            }`}
          >
            Phase {p.phase}
          </button>
        ))}
      </div>

      <div className="bg-surface2 rounded-xl p-3">
        <div className="font-bold">{phase.name}</div>
        <div className="text-xs text-text-dim">Woche {phase.weeks[0]}–{phase.weeks[1]} · {phase.gymDaysPerWeek}x/Woche</div>
      </div>

      {phase.days.map(day => (
        <div key={day.name} className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="bg-surface2 px-4 py-2 font-semibold text-sm">{day.name}</div>
          <div className="divide-y divide-border/50">
            {day.exercises.map(ex => (
              <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5">
                <img
                  src={ex.equipmentImage}
                  alt={ex.equipment}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface2"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/equipment/placeholder.svg' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{ex.name}</div>
                  <div className="text-xs text-text-dim">{ex.equipment} · {ex.sets} Sätze</div>
                  {ex.hints && <div className="text-xs text-text-dim italic">{ex.hints}</div>}
                </div>
                {ex.shoulderWarning && (
                  <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded flex-shrink-0">⚠️</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-surface rounded-xl border border-danger/20 p-4">
        <h3 className="font-bold text-danger text-sm mb-2">Schulter: Verboten</h3>
        <ul className="space-y-1">
          {SHOULDER_FORBIDDEN.map(item => (
            <li key={item} className="text-xs text-text-dim flex items-center gap-2">
              <span className="text-danger">✕</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface rounded-xl border border-success/20 p-4">
        <h3 className="font-bold text-success text-sm mb-2">Schulter: Erlaubt (mit Vorsicht)</h3>
        <ul className="space-y-1">
          {SHOULDER_ALLOWED.map(item => (
            <li key={item} className="text-xs text-text-dim flex items-center gap-2">
              <span className="text-success">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface rounded-xl border border-accent/20 p-4">
        <h3 className="font-bold text-accent text-sm mb-2">Durchhalte-Regeln</h3>
        <ul className="space-y-2 text-xs text-text-dim">
          <li><span className="font-semibold text-text-primary">Nie-Null-Regel:</span> Jeden Tag mindestens eine Aktivität — Gym oder Walking Pad. Kein Tag bei Null.</li>
          <li><span className="font-semibold text-text-primary">2-Tage-Schutz:</span> Maximal 2 Ruhetage am Stück. Am 3. Tag wird trainiert, egal wie.</li>
          <li><span className="font-semibold text-text-primary">Krankheitsregel:</span> Bei Krankheit: Walking Pad statt Gym. Nur bei Fieber komplett pausieren.</li>
          <li><span className="font-semibold text-text-primary">Pyramide:</span> Am Gerät aufwärmen, Gewicht steigern, letzter Satz schwer aber 2-3 Wdh Reserve.</li>
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Plan.tsx
git commit -m "feat: implement Plan page with phase selector, exercises, and shoulder protocol"
```

---

## Chunk 6: Deployment + Polish

### Task 17: SPA Routing + `_routes.json`

**Files:**
- Create: `public/_routes.json`

- [ ] **Step 1: Create `_routes.json` for Cloudflare Pages SPA routing**

Create `public/_routes.json`:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/images/*", "/assets/*"]
}
```

This ensures all non-asset routes are handled by the SPA's `index.html` so React Router works correctly on page refresh.

- [ ] **Step 2: Commit**

```bash
git add public/_routes.json
git commit -m "feat: add Cloudflare Pages SPA routing config"
```

---

### Task 18: GitHub + Cloudflare Pages Setup

- [ ] **Step 1: Create GitHub repo**

```bash
cd c:/Programmierung/Claude/fitness
gh repo create sebastianschlaeger/fitness --public --source=. --remote=origin --push
```

- [ ] **Step 2: Set up Cloudflare Pages**

Go to Cloudflare Dashboard → Pages → Create a project → Connect to Git → select `sebastianschlaeger/fitness`.

Build settings:
- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: Add D1 database binding in the Cloudflare dashboard (Settings → Functions → D1 database bindings → variable name: `DB`, database: `fitness-db`)

- [ ] **Step 3: Push and verify deployment**

```bash
git push origin main
```

Wait for Cloudflare Pages to build and deploy. Verify the app loads at the assigned `.pages.dev` URL.

- [ ] **Step 4: Apply D1 schema to production**

```bash
npx wrangler d1 execute fitness-db --remote --file=db/schema.sql
```

- [ ] **Step 5: Commit any deployment adjustments**

---

### Task 19: Download Equipment Images

- [ ] **Step 1: Search and download equipment images**

For each equipment piece in the training plan, search the official product pages:
- BH Fitness: `bh.fitness/en/equipment/`
- Technogym: `technogym.com`

Download product images and save to `public/images/equipment/` with the exact filenames referenced in `training-plan.ts`.

Resize images to ~400px wide for mobile performance.

- [ ] **Step 2: Commit images**

```bash
git add public/images/equipment/
git commit -m "feat: add real equipment images for all gym machines"
```

- [ ] **Step 3: Push to deploy**

```bash
git push origin main
```
