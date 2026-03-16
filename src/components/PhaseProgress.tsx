export default function PhaseProgress({ phase, name, weekCurrent, weekTotal }: {
  phase: number; name: string; weekCurrent: number; weekTotal: number
}) {
  const pct = Math.min(100, Math.round((weekCurrent / weekTotal) * 100))
  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim">Phase {phase} — {name} · Woche {weekCurrent}/{weekTotal}</div>
      <div className="bg-white/10 rounded h-1.5 mt-2">
        <div className="bg-accent-light rounded h-1.5 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
