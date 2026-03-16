import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Dashboard', icon: '⬛' },
  { to: '/training', label: 'Training', icon: '🏋️' },
  { to: '/weight', label: 'Gewicht', icon: '⚖️' },
  { to: '/walking', label: 'Walking', icon: '🚶' },
  { to: '/plan', label: 'Plan', icon: '📋' },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface2 border-t border-border flex z-50">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              isActive ? 'text-accent-light bg-accent/10' : 'text-text-dim'
            }`
          }
        >
          <span className="text-lg mb-0.5">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
