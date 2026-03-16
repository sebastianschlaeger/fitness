import { useState } from 'react'
import { phases } from '../data/training-plan'
import { getCurrentPhase } from '../lib/dates'

const SHOULDER_FORBIDDEN = [
  'L490 — Seitheben-Maschine',
  'PL090 — Shoulder Press',
  'L450 — Dip-Funktion',
  'Aufrechtes Rudern',
  'Nackendrücken',
]

const SHOULDER_ALLOWED = [
  'Brustpresse — ROM auf 90° begrenzen',
  'L410 — Hintere Schulter (leichtes Gewicht, 15+ Wdh)',
  'Face Pulls am L480 Kabelzug',
  'Außenrotation am Kabelzug (L480)',
]

export default function Plan() {
  const currentPhase = getCurrentPhase()
  const [selectedPhase, setSelectedPhase] = useState(currentPhase.phase)
  const phase = phases.find(p => p.phase === selectedPhase)!

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Trainingsplan</h1>

      <div className="flex gap-2">
        {phases.map(p => (
          <button
            key={p.phase}
            onClick={() => setSelectedPhase(p.phase)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              p.phase === selectedPhase ? 'bg-accent text-white' :
              p.phase === currentPhase.phase ? 'bg-accent/20 text-accent-light border border-accent/30' :
              'bg-surface2 text-text-dim'
            }`}
          >
            Phase {p.phase}
          </button>
        ))}
      </div>

      <div className="bg-surface2 rounded-xl p-3">
        <div className="font-bold">{phase.name}</div>
        <div className="text-xs text-text-dim">Woche {phase.weeks[0]}–{phase.weeks[1]} · {phase.gymDaysPerWeek}x/Woche</div>
      </div>

      {phase.days.map(day => (
        <div key={day.name} className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="bg-surface2 px-4 py-2 font-semibold text-sm">{day.name}</div>
          <div className="divide-y divide-border/50">
            {day.exercises.map(ex => (
              <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5">
                <img
                  src={ex.equipmentImage}
                  alt={ex.equipment}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface2"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/equipment/placeholder.svg' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{ex.name}</div>
                  <div className="text-xs text-text-dim">{ex.equipment} · {ex.sets} Sätze</div>
                  {ex.hints && <div className="text-xs text-text-dim italic">{ex.hints}</div>}
                </div>
                {ex.shoulderWarning && (
                  <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded flex-shrink-0">⚠️</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-surface rounded-xl border border-danger/20 p-4">
        <h3 className="font-bold text-danger text-sm mb-2">Schulter: Verboten</h3>
        <ul className="space-y-1">
          {SHOULDER_FORBIDDEN.map(item => (
            <li key={item} className="text-xs text-text-dim flex items-center gap-2">
              <span className="text-danger">✕</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface rounded-xl border border-success/20 p-4">
        <h3 className="font-bold text-success text-sm mb-2">Schulter: Erlaubt (mit Vorsicht)</h3>
        <ul className="space-y-1">
          {SHOULDER_ALLOWED.map(item => (
            <li key={item} className="text-xs text-text-dim flex items-center gap-2">
              <span className="text-success">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface rounded-xl border border-accent/20 p-4">
        <h3 className="font-bold text-accent text-sm mb-2">Durchhalte-Regeln</h3>
        <ul className="space-y-2 text-xs text-text-dim">
          <li><span className="font-semibold text-text-primary">Nie-Null-Regel:</span> Jeden Tag mindestens eine Aktivität — Gym oder Walking Pad. Kein Tag bei Null.</li>
          <li><span className="font-semibold text-text-primary">2-Tage-Schutz:</span> Maximal 2 Ruhetage am Stück. Am 3. Tag wird trainiert, egal wie.</li>
          <li><span className="font-semibold text-text-primary">Krankheitsregel:</span> Bei Krankheit: Walking Pad statt Gym. Nur bei Fieber komplett pausieren.</li>
          <li><span className="font-semibold text-text-primary">Pyramide:</span> Am Gerät aufwärmen, Gewicht steigern, letzter Satz schwer aber 2-3 Wdh Reserve.</li>
        </ul>
      </div>
    </div>
  )
}
