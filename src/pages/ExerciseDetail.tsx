import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCurrentPhase, getTodaysTraining, today } from '../lib/dates'
import { getTodaysWorkout, startWorkout, getLastExerciseSets, getExerciseSetData, logExerciseSets, completeExercise, getWorkoutExercises, type WorkoutLog } from '../lib/api'
import { orderExercises } from '../lib/exerciseOrder'
import { useTimer } from '../lib/timer'
import { useCustomImage, captureCustomImage, removeCustomImage } from '../lib/customImages'
import SetInput from '../components/SetInput'
import CardioBlock from '../components/CardioBlock'

type SetData = { weight_kg: number; reps: number; completed: boolean }

const WARMUP_REST_SECONDS = 45

/** Label für die Arbeitssätze (ohne den vorgelagerten Aufwärmsatz). */
function workLabel(idx: number, count: number): string {
  if (idx === count - 1) return 'Top-Satz'
  if (idx === count - 2) return 'Schwer'
  if (idx === 0) return 'Leicht'
  return 'Mittel'
}

/** Nächste noch nicht erledigte Übung in der sortierten Liste (mit Wrap-around). */
function findNextUnfinished<T extends { id: string }>(ordered: T[], currentId: string, completedIds: Set<string>): T | null {
  const currentIndex = ordered.findIndex(e => e.id === currentId)
  for (let i = currentIndex + 1; i < ordered.length; i++) {
    if (!completedIds.has(ordered[i].id)) return ordered[i]
  }
  for (let i = 0; i < currentIndex; i++) {
    if (!completedIds.has(ordered[i].id)) return ordered[i]
  }
  return null
}

/** Gespeicherten Satz vom Ende her zuordnen (Top-Satz auf Top-Satz). */
function pickAligned<T extends { set_number: number }>(sortedAsc: T[], total: number, i: number): T | undefined {
  const li = sortedAsc.length - 1 - (total - 1 - i)
  return li >= 0 ? sortedAsc[li] : undefined
}

