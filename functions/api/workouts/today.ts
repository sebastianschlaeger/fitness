import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  // Optionaler ?date= (für Nachhol-Modus); Default = heute.
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

  const result = await env.DB.prepare(
    'SELECT * FROM workout_logs WHERE date = ? ORDER BY id DESC LIMIT 1'
  ).bind(date).first()

  return jsonResponse(result || null)
}
