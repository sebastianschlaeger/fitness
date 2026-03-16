import { useEffect, useState, useRef } from 'react'

export default function RestTimer({ seconds, onDone, onSkip, isExerciseTransition, nextExerciseName }: {
  seconds: number
  onDone: () => void
  onSkip: () => void
  isExerciseTransition?: boolean
  nextExerciseName?: string
}) {
  const [remaining, setRemaining] = useState(seconds)
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      playBeep()
      onDone()
      return
    }
    const interval = setInterval(() => {
      setRemaining(r => r - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining, onDone])

  function playBeep() {
    try {
      const ctx = audioRef.current || new AudioContext()
      audioRef.current = ctx
      // Play 3 short beeps
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
    } catch (e) {
      // Audio not supported
    }
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = 1 - remaining / seconds

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4 text-center">
      <div className="text-xs text-accent-light font-semibold uppercase tracking-wider mb-2">
        {isExerciseTransition ? 'Pause vor nächster Übung' : 'Satzpause'}
      </div>
      {nextExerciseName && (
        <div className="text-sm font-bold mb-2">Nächste: {nextExerciseName}</div>
      )}
      <div className="text-4xl font-bold text-accent mb-3 font-mono">
        {mins}:{secs.toString().padStart(2, '0')}
      </div>
      {/* Progress bar */}
      <div className="w-full bg-surface2 rounded-full h-1.5 mb-3">
        <div
          className="bg-accent h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <button
        onClick={onSkip}
        className="text-sm text-accent-light font-semibold"
      >
        Überspringen →
      </button>
    </div>
  )
}
