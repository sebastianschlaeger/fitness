import { type Env, jsonResponse } from '../_db'

// Generischer Key-Value-Store für geräteübergreifende, ausfallsichere
// Nutzer-Config (Geräte-Einstellungen, eigene Fotos, Sortier-Reihenfolge).
// Single-User-App → kein user_id nötig.
//
// Last-Write-Wins: updated_at ist ein CLIENT-Zeitstempel (ms). Löschungen sind
// Tombstones (deleted=1, Zeile bleibt erhalten), damit sie sich geräteübergreifend
// ausbreiten statt wieder hochgeladen zu werden. Die Tabelle wird bei Bedarf
// selbst angelegt (kein separates Migrations-Token nötig).

async function ensureTable(env: Env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS app_kv (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL,
       updated_at INTEGER NOT NULL,
       deleted INTEGER NOT NULL DEFAULT 0
     )`
  ).run()
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  await ensureTable(env)
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  const keys = url.searchParams.get('keys')     // Keys + Meta (für große Werte wie Fotos)
  const prefix = url.searchParams.get('prefix') // Key + Value + Meta (für kleine Werte)

  if (key !== null) {
    const row = await env.DB.prepare('SELECT value, updated_at, deleted FROM app_kv WHERE key = ?')
      .bind(key).first<{ value: string; updated_at: number; deleted: number }>()
    return jsonResponse({
      value: row && !row.deleted ? row.value : null,
      updated_at: row?.updated_at ?? 0,
      deleted: row?.deleted ?? 0,
    })
  }
  if (keys !== null) {
    const res = await env.DB.prepare('SELECT key, updated_at, deleted FROM app_kv WHERE key LIKE ?')
      .bind(keys + '%').all<{ key: string; updated_at: number; deleted: number }>()
    return jsonResponse(res.results ?? [])
  }
  if (prefix !== null) {
    const res = await env.DB.prepare('SELECT key, value, updated_at, deleted FROM app_kv WHERE key LIKE ?')
      .bind(prefix + '%').all<{ key: string; value: string; updated_at: number; deleted: number }>()
    return jsonResponse(res.results ?? [])
  }
  return jsonResponse({ error: 'key, keys or prefix required' }, 400)
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  await ensureTable(env)
  const body = await request.json<{ key: string; value?: string; updated_at: number; deleted?: number }>()
  if (!body?.key || typeof body.updated_at !== 'number') {
    return jsonResponse({ error: 'key and updated_at required' }, 400)
  }
  const value = typeof body.value === 'string' ? body.value : ''
  const deleted = body.deleted ? 1 : 0
  // Server-seitiges LWW: ältere/out-of-order Pushes werden ignoriert.
  await env.DB.prepare(
    `INSERT INTO app_kv (key, value, updated_at, deleted) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       deleted = excluded.deleted
     WHERE excluded.updated_at >= app_kv.updated_at`
  ).bind(body.key, value, body.updated_at, deleted).run()
  return jsonResponse({ success: true })
}
