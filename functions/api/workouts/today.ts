import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date().toISOString().split('T')[0]

  const result = await env.DB.prepare(
    'SELECT * FROM workout_logs WHERE date = ? ORDER BY id DESC LIMIT 1'
  ).bind(today).first()

  return jsonResponse(result || null)
}
