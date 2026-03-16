# Fitness App — Design Spec

## Overview

Personal fitness dashboard for tracking gym workouts, body weight, and walking pad usage. Designed around a 24-week training plan leading to the Mammutmarsch Bremen (55 km, September 5, 2026). Single user, no authentication.

## Goals

1. **Log workouts efficiently in the gym** — phone in hand, pre-filled weights from last session, tap to adjust and confirm
2. **Track body weight and walking pad** — daily entries with trend visualization
3. **Motivate through visibility** — streaks, countdown, progress bars, milestone celebrations
4. **Show the training plan** — with equipment images so the user can find machines in the gym

## Non-Goals

- Nutrition tracking (handled via Weight Watchers)
- Multi-user / authentication
- Custom exercise editing (plan changes happen in code)
- Push notifications
- Social features

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React + TypeScript |
| Styling | TailwindCSS |
| Charts | Recharts |
| Routing | React Router (5 tabs) |
| Backend/API | Cloudflare Pages Functions (Workers) |
| Database | Cloudflare D1 (SQLite) |
| Hosting | Cloudflare Pages (auto-deploy on push to `main`) |
| Repo | GitHub `sebastianschlaeger/fitness` |

## Navigation

Bottom tab bar with 5 tabs:
1. **Dashboard** — home screen with key metrics
2. **Training** — today's workout, exercise logging
3. **Gewicht** — body weight entry and chart
4. **Walking** — walking pad entry and stats
5. **Plan** — full training plan reference (phases, exercises, shoulder protocol)

## Screens

### 1. Dashboard

The home screen. Shows at a glance:
- **Streak widget** — consecutive weeks with at least 3 gym visits (Phase 1) / 4 visits (Phase 2) / 5 visits (Phase 3)
- **Mammutmarsch countdown** — days remaining + total walking km accumulated
- **Current weight** — latest entry + delta from start (94 kg)
- **Phase progress** — current phase, week X/Y, progress bar
- **Walking pad this week** — km and hours
- **Nie-Null weekly view** — 7 day boxes (Mo-So), colored by activity: green = gym, blue = walking pad, gray = rest/upcoming
- **CTA button** — "Training starten: [next workout name]" — navigates to Training tab

### 2. Training

Two views:

**Exercise List (default):**
- Header shows phase + day name (e.g., "Phase 1 · Mo: Ganzkörper")
- List of exercises for today's workout
- Each exercise shows: equipment image (thumbnail), exercise name, equipment name, last top-set weight × reps
- Checkmark status: completed (green check) / current (highlighted border) / upcoming (dimmed)
- "Training abschließen" button at bottom (disabled until all exercises done)
- Tapping an exercise opens the Set Detail view

**Determining "today's workout":** Based on current phase (derived from start date March 16, 2026) and day of week. Monday = first training day of the week, etc. On non-training days (e.g., Phase 1 Tuesday), show "Heute: Ruhetag (Walking Pad)" with a quick-log for walking pad. **Catch-up logic:** If a scheduled workout from earlier this week was not completed, the Training tab offers that workout instead of showing "Ruhetag". This way missed workouts can be made up on a different day.

**Set Detail (tapping an exercise):**
- Large equipment image at top
- Exercise hints (e.g., "Schulterblätter zusammen, Ellbogen nah am Körper")
- Shoulder warning if applicable (e.g., "ROM begrenzen, 2-3 Wdh Reserve")
- Set rows (3 or 4 depending on exercise):
  - Set number with type label (Aufwärmen / Mittel / Top-Satz)
  - Weight input (pre-filled from last session)
  - Reps input (pre-filled from last session)
  - Checkmark to confirm set
- Top-set row is visually highlighted (accent color background)
- "Übung abschließen" button
- Last session reference shown at bottom

**Pre-filling logic:**
- On first use: fields are empty, user enters weights
- Subsequent sessions: each set's weight and reps are pre-filled from the same exercise's last logged values
- User can tap any field to override

### 3. Gewicht (Body Weight)

- Quick entry at top: number input + "Heute eintragen" button
- Weight chart below (line chart, last 8-12 weeks)
- Start weight marker (94 kg), goal weight marker (~80 kg)
- List of recent entries with date and weight

### 4. Walking Pad

- Quick entry at top: duration (minutes) + distance (km) inputs + "Eintragen" button
- Stats: this week (km, hours), this month, total since start
- Weekly bar chart showing km per day

### 5. Plan

Interactive version of the fitness plan:
- Phase selector (1/2/3) with current phase highlighted
- Training days for selected phase with exercise lists
- Each exercise shows equipment image, name, sets, hints
- Shoulder protocol section (forbidden/allowed exercises)
- Durchhalte-Regeln (Nie-Null, 2-Tage-Schutz, etc.)

## Data Model (Cloudflare D1)

### `training_plans`

The training plan is stored as static JSON data in the codebase (`src/data/training-plan.ts`), not in the database. It contains:

```typescript
type Phase = {
  phase: 1 | 2 | 3;
  name: string;           // "Wiedereinstieg" | "Aufbau" | "Leistung"
  weeks: string;          // "1-4" | "5-12" | "13-24"
  gymDaysPerWeek: number; // 3 | 4 | 5
  days: TrainingDay[];
}

type TrainingDay = {
  dayOfWeek: number[];      // [1, 3, 5] for Mo/Mi/Fr
  name: string;             // "Ganzkörper" | "Unterkörper" | "Push" etc.
  exercises: Exercise[];
}

type Exercise = {
  id: string;               // "beinpresse-technogym"
  name: string;             // "Beinpresse"
  equipment: string;        // "Technogym Leg Press"
  equipmentImage: string;   // "/images/equipment/technogym-leg-press.jpg"
  sets: number;             // 3 or 4
  hints?: string;           // "Füße schulterbreit, nicht zu tief"
  shoulderWarning?: string; // "ROM begrenzen, 2-3 Wdh Reserve"
}
```

