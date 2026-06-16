import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getCurrentPhase, getTodaysTraining, today, yesterday, getDayOfWeek, getUpcomingTrainings } from '../lib/dates'
import { getTodaysWorkout, startWorkout, completeWorkout, getLastExerciseSets, getWorkoutExercises, type WorkoutLog } from '../lib/api'
import { useOrderedExercises } from '../lib/exerciseOrder'
import ExerciseCard from '../components/ExerciseCard'
import SortableExerciseList from '../components/SortableExerciseList'

const DAY_NAMES = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** Kurzes Datums-Label wie "Sa 14.6." (Datum ist UTC-Mitternacht). */
function formatDayLabel(dateStr: string): string {
  const dow = getDayOfWeek(dateStr)
  const d = new Date(dateStr)
  return `${DAY_NAMES[dow]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`
}

function UpcomingTrainings() {
  const upcoming = getUpcomingTrainings(2)
  if (upcoming.length === 0) return null

  return (
    <div className="mt-6">
      <h2 className="text-sm font-bold text-text-dim uppercase tracking-wider mb-3">Nächste Trainings</h2>
      <div className="space-y-3">
        {upcoming.map(({ date, dayName, training }) => (
          <div key={date} className="bg-surface rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">{dayName}</span>
              <span className="text-xs text-text-dim">{training.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {training.exercises.map(ex => (
                <span key={ex.id} className="text-xs bg-surface2 rounded-lg px-2 py-0.5 text-text-dim">
                  {ex.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Training() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  // Nachhol-Modus: ?date=YYYY-MM-DD. Ohne Parameter = heute.
  const dateParam = params.get('date')
  const date = dateParam || today()
  const isCatchUp = !!dateParam && dateParam !== today()
  const dateQuery = isCatchUp ? `?date=${date}` : ''

  const phase = getCurrentPhase(date)
  const trainingDay = getTodaysTraining(date)
  const exercises = useOrderedExercises(trainingDay)
  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
  const [topSets, setTopSets] = useState<Record<string, { weight_kg: number; reps: number }>>({})
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState(false)
  // Gestriges Training schon abgeschlossen? Steuert den Nachhol-Einstieg.
  const [yesterdayDone, setYesterdayDone] = useState(false)

  // Gab es gestern überhaupt ein Training? (nur relevant, wenn wir heute schauen)
  const yesterdaysTraining = isCatchUp ? null : getTodaysTraining(yesterday())

  useEffect(() => {
    setLoading(true)
    setWorkout(null)
    setCompletedExercises(new Set())
    setTopSets({})
    setYesterdayDone(false)
    async function load() {
      try {
        const w = await getTodaysWorkout(isCatchUp ? date : undefined)
        setWorkout(w)

        // Nachhol-Einstieg: prüfen, ob das gestrige Training schon erledigt ist.
        if (!isCatchUp && yesterdaysTraining) {
          const yw = await getTodaysWorkout(yesterday())
          setYesterdayDone(!!yw?.completed_at)
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // Einstieg zum Nachholen des gestrigen Trainings (nur in der Heute-Ansicht).
  const catchUpEntry = !isCatchUp && yesterdaysTraining && !yesterdayDone ? (
    <button
      onClick={() => navigate(`/training?date=${yesterday()}`)}
      className="w-full mt-6 rounded-xl border border-accent/30 bg-accent/10 p-3 text-center text-sm font-semibold text-accent-light active:bg-accent/20 transition-colors"
    >
      ↩ Gestriges Training nachholen · {yesterdaysTraining.name}
    </button>
  ) : null

  // Banner im Nachhol-Modus mit Rücksprung zu heute.
  const catchUpBanner = isCatchUp ? (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-3 py-2">
      <span className="text-xs font-semibold text-accent-light">↩ Nachhol-Modus · {formatDayLabel(date)}</span>
      <button onClick={() => navigate('/training')} className="text-xs text-text-dim underline">
        Zurück zu heute
      </button>
    </div>
  ) : null

  if (loading) return <div className="p-4 text-text-dim">Laden...</div>

  if (!trainingDay) {
    return (
      <div className="p-4">
        {catchUpBanner}
        <div className="text-center">
          <div className="text-6xl mb-4">🧘</div>
          <h1 className="text-xl font-bold mb-2">{isCatchUp ? `${formatDayLabel(date)}: Ruhetag` : 'Heute: Ruhetag'}</h1>
          <p className="text-text-dim">Walking Pad nicht vergessen!</p>
        </div>
        {catchUpEntry}
        {!isCatchUp && <UpcomingTrainings />}
      </div>
    )
  }

  const allDone = exercises.length > 0 && exercises.every(ex => completedExercises.has(ex.id))
  const doneCount = completedExercises.size
  const totalCount = exercises.length

  async function handleStart() {
    const w = await startWorkout({ date, phase: phase.phase, day_name: trainingDay!.name })
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
      {catchUpBanner}
      <div className="text-xs text-text-dim uppercase tracking-wider mb-1">
        Phase {phase.phase} · {DAY_NAMES[getDayOfWeek(date)]}: {trainingDay.name}
      </div>
      {phase.info && (
        <p className="text-xs text-text-dim mb-2">{phase.info}</p>
      )}
      {phase.rir && (
        <div className="text-xs text-accent-light mb-3">RIR {phase.rir} · Pause ~{Math.round((phase.restSeconds || 150) / 60)} Min</div>
      )}

      {!workout && !sortMode && (
        <button onClick={handleStart} className="w-full bg-accent rounded-xl p-3 text-center font-semibold text-white mb-4 active:bg-accent/80">
          Training starten
        </button>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-text-dim uppercase tracking-wider">Übungen</h2>
        <button
          onClick={() => setSortMode(s => !s)}
          className={`text-xs font-semibold rounded-lg px-2.5 py-1 ${
            sortMode ? 'bg-accent text-white' : 'bg-surface2 text-accent-light'
          }`}
        >
          {sortMode ? 'Fertig' : '↕ Sortieren'}
        </button>
      </div>

      {sortMode ? (
        <>
          <p className="text-xs text-text-dim mb-2">Am Griff rechts ziehen, um die Reihenfolge zu ändern.</p>
          <SortableExerciseList dayName={trainingDay.name} exercises={exercises} />
        </>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex, i) => {
            const isCompleted = completedExercises.has(ex.id)
            const firstUncompleted = exercises.findIndex(e => !completedExercises.has(e.id))
            const status = isCompleted ? 'completed' as const : i === firstUncompleted ? 'current' as const : 'upcoming' as const

            return <ExerciseCard key={ex.id} exercise={ex} status={status} topSet={topSets[ex.id]} dateQuery={dateQuery} />
          })}
        </div>
      )}

      {workout && !workout.completed_at && !sortMode && (
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

      {workout?.completed_at && !sortMode && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center text-success font-semibold mt-4">
          Training abgeschlossen ✓
        </div>
      )}

      {catchUpEntry}
      {!isCatchUp && <UpcomingTrainings />}
    </div>
  )
}
