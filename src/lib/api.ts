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

export function completeExercise(workoutId: number, exerciseId: string) {
  return request<{ success: boolean }>('/exercises/complete', { method: 'POST', body: JSON.stringify({ workout_id: workoutId, exercise_id: exerciseId }) })
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
