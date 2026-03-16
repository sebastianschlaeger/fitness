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
