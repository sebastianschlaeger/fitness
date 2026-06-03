import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Exercise } from '../data/training-plan'
import { setOrder } from '../lib/exerciseOrder'
import { useCustomImage } from '../lib/customImages'

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

type DragState = { id: string; fromIndex: number; startY: number; delta: number; targetIndex: number }

/**
 * Touch-optimiertes Drag-and-Drop zum Sortieren der Geräte. Bewusst ohne
 * externe Library (Pointer-Events) — hält den Build und Auto-Deploy schlank.
 * Das gezogene Element folgt dem Finger, die übrigen weichen live aus.
 */
export default function SortableExerciseList({ dayName, exercises }: {
  dayName: string
  exercises: Exercise[]
}) {
  const [items, setItems] = useState<Exercise[]>(exercises)
  const [drag, setDrag] = useState<DragState | null>(null)
  const stepRef = useRef<number>(72)
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Reihenfolge von außen übernehmen, solange nicht gerade gezogen wird
  const incomingKey = exercises.map(e => e.id).join('|')
  useEffect(() => {
    if (!drag) setItems(exercises)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingKey])

  function measureStep() {
    const tops = items
      .map(it => rowRefs.current.get(it.id))
      .filter((el): el is HTMLDivElement => !!el)
      .map(el => el.getBoundingClientRect().top)
    if (tops.length >= 2) stepRef.current = Math.abs(tops[1] - tops[0]) || stepRef.current
  }

  function onPointerDown(e: ReactPointerEvent, index: number, id: string) {
    e.preventDefault()
    measureStep()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ id, fromIndex: index, startY: e.clientY, delta: 0, targetIndex: index })
  }

  function onPointerMove(e: ReactPointerEvent) {
    setDrag(prev => {
      if (!prev) return prev
      const delta = e.clientY - prev.startY
      const step = stepRef.current || 72
      const targetIndex = Math.max(0, Math.min(items.length - 1, prev.fromIndex + Math.round(delta / step)))
      return { ...prev, delta, targetIndex }
    })
  }

  function onPointerUp(e: ReactPointerEvent) {
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    setDrag(prev => {
      if (prev && prev.targetIndex !== prev.fromIndex) {
        const next = move(items, prev.fromIndex, prev.targetIndex)
        setItems(next)
        setOrder(dayName, next.map(it => it.id))
      }
      return null
    })
  }

  function onPointerCancel(e: ReactPointerEvent) {
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    setDrag(null)
  }

  return (
    <div className="space-y-2 select-none">
      {items.map((ex, i) => {
        const step = stepRef.current || 72
        let translateY = 0
        let dragging = false
        if (drag) {
          if (drag.id === ex.id) {
            translateY = drag.delta
            dragging = true
          } else if (drag.fromIndex < drag.targetIndex && i > drag.fromIndex && i <= drag.targetIndex) {
            translateY = -step
          } else if (drag.fromIndex > drag.targetIndex && i >= drag.targetIndex && i < drag.fromIndex) {
            translateY = step
          }
        }
        return (
          <SortableRow
            key={ex.id}
            exercise={ex}
            dragging={dragging}
            translateY={translateY}
            registerRef={(el) => { if (el) rowRefs.current.set(ex.id, el); else rowRefs.current.delete(ex.id) }}
            onHandleDown={(e) => onPointerDown(e, i, ex.id)}
            onHandleMove={onPointerMove}
            onHandleUp={onPointerUp}
            onHandleCancel={onPointerCancel}
          />
        )
      })}
    </div>
  )
}

function SortableRow({ exercise, dragging, translateY, registerRef, onHandleDown, onHandleMove, onHandleUp, onHandleCancel }: {
  exercise: Exercise
  dragging: boolean
  translateY: number
  registerRef: (el: HTMLDivElement | null) => void
  onHandleDown: (e: ReactPointerEvent) => void
  onHandleMove: (e: ReactPointerEvent) => void
  onHandleUp: (e: ReactPointerEvent) => void
  onHandleCancel: (e: ReactPointerEvent) => void
}) {
  const customImage = useCustomImage(exercise.id)
  return (
    <div
      ref={registerRef}
      style={{
        transform: `translateY(${translateY}px)`,
        transition: dragging ? 'none' : 'transform 150ms ease',
        zIndex: dragging ? 10 : undefined,
      }}
      className={`relative flex items-center gap-3 bg-surface2 rounded-xl p-3 ${
        dragging ? 'shadow-lg shadow-accent/20 scale-[1.02] border border-accent' : 'border border-transparent'
      }`}
    >
      <img
        src={customImage || exercise.equipmentImage}
        alt={exercise.equipment}
        className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-surface"
        onError={(e) => { (e.target as HTMLImageElement).src = '/images/equipment/placeholder.svg' }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{exercise.name}</div>
        <div className="text-xs text-text-dim truncate">{exercise.equipment}</div>
      </div>
      <button
        aria-label="Verschieben"
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleCancel}
        className="flex-shrink-0 px-2 py-2 text-text-dim touch-none cursor-grab active:cursor-grabbing"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>
    </div>
  )
}
