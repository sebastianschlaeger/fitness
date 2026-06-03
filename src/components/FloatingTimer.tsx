import { useTimer } from '../lib/timer'

/**
 * App-weiter Rest-Timer. Schwebt über der TabBar und läuft unabhängig von der
 * aktuellen Seite weiter — so erscheint nach einer Übung sofort die nächste,
 * während die Pause oben weiterzählt.
 */
export default function FloatingTimer() {
  const { isRunning, remaining, totalSeconds, label, add, stop } = useTimer()

  if (!isRunning) return null

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-2">
      <div className="bg-accent text-white rounded-2xl shadow-lg shadow-accent/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-white/80 truncate">{label || 'Pause'}</div>
            <div className="text-3xl font-bold font-mono leading-tight">
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
          </div>
          <button
            onClick={() => add(30)}
            className="bg-white/15 active:bg-white/25 rounded-lg px-3 py-2 text-sm font-semibold flex-shrink-0"
          >
            +30s
          </button>
          <button
            onClick={stop}
            className="bg-white/15 active:bg-white/25 rounded-lg px-3 py-2 text-sm font-semibold flex-shrink-0"
          >
            Fertig
          </button>
        </div>
        <div className="w-full bg-white/20 rounded-full h-1 mt-2">
          <div
            className="bg-white h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
