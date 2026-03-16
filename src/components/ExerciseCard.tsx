import { useNavigate } from 'react-router-dom'
import type { Exercise } from '../data/training-plan'

type Status = 'completed' | 'current' | 'upcoming'

export default function ExerciseCard({ exercise, status, topSet }: {
  exercise: Exercise
  status: Status
  topSet?: { weight_kg: number; reps: number }
}) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/training/${exercise.id}`)}
      className={`flex items-center gap-3 bg-surface2 rounded-xl p-3 cursor-pointer transition-all active:scale-[0.98] ${
        status === 'completed' ? 'opacity-50' :
        status === 'current' ? 'border border-accent' :
        'opacity-60'
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
        status === 'completed' ? 'bg-success text-white' : 'border-2 border-border'
      }`}>
        {status === 'completed' && '✓'}
      </div>

      <img
        src={exercise.equipmentImage}
        alt={exercise.equipment}
        className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-surface"
        onError={(e) => { (e.target as HTMLImageElement).src = '/images/equipment/placeholder.svg' }}
      />

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{exercise.name}</div>
        <div className="text-xs text-text-dim truncate">{exercise.equipment}</div>
      </div>

      <div className="text-right flex-shrink-0">
        {topSet ? (
          <>
            <div className="text-sm font-bold text-accent-light">{topSet.weight_kg} kg × {topSet.reps}</div>
            <div className="text-xs text-text-dim">Top-Satz</div>
          </>
        ) : (
          <div className="text-xs text-text-dim">—</div>
        )}
      </div>
    </div>
  )
}
