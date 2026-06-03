import { useState } from 'react'
import type { MachineAdjustment } from '../data/machineAdjustments'
import { useMachineSettings } from '../lib/machineSettings'

const NOTE_KEY = '__note'

/**
 * Geräte-Einstellungen pro Maschine: vordefinierte Felder (Sitzhöhe etc.) zum
 * Eintragen der persönlichen Werte + freies Notizfeld. Eingeklappt zeigt die
 * Karte die gespeicherten Werte als Kurzübersicht (am Gerät schnell ablesbar).
 */
export default function MachineSettingsCard({ machineId, adjustments }: {
  machineId: string
  adjustments: MachineAdjustment[]
}) {
  const [values, setValue] = useMachineSettings(machineId)
  const [open, setOpen] = useState(false)

  const filled = adjustments.filter(a => values[a.key]?.trim())
  const note = values[NOTE_KEY]?.trim()

  return (
    <div className="bg-surface rounded-xl border border-border mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-sm font-bold">⚙️ Einstellungen</span>
        {!open && (
          <span className="text-xs text-text-dim truncate flex-1">
            {filled.length > 0
              ? filled.map(a => `${a.label}: ${values[a.key]}`).join(' · ')
              : note
                ? note
                : '— tippen zum Eintragen'}
          </span>
        )}
        <span className="ml-auto text-text-dim text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {adjustments.map(a => (
            <div key={a.key} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.label}</div>
                {a.hint && <div className="text-xs text-text-dim">{a.hint}</div>}
              </div>
              <input
                type="text"
                inputMode="text"
                value={values[a.key] ?? ''}
                onChange={e => setValue(a.key, e.target.value)}
                placeholder={a.records}
                className="w-28 bg-surface2 border border-border rounded-lg px-2 py-1.5 text-center text-sm font-semibold flex-shrink-0"
              />
            </div>
          ))}

          <div>
            <div className="text-sm font-medium mb-1">Notiz</div>
            <textarea
              value={values[NOTE_KEY] ?? ''}
              onChange={e => setValue(NOTE_KEY, e.target.value)}
              placeholder="z.B. Griffposition, Fußstellung …"
              rows={2}
              className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
