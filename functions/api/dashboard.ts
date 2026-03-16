import { type Env, jsonResponse } from './_db'

const PLAN_START = '2026-03-16'
const MAMMUTMARSCH = '2026-09-05'
const START_WEIGHT = 94

function getPhaseInfo(today: Date) {
  const start = new Date(PLAN_START)
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1

  if (week <= 4) return { phase: 1, name: 'Wiedereinstieg', weekCurrent: week, weekTotal: 4, minVisits: 3 }
  if (week <= 12) return { phase: 2, name: 'Aufbau', weekCurrent: week - 4, weekTotal: 8, minVisits: 4 }
  return { phase: 3, name: 'Leistung', weekCurrent: Math.min(week - 12, 12), weekTotal: 12, minVisits: 5 }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const phaseInfo = getPhaseInfo(today)

  // Week start (Monday)
  const dayOfWeek = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  const weekStart = monday.toISOString().split('T')[0]

  // Streak: count consecutive qualifying weeks going backwards
  let streak = 0
  let checkDate = new Date(monday)
  checkDate.setDate(checkDate.getDate() - 7) // Start from last completed week

  while (streak < 52) { // Safety bound: max 52 weeks
    const ws = checkDate.toISOString().split('T')[0]
    const we = new Date(checkDate)
    we.setDate(we.getDate() + 6)
    const weStr = we.toISOString().split('T')[0]

    const pi = getPhaseInfo(checkDate)
    const count = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM workout_logs WHERE date >= ? AND date <= ? AND completed_at IS NOT NULL'
    ).bind(ws, weStr).first()

    if ((count as any).c >= pi.minVisits) {
      streak++
      checkDate.setDate(checkDate.getDate() - 7)
    } else {
      break
    }
  }

  // Latest weight
  const latestWeight = await env.DB.prepare(
    'SELECT * FROM body_weight ORDER BY date DESC LIMIT 1'
  ).first()

  // Walking this week + total
  const [walkWeek, walkTotal] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(SUM(distance_km),0) as km, COALESCE(SUM(duration_minutes),0) as minutes FROM walking_pad WHERE date >= ?').bind(weekStart).first(),
    env.DB.prepare('SELECT COALESCE(SUM(distance_km),0) as km FROM walking_pad').first(),
  ])

  // Week activity (Mon-Sun)
  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(d.toISOString().split('T')[0])
  }

  const [workouts, walkingEntries] = await Promise.all([
    env.DB.prepare(`SELECT date FROM workout_logs WHERE date >= ? AND date <= ? AND completed_at IS NOT NULL`).bind(weekStart, weekDates[6]).all(),
    env.DB.prepare(`SELECT date FROM walking_pad WHERE date >= ? AND date <= ?`).bind(weekStart, weekDates[6]).all(),
  ])

  const gymDates = new Set((workouts.results as any[]).map(w => w.date))
  const walkDates = new Set((walkingEntries.results as any[]).map(w => w.date))

  const weekActivity = weekDates.map(date => {
    if (date > todayStr) return { date, type: 'future' as const }
    if (gymDates.has(date)) return { date, type: 'gym' as const }
    if (walkDates.has(date)) return { date, type: 'walking' as const }
    return { date, type: 'rest' as const }
  })

  // Today's training name (from phase/day-of-week mapping)
  const dow = today.getDay() || 7
  const phaseData = [
    { days: [{ daysOfWeek: [1,3,5], name: 'Ganzkörper' }] },
    { days: [{ daysOfWeek: [1,4], name: 'Unterkörper' }, { daysOfWeek: [2,5], name: 'Oberkörper' }] },
    { days: [{ daysOfWeek: [1], name: 'Push' }, { daysOfWeek: [2], name: 'Pull' }, { daysOfWeek: [3], name: 'Legs' }, { daysOfWeek: [4], name: 'Upper' }, { daysOfWeek: [5], name: 'Lower' }] },
  ]
  const currentPhaseData = phaseData[phaseInfo.phase - 1]
  const todaysDay = currentPhaseData.days.find(d => d.daysOfWeek.includes(dow))

  const daysUntil = Math.max(0, Math.ceil((new Date(MAMMUTMARSCH).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  return jsonResponse({
    streak,
    phase: { phase: phaseInfo.phase, name: phaseInfo.name, weekCurrent: phaseInfo.weekCurrent, weekTotal: phaseInfo.weekTotal },
    mammutmarschDays: daysUntil,
    latestWeight: latestWeight ? { weight_kg: (latestWeight as any).weight_kg, delta: (latestWeight as any).weight_kg - START_WEIGHT } : null,
    walkingThisWeek: { km: (walkWeek as any).km, minutes: (walkWeek as any).minutes },
    walkingTotal: { km: (walkTotal as any).km },
    weekActivity,
    todaysTraining: todaysDay ? { name: todaysDay.name } : null,
  })
}
