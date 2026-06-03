import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

type TimerState = {
  endsAt: number      // epoch ms when the timer fires
  totalSeconds: number
  label: string
}

type TimerContextValue = {
  /** true while a timer is actively counting down */
  isRunning: boolean
  /** whole seconds left (0 when nothing running) */
  remaining: number
  totalSeconds: number
  label: string
  /** start (or restart) the rest timer */
  start: (seconds: number, label: string) => void
  /** add seconds to a running timer */
  add: (seconds: number) => void
  /** stop / dismiss the timer */
  stop: () => void
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

// --- Audio ---------------------------------------------------------------
// Ein einziger AudioContext, der beim ersten echten User-Tap entsperrt wird.
// Auf iOS/Android startet ein AudioContext sonst 'suspended' und bleibt stumm,
// wenn er erst im Timer-Callback (ausserhalb einer Geste) erzeugt wird.
let sharedCtx: AudioContext | null = null

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

/** Beim ersten Tap aufrufen (User-Gesture) — entsperrt Audio fuer spaetere Beeps. */
function unlockAudio() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
}

function vibrate() {
  try { navigator.vibrate?.([200, 100, 200]) } catch { /* not supported */ }
}

function playBeep() {
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

  // fire beep + clear when it hits zero
  useEffect(() => {
    if (!state) return
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      playBeep()
      localStorage.removeItem(STORAGE_KEY)
      setState(null)
    }
  }, [remaining, state])

  const start = useCallback((seconds: number, label: string) => {
    unlockAudio() // start() kommt aus einem Tap → Gelegenheit zum Entsperren
    firedRef.current = false
    const next: TimerState = { endsAt: Date.now() + seconds * 1000, totalSeconds: seconds, label }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setNow(Date.now())
    setState(next)
  }, [])

  const add = useCallback((seconds: number) => {
    setState(prev => {
      if (!prev) return prev
      const next: TimerState = {
        ...prev,
        endsAt: prev.endsAt + seconds * 1000,
        totalSeconds: prev.totalSeconds + seconds,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const stop = useCallback(() => {
    firedRef.current = true
    localStorage.removeItem(STORAGE_KEY)
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
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider')
  return ctx
}
