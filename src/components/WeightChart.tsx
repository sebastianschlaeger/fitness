import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import { START_WEIGHT_KG, GOAL_WEIGHT_KG } from '../data/training-plan'

export default function WeightChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  const formatted = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    kg: d.weight_kg,
  }))

  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim mb-2">Gewichtsverlauf</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b90a5' }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#8b90a5' }} width={35} />
          <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2e3345', borderRadius: 8 }} />
          <ReferenceLine y={START_WEIGHT_KG} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Start', fill: '#ef4444', fontSize: 10 }} />
          <ReferenceLine y={GOAL_WEIGHT_KG} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Ziel', fill: '#22c55e', fontSize: 10 }} />
          <Line type="monotone" dataKey="kg" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
