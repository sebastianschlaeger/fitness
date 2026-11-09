type SetData = { weight_kg: number; reps: number; completed: boolean }

export default function SetInput({ setNumber, label, isWarmup, isTopSet, data, onChange }: {
  setNumber: number
  label: string
  isWarmup: boolean
  isTopSet: boolean
  data: SetData
  onChange: (field: 'weight_kg', value: number) => void
}) {
  return (
    <div className={`flex items-center gap-3 py-3 px-3 rounded-lg ${
      isTopSet ? 'bg-accent/10' : isWarmup ? 'bg-surface2/40' : ''
    } ${data.completed ? 'opacity-50' : ''}`}>
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
        className={`bg-surface2 border rounded-lg px-2 text-center font-semibold w-16 py-1.5 text-sm ${isTopSet ? 'border-accent' : 'border-border'}`}
      />
      <span className="text-xs text-text-dim">kg</span>

      {/* Passiver Status — „Übung abschließen“ hakt alle Sätze ab. */}
      <div className="w-7 h-7 ml-auto flex items-center justify-center flex-shrink-0">
        {data.completed && <span className="text-success text-sm">✓</span>}
      </div>
    </div>
  )
}
