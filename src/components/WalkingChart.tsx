import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function WalkingChart({ data }: { data: { date: string; distance_km: number }[] }) {
  const formatted = data.map(d => ({
    day: new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short' }),
    km: d.distance_km,
  }))

  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim mb-2">Walking Pad diese Woche</div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={formatted}>
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8b90a5' }} />
          <YAxis tick={{ fontSize: 10, fill: '#8b90a5' }} width={30} />
          <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2e3345', borderRadius: 8 }} />
          <Bar dataKey="km" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
