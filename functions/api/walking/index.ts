import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const from = url.searchParams.get('from') || '2026-01-01'
  const to = url.searchParams.get('to') || '2099-12-31'

  const result = await env.DB.prepare(
    'SELECT * FROM walking_pad WHERE date >= ? AND date <= ? ORDER BY date ASC'
  ).bind(from, to).all()

  return jsonResponse(result.results)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ date: string; duration_minutes: number; distance_km: number }>()

  const result = await env.DB.prepare(
    `INSERT INTO walking_pad (date, duration_minutes, distance_km) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET duration_minutes = excluded.duration_minutes, distance_km = excluded.distance_km
     RETURNING *`
  ).bind(body.date, body.duration_minutes, body.distance_km).first()

  return jsonResponse(result, 201)
}
