import { type Env, jsonResponse } from '../_db'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ workout_id: number; exercise_id: string }>()

  await env.DB.prepare(
    `INSERT INTO exercise_completions (workout_id, exercise_id, completed_at)
     VALUES (?, ?, ?)
     ON CONFLICT(workout_id, exercise_id) DO NOTHING`
  ).bind(body.workout_id, body.exercise_id, new Date().toISOString()).run()

  return jsonResponse({ success: true })
}
