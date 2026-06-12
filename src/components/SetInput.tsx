type SetData = { weight_kg: number; reps: number; completed: boolean }

export default function SetInput({ setNumber, label, isWarmup, isTopSet, isActive, data, onChange }: {
  setNumber: number
  label: string
  isWarmup: boolean
  isTopSet: boolean
  /** Aktuell laufender Satz in der Automatik — hervorgehoben. */
  isActive: boolean
  data: SetData
  onChange: (field: 'weight_kg' | 'reps', value: number) => void
}) {
  return (
    <div className={`flex items-center gap-3 py-3 px-3 rounded-lg ${
      isActive ? 'ring-2 ring-accent bg-accent/10' : isTopSet ? 'bg-accent/10' : isWarmup ? 'bg-surface2/40' : ''
    } ${data.completed && !isActive ? 'opacity-50' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isTopSet ? 'bg-accent text-white' : isWarmup ? 'border border-dashed border-border text-text-dim' : 'bg-surface2 text-text-dim'
      }`}>
        {setNumber}
      </div>

      <div className="flex-shrink-0 w-16">
        <div className={`text-xs ${isTopSet ? 'text-accent-light font-semibold' : 'text-text-dim'}`}>{label}</div>
      </div>

      <input
        type="number"
        inputMode="decimal"
        value={data.weight_kg || ''}
        onChange={e => onChange('weight_kg', parseFloat(e.target.value) || 0)}
        className={`bg-surface2 border rounded-lg px-2 text-center font-semibold ${
          isActive ? 'w-20 py-2 text-xl' : 'w-16 py-1.5 text-sm'
        } ${isTopSet ? 'border-accent' : 'border-border'}`}
        disabled={data.completed}
      />
      <span className="text-xs text-text-dim">kg</span>

      <input
        type="number"
        inputMode="numeric"
        value={data.reps || ''}
        onChange={e => onChange('reps', parseInt(e.target.value) || 0)}
        className={`bg-surface2 border rounded-lg px-2 text-center font-semibold ${
          isActive ? 'w-16 py-2 text-xl' : 'w-14 py-1.5 text-sm'
        } ${isTopSet ? 'border-accent' : 'border-border'}`}
        disabled={data.completed}
      />
      <span className="text-xs text-text-dim">Wdh</span>

      {/* Passiver Status — kein manuelles Abhaken mehr, die Automatik steuert. */}
      <div className="w-7 h-7 ml-auto flex items-center justify-center flex-shrink-0">
        {isActive
          ? <span className="block w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          : data.completed
            ? <span className="text-success text-sm">✓</span>
            : null}
      </div>
    </div>
  )
}