export default function ExerciseDetail() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const phase = getCurrentPhase()
  const trainingDay = getTodaysTraining()
  const exercise = trainingDay?.exercises.find(e => e.id === exerciseId)
  const timer = useTimer()
  const customImage = useCustomImage(exercise?.id ?? '')

  // Ein echter Aufwärmsatz (sehr leicht) vor den Arbeitssätzen — nur bei Kraft.
  const warmupCount = exercise && !exercise.isCardio ? 1 : 0

  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [sets, setSets] = useState<SetData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setsRef = useRef<SetData[]>([])
  const workoutRef = useRef<WorkoutLog | null>(null)

  // Keep refs in sync
  useEffect(() => { setsRef.current = sets }, [sets])
  useEffect(() => { workoutRef.current = workout }, [workout])

  const saveToServer = useCallback(async (setsToSave: SetData[]) => {
    const w = workoutRef.current
    if (!w || !exercise) return
    setSaving(true)
    try {
      const exerciseSets = setsToSave.map((s, i) => ({
        workout_id: w.id,
        exercise_id: exercise.id,
        set_number: i + 1,
        weight_kg: s.weight_kg,
        reps: s.reps,
        is_top_set: i === setsToSave.length - 1 ? 1 : 0,
        is_completed: s.completed ? 1 : 0,
      }))
      await logExerciseSets(exerciseSets)
    } catch (e) {
      console.error('Auto-save failed:', e)
    } finally {
      setSaving(false)
    }
  }, [exercise])

  // Debounced auto-save
  const triggerAutoSave = useCallback((updatedSets: SetData[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToServer(updatedSets)
    }, 500)
  }, [saveToServer])

  // Save on page leave via sendBeacon
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const w = workoutRef.current
      if (w && exercise && setsRef.current.some(s => s.weight_kg > 0 || s.reps > 0)) {
        const exerciseSets = setsRef.current.map((s, i) => ({
          workout_id: w.id,
          exercise_id: exercise.id,
          set_number: i + 1,
          weight_kg: s.weight_kg,
          reps: s.reps,
          is_top_set: i === setsRef.current.length - 1 ? 1 : 0,
          is_completed: s.completed ? 1 : 0,
        }))
        const blob = new Blob([JSON.stringify({ sets: exerciseSets })], { type: 'application/json' })
        navigator.sendBeacon('/api/exercises', blob)
      }
    }
  }, [exercise])

  // Load exercise data — resets fully when exerciseId changes
  useEffect(() => {
    setLoading(true)
    setSets([])
    setSaving(false)
    setFinishing(false)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    async function load() {
      if (!exercise) return

      let w = await getTodaysWorkout()
      if (!w) {
        w = await startWorkout({ date: today(), phase: phase.phase, day_name: trainingDay!.name })
      }
      setWorkout(w)

      const total = warmupCount + exercise.sets

      // Try to load today's saved sets first
      const savedSets = await getExerciseSetData(w.id, exercise.id)
      let prefilled: SetData[]

      if (savedSets.length > 0) {
        // Vom Ende her ausrichten — im Normalfall identisch zur Position,
        // korrigiert aber den Fall, dass alte Daten (ohne Aufwärmsatz) mitten
        // im Workout neu geladen werden (sonst rutscht der Top-Satz auf 'Schwer').
        const sorted = [...savedSets].sort((a, b) => a.set_number - b.set_number)
        prefilled = Array.from({ length: total }, (_, i) => {
          const saved = pickAligned(sorted, total, i)
          return {
            weight_kg: saved?.weight_kg || 0,
            reps: saved?.reps || 0,
            completed: saved?.is_completed === 1,
          }
        })
      } else {
        // Pre-fill from last session — ebenfalls vom Ende her ausgerichtet
        // (Top-Satz auf Top-Satz), damit der neue Aufwärmsatz vorne leer bleibt.
        const lastSets = await getLastExerciseSets(exercise.id)
        const sorted = [...lastSets].sort((a, b) => a.set_number - b.set_number)
        prefilled = Array.from({ length: total }, (_, i) => {
          const last = pickAligned(sorted, total, i)
          return {
            weight_kg: last?.weight_kg || 0,
            reps: last?.reps || 0,
            completed: false,
          }
        })
      }
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
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveToServer(updated)

    // Check if all sets done → auto-complete exercise
    const allCompleted = updated.every(s => s.completed)
    if (allCompleted) {
      finishExercise(updated)
    } else if (index < warmupCount) {
      // Kurze Pause nach dem Aufwärmsatz
      timer.start(WARMUP_REST_SECONDS, 'Aufwärmen — kurze Pause')
    } else {
      timer.start(phase.restSeconds || 150, 'Satzpause')
    }
  }

  async function finishExercise(currentSets?: SetData[]) {
    if (!workout || !exercise || finishing) return
    setFinishing(true)
    const setsToSave = currentSets || sets
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    await saveToServer(setsToSave)
    await completeExercise(workout.id, exercise.id)

    if (trainingDay) {
      const ordered = orderExercises(trainingDay)
      // Get all completed exercises to find the next uncompleted one
      const completedExercises = await getWorkoutExercises(workout.id)
      const completedIds = new Set(completedExercises.map(e => e.exercise_id))
      completedIds.add(exercise.id) // Include the one we just completed

      const nextExercise = findNextUnfinished(ordered, exercise.id, completedIds)

      if (nextExercise) {
        // Sofort die nächste Übung anzeigen — die Pause läuft oben weiter.
        timer.start(phase.restSeconds || 120, `Pause vor: ${nextExercise.name}`)
        navigate(`/training/${nextExercise.id}`, { replace: true })
      } else {
        // All exercises done → back to training overview
        timer.stop()
        navigate('/training')
      }
    } else {
      navigate('/training')
    }
  }

  // "Gerät besetzt" → nächste noch offene Übung (überspringt Erledigte), Stand sichern
  async function handleSkip() {
    if (!exercise || !trainingDay) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    await saveToServer(sets)
    const ordered = orderExercises(trainingDay)
    let completedIds = new Set<string>()
    if (workout) {
      const completed = await getWorkoutExercises(workout.id)
      completedIds = new Set(completed.map(e => e.exercise_id))
    }
    const next = findNextUnfinished(ordered, exercise.id, completedIds)
    if (next) {
      navigate(`/training/${next.id}`, { replace: true })
    } else {
      navigate('/training')
    }
  }

  const allDone = sets.length > 0 && sets.every(s => s.completed)
  const startedAt = workout?.started_at ? new Date(workout.started_at) : null
  const durationMinutes = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 60000) : 0

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate('/training')} className="text-accent-light text-sm flex items-center gap-1">
          ← Zurück
        </button>
        {startedAt && durationMinutes > 0 && (
          <span className="text-xs text-text-dim">
            {durationMinutes < 60 ? `${durationMinutes} Min` : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`}
          </span>
        )}
      </div>

      <div className="relative mb-3">
        <img
          src={customImage || exercise.equipmentImage}
          alt={exercise.equipment}
          className="w-full h-48 object-contain rounded-xl bg-surface"
          onError={(e) => {
            const img = e.target as HTMLImageElement
            if (!img.src.endsWith('/images/equipment/placeholder.svg')) {
              img.src = '/images/equipment/placeholder.svg'
            }
          }}
        />
        <div className="absolute bottom-2 right-2 flex gap-2">
          {customImage && (
            <button
              onClick={() => removeCustomImage(exercise.id)}
              className="bg-surface/80 backdrop-blur text-text-dim rounded-lg px-2 py-1 text-xs border border-border"
            >
              Entfernen
            </button>
          )}
          <button
            onClick={() => captureCustomImage(exercise.id)}
            className="bg-surface/80 backdrop-blur text-text-dim rounded-lg px-2 py-1 text-xs border border-border"
          >
            📷 {customImage ? 'Neues Foto' : 'Foto aufnehmen'}
          </button>
        </div>
      </div>

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

      {exercise.isCardio ? (
        <CardioBlock
          exercise={exercise}
          allDone={allDone}
          onComplete={() => {
            const updated = sets.map(s => ({ ...s, completed: true }))
            setSets(updated)
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveToServer(updated)
            finishExercise(updated)
          }}
        />
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold">
                {warmupCount > 0 ? 'Aufwärmen + ' : ''}{exercise.sets} Sätze{exercise.reps ? ` × ${exercise.reps} Wdh` : ''}
              </h3>
              {saving && <span className="text-xs text-text-dim">Speichert...</span>}
            </div>
            <div className="space-y-1">
              {sets.map((set, i) => {
                const isWarmup = i < warmupCount
                const isTopSet = i === sets.length - 1
                const label = isWarmup ? 'Aufwärmen' : workLabel(i - warmupCount, exercise.sets)
                return (
                  <SetInput
                    key={i}
                    setNumber={i + 1}
                    label={label}
                    isWarmup={isWarmup}
                    isTopSet={isTopSet}
                    data={set}
                    onChange={(field, value) => updateSet(i, field, value)}
                    onComplete={() => completeSet(i)}
                  />
                )
              })}
            </div>
          </div>

          {!allDone && (
            <>
              <button
                onClick={() => finishExercise()}
                className="w-full rounded-xl p-3 text-center font-semibold text-white transition-colors bg-accent/30 cursor-not-allowed mb-2"
                disabled
              >
                Alle Sätze abschließen zum Weiter
              </button>
              <button
                onClick={handleSkip}
                className="w-full rounded-xl p-2 text-center text-sm text-accent-light font-medium"
              >
                Gerät besetzt → Überspringen
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
