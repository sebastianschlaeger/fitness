import { type Env, jsonResponse } from '../_db'

export const onRequestPatch: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id

  const result = await env.DB.prepare(
    'UPDATE workout_logs SET completed_at = ? WHERE id = ? RETURNING *'
  ).bind(new Date().toISOString(), id).first()

  if (!result) return jsonResponse({ error: 'Not found' }, 404)
  return jsonResponse(result)
}
