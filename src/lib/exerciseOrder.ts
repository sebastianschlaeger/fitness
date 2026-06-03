import { useEffect, useState } from 'react'
import type { Exercise, TrainingDay } from '../data/training-plan'
import { recordWriteImmediate } from './sync'

/**
 * Selbst festgelegte Geräte-Reihenfolge pro Trainingstag (Drag-and-Drop).
 * Gespeichert als Liste von Übungs-IDs im localStorage, robust gegen
 * Plan-Änderungen: neue Übungen werden hinten angehängt, entfernte ignoriert.
 */

const PREFIX = 'exercise-order-'
const CHANGE_EVENT = 'exerciseorder-change'

function keyFor(dayName: string) {
  return `${PREFIX}${dayName}`
}

export function getOrder(dayName: string): string[] | null {
  try {
    const raw = localStorage.getItem(keyFor(dayName))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : null
  } catch {
    return null
  }
}

export function setOrder(dayName: string, ids: string[]) {
  const key = keyFor(dayName)
  const json = JSON.stringify(ids)
  localStorage.setItem(key, json)
  void recordWriteImmediate(key, json) // geräteübergreifend persistieren
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { dayName } }))
}

/** Übungen eines Tages in der gespeicherten Reihenfolge zurückgeben. */
export function orderExercises(day: TrainingDay): Exercise[] {
  const order = getOrder(day.name)
  if (!order) return day.exercises
  const byId = new Map(day.exercises.map(ex => [ex.id, ex]))
  const result: Exercise[] = []
  // erst die gespeicherte Reihenfolge (nur noch existierende Übungen)
  for (const id of order) {
    const ex = byId.get(id)
    if (ex) {
      result.push(ex)
      byId.delete(id)
    }
  }
  // dann alles, was im Plan neu dazugekommen ist
  for (const ex of day.exercises) {
    if (byId.has(ex.id)) result.push(ex)
  }
  return result
}

/** Reaktive Variante: rendert neu, wenn sich die Reihenfolge ändert. */
export function useOrderedExercises(day: TrainingDay | null): Exercise[] {
  const [exercises, setExercises] = useState<Exercise[]>(() => (day ? orderExercises(day) : []))

  useEffect(() => {
    setExercises(day ? orderExercises(day) : [])
    if (!day) return
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ dayName: string }>).detail
      if (!detail || detail.dayName === day!.name) setExercises(orderExercises(day!))
    }
    function onStorage(e: StorageEvent) {
      if (e.key === keyFor(day!.name)) setExercises(orderExercises(day!))
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [day?.name])

  return exercises
}
