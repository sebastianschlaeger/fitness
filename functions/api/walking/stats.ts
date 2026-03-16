import { type Env, jsonResponse } from '../_db'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  const weekStart = monday.toISOString().split('T')[0]

  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [weekResult, monthResult, totalResult] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(SUM(distance_km), 0) as km, COALESCE(SUM(duration_minutes), 0) as minutes FROM walking_pad WHERE date >= ?').bind(weekStart).first(),
    env.DB.prepare('SELECT COALESCE(SUM(distance_km), 0) as km, COALESCE(SUM(duration_minutes), 0) as minutes FROM walking_pad WHERE date >= ?').bind(monthStart).first(),
    env.DB.prepare('SELECT COALESCE(SUM(distance_km), 0) as km, COALESCE(SUM(duration_minutes), 0) as minutes FROM walking_pad').first(),
  ])

  return jsonResponse({
    thisWeek: { km: (weekResult as any).km, minutes: (weekResult as any).minutes },
    thisMonth: { km: (monthResult as any).km, minutes: (monthResult as any).minutes },
    total: { km: (totalResult as any).km, minutes: (totalResult as any).minutes },
  })
}
