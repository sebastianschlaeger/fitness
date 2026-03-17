import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCurrentPhase, getTodaysTraining, today } from '../lib/dates'
import { getTodaysWorkout, startWorkout, getLastExerciseSets, getExerciseSetData, logExerciseSets, completeExercise, getWorkoutExercises, type WorkoutLog } from '../lib/api'
import SetInput from '../components/SetInput'
import RestTimer from '../components/RestTimer'
import CardioBlock from '../components/CardioBlock'

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
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [showTimer, setShowTimer] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setsRef = useRef<SetData[]>([])
  const workoutRef = useRef<WorkoutLog | null>(null)
  const timerNextRef = useRef<string | null>(null)

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
    setShowTimer(false)
    setTimerSeconds(0)
    setFinishing(false)
    timerNextRef.current = null
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    async function load() {
      if (!exercise) return

      let w = await getTodaysWorkout()
      if (!w) {
        w = await startWorkout({ date: today(), phase: phase.phase, day_name: trainingDay!.name })
      }
      setWorkout(w)

      // Try to load today's saved sets first
      const savedSets = await getExerciseSetData(w.id, exercise.id)
      let prefilled: SetData[]

      if (savedSets.length > 0) {
        prefilled = Array.from({ length: exercise.sets }, (_, i) => {
          const saved = savedSets.find(s => s.set_number === i + 1)
          return {
            weight_kg: saved?.weight_kg || 0,
            reps: saved?.reps || 0,
            completed: saved?.is_completed === 1,
          }
        })
      } else {
        // Pre-fill from last session
        const lastSets = await getLastExerciseSets(exercise.id)
        prefilled = Array.from({ length: exercise.sets }, (_, i) => {
          const last = lastSets.find(s => s.set_number === i + 1)
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
    } else {
      // Start rest timer between sets (use phase setting or default 150s)
      setTimerSeconds(phase.restSeconds || 150)
      setShowTimer(true)
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
      // Get all completed exercises to find the next uncompleted one
      const completedExercises = await getWorkoutExercises(workout.id)
      const completedIds = new Set(completedExercises.map(e => e.exercise_id))
      completedIds.add(exercise.id) // Include the one we just completed

      // Find next uncompleted exercise (starting after current, then wrapping)
      const currentIndex = trainingDay.exercises.findIndex(e => e.id === exerciseId)
      let nextExercise = null

      // First check exercises after current position
      for (let i = currentIndex + 1; i < trainingDay.exercises.length; i++) {
        if (!completedIds.has(trainingDay.exercises[i].id)) {
          nextExercise = trainingDay.exercises[i]
          break
        }
      }
      // Then check exercises before current position (skipped ones)
      if (!nextExercise) {
        for (let i = 0; i < currentIndex; i++) {
          if (!completedIds.has(trainingDay.exercises[i].id)) {
            nextExercise = trainingDay.exercises[i]
            break
          }
        }
      }

      if (nextExercise) {
        timerNextRef.current = nextExercise.id
        setTimerSeconds(120)
        setShowTimer(true)
      } else {
        // All exercises done → back to training overview
        navigate('/training')
      }
    } else {
      navigate('/training')
    }
  }

  function handleTimerDone() {
    setShowTimer(false)
    if (timerNextRef.current) {
      const nextId = timerNextRef.current
      timerNextRef.current = null
      navigate(`/training/${nextId}`, { replace: true })
    }
  }

  function handleTimerSkip() {
    setShowTimer(false)
    if (timerNextRef.current) {
      const nextId = timerNextRef.current
      timerNextRef.current = null
      navigate(`/training/${nextId}`, { replace: true })
    }
  }

  const allDone = sets.every(s => s.completed)
  const startedAt = workout?.started_at ? new Date(workout.started_at) : null
  const durationMinutes = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 60000) : 0

  // Custom image from localStorage
  const customImage = localStorage.getItem(`exercise-image-${exercise.id}`)

  function handleImageUpload() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        localStorage.setItem(`exercise-image-${exercise!.id}`, reader.result as string)
        window.location.reload()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

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

      {showTimer && (
        <RestTimer
          seconds={timerSeconds}
          onDone={handleTimerDone}
          onSkip={handleTimerSkip}
          isExerciseTransition={timerNextRef.current !== null}
          nextExerciseName={
            timerNextRef.current
              ? trainingDay?.exercises.find(e => e.id === timerNextRef.current)?.name
              : undefined
          }
        />
      )}

      <div className="relative mb-3">
        <img
          src={customImage || exercise.equipmentImage}
          alt={exercise.equipment}
          className="w-full h-48 object-contain rounded-xl bg-surface"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <button
          onClick={handleImageUpload}
          className="absolute bottom-2 right-2 bg-surface/80 backdrop-blur text-text-dim rounded-lg px-2 py-1 text-xs border border-border"
        >
          📷 Foto ändern
        </button>
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
              <h3 className="text-sm font-bold">{exercise.sets} Sätze{exercise.reps ? ` × ${exercise.reps} Wdh` : ''}</h3>
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
                onClick={() => {
                  if (!trainingDay) return
                  const currentIndex = trainingDay.exercises.findIndex(e => e.id === exerciseId)
                  const nextExercise = trainingDay.exercises[currentIndex + 1] || trainingDay.exercises[0]
                  if (nextExercise && nextExercise.id !== exerciseId) {
                    navigate(`/training/${nextExercise.id}`, { replace: true })
                  }
                }}
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
