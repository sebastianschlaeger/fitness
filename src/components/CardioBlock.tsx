import { useState, useEffect, useRef } from 'react'
import type { Exercise } from '../data/training-plan'

export default function CardioBlock({ exercise, allDone, onComplete }: {
  exercise: Exercise
  allDone: boolean
  onComplete: () => void
}) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number>(0)
  const target = (exercise.durationMinutes || 20) * 60 // seconds

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  function handleStart() {
    startTimeRef.current = Date.now()
    setRunning(true)
  }

  function handleDone() {
    setRunning(false)
    onComplete()
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const targetMins = exercise.durationMinutes || 20
  const progress = Math.min(1, elapsed / target)
  const reachedTarget = elapsed >= target

  if (allDone) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center mb-4">
        <div className="text-success font-semibold">Cardio abgeschlossen ✓</div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-4 mb-4">
      <div className="text-center">
        <div className="text-xs text-text-dim uppercase tracking-wider mb-1">
          Ziel: {targetMins} Minuten
        </div>

        {!running ? (
          <button
            onClick={handleStart}
            className="w-full bg-accent rounded-xl p-4 text-center font-bold text-white text-lg active:bg-accent/80 my-3"
          >
            Cardio starten
          </button>
        ) : (
          <>
            <div className={`text-5xl font-bold font-mono my-4 ${reachedTarget ? 'text-success' : 'text-accent'}`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-surface2 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${reachedTarget ? 'bg-success' : 'bg-accent'}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {reachedTarget && (
              <div className="text-sm text-success font-semibold mb-3">
                Ziel erreicht!
              </div>
            )}

            <button
              onClick={handleDone}
              className={`w-full rounded-xl p-3 text-center font-semibold text-white ${
                reachedTarget ? 'bg-success active:bg-success/80' : 'bg-accent active:bg-accent/80'
              }`}
            >
              Cardio abschließen
            </button>
          </>
        )}
      </div>
    </div>
  )
}
