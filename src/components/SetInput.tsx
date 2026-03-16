type SetData = { weight_kg: number; reps: number; completed: boolean }

export default function SetInput({ setNumber, totalSets, data, isTopSet, onChange, onComplete }: {
  setNumber: number
  totalSets: number
  data: SetData
  isTopSet: boolean
  onChange: (field: 'weight_kg' | 'reps', value: number) => void
  onComplete: () => void
}) {
  const label = setNumber === totalSets ? 'Top-Satz' :
                setNumber === 1 ? 'Aufwärmen' :
                setNumber === totalSets - 1 ? 'Schwer' : 'Mittel'

  return (
    <div className={`flex items-center gap-3 py-3 px-3 rounded-lg ${
      isTopSet ? 'bg-accent/10' : ''
    } ${data.completed ? 'opacity-50' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isTopSet ? 'bg-accent text-white' : 'bg-surface2 text-text-dim'
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
        className={`w-16 bg-surface2 border rounded-lg px-2 py-1.5 text-center text-sm font-semibold ${
          isTopSet ? 'border-accent' : 'border-border'
        }`}
        disabled={data.completed}
      />
      <span className="text-xs text-text-dim">kg</span>

      <input
        type="number"
        inputMode="numeric"
        value={data.reps || ''}
        onChange={e => onChange('reps', parseInt(e.target.value) || 0)}
        className={`w-14 bg-surface2 border rounded-lg px-2 py-1.5 text-center text-sm font-semibold ${
          isTopSet ? 'border-accent' : 'border-border'
        }`}
        disabled={data.completed}
      />
      <span className="text-xs text-text-dim">Wdh</span>

      <button
        onClick={onComplete}
        disabled={data.completed}
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ml-auto flex-shrink-0 ${
          data.completed ? 'bg-success text-white' : 'border-2 border-border hover:border-success'
        }`}
      >
        {data.completed && '✓'}
      </button>
    </div>
  )
}
