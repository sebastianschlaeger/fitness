import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result = await env.DB.prepare(
    'SELECT * FROM body_weight ORDER BY date DESC LIMIT 1'
  ).first()

  return jsonResponse(result || null)
}
