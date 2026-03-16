import { useEffect, useState } from 'react'
import { getCurrentPhase, getTodaysTraining, today, getDayOfWeek } from '../lib/dates'
import { getTodaysWorkout, startWorkout, completeWorkout, getLastExerciseSets, getWorkoutExercises, type WorkoutLog, type ExerciseLog } from '../lib/api'
import ExerciseCard from '../components/ExerciseCard'

const DAY_NAMES = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function Training() {
  const phase = getCurrentPhase()
  const trainingDay = getTodaysTraining()
  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
  const [topSets, setTopSets] = useState<Record<string, { weight_kg: number; reps: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const w = await getTodaysWorkout()
        setWorkout(w)

        if (trainingDay) {
          // Load last top sets for each exercise
          const sets: Record<string, { weight_kg: number; reps: number }> = {}
          await Promise.all(trainingDay.exercises.map(async (ex) => {
            const lastSets = await getLastExerciseSets(ex.id)
            const topSet = lastSets.find(s => s.is_top_set)
            if (topSet) sets[ex.id] = { weight_kg: topSet.weight_kg, reps: topSet.reps }
          }))
          setTopSets(sets)

          // Check which exercises are completed in today's workout
          if (w) {
            const completed = new Set<string>()
            const workoutExercises = await getWorkoutExercises(w.id)
            workoutExercises.forEach(ex => completed.add(ex.exercise_id))
            setCompletedExercises(completed)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-4 text-text-dim">Laden...</div>

  if (!trainingDay) {
    return (
      <div className="p-4 text-center">
        <div className="text-6xl mb-4">🧘</div>
        <h1 className="text-xl font-bold mb-2">Heute: Ruhetag</h1>
        <p className="text-text-dim">Walking Pad nicht vergessen!</p>
      </div>
    )
  }

  const allDone = trainingDay.exercises.every(ex => completedExercises.has(ex.id))
  const doneCount = completedExercises.size
  const totalCount = trainingDay.exercises.length

  async function handleStart() {
    const w = await startWorkout({ date: today(), phase: phase.phase, day_name: trainingDay!.name })
    setWorkout(w)
  }

  async function handleComplete() {
    if (workout) {
      await completeWorkout(workout.id)
      setWorkout({ ...workout, completed_at: new Date().toISOString() })
    }
  }

  return (
    <div className="p-4">
      <div className="text-xs text-text-dim uppercase tracking-wider mb-1">
        Phase {phase.phase} · {DAY_NAMES[getDayOfWeek()]}: {trainingDay.name}
      </div>

      {!workout && (
        <button onClick={handleStart} className="w-full bg-accent rounded-xl p-3 text-center font-semibold text-white mb-4 active:bg-accent/80">
          Training starten
        </button>
      )}

      <div className="space-y-2">
        {trainingDay.exercises.map((ex, i) => {
          const isCompleted = completedExercises.has(ex.id)
          const firstUncompleted = trainingDay.exercises.findIndex(e => !completedExercises.has(e.id))
          const status = isCompleted ? 'completed' as const : i === firstUncompleted ? 'current' as const : 'upcoming' as const

          return <ExerciseCard key={ex.id} exercise={ex} status={status} topSet={topSets[ex.id]} />
        })}
      </div>

      {workout && !workout.completed_at && (
        <button
          onClick={handleComplete}
          disabled={!allDone}
          className={`w-full rounded-xl p-3 text-center font-semibold text-white mt-4 transition-colors ${
            allDone ? 'bg-success active:bg-success/80' : 'bg-success/30 cursor-not-allowed'
          }`}
        >
          Training abschließen ({doneCount}/{totalCount})
        </button>
      )}

      {workout?.completed_at && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center text-success font-semibold mt-4">
          Training abgeschlossen ✓
        </div>
      )}
    </div>
  )
}
