import { phases, PLAN_START_DATE, MAMMUTMARSCH_DATE, type Phase, type TrainingDay } from '../data/training-plan'

/** Get ISO date string for today (YYYY-MM-DD) */
export function today(): string {
  return new Date().toISOString().split('T')[0]
}

/** Calculate week number since plan start (1-based) */
export function getWeekNumber(date: string = today()): number {
  const start = new Date(PLAN_START_DATE)
  const current = new Date(date)
  const diffMs = current.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

/** Get current phase based on date */
export function getCurrentPhase(date: string = today()): Phase {
  const week = getWeekNumber(date)
  for (const phase of phases) {
    if (week >= phase.weeks[0] && week <= phase.weeks[1]) {
      return phase
    }
  }
  // After plan ends, stay on phase 3
  return phases[2]
}

/** Get day of week (1=Mon, 7=Sun) */
export function getDayOfWeek(date: string = today()): number {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ...
  return day === 0 ? 7 : day
}

/** Get today's training day (or null if rest day) */
export function getTodaysTraining(date: string = today()): TrainingDay | null {
  const phase = getCurrentPhase(date)
  const dow = getDayOfWeek(date)

  // Check if today is a training day at all
  const matchingDay = phase.days.find(d => d.daysOfWeek.includes(dow))
  if (!matchingDay) return null

  // A/B alternation for phases with exactly 2 day templates
  if (phase.alternating && phase.days.length === 2) {
    const week = getWeekNumber(date)
    const phaseWeek = week - phase.weeks[0] + 1 // 1-based week within phase

    // Which session of the week is this? (1st, 2nd, 3rd based on daysOfWeek order)
    const trainingDays = phase.days[0].daysOfWeek // both templates share same daysOfWeek
    const sessionIndex = trainingDays.indexOf(dow) // 0, 1, or 2

    // Odd phase-weeks: A-B-A (sessions 0,2 = A, session 1 = B)
    // Even phase-weeks: B-A-B (sessions 0,2 = B, session 1 = A)
    const isOddWeek = phaseWeek % 2 === 1
    const isMiddleSession = sessionIndex === 1

    const useA = isOddWeek ? !isMiddleSession : isMiddleSession
    return useA ? phase.days[0] : phase.days[1]
  }

  return matchingDay
}

/** Days until Mammutmarsch */
export function daysUntilMammutmarsch(date: string = today()): number {
  const target = new Date(MAMMUTMARSCH_DATE)
  const current = new Date(date)
  const diffMs = target.getTime() - current.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

/** Get Monday of the week containing the given date */
export function getWeekStart(date: string = today()): string {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

/** Get all 7 dates (Mon-Sun) for the week containing the given date */
export function getWeekDates(date: string = today()): string[] {
  const monday = new Date(getWeekStart(date))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

/** Get the next N upcoming training days (looking ahead from tomorrow) */
export function getUpcomingTrainings(count: number = 2): { date: string; dayName: string; training: TrainingDay }[] {
  const result: { date: string; dayName: string; training: TrainingDay }[] = []
  const d = new Date(today())

  for (let i = 0; i < 30 && result.length < count; i++) {
    d.setDate(d.getDate() + 1)
    const dateStr = d.toISOString().split('T')[0]
    const training = getTodaysTraining(dateStr)
    if (training) {
      const dow = getDayOfWeek(dateStr)
      const names = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
      const day = d.getDate()
      const month = d.getMonth() + 1
      result.push({
        date: dateStr,
        dayName: `${names[dow]} ${day}.${month}.`,
        training,
      })
    }
  }
  return result
}

/** Week progress within current phase (e.g., week 3 of 4) */
export function getPhaseWeekProgress(date: string = today()): { current: number; total: number } {
  const phase = getCurrentPhase(date)
  const week = getWeekNumber(date)
  const current = week - phase.weeks[0] + 1
  const total = phase.weeks[1] - phase.weeks[0] + 1
  return { current: Math.min(current, total), total }
}
