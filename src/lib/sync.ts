/**
 * Geräteübergreifende, ausfallsichere Speicherung von Nutzer-Config
 * (Geräte-Einstellungen, eigene Fotos, Sortier-Reihenfolge).
 *
 * Modell: localStorage = schneller Offline-Cache, D1 (über /api/kv) = Quelle der
 * Wahrheit. Konfliktauflösung per Last-Write-Wins über CLIENT-Zeitstempel; jeder
 * Key trägt lokal einen Zeitstempel (Map in '__sync_ts'). Löschungen sind
 * Tombstones (deleted=1), damit sie sich geräteübergreifend ausbreiten statt
 * wieder hochgeladen zu werden. Beim Start: pending Pushes flushen, dann mergen.
 */

const BASE = '/api/kv'
const TS_STORE = '__sync_ts'

type Meta = { key: string; value?: string | null; updated_at: number; deleted: number }

// --- Zeitstempel-Map ---------------------------------------------------

let tsMap: Record<string, number> | null = null
function ts(): Record<string, number> {
  if (!tsMap) {
    try { tsMap = JSON.parse(localStorage.getItem(TS_STORE) || '{}') } catch { tsMap = {} }
  }
  return tsMap!
}
function getTs(key: string): number { return ts()[key] ?? 0 }
function setTs(key: string, value: number) { ts()[key] = value }
function saveTs() { try { localStorage.setItem(TS_STORE, JSON.stringify(ts())) } catch { /* ignore */ } }
function now(): number { return Date.now() }

// --- Low-level HTTP ----------------------------------------------------

/** GET, wirft bei Netzwerk-/HTTP-Fehler (für den Pull, damit Retry möglich ist). */
async function getJson<T>(qs: string): Promise<T> {
  const res = await fetch(`${BASE}?${qs}`)
  if (!res.ok) throw new Error(`kv GET ${res.status}`)
  return await res.json() as T
}

/** POST, gibt Erfolg zurück (schluckt Netzwerk-/Server-Fehler → false). */
async function pushKv(key: string, value: string, updated_at: number, deleted: number): Promise<boolean> {
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, updated_at, deleted }),
    })
    return res.ok
  } catch {
    return false
  }
}

// --- Pending Pushes (Debounce + Flush) ---------------------------------

type Pending = { key: string; value: string; ts: number; deleted: number; timer: ReturnType<typeof setTimeout> }
const pending = new Map<string, Pending>()

function schedulePush(key: string, value: string, t: number, deleted: number, ms: number) {
  const ex = pending.get(key)
  if (ex) clearTimeout(ex.timer)
  const timer = setTimeout(() => { pending.delete(key); pushKv(key, value, t, deleted) }, ms)
  pending.set(key, { key, value, ts: t, deleted, timer })
}
function cancelPending(key: string) {
  const ex = pending.get(key)
  if (ex) { clearTimeout(ex.timer); pending.delete(key) }
}
async function flushPending() {
  const entries = [...pending.values()]
  for (const e of entries) clearTimeout(e.timer)
  pending.clear()
  for (const e of entries) await pushKv(e.key, e.value, e.ts, e.deleted)
}

// --- Schreib-API für die Stores ----------------------------------------

/** Sofort persistieren (Reihenfolge, Fotos). Gibt Cloud-Erfolg zurück. */
export async function recordWriteImmediate(key: string, value: string): Promise<boolean> {
  const t = now()
  setTs(key, t); saveTs()
  cancelPending(key)
  return pushKv(key, value, t, 0)
}

/** Debounced persistieren (Einstellungs-Felder, pro Tastendruck aufgerufen). */
export function recordWriteDebounced(key: string, value: string, ms = 700): void {
  const t = now()
  setTs(key, t); saveTs()
  schedulePush(key, value, t, 0, ms)
}

/** Löschung als Tombstone persistieren (verbreitet sich geräteübergreifend). */
export function recordDelete(key: string): void {
  const t = now()
  setTs(key, t); saveTs()
  cancelPending(key)
  pushKv(key, '', t, 1)
}

// --- Fotos: Lazy-Download mit In-Memory-Fallback -----------------------

const photoMem = new Map<string, string | null>()

/** Foto vom Server holen (für ein neues Gerät), wenn lokal nicht vorhanden. */
export async function loadRemotePhoto(key: string): Promise<string | null> {
  if (photoMem.has(key)) return photoMem.get(key) ?? null
  let meta: Meta
  try {
    meta = await getJson<Meta>(`key=${encodeURIComponent(key)}`)
  } catch {
    return null // Netzwerkfehler → kein Caching, nächster Mount versucht erneut
  }
  if (meta && meta.value != null && meta.updated_at >= getTs(key)) {
    try { localStorage.setItem(key, meta.value) } catch { /* Quota → nur In-Memory */ }
    setTs(key, meta.updated_at); saveTs()
    photoMem.set(key, meta.value)
    return meta.value
  }
  photoMem.set(key, null) // geprüft, nichts (oder lokaler Tombstone neuer)
  return null
}

