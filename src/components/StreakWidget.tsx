export default function StreakWidget({ weeks }: { weeks: number }) {
  return (
    <div className="bg-surface2 rounded-xl p-4 text-center flex-1">
      <div className="text-xs text-text-dim uppercase tracking-wider">Streak</div>
      <div className="text-3xl font-extrabold text-accent-light">{weeks}</div>
      <div className="text-xs text-text-dim">Wochen</div>
    </div>
  )
}
