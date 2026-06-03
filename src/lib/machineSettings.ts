import { useEffect, useState, useCallback } from 'react'
import { recordWriteDebounced, recordDelete } from './sync'

/**
 * Persönliche Geräte-Einstellungen (Sitzhöhe, Rückenlehne, ROM …) pro Maschine.
 * Werte werden im localStorage gehalten, keyed nach machineId (= Bild-/Modell-
 * Basename), damit dasselbe Gerät über Übungen/Phasen hinweg dieselben Werte
 * teilt. Reaktiv über CustomEvent + storage-Event (wie die eigenen Gerätefotos).
 */

export type MachineSettingValues = Record<string, string>

const PREFIX = 'machine-settings-'
const CHANGE_EVENT = 'machinesettings-change'

function keyFor(machineId: string) {
  return `${PREFIX}${machineId}`
}

export function getMachineSettings(machineId: string): MachineSettingValues {
  try {
    const raw = localStorage.getItem(keyFor(machineId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as MachineSettingValues) : {}
  } catch {
    return {}
  }
}

function writeMachineSettings(machineId: string, values: MachineSettingValues) {
  // Leere Felder nicht speichern → sauberes Objekt
  const cleaned: MachineSettingValues = {}
  for (const [k, v] of Object.entries(values)) {
    if (v != null && v.trim() !== '') cleaned[k] = v
  }
  const key = keyFor(machineId)
  const empty = Object.keys(cleaned).length === 0
  const json = JSON.stringify(cleaned)
  try {
    if (empty) localStorage.removeItem(key)
    else localStorage.setItem(key, json)
  } catch {
    // Quota o.Ä. — Werte sind klein, daher praktisch nie ein Problem
  }
  // geräteübergreifend persistieren (debounced, da pro Tastendruck aufgerufen)
  if (empty) recordDelete(key)
  else recordWriteDebounced(key, json)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { machineId } }))
}

/** Reaktiver Zugriff + Setter für die Einstellungen einer Maschine. */
export function useMachineSettings(machineId: string): [MachineSettingValues, (key: string, value: string) => void] {
  const [values, setValues] = useState<MachineSettingValues>(() => getMachineSettings(machineId))

  useEffect(() => {
    setValues(getMachineSettings(machineId))
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ machineId: string }>).detail
      if (!detail || detail.machineId === machineId) setValues(getMachineSettings(machineId))
    }
    function onStorage(e: StorageEvent) {
      if (e.key === keyFor(machineId)) setValues(getMachineSettings(machineId))
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [machineId])

  const setValue = useCallback((key: string, value: string) => {
    const current = getMachineSettings(machineId)
    writeMachineSettings(machineId, { ...current, [key]: value })
  }, [machineId])

  return [values, setValue]
}
