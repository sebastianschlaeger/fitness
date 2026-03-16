const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const COLORS = {
  gym: 'bg-success text-white',
  walking: 'bg-accent text-white',
  rest: 'bg-surface border border-border text-text-dim',
  future: 'bg-surface2 border border-border text-text-dim',
}

export default function WeekView({ activity }: {
  activity: { date: string; type: 'gym' | 'walking' | 'rest' | 'future' }[]
}) {
  return (
    <div className="bg-surface2 rounded-xl p-4">
      <div className="text-xs text-text-dim mb-2">Nie-Null-Regel</div>
      <div className="flex gap-1">
        {activity.map((day, i) => (
          <div
            key={day.date}
            className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-semibold ${COLORS[day.type]}`}
          >
            {DAY_LABELS[i]}
          </div>
        ))}
      </div>
    </div>
  )
}
