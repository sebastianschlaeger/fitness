import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const from = url.searchParams.get('from') || '2026-01-01'
  const to = url.searchParams.get('to') || '2099-12-31'

  const result = await env.DB.prepare(
    'SELECT * FROM body_weight WHERE date >= ? AND date <= ? ORDER BY date ASC'
  ).bind(from, to).all()

  return jsonResponse(result.results)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ date: string; weight_kg: number }>()

  const result = await env.DB.prepare(
    `INSERT INTO body_weight (date, weight_kg) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg
     RETURNING *`
  ).bind(body.date, body.weight_kg).first()

  return jsonResponse(result, 201)
}
