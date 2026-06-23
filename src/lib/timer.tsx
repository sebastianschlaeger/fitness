import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

/** Was beim Ablaufen des Timers ertönt. */
type TimerCue = 'beep' | 'start' | 'none'

type TimerState = {
  endsAt: number      // epoch ms when the timer fires
  totalSeconds: number
  label: string
  cue?: TimerCue      // default 'beep'
}

type TimerContextValue = {
  /** true while a timer is actively counting down */
  isRunning: boolean
  /** whole seconds left (0 when nothing running) */
  remaining: number
  totalSeconds: number
  label: string
  /** start (or restart) the rest timer */
  start: (seconds: number, label: string, opts?: { cue?: TimerCue }) => void
  /** add seconds to a running timer */
  add: (seconds: number) => void
  /** stop / dismiss the timer */
  stop: () => void
  /**
   * Auf das natürliche Ablaufen des Timers hören (nicht bei stop()).
   * Gibt eine Abmelde-Funktion zurück. Treibt die Auto-Satz-Sequenz an.
   */
  onElapse: (cb: () => void) => () => void
  /**
   * Auf einen echten externen Stopp hören — NUR über stop() (z.B. „Fertig" in der
   * FloatingTimer-Leiste), NICHT beim natürlichen Ablauf. Gibt eine Abmelde-
   * Funktion zurück. Lässt die Automatik bei einem manuellen Stopp sauber aussteigen.
   */
  onStop: (cb: () => void) => () => void
}

const STORAGE_KEY = 'rest-timer'
const TimerContext = createContext<TimerContextValue | null>(null)

function load(): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TimerState
    if (!parsed.endsAt || parsed.endsAt <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Persistiert NUR reguläre Pausentimer (cue 'beep'), die Reload/Navigation
 * überleben sollen. Auto-Satz-Timer ('start'/'none') hängen am flüchtigen
 * Automatik-Zustand (auto/autoIndex) und werden bewusst NICHT gespeichert —
 * sonst feuert nach einem Reload eine verwaiste „Start"-Ansage, ohne dass die
 * Sequenz weiterläuft.
 */
function persist(next: TimerState) {
  if ((next.cue ?? 'beep') === 'beep') localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  else localStorage.removeItem(STORAGE_KEY)
}

// --- Audio ---------------------------------------------------------------
// Ein einziger AudioContext, der beim ersten echten User-Tap entsperrt wird.
// Auf iOS/Android startet ein AudioContext sonst 'suspended' und bleibt stumm,
// wenn er erst im Timer-Callback (ausserhalb einer Geste) erzeugt wird.
let sharedCtx: AudioContext | null = null
let speechPrimed = false

function getCtx(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!sharedCtx) sharedCtx = new Ctor()
    return sharedCtx
  } catch {
    return null
  }
}

/** Beim ersten Tap aufrufen (User-Gesture) — entsperrt Audio + Sprachausgabe. */
export function unlockAudio() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
  // iOS/Safari geben Sprachausgabe nur frei, wenn sie einmal innerhalb einer
  // echten Geste angestossen wurde — hier mit einer stummen Utterance "aufwecken".
  try {
    const synth = window.speechSynthesis
    if (synth && !speechPrimed) {
      speechPrimed = true
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      synth.speak(u)
    }
  } catch { /* speech not available */ }
}

function vibrate() {
  try { navigator.vibrate?.([200, 100, 200]) } catch { /* not supported */ }
}

/** Spricht ein Wort (z.B. "Start"). Fallback auf Beep, wenn keine Sprachausgabe. */
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis
    if (!synth) { playBeep(); return }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    u.rate = 1
    u.volume = 1
    synth.speak(u)
  } catch {
    playBeep()
  }
}

export function playBeep() {
  vibrate()
  const ctx = getCtx()
  if (!ctx) return
  const fire = () => {
    try {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.value = 0.3
        osc.start(ctx.currentTime + i * 0.2)
        osc.stop(ctx.currentTime + i * 0.2 + 0.15)
      }
    } catch { /* audio not available */ }
  }
  if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {})
  else fire()
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState | null>(() => load())
  const [now, setNow] = useState(() => Date.now())
  const firedRef = useRef(false)
  const listenersRef = useRef<Set<() => void>>(new Set())
  const stopListenersRef = useRef<Set<() => void>>(new Set())

  const remaining = state ? Math.max(0, Math.ceil((state.endsAt - now) / 1000)) : 0
  const isRunning = state !== null && remaining > 0

  // Audio einmalig beim ersten User-Tap irgendwo in der App entsperren
  useEffect(() => {
    function onFirstTap() { unlockAudio() }
    window.addEventListener('pointerdown', onFirstTap, { once: true })
    return () => window.removeEventListener('pointerdown', onFirstTap)
  }, [])

  // tick every quarter second while a timer is active
  useEffect(() => {
    if (!state) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state])

  // Beim Zurueckkehren aus dem Hintergrund Zeit nachziehen (Mobile drosselt Timer)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // fire cue + notify listeners + clear when it hits zero
  useEffect(() => {
    if (!state) return
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      const cue = state.cue ?? 'beep'
      if (cue === 'beep') {
        playBeep()
      } else if (cue === 'start') {
        vibrate()
        speak('Start')
      }
      // cue === 'none' → still, nur visuell/Abschluss
      // Auf das Ablaufen wartende Hörer benachrichtigen (Auto-Satz-Sequenz).
      // Snapshot, damit Ab-/Anmeldungen während der Iteration nichts brechen.
      Array.from(listenersRef.current).forEach(fn => { try { fn() } catch { /* ignore */ } })
      localStorage.removeItem(STORAGE_KEY)
      setState(null)
    }
  }, [remaining, state])

  const start = useCallback((seconds: number, label: string, opts?: { cue?: TimerCue }) => {
    unlockAudio() // start() kommt aus einem Tap → Gelegenheit zum Entsperren
    firedRef.current = false
    const next: TimerState = { endsAt: Date.now() + seconds * 1000, totalSeconds: seconds, label, cue: opts?.cue ?? 'beep' }
    persist(next)
    setNow(Date.now())
    setState(next)
  }, [])

  const onElapse = useCallback((cb: () => void) => {
    listenersRef.current.add(cb)
    return () => { listenersRef.current.delete(cb) }
  }, [])

  const onStop = useCallback((cb: () => void) => {
    stopListenersRef.current.add(cb)
    return () => { stopListenersRef.current.delete(cb) }
  }, [])

  const add = useCallback((seconds: number) => {
    setState(prev => {
      if (!prev) return prev
      const next: TimerState = {
        ...prev,
        endsAt: prev.endsAt + seconds * 1000,
        totalSeconds: prev.totalSeconds + seconds,
      }
      persist(next)
      return next
    })
  }, [])

  const stop = useCallback(() => {
    firedRef.current = true
    localStorage.removeItem(STORAGE_KEY)
    // Echter Stopp (nicht natürlicher Ablauf) → Hörer benachrichtigen, bevor der
    // State fällt. Snapshot, damit Ab-/Anmeldungen die Iteration nicht brechen.
    Array.from(stopListenersRef.current).forEach(fn => { try { fn() } catch { /* ignore */ } })
    setState(null)
  }, [])

  const value: TimerContextValue = {
    isRunning,
    remaining,
    totalSeconds: state?.totalSeconds ?? 0,
    label: state?.label ?? '',
    start,
    add,
    stop,
    onElapse,
    onStop,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider')
  return ctx
}
