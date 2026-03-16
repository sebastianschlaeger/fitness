import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard, type DashboardData } from '../lib/api'
import StreakWidget from '../components/StreakWidget'
import CountdownWidget from '../components/CountdownWidget'
import PhaseProgress from '../components/PhaseProgress'
import WeekView from '../components/WeekView'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-text-dim">Laden...</div>
  if (!data) return <div className="p-4 text-danger">Fehler beim Laden</div>

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-3">
        <StreakWidget weeks={data.streak} />
        <CountdownWidget days={data.mammutmarschDays} />
        <div className="bg-surface2 rounded-xl p-4 text-center flex-1">
          <div className="text-xs text-text-dim uppercase tracking-wider">Gewicht</div>
          <div className="text-3xl font-extrabold text-accent-light">
            {data.latestWeight ? data.latestWeight.weight_kg.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-text-dim">
            {data.latestWeight ? `kg (${data.latestWeight.delta > 0 ? '+' : ''}${data.latestWeight.delta.toFixed(1)})` : 'kg'}
          </div>
        </div>
      </div>

      <PhaseProgress
        phase={data.phase.phase}
        name={data.phase.name}
        weekCurrent={data.phase.weekCurrent}
        weekTotal={data.phase.weekTotal}
      />

      <div className="bg-surface2 rounded-xl p-4">
        <div className="text-xs text-text-dim">Walking Pad diese Woche</div>
        <div className="flex justify-between items-baseline mt-1">
          <span className="text-xl font-bold text-success">{data.walkingThisWeek.km.toFixed(1)} km</span>
          <span className="text-xs text-text-dim">{(data.walkingThisWeek.minutes / 60).toFixed(1)}h · Gesamt: {data.walkingTotal.km.toFixed(0)} km</span>
        </div>
      </div>

      <WeekView activity={data.weekActivity} />

      {data.todaysTraining && (
        <button
          onClick={() => navigate('/training')}
          className="w-full bg-accent rounded-xl p-4 text-center font-semibold text-white text-lg active:bg-accent/80 transition-colors"
        >
          Training starten: {data.todaysTraining.name}
        </button>
      )}

      {!data.todaysTraining && (
        <div className="bg-surface2 rounded-xl p-4 text-center text-text-dim">
          Heute: Ruhetag 🧘
        </div>
      )}
    </div>
  )
}
