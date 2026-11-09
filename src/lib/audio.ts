// --- Audio ---------------------------------------------------------------
// Ein einziger AudioContext, der beim ersten echten User-Tap entsperrt wird.
// Auf iOS/Android startet ein AudioContext sonst 'suspended' und bleibt stumm,
// wenn er erst im Timer-Callback (ausserhalb einer Geste) erzeugt wird.
let sharedCtx: AudioContext | null = null
let speechPrimed = false

function getCtx(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!sharedCtx) sharedCtx = new Ctor()
    return sharedCtx
  } catch {
    return null
  }
}

/** Beim ersten Tap aufrufen (User-Gesture) — entsperrt Audio + Sprachausgabe. */
export function unlockAudio() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
  // iOS/Safari geben Sprachausgabe nur frei, wenn sie einmal innerhalb einer
  // echten Geste angestossen wurde — hier mit einer stummen Utterance "aufwecken".
  try {
    const synth = window.speechSynthesis
    if (synth && !speechPrimed) {
      speechPrimed = true
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      synth.speak(u)
    }
  } catch { /* speech not available */ }
}

function vibrate() {
  try { navigator.vibrate?.([200, 100, 200]) } catch { /* not supported */ }
}

/** Spricht ein Wort (z.B. "Start"). Fallback auf Beep, wenn keine Sprachausgabe. */
export function speak(text: string) {
  try {
    const synth = window.speechSynthesis
    if (!synth) { playBeep(); return }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    u.rate = 1
    u.volume = 1
    synth.speak(u)
  } catch {
    playBeep()
  }
}

export function playBeep() {
  vibrate()
  const ctx = getCtx()
  if (!ctx) return
  const fire = () => {
    try {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.value = 0.3
        osc.start(ctx.currentTime + i * 0.2)
        osc.stop(ctx.currentTime + i * 0.2 + 0.15)
      }
    } catch { /* audio not available */ }
  }
  if (ctx.state === 'suspended') ctx.resume().then(fire).catch(() => {})
  else fire()
}
