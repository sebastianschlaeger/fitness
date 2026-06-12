import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { ExerciseHistoryPoint } from '../lib/api'

/** Liniendiagramm: maximales Gewicht pro Trainingstag für eine Übung. */
export default function ExerciseHistoryChart({ data }: { data: ExerciseHistoryPoint[] }) {
  if (data.length === 0) {
    return <div className="text-xs text-text-dim text-center py-6">Noch keine Historie — nach dem ersten Training erscheint hier dein Verlauf.</div>
  }

  const formatted = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    kg: d.max_weight,
  }))

  const best = Math.max(...data.map(d => d.max_weight))

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-text-dim">Max. Gewicht je Training</span>
        <span className="text-xs text-accent-light font-semibold">Bestwert {best} kg</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={formatted}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b90a5' }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8b90a5' }} width={32} />
          <Tooltip
            contentStyle={{ background: '#1a1d27', border: '1px solid #2e3345', borderRadius: 8 }}
            formatter={(v) => [`${v} kg`, 'Max']}
          />
          <Line type="monotone" dataKey="kg" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
