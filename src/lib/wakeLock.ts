import { useEffect, useRef } from 'react'

/**
 * Hält den Bildschirm wach, solange `active` true ist (z.B. während die
 * Trainings-Automatik läuft). Ohne das dunkelt das Handy nach ~30 s ab und
 * sperrt — dann frieren JS-Timer ein und die Sprachausgabe schweigt, sodass die
 * „Start"-Ansage nicht mehr pünktlich käme.
 *
 * Das Betriebssystem gibt den Lock automatisch frei, sobald die Seite versteckt
 * wird; deshalb fordern wir ihn bei Rückkehr in den Vordergrund neu an. No-op,
 * wenn die Wake-Lock-API fehlt (älteres iOS, manche Desktop-Browser) — kein Crash.
 *
 * Grenze: Sperrt der Nutzer das Display MANUELL, kann keine Web-App das
 * überstimmen. Wake Lock verhindert nur das automatische Abdunkeln/Sperren.
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return
    if (!('wakeLock' in navigator)) return // API nicht verfügbar → still überspringen
    let cancelled = false

    async function acquire() {
      if (cancelled || sentinelRef.current) return
      if (document.visibilityState !== 'visible') return // nur sichtbar anforderbar
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) { sentinel.release().catch(() => {}); return }
        sentinelRef.current = sentinel
        // Vom System aufgehoben (Tab versteckt/gesperrt) → Referenz freigeben,
        // damit wir bei Rückkehr in den Vordergrund sauber neu anfordern.
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null
        })
      } catch {
        // Verweigert (z.B. niedriger Akku) oder doch nicht unterstützt → ignorieren
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      const s = sentinelRef.current
      sentinelRef.current = null
      s?.release().catch(() => {})
    }
  }, [active])
}
