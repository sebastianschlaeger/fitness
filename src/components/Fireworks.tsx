import { useEffect, useRef, useState } from 'react'

const COLORS = ['#818cf8', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#ffffff']

type Particle = {
  id: number
  left: string
  top: string
  dx: number
  dy: number
  color: string
  delay: number
}

/** Mehrere Bursts an verschiedenen Stellen → Partikel fliegen radial nach außen. */
function buildParticles(): Particle[] {
  const bursts = [
    { cx: 30, cy: 35 },
    { cx: 70, cy: 30 },
    { cx: 50, cy: 55 },
  ]
  const out: Particle[] = []
  let id = 0
  bursts.forEach((b, bi) => {
    const n = 16
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2
      const dist = 70 + Math.random() * 70
      out.push({
        id: id++,
        left: `${b.cx}%`,
        top: `${b.cy}%`,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: bi * 160,
      })
    }
  })
  return out
}

/**
 * Kurzes Feuerwerk-Overlay. Spielt einmal ab und ruft nach ~1,4 s onDone auf
 * (zum Aushängen). pointer-events:none → blockiert keine Eingaben.
 */
export default function Fireworks({ onDone }: { onDone: () => void }) {
  const [particles] = useState(buildParticles)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 1400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {particles.map(p => (
        <span
          key={p.id}
          className="firework-particle"
          style={{
            left: p.left,
            top: p.top,
            background: p.color,
            // CSS-Variablen steuern die Flugrichtung im Keyframe
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            animationDelay: `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