// --- Startup-Sync (Merge) ----------------------------------------------

function localKeysWithPrefix(prefix: string): string[] {
  const out: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) out.push(k)
  }
  return out
}

/** Bestehende lokale Daten ohne Zeitstempel als "Alt-Bestand" markieren (ts=1),
 *  damit sie hochmigriert und auf frische Geräte gezogen werden. */
function stampLegacy(prefix: string) {
  for (const k of localKeysWithPrefix(prefix)) {
    if (!(k in ts())) setTs(k, 1)
  }
}

/** Kleine Werte (Einstellungen, Reihenfolge): vollständiger LWW-Merge. */
async function syncSmall(prefix: string, event: string) {
  const server = await getJson<Meta[]>(`prefix=${encodeURIComponent(prefix)}`)
  const serverByKey = new Map(server.map(e => [e.key, e]))
  let changed = false

  // Server → lokal, wo der Server neuer ist
  for (const e of server) {
    if (e.updated_at > getTs(e.key)) {
      if (e.deleted) localStorage.removeItem(e.key)
      else localStorage.setItem(e.key, e.value ?? '')
      setTs(e.key, e.updated_at)
      changed = true
    }
  }

  // lokal → Server, wo lokal neuer (oder Server unbekannt)
  const localKeys = new Set(localKeysWithPrefix(prefix))
  for (const k of Object.keys(ts())) if (k.startsWith(prefix)) localKeys.add(k)
  for (const key of localKeys) {
    const lt = getTs(key)
    const st = serverByKey.get(key)?.updated_at ?? -1
    if (lt > st) {
      const v = localStorage.getItem(key)
      await pushKv(key, v ?? '', lt, v === null ? 1 : 0)
    }
  }

  saveTs()
  if (changed) window.dispatchEvent(new CustomEvent(event))
}

/** Fotos (groß): Tombstones/Updates anwenden, lokale hochladen (sequenziell),
 *  Download passiert lazy pro Übung. */
async function syncPhotos(prefix = 'exercise-image-') {
  const server = await getJson<Meta[]>(`keys=${encodeURIComponent(prefix)}`)
  const serverByKey = new Map(server.map(e => [e.key, e]))

  for (const e of server) {
    if (e.updated_at > getTs(e.key)) {
      localStorage.removeItem(e.key)      // alte/gelöschte Version verwerfen
      photoMem.delete(e.key)
      if (e.deleted) setTs(e.key, e.updated_at) // Tombstone übernehmen
      // bei Update (nicht gelöscht): ts niedrig lassen → Lazy-Download holt neu
    }
  }

  const localKeys = new Set(localKeysWithPrefix(prefix))
  for (const k of Object.keys(ts())) if (k.startsWith(prefix)) localKeys.add(k)
  for (const key of localKeys) {
    const lt = getTs(key)
    const st = serverByKey.get(key)?.updated_at ?? -1
    if (lt > st) {
      const v = localStorage.getItem(key)
      await pushKv(key, v ?? '', lt, v === null ? 1 : 0) // sequenziell → keine Spitze
    }
  }

  saveTs()
  window.dispatchEvent(new CustomEvent('customimage-change'))
}

let pulled = false
let retryArmed = false

async function doPull() {
  await flushPending()
  stampLegacy('machine-settings-')
  stampLegacy('exercise-order-')
  stampLegacy('exercise-image-')
  saveTs()
  // syncSmall/syncPhotos werfen bei Netzwerkfehler → Retry über catch
  await syncSmall('machine-settings-', 'machinesettings-change')
  await syncSmall('exercise-order-', 'exerciseorder-change')
  await syncPhotos('exercise-image-')
}

let pulling = false
/** Einmaliger Sync beim App-Start; bei Offline-Fehler Retry beim 'online'-Event. */
export function pullConfig(): void {
  if (pulled || pulling) return // pulling-Guard verhindert StrictMode-Doppellauf
  pulling = true
  doPull()
    .then(() => { pulled = true })
    .catch(() => {
      if (!retryArmed) {
        retryArmed = true
        window.addEventListener('online', () => { retryArmed = false; pullConfig() }, { once: true })
      }
    })
    .finally(() => { pulling = false })
}