### `workout_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| date | TEXT | ISO date (2026-03-16) |
| phase | INTEGER | 1, 2, or 3 |
| day_name | TEXT | "Ganzkörper", "Unterkörper", etc. |
| started_at | TEXT | ISO timestamp |
| completed_at | TEXT | ISO timestamp, null if in progress |

### `exercise_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| workout_id | INTEGER FK | References workout_logs.id |
| exercise_id | TEXT | e.g., "beinpresse-technogym" |
| set_number | INTEGER | 1, 2, 3 (or 4) |
| weight_kg | REAL | Weight in kg |
| reps | INTEGER | Repetitions completed |
| is_top_set | BOOLEAN | True for the heaviest set |

### `body_weight`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| date | TEXT | ISO date, UNIQUE constraint |
| weight_kg | REAL | Body weight in kg |

### `walking_pad`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| date | TEXT | ISO date, UNIQUE constraint |
| duration_minutes | INTEGER | Duration in minutes |
| distance_km | REAL | Distance in km |

## API Endpoints (Cloudflare Pages Functions)

All endpoints under `/api/`:

### Workouts
- `GET /api/workouts?from=&to=` — list workouts in date range
- `GET /api/workouts/today` — get today's workout (or null)
- `POST /api/workouts` — start a new workout
- `PATCH /api/workouts/:id` — complete a workout (set completed_at)

### Exercise Logs
- `GET /api/exercises/:exerciseId/last` — get last logged sets for an exercise (for pre-filling)
- `POST /api/exercises` — log a set (or batch of sets for one exercise). Uses UPSERT on `(workout_id, exercise_id, set_number)` so re-submitting corrects the entry instead of creating duplicates.

### Body Weight
- `GET /api/weight?from=&to=` — weight entries in range
- `POST /api/weight` — log today's weight
- `GET /api/weight/latest` — most recent entry

### Walking Pad
- `GET /api/walking?from=&to=` — walking entries in range
- `POST /api/walking` — log today's walking
- `GET /api/walking/stats` — aggregated stats (this week, total)

### Dashboard
- `GET /api/dashboard` — aggregated data for dashboard (streak, phase, stats) — single call to reduce round-trips on mobile

## Equipment Images

Images sourced from BH Fitness and Technogym product pages. Stored as static assets in `/public/images/equipment/`. One image per unique equipment piece.

Equipment list (26 unique machines):
- BH Fitness: PL110, PL090, PL070, PL300, L080, L490, L030, L250, L010, PL340, L550, L410, L450, L610, PL330, L480, PL210, PL320, PL700, PL200
- Technogym: Pectoral, Low Row, Vertical Traction, Chest Press, Upper Back, Abdominal Crunch, Lower Back, Leg Press, Leg Curl, Leg Extension, Adductor, Abductor

Image naming: `{brand}-{model-or-name}.jpg` (e.g., `bh-pl300-seated-row.jpg`, `technogym-chest-press.jpg`)

## Streak Calculation

A "streak week" counts if the user completed at least the minimum gym visits for their current phase:
- Phase 1: 3 visits/week
- Phase 2: 4 visits/week
- Phase 3: 5 visits/week

The streak counter shows consecutive qualifying weeks. A missed week resets the counter to 0. The "Nie-Null" weekly view on the dashboard shows this week's progress toward the minimum.

## Phase Determination

The current phase is derived from the start date (March 16, 2026):
- Week 1-4 (Mar 16 – Apr 12): Phase 1
- Week 5-12 (Apr 13 – Jun 7): Phase 2
- Week 13-24 (Jun 8 – Sep 5): Phase 3

The app calculates this automatically — no manual phase switching needed.

## Design

- Dark theme (matches the existing fitness-plan.html aesthetic)
- Mobile-first, responsive for desktop
- Color scheme: dark backgrounds (#0f1117, #1a1d27), accent purple (#6366f1), green for success (#22c55e)
- Bottom tab bar on mobile, sidebar on desktop
- Large tap targets for gym use (minimum 44px)
- Pre-filled inputs should be clearly distinguishable from user-entered values (dimmed vs. bright)

## Project Structure

```
fitness/
  src/
    pages/
      Dashboard.tsx
      Training.tsx
      ExerciseDetail.tsx
      Weight.tsx
      Walking.tsx
      Plan.tsx
    components/
      TabBar.tsx
      ExerciseCard.tsx
      SetInput.tsx
      WeightChart.tsx
      StreakWidget.tsx
      CountdownWidget.tsx
      PhaseProgress.tsx
      WeekView.tsx
    data/
      training-plan.ts       (all phases, days, exercises as typed data)
      equipment-images.ts    (exercise ID → image path mapping)
    lib/
      api.ts                 (fetch wrapper for /api/* calls)
      dates.ts               (phase calculation, week number, etc.)
    App.tsx
    main.tsx
  functions/
    api/
      workouts/
        index.ts              (GET list, POST create)
        today.ts              (GET today's workout)
        [id].ts               (PATCH complete)
      exercises/
        index.ts              (POST log sets)
        [exerciseId]/
          last.ts             (GET last logged sets)
      weight/
        index.ts              (GET range, POST log)
        latest.ts             (GET latest)
      walking/
        index.ts              (GET range, POST log)
        stats.ts              (GET aggregated)
      dashboard.ts            (GET aggregated dashboard data)
  public/
    images/
      equipment/             (26+ equipment photos)
  wrangler.toml              (D1 binding)
  tailwind.config.ts
  vite.config.ts
  package.json
```
