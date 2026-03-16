import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCurrentPhase, getTodaysTraining, today } from '../lib/dates'
import { getTodaysWorkout, startWorkout, getLastExerciseSets, logExerciseSets, type WorkoutLog } from '../lib/api'
import SetInput from '../components/SetInput'

type SetData = { weight_kg: number; reps: number; completed: boolean }

export default function ExerciseDetail() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const phase = getCurrentPhase()
  const trainingDay = getTodaysTraining()
  const exercise = trainingDay?.exercises.find(e => e.id === exerciseId)

  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [sets, setSets] = useState<SetData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setsRef = useRef<SetData[]>([])

  // Keep ref in sync
  useEffect(() => { setsRef.current = sets }, [sets])

  const saveToServer = useCallback(async (setsToSave: SetData[]) => {
    if (!workout || !exercise) return
    setSaving(true)
    try {
      const exerciseSets = setsToSave.map((s, i) => ({
        workout_id: workout.id,
        exercise_id: exercise.id,
        set_number: i + 1,
        weight_kg: s.weight_kg,
        reps: s.reps,
        is_top_set: i === setsToSave.length - 1 ? 1 : 0,
      }))
      await logExerciseSets(exerciseSets)
    } catch (e) {
      console.error('Auto-save failed:', e)
    } finally {
      setSaving(false)
    }
  }, [workout, exercise])

  // Debounced auto-save: saves 500ms after last change
  const triggerAutoSave = useCallback((updatedSets: SetData[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToServer(updatedSets)
    }, 500)
  }, [saveToServer])

  // Save immediately on page leave
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        // Fire save synchronously on unmount
        if (workout && exercise && setsRef.current.some(s => s.weight_kg > 0 || s.reps > 0)) {
          const exerciseSets = setsRef.current.map((s, i) => ({
            workout_id: workout.id,
            exercise_id: exercise.id,
            set_number: i + 1,
            weight_kg: s.weight_kg,
            reps: s.reps,
            is_top_set: i === setsRef.current.length - 1 ? 1 : 0,
          }))
          // Use sendBeacon for reliable save on page close
          const blob = new Blob([JSON.stringify({ sets: exerciseSets })], { type: 'application/json' })
          navigator.sendBeacon('/api/exercises', blob)
        }
      }
    }
  }, [workout, exercise])

  useEffect(() => {
    async function load() {
      if (!exercise) return

      // Ensure workout exists
      let w = await getTodaysWorkout()
      if (!w) {
        w = await startWorkout({ date: today(), phase: phase.phase, day_name: trainingDay!.name })
      }
      setWorkout(w)

      // Pre-fill from last session
      const lastSets = await getLastExerciseSets(exercise.id)
      const prefilled: SetData[] = Array.from({ length: exercise.sets }, (_, i) => {
        const last = lastSets.find(s => s.set_number === i + 1)
        return {
          weight_kg: last?.weight_kg || 0,
          reps: last?.reps || 0,
          completed: false,
        }
      })
      setSets(prefilled)
      setLoading(false)
    }
    load()
  }, [exerciseId])

  if (!exercise) return <div className="p-4 text-danger">Übung nicht gefunden</div>
  if (loading) return <div className="p-4 text-text-dim">Laden...</div>

  function updateSet(index: number, field: 'weight_kg' | 'reps', value: number) {
    const updated = sets.map((s, i) => i === index ? { ...s, [field]: value } : s)
    setSets(updated)
    triggerAutoSave(updated)
  }

  function completeSet(index: number) {
    const updated = sets.map((s, i) => i === index ? { ...s, completed: true } : s)
    setSets(updated)
    // Save immediately on set completion (no debounce)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveToServer(updated)
  }

  const allDone = sets.every(s => s.completed)

  async function handleFinish() {
    if (!workout) return
    // Final save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    await saveToServer(sets)
    navigate('/training')
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate('/training')} className="text-accent-light text-sm mb-3 flex items-center gap-1">
        ← Zurück
      </button>

      <img
        src={exercise.equipmentImage}
        alt={exercise.equipment}
        className="w-full h-40 object-cover rounded-xl mb-3 bg-surface"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />

      <h1 className="text-xl font-bold">{exercise.name}</h1>
      <p className="text-sm text-text-dim mb-2">{exercise.equipment}</p>

      {exercise.hints && (
        <p className="text-xs text-text-dim mb-2">{exercise.hints}</p>
      )}

      {exercise.shoulderWarning && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-danger font-semibold">⚠️ {exercise.shoulderWarning}</p>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold">{exercise.sets} Sätze (Pyramide)</h3>
          {saving && <span className="text-xs text-text-dim">Speichert...</span>}
        </div>
        <div className="space-y-1">
          {sets.map((set, i) => (
            <SetInput
              key={i}
              setNumber={i + 1}
              totalSets={exercise.sets}
              data={set}
              isTopSet={i === sets.length - 1}
              onChange={(field, value) => updateSet(i, field, value)}
              onComplete={() => completeSet(i)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleFinish}
        disabled={!allDone}
        className={`w-full rounded-xl p-3 text-center font-semibold text-white transition-colors ${
          allDone ? 'bg-accent active:bg-accent/80' : 'bg-accent/30 cursor-not-allowed'
        }`}
      >
        Übung abschließen
      </button>
    </div>
  )
}
