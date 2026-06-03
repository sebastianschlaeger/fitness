import { useEffect, useState } from 'react'

/**
 * Eigene Gerätefotos. Werden pro Übungs-ID im localStorage gehalten (als
 * herunterskalierte JPEG-DataURL) und reaktiv überall angezeigt — Liste,
 * Detail, Plan. So erkennt man "sein" Gerät im Studio sofort wieder.
 */

const PREFIX = 'exercise-image-'
const CHANGE_EVENT = 'customimage-change'
const MAX_DIM = 1000      // längste Kante in px
const JPEG_QUALITY = 0.75

function keyFor(id: string) {
  return `${PREFIX}${id}`
}

/** localStorage-Überlauf — Browser melden das uneinheitlich. */
function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || // Firefox
    e.name === 'QUOTA_EXCEEDED_ERR' ||          // älteres Safari
    e.code === 22
  )
}

export function getCustomImage(id: string): string | null {
  try {
    return localStorage.getItem(keyFor(id))
  } catch {
    return null
  }
}

function notify(id: string) {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { id } }))
}

export function setCustomImage(id: string, dataUrl: string) {
  localStorage.setItem(keyFor(id), dataUrl)
  notify(id)
}

export function removeCustomImage(id: string) {
  localStorage.removeItem(keyFor(id))
  notify(id)
}

/** Bild auf MAX_DIM herunterskalieren und als JPEG-DataURL zurückgeben. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas nicht verfügbar'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Öffnet die Kamera (mobil) bzw. den Datei-Dialog, skaliert das Foto herunter
 * und speichert es. onError wird bei vollem Speicher o. Ä. aufgerufen.
 */
export function captureCustomImage(id: string, onError?: (msg: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const dataUrl = await downscale(file)
      setCustomImage(id, dataUrl)
    } catch (e) {
      const msg = isQuotaError(e)
        ? 'Speicher voll — bitte ein paar Fotos entfernen.'
        : 'Foto konnte nicht gespeichert werden.'
      if (onError) onError(msg)
      else alert(msg)
    }
  }
  input.click()
}

/** Reaktiver Zugriff auf das eigene Foto einer Übung. */
export function useCustomImage(id: string): string | null {
  const [img, setImg] = useState<string | null>(() => getCustomImage(id))

  useEffect(() => {
    setImg(getCustomImage(id))
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ id: string }>).detail
      if (!detail || detail.id === id) setImg(getCustomImage(id))
    }
    function onStorage(e: StorageEvent) {
      if (e.key === keyFor(id)) setImg(getCustomImage(id))
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [id])

  return img
}
