export default function CountdownWidget({ days }: { days: number }) {
  return (
    <div className="bg-surface2 rounded-xl p-4 text-center flex-1">
      <div className="text-xs text-text-dim uppercase tracking-wider">Mammutmarsch</div>
      <div className="text-3xl font-extrabold text-accent-light">{days}</div>
      <div className="text-xs text-text-dim">Tage</div>
    </div>
  )
}
