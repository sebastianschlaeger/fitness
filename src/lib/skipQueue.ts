/**
 * „Gerät besetzt"-Warteschlange: übersprungene Übungen werden ans Ende des
 * Trainings geschoben und dort automatisch nachgeholt. Pro Workout in
 * localStorage gehalten, damit der Stand Navigation UND Reload übersteht
 * (ein Workout läuft typischerweise auf einem Gerät, daher kein Geräte-Sync).
 */

const PREFIX = 'deferred-exercises-'

function keyFor(workoutId: number) {
  return `${PREFIX}${workoutId}`
}

/** Übersprungene Übungs-IDs dieses Workouts in Skip-Reihenfolge. */
export function getDeferred(workoutId: number): string[] {
  try {
    const raw = localStorage.getItem(keyFor(workoutId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

/** Übung ans Ende der Nachhol-Reihenfolge setzen (idempotent, bewahrt Skip-Reihenfolge). */
export function addDeferred(workoutId: number, exerciseId: string): void {
  const current = getDeferred(workoutId)
  if (current.includes(exerciseId)) return
  try {
    localStorage.setItem(keyFor(workoutId), JSON.stringify([...current, exerciseId]))
  } catch {
    // localStorage gesperrt/voll → Skip funktioniert ohne Persistenz weiter
  }
}

export function clearDeferred(workoutId: number): void {
  try {
    localStorage.removeItem(keyFor(workoutId))
  } catch {
    // ignore
  }
}

/** Liste so umsortieren, dass übersprungene Übungen — in Skip-Reihenfolge — ans Ende wandern. */
export function orderByDeferred<T extends { id: string }>(list: T[], deferredIds: string[]): T[] {
  if (deferredIds.length === 0) return list
  const deferredSet = new Set(deferredIds)
  const nonDeferred = list.filter(e => !deferredSet.has(e.id))
  const deferred = deferredIds
    .map(id => list.find(e => e.id === id))
    .filter((e): e is T => e !== undefined)
  return [...nonDeferred, ...deferred]
}
