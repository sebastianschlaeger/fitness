import { useEffect, useState } from 'react'
import { getWalkingEntries, getWalkingStats, logWalking, type WalkingEntry, type WalkingStats } from '../lib/api'
import { today, getWeekStart } from '../lib/dates'
import WalkingChart from '../components/WalkingChart'

export default function Walking() {
  const [entries, setEntries] = useState<WalkingEntry[]>([])
  const [stats, setStats] = useState<WalkingStats | null>(null)
  const [minutes, setMinutes] = useState('')
  const [km, setKm] = useState('')
  async function load() {
    const weekStart = getWeekStart()
    const [e, s] = await Promise.all([
      getWalkingEntries(weekStart, today()),
      getWalkingStats(),
    ])
    setEntries(e)
    setStats(s)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const m = parseInt(minutes)
    const k = parseFloat(km)
    if (!m || !k) return
    await logWalking(today(), m, k)
    setMinutes('')
    setKm('')
    await load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Walking Pad</h1>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            placeholder="Minuten"
            className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 font-semibold"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={km}
            onChange={e => setKm(e.target.value)}
            placeholder="km"
            className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 font-semibold"
          />
        </div>
        <button type="submit" className="w-full bg-accent rounded-xl px-6 py-3 font-semibold text-white active:bg-accent/80">
          Eintragen
        </button>
      </form>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-xs text-text-dim">Diese Woche</div>
            <div className="text-lg font-bold text-success">{stats.thisWeek.km.toFixed(1)} km</div>
            <div className="text-xs text-text-dim">{(stats.thisWeek.minutes / 60).toFixed(1)}h</div>
          </div>
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-xs text-text-dim">Dieser Monat</div>
            <div className="text-lg font-bold text-accent-light">{stats.thisMonth.km.toFixed(1)} km</div>
          </div>
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="text-xs text-text-dim">Gesamt</div>
            <div className="text-lg font-bold text-text-primary">{stats.total.km.toFixed(0)} km</div>
          </div>
        </div>
      )}

      {entries.length > 0 && <WalkingChart data={entries} />}
    </div>
  )
}
