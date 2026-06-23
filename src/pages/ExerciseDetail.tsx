import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentPhase, getTodaysTraining, today } from '../lib/dates'
import { getTodaysWorkout, startWorkout, getLastExerciseSets, getExerciseSetData, logExerciseSets, completeExercise, getWorkoutExercises, getExerciseHistory, type WorkoutLog, type ExerciseHistoryPoint } from '../lib/api'
import { orderExercises } from '../lib/exerciseOrder'
import { getDeferred, addDeferred, orderByDeferred } from '../lib/skipQueue'
import { useTimer } from '../lib/timer'
import { useWakeLock } from '../lib/wakeLock'
import { useCustomImage, captureCustomImage, removeCustomImage } from '../lib/customImages'
import { getMachineAdjustments, machineIdFromImage } from '../data/machineAdjustments'
import SetInput from '../components/SetInput'
import CardioBlock from '../components/CardioBlock'
import HiitBlock from '../components/HiitBlock'
import MachineSettingsCard from '../components/MachineSettingsCard'
import ExerciseHistoryChart from '../components/ExerciseHistoryChart'
import Fireworks from '../components/Fireworks'

type SetData = { weight_kg: number; reps: number; completed: boolean }

/** Gewichtsstufe, falls noch keine zwei vergangenen Trainings zum Ableiten da sind. */
const DEFAULT_STEP_KG = 2.5

/** Auf 0,1 kg runden — gegen Float-Rauschen bei REAL-Gewichten. */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * „Eine Stufe" = die Gewichtsdifferenz zwischen den letzten beiden Arbeitssätzen
 * (Top-Satz minus dem Satz davor, z. B. 35 − 30 = 5 kg). Der Aufwärmsatz zählt
 * nicht mit. Passt sich automatisch an, wenn die Sätze geändert werden.
 * Fallback auf DEFAULT_STEP_KG, wenn es keine zwei Arbeitssätze mit Gewicht gibt.
 */
function computeStep(sets: SetData[], warmupCount: number): number {
  const work = sets.slice(warmupCount).filter(s => s.weight_kg > 0)
  if (work.length >= 2) {
    const delta = round1(work[work.length - 1].weight_kg - work[work.length - 2].weight_kg)
    if (delta > 0) return delta
  }
  return DEFAULT_STEP_KG
}

/**
 * Automatik-Timing: Basis-Wartezeit für den ersten Satz, danach pro Satz +15 s —
 * späte (schwere) Sätze brauchen mehr Pause als die ersten.
 */
const AUTO_BASE_SECONDS = 60
const AUTO_STEP_SECONDS = 15
/** Wartezeit für den Satz an Position `index` (0-basiert): 60 s, 75 s, 90 s, … */
function autoSetSeconds(index: number): number {
  return AUTO_BASE_SECONDS + index * AUTO_STEP_SECONDS
}

/** Ganze Tage zwischen zwei ISO-Daten (YYYY-MM-DD), UTC-basiert wie today(). */
function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00Z`).getTime()
  const b = new Date(`${toISO}T00:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

type TopSetIncrease = { days: number; from: number; to: number; date: string }

/**
 * Letzte Steigerung des Top-Satzes: jüngster Trainingstag, an dem das max.
 * Gewicht höher war als am Trainingstag davor. `days` = Abstand zu `refDate`.
 * null, wenn es (noch) keine Steigerung gibt.
 */
