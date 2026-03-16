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
