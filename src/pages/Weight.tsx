import { useEffect, useState } from 'react'
import { getWeightEntries, logWeight, type BodyWeightEntry } from '../lib/api'
import { today } from '../lib/dates'
import WeightChart from '../components/WeightChart'

export default function Weight() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await getWeightEntries('2026-01-01', '2099-12-31')
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(input)
    if (!val) return
    await logWeight(today(), val)
    setInput('')
    await load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Gewicht</h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="z.B. 92.5"
          className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-3 text-lg font-semibold"
        />
        <button type="submit" className="bg-accent rounded-xl px-6 py-3 font-semibold text-white active:bg-accent/80">
          Eintragen
        </button>
      </form>

      {!loading && entries.length > 0 && <WeightChart data={entries} />}

      <div className="space-y-2">
        {entries.slice().reverse().slice(0, 20).map(e => (
          <div key={e.id} className="flex justify-between bg-surface2 rounded-lg px-4 py-2 text-sm">
            <span className="text-text-dim">{new Date(e.date).toLocaleDateString('de-DE')}</span>
            <span className="font-semibold">{e.weight_kg.toFixed(1)} kg</span>
          </div>
        ))}
      </div>
    </div>
  )
}
