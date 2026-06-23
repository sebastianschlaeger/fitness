import { useState, useEffect, useRef, useMemo } from 'react'
import type { Exercise } from '../data/training-plan'
import { unlockAudio, playBeep, speak } from '../lib/timer'

type SegKind = 'warmup' | 'work' | 'rest' | 'cooldown'
type Seg = { kind: SegKind; label: string; seconds: number; round: number }

/** Phasenfolge aus der HIIT-Konfiguration aufbauen: Aufwärmen → N×(hart/locker) → Auslaufen. */
function buildSegments(h: NonNullable<Exercise['hiit']>): Seg[] {
  const segs: Seg[] = []
  if (h.warmupSeconds > 0) segs.push({ kind: 'warmup', label: 'Aufwärmen', seconds: h.warmupSeconds, round: 0 })
  for (let r = 1; r <= h.rounds; r++) {
    segs.push({ kind: 'work', label: 'Belastung', seconds: h.workSeconds, round: r })
    segs.push({ kind: 'rest', label: 'Erholung', seconds: h.restSeconds, round: r })
  }
  if (h.cooldownSeconds > 0) segs.push({ kind: 'cooldown', label: 'Auslaufen', seconds: h.cooldownSeconds, round: 0 })
  return segs
}

function fmt(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const KIND_TEXT: Record<SegKind, string> = {
  warmup: 'text-accent',
  work: 'text-danger',
  rest: 'text-success',
  cooldown: 'text-accent',
}
const KIND_BAR: Record<SegKind, string> = {
  warmup: 'bg-accent',
  work: 'bg-danger',
  rest: 'bg-success',
  cooldown: 'bg-accent',
}

/** Akustisches/visuelles Signal beim Phasenwechsel. */
function cue(kind: SegKind) {
  if (kind === 'work') { playBeep(); speak('Belastung') }
  else if (kind === 'rest') { playBeep(); speak('Erholung') }
  else if (kind === 'warmup') { speak('Aufwärmen') }
  else { playBeep(); speak('Auslaufen') }
}

export default function HiitBlock({ exercise, allDone, onComplete }: {
  exercise: Exercise
  allDone: boolean
  onComplete: () => void
}) {
  const h = exercise.hiit!
  const segments = useMemo(() => buildSegments(h), [h])
  const total = useMemo(() => segments.reduce((sum, s) => sum + s.seconds, 0), [segments])
  // Kumulierte End-Offsets je Segment — daraus leiten wir die aktuelle Phase ab.
  const cumEnd = useMemo(() => {
    let acc = 0
    return segments.map(s => (acc += s.seconds))
  }, [segments])

  const [running, setRunning] = useState(false)
  const [now, setNow] = useState(0)
  const startRef = useRef(0)
  const prevIdxRef = useRef(-1)

  // Tick im Viertelsekundentakt + Nachziehen beim Rückkehren aus dem Hintergrund.
  // Die Phase wird IMMER aus (now - start) berechnet → Handy-Sperre kann die
  // Intervalle nicht verschieben.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    const onVis = () => { if (document.visibilityState === 'visible') setNow(Date.now()) }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [running])

  const elapsed = running ? Math.max(0, Math.floor((now - startRef.current) / 1000)) : 0
  const finished = running && elapsed >= total

  let idx = cumEnd.findIndex(e => elapsed < e)
  if (idx === -1) idx = segments.length - 1
  const seg = segments[idx]
  const segStart = idx > 0 ? cumEnd[idx - 1] : 0
  const segRemaining = Math.max(0, cumEnd[idx] - elapsed)
  const segElapsed = elapsed - segStart
  const segProgress = seg.seconds > 0 ? Math.min(1, segElapsed / seg.seconds) : 1
  const overallProgress = total > 0 ? Math.min(1, elapsed / total) : 0

  // Ansage/Beep bei jedem Phasenwechsel (und einmalig am Ende).
  useEffect(() => {
    if (!running) return
    if (finished) {
      if (prevIdxRef.current !== 999) {
        prevIdxRef.current = 999
        playBeep()
        speak('Fertig')
      }
      return
    }
    if (idx !== prevIdxRef.current) {
      prevIdxRef.current = idx
      cue(seg.kind)
    }
  }, [idx, finished, running, seg.kind])

  function handleStart() {
    unlockAudio()
    startRef.current = Date.now()
    prevIdxRef.current = -1
    setNow(Date.now())
    setRunning(true)
  }

  function handleDone() {
    setRunning(false)
    onComplete()
  }

  if (allDone) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center mb-4">
        <div className="text-success font-semibold">HIIT abgeschlossen ✓</div>
      </div>
    )
  }

  if (!running) {
    const fmtShort = (s: number) => (s % 60 === 0 && s >= 60 ? `${s / 60} Min` : `${s}s`)
    return (
      <div className="bg-surface rounded-xl border border-border p-4 mb-4">
        <div className="text-xs text-text-dim uppercase tracking-wider mb-3 text-center">
          {h.rounds} Runden · {fmt(total)} gesamt
        </div>
        <div className="space-y-1.5 text-sm mb-4">
          <div className="flex justify-between"><span className="text-accent">🔵 Aufwärmen</span><span className="text-text-dim">{fmtShort(h.warmupSeconds)}</span></div>
          <div className="flex justify-between"><span className="text-danger">🔴 Belastung</span><span className="text-text-dim">{fmtShort(h.workSeconds)} × {h.rounds}</span></div>
          <div className="flex justify-between"><span className="text-success">🟢 Erholung</span><span className="text-text-dim">{fmtShort(h.restSeconds)} × {h.rounds}</span></div>
          <div className="flex justify-between"><span className="text-accent">🔵 Auslaufen</span><span className="text-text-dim">{fmtShort(h.cooldownSeconds)}</span></div>
        </div>
        <button
          onClick={handleStart}
          className="w-full bg-accent rounded-xl p-4 text-center font-bold text-white text-lg active:bg-accent/80"
        >
          HIIT starten
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-4 mb-4">
      <div className="text-center">
        <div className="text-xs text-text-dim uppercase tracking-wider mb-1">
          {finished ? 'Geschafft! 💪' : seg.round > 0 ? `Runde ${seg.round} / ${h.rounds}` : seg.label}
        </div>
        <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${finished ? 'text-success' : KIND_TEXT[seg.kind]}`}>
          {finished ? 'Fertig' : seg.label}
        </div>

        <div className={`text-6xl font-bold font-mono my-3 ${finished ? 'text-success' : KIND_TEXT[seg.kind]}`}>
          {fmt(finished ? 0 : segRemaining)}
        </div>

        {/* Fortschritt aktuelle Phase */}
        <div className="w-full bg-surface2 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${finished ? 'bg-success' : KIND_BAR[seg.kind]}`}
            style={{ width: `${(finished ? 1 : segProgress) * 100}%` }}
          />
        </div>

        {/* Gesamtfortschritt */}
        <div className="flex items-center justify-between text-xs text-text-dim mb-3">
          <span>Gesamt</span>
          <span>{fmt(Math.max(0, total - elapsed))} übrig</span>
        </div>
        <div className="w-full bg-surface2 rounded-full h-1 mb-4">
          <div className="bg-accent-light h-1 rounded-full transition-all duration-300" style={{ width: `${overallProgress * 100}%` }} />
        </div>

        <button
          onClick={handleDone}
          className={`w-full rounded-xl p-3 text-center font-semibold text-white ${
            finished ? 'bg-success active:bg-success/80' : 'bg-accent active:bg-accent/80'
          }`}
        >
          HIIT abschließen
        </button>
      </div>
    </div>
  )
}
