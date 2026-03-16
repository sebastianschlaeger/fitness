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