function lastTopSetIncrease(series: ExerciseHistoryPoint[], refDate: string): TopSetIncrease | null {
  for (let i = series.length - 1; i >= 1; i--) {
    if (series[i].max_weight > series[i - 1].max_weight) {
      return {
        days: daysBetween(series[i].date, refDate),
        from: series[i - 1].max_weight,
        to: series[i].max_weight,
        date: series[i].date,
      }
    }
  }
  return null
}

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
  const [params] = useSearchParams()
  // Nachhol-Modus: ?date=YYYY-MM-DD wird von der Training-Seite durchgereicht.
  const dateParam = params.get('date')
  const date = dateParam || today()
  const isCatchUp = !!dateParam && dateParam !== today()
  const dateQuery = isCatchUp ? `?date=${date}` : ''
  const phase = getCurrentPhase(date)
  const trainingDay = getTodaysTraining(date)
  const exercise = trainingDay?.exercises.find(e => e.id === exerciseId)
  const timer = useTimer()
  const customImage = useCustomImage(exercise?.id ?? '')

  // Ein echter Aufwärmsatz (sehr leicht) vor den Arbeitssätzen — nur bei Kraft.
  const warmupCount = exercise && !exercise.isCardio ? 1 : 0

  const [workout, setWorkout] = useState<WorkoutLog | null>(null)
  const [sets, setSets] = useState<SetData[]>([])
  const [history, setHistory] = useState<ExerciseHistoryPoint[]>([])
  const [showHistory, setShowHistory] = useState(false)
  // Feuerwerk-Overlay: Zähler als Key → jeder Trigger startet die Animation neu.
  const [fxId, setFxId] = useState(0)
  const triggerFx = () => setFxId(id => id + 1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  // Automatik: hands-free Ablauf mit Timer pro Satz (60 s, je Satz +15 s) und „Start".
  const [auto, setAuto] = useState(false)
  const [autoIndex, setAutoIndex] = useState(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setsRef = useRef<SetData[]>([])
  const workoutRef = useRef<WorkoutLog | null>(null)
  const autoRef = useRef(false)
  const autoIndexRef = useRef(0)
  // Synchroner Re-Entry-Schutz für finishExercise (State `finishing` hinkt einen
  // Commit hinterher → Doppeltipp/Doppel-Abschluss möglich).
  const finishingRef = useRef(false)
  // Serialisiert Speichervorgänge (siehe saveToServer).
  const saveChainRef = useRef<Promise<void>>(Promise.resolve())
  // Immer auf die neueste advanceAuto-Closure zeigen, damit der einmalig
  // registrierte onElapse-Hörer nicht auf veraltetem State arbeitet.
  const advanceRef = useRef<() => void>(() => {})

  // Keep refs in sync
  useEffect(() => { setsRef.current = sets }, [sets])
  useEffect(() => { workoutRef.current = workout }, [workout])
  useEffect(() => { autoRef.current = auto }, [auto])
  useEffect(() => { autoIndexRef.current = autoIndex }, [autoIndex])

  // Timer-Ablauf abonnieren (nur natürliches Ende, nicht stop()) → Sequenz weiter
  const { onElapse, onStop } = timer
  useEffect(() => onElapse(() => advanceRef.current()), [onElapse])

  // Echter externer Stopp (z.B. „Fertig" in der FloatingTimer-Leiste) → Automatik
  // sauber beenden. Bewusst NICHT an `isRunning` gekoppelt: beim natürlichen Ablauf
  // wird isRunning ebenfalls false, aber React feuert den Kind-Effekt VOR dem
  // Eltern-Elapse-Effekt — ein isRunning-Watchdog würde die Sequenz dann fälschlich
  // stoppen, bevor advanceAuto den nächsten Satz starten kann.
  useEffect(() => onStop(() => setAuto(false)), [onStop])

  // Bildschirm wach halten, solange die Automatik läuft — sonst dunkelt das
  // Handy ab, friert den Satz-Timer ein und die „Start"-Ansage bliebe stumm.
  useWakeLock(auto)

  // Startet den (mit jedem Satz um 15 s längeren) Timer für den laufenden Satz.
  // Der LETZTE Satz bekommt keinen Ruhe-Countdown mehr: er wurde bereits von der
  // „Start"-Ansage des vorletzten Satzes angekündigt → die Übung wird direkt
  // abgeschlossen, und die anschließende „Pause vor: nächste Übung" deckt das
  // Ausführen des letzten Satzes mit ab. (Früher lief hier noch ein stiller
  // ~90–120 s-Countdown ohne Zweck.)
  useEffect(() => {
    if (!auto || !exercise) return
    const total = setsRef.current.length
    if (total === 0 || autoIndex >= total) return
    if (autoIndex === total - 1) {
      setAuto(false)
      const updated = setsRef.current.map(s => ({ ...s, completed: true }))
      setSets(updated)
      finishExercise(updated)
      return
    }
    const label = `${exercise.name} · Satz ${autoIndex + 1}/${total}`
    timer.start(autoSetSeconds(autoIndex), label, { cue: 'start' })
    // exercise/timer sind stabil genug; bewusst nur auf auto+autoIndex reagieren.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, autoIndex])

  // Serialisiert: jeder Save wartet auf den vorherigen, damit ein älterer, noch
  // fliegender Request (z.B. ein gerade abgefeuerter Debounce-Save mit
  // completed:false) niemals einen neueren (completed:true) überschreibt — POSTs
  // sind sonst nicht der Reihe nach garantiert (logExerciseSets ist ein Upsert).
  const saveToServer = useCallback((setsToSave: SetData[]): Promise<void> => {
    const w = workoutRef.current
    if (!w || !exercise) return Promise.resolve()
    const run = async () => {
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
    }
    const next = saveChainRef.current.then(run, run)
    saveChainRef.current = next
    return next
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
    setHistory([])
    setShowHistory(false)
    setSaving(false)
    setFinishing(false)
    finishingRef.current = false
    setAuto(false)
    setAutoIndex(0)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    async function load() {
      if (!exercise) return

      let w = await getTodaysWorkout(isCatchUp ? date : undefined)
      if (!w) {
        w = await startWorkout({ date, phase: phase.phase, day_name: trainingDay!.name })
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

      // Historie laden (nicht-blockierend für die Eingabe) → speist den Chart.
      const hist = await getExerciseHistory(exercise.id)
      setHistory(hist)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, date])

  if (!exercise) return <div className="p-4 text-danger">Übung nicht gefunden</div>
  if (loading) return <div className="p-4 text-text-dim">Laden...</div>

  function updateSet(index: number, field: 'weight_kg' | 'reps', value: number) {
    const updated = sets.map((s, i) => i === index ? { ...s, [field]: value } : s)
    setSets(updated)
    triggerAutoSave(updated)
  }

  // Alle noch offenen Arbeitssätze um eine Stufe anheben. Der Aufwärmsatz
  // (Index < warmupCount) bleibt IMMER gleich, ebenso leere und erledigte Sätze.
  function bumpAllSets() {
    const bumpable = (s: SetData, i: number) => i >= warmupCount && !s.completed && s.weight_kg > 0
    if (!sets.some((s, i) => bumpable(s, i))) return
    const updated = sets.map((s, i) =>
      bumpable(s, i) ? { ...s, weight_kg: round1(s.weight_kg + step) } : s
    )
    setSets(updated)
    triggerAutoSave(updated)
    triggerFx()
  }

  // --- Automatik (hands-free) ---------------------------------------------
  // Ablauf: Satz 1 sofort machen → Timer (60 s, je Satz +15 s) → „Start" → Satz 2
  // → … → „Start" für den letzten Satz → Übung wird sofort abgeschlossen (KEIN
  // weiterer Countdown), danach läuft nur noch die „Pause vor: nächste Übung".

  function startAuto() {
    // finishingRef prüfen: sonst könnte ein noch laufender manueller Abschluss den
    // automatischen finishExercise am Ende der Sequenz verschlucken.
    if (autoRef.current || finishingRef.current) return
    // Beim ersten noch offenen Satz fortsetzen (nicht stur bei Satz 1) — wichtig
    // nach „Automatik stoppen" und nach einem Reload mit teils erledigten Sätzen.
    const firstOpen = sets.findIndex(s => !s.completed)
    if (firstOpen === -1) return // alle Sätze schon erledigt → nichts zu tun
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setAutoIndex(firstOpen)
    setAuto(true) // löst den [auto, autoIndex]-Effekt aus → startet Timer
  }

  function stopAuto() {
    setAuto(false)
    timer.stop()
  }

  // Wird beim natürlichen Ablauf des Satz-Timers aufgerufen (über advanceRef).
  function advanceAuto() {
    if (!autoRef.current) return
    // Offenen Debounce-Save abbrechen: dessen Snapshot hätte den gerade laufenden
    // Satz noch completed:false und würde die hier gesetzte Completion überschreiben.
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const i = autoIndexRef.current
    const updated = setsRef.current.map((s, idx) => idx <= i ? { ...s, completed: true } : s)
    setSets(updated)
    if (i >= updated.length - 1) {
      // Letzter Satz erledigt → Übung abschließen (saveToServer passiert dort).
      setAuto(false)
      finishExercise(updated)
    } else {
      saveToServer(updated)
      setAutoIndex(i + 1) // löst den Effekt aus → nächster (längerer) Satz-Timer
    }
  }
  advanceRef.current = advanceAuto

  async function finishExercise(currentSets?: SetData[]) {
    if (!workout || !exercise || finishingRef.current) return
    finishingRef.current = true
    setFinishing(true)
    const setsToSave = currentSets || sets
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    try {
      await saveToServer(setsToSave)
      await completeExercise(workout.id, exercise.id)

      if (trainingDay) {
        // Übersprungene Übungen ans Ende → werden zuletzt automatisch nachgeholt.
        const ordered = orderByDeferred(orderExercises(trainingDay), getDeferred(workout.id))
        // Get all completed exercises to find the next uncompleted one
        const completedExercises = await getWorkoutExercises(workout.id)
        const completedIds = new Set(completedExercises.map(e => e.exercise_id))
        completedIds.add(exercise.id) // Include the one we just completed

        const nextExercise = findNextUnfinished(ordered, exercise.id, completedIds)

        if (nextExercise) {
          // Sofort die nächste Übung anzeigen — die Pause läuft oben weiter.
          timer.start(phase.restSeconds || 120, `Pause vor: ${nextExercise.name}`)
          navigate(`/training/${nextExercise.id}${dateQuery}`, { replace: true })
        } else {
          // All exercises done → Feuerwerk feiern, dann zurück zur Übersicht
          timer.stop()
          triggerFx()
          await new Promise(r => setTimeout(r, 1200))
          navigate(`/training${dateQuery}`)
        }
      } else {
        navigate(`/training${dateQuery}`)
      }
    } catch (e) {
      // Netzwerk-/Serverfehler: nicht stecken bleiben — Button bleibt nutzbar,
      // damit der User den Abschluss erneut auslösen kann.
      console.error('Übung abschließen fehlgeschlagen:', e)
      finishingRef.current = false
      setFinishing(false)
    }
  }

  // "Gerät besetzt" → Übung ans Ende schieben und zur nächsten offenen springen.
  // Die übersprungene wird so garantiert zuletzt automatisch nachgeholt.
  async function handleSkip() {
    if (!exercise || !trainingDay || !workout) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    await saveToServer(sets)
    addDeferred(workout.id, exercise.id)
    const ordered = orderByDeferred(orderExercises(trainingDay), getDeferred(workout.id))
    const completed = await getWorkoutExercises(workout.id)
    const completedIds = new Set(completed.map(e => e.exercise_id))
    const next = findNextUnfinished(ordered, exercise.id, completedIds)
    if (next) {
      navigate(`/training/${next.id}${dateQuery}`, { replace: true })
    } else {
      navigate(`/training${dateQuery}`)
    }
  }

  const allDone = sets.length > 0 && sets.every(s => s.completed)
  const step = computeStep(sets, warmupCount)

  // „Top-Satz zuletzt erhöht": aus der DB-Historie (max. Gewicht je Tag), aber den
  // aktuell eingetragenen Top-Satz für `date` eingemischt, damit ein Bump im
  // laufenden Training sofort zählt (Historie wird nur beim Laden geholt).
  const liveMax = sets.reduce((m, s) => Math.max(m, s.weight_kg), 0)
  const mergedHistory = liveMax > 0
    ? [...history.filter(h => h.date !== date), { date, max_weight: liveMax }].sort((a, b) => (a.date < b.date ? -1 : 1))
    : history
  const lastIncrease = lastTopSetIncrease(mergedHistory, today())
  const startedAt = workout?.started_at ? new Date(workout.started_at) : null
  const durationMinutes = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 60000) : 0

  return (
    <div className="p-4">
      {fxId > 0 && <Fireworks key={fxId} onDone={() => setFxId(0)} />}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate(`/training${dateQuery}`)} className="text-accent-light text-sm flex items-center gap-1">
          ← Zurück{isCatchUp ? ' · Nachhol-Modus' : ''}
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
          className={`w-full object-contain rounded-xl bg-surface transition-all ${auto ? 'h-20' : 'h-48'}`}
          onError={(e) => {
            const img = e.target as HTMLImageElement
            if (!img.src.endsWith('/images/equipment/placeholder.svg')) {
              img.src = '/images/equipment/placeholder.svg'
            }
          }}
        />
        <div className={`absolute bottom-2 right-2 flex gap-2 ${auto ? 'hidden' : ''}`}>
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
      <p className="text-sm text-text-dim mb-3">{exercise.equipment}</p>

      {exercise.hiit ? (
        <HiitBlock
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
      ) : exercise.isCardio ? (
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
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="text-sm font-bold">
                {warmupCount > 0 ? 'Aufwärmen + ' : ''}{exercise.sets} Sätze{exercise.reps ? ` × ${exercise.reps} Wdh` : ''}
              </h3>
              <div className="flex items-center gap-2">
                {saving && <span className="text-xs text-text-dim">Speichert...</span>}
                {!allDone && (
                  <button
                    onClick={bumpAllSets}
                    className="rounded-lg bg-accent/15 border border-accent/30 text-accent-light text-xs font-semibold px-2.5 py-1 active:bg-accent/25 transition-colors whitespace-nowrap"
                  >
                    ⬆ +{step} kg alle
                  </button>
                )}
              </div>
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
                    isActive={auto && i === autoIndex}
                    large={auto}
                    data={set}
                    onChange={(field, value) => updateSet(i, field, value)}
                  />
                )
              })}
            </div>
          </div>

          {auto ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-surface border border-border p-3 text-center text-xs text-text-dim">
                Automatik läuft · bei „Start" den nächsten Satz beginnen. Nach dem letzten Satz endet die Übung automatisch.
              </div>
              <button
                onClick={stopAuto}
                className="w-full rounded-xl p-3 text-center font-semibold text-white bg-danger/80 active:bg-danger transition-colors"
              >
                ⏹ Automatik stoppen
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {!allDone && (
                <button
                  onClick={startAuto}
                  disabled={finishing}
                  className={`w-full rounded-xl p-3 text-center font-semibold text-white transition-colors ${
                    finishing ? 'bg-accent/40 cursor-wait' : 'bg-accent active:bg-accent/80'
                  }`}
                >
                  ▶ Automatik starten · {sets.findIndex(s => !s.completed) > 0 ? 'fortsetzen' : `${sets.length} Sätze · Pause ${AUTO_BASE_SECONDS}–${autoSetSeconds(sets.length - 1)}s`}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => finishExercise(sets.map(s => ({ ...s, completed: true })))}
                  disabled={finishing}
                  className={`flex-1 rounded-xl p-2 text-center text-sm font-medium border border-border transition-colors ${
                    finishing ? 'text-text-dim cursor-wait' : 'text-text-dim active:bg-surface2'
                  }`}
                >
                  {finishing ? 'Schließe ab…' : 'Übung abschließen'}
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 rounded-xl p-2 text-center text-sm text-accent-light font-medium border border-border active:bg-surface2 transition-colors"
                >
                  Gerät besetzt
                </button>
              </div>
            </div>
          )}

          {getMachineAdjustments(exercise.equipmentImage).length > 0 && (
            <div className="mt-4">
              <MachineSettingsCard
                machineId={machineIdFromImage(exercise.equipmentImage)}
                adjustments={getMachineAdjustments(exercise.equipmentImage)}
              />
            </div>
          )}

          {mergedHistory.length >= 2 && (
            <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm">
              {lastIncrease ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-dim">⬆ Top-Satz zuletzt erhöht</span>
                  <span className="font-semibold text-accent-light whitespace-nowrap">
                    {lastIncrease.days === 0 ? 'heute' : lastIncrease.days === 1 ? 'vor 1 Tag' : `vor ${lastIncrease.days} Tagen`}
                    <span className="text-text-dim font-normal"> · {lastIncrease.from} → {lastIncrease.to} kg</span>
                  </span>
                </div>
              ) : (
                <span className="text-text-dim">⬆ Top-Satz bislang nicht gesteigert</span>
              )}
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-dim active:bg-surface2 transition-colors"
            >
              <span>📈 Verlauf · max. Gewicht{history.length > 0 ? ` (${history.length})` : ''}</span>
              <span className="text-xs">{showHistory ? '▲' : '▼'}</span>
            </button>
            {showHistory && (
              <div className="bg-surface rounded-xl border border-border p-3 mt-2">
                <ExerciseHistoryChart data={history} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
