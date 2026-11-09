/**
 * Echte Gewichtsstufen je Übung (Stand 06.11.2026).
 *
 * BH: Beschriftung abgelesen vom Blockfoto (bis 70 kg), Rest aus dem Plattenaufbau.
 * Technogym: offizielle Ersatzteillisten und Blockfoto. Blöcke in 5-kg-Schritten plus
 * gelber Zusatzknopf 2,5 kg, dadurch 2,5-kg-Schritte. Die Beinpresse hat keinen Zusatzknopf.
 * Herleitung: ~/dokumente/gesundheit/training/gewichtsstufen.md
 */

function ladder(from: number, to: number, step: number): number[] {
  const stages: number[] = []
  for (let w = from; w <= to; w += step) stages.push(w)
  return stages
}

const TECHNOGYM_MIT_ZUSATZ = ladder(2.5, 132.5, 2.5)
const TECHNOGYM_BEINPRESSE = [5, ...ladder(10, 250, 10)]
const BH_BLOCK = [5, 7.5, 10, 12.5, 17.5, 22.5, 30, 35, 42.5, 50, 57.5, 62.5, 70, 77.5, 85, 90]
const SCHEIBEN = ladder(2.5, 150, 2.5)
const KURZHANTELN = ladder(2.5, 50, 2.5)

const WEIGHT_STAGES: Record<string, number[]> = {
  'latzug-technogym': TECHNOGYM_MIT_ZUSATZ,
  'brustpresse-technogym': TECHNOGYM_MIT_ZUSATZ,
  'rudern-technogym': TECHNOGYM_MIT_ZUSATZ,
  'beinbeuger-technogym': TECHNOGYM_MIT_ZUSATZ,
  'bauchmaschine-technogym': TECHNOGYM_MIT_ZUSATZ,
  'beinpresse-technogym': TECHNOGYM_BEINPRESSE,
  // Die ID ist historisch: Das Gerät im Studio ist ein BH-Beinstrecker.
  'beinstrecker-technogym': BH_BLOCK,
  'beinbeuger-l030': BH_BLOCK,
  'hintere-schulter-l410': BH_BLOCK,
  'kabel-crunches-l480': BH_BLOCK,
  'latzug-pl110': SCHEIBEN,
  'kh-schraegbank': KURZHANTELN,
}

/** Nächste echte Stufe; liegt ein Wert genau dazwischen, gilt die leichtere. */
export function snapToStage(exerciseId: string, kg: number): number {
  const stages = WEIGHT_STAGES[exerciseId]
  if (!stages || kg <= 0) return kg
  return stages.reduce((best, s) => (Math.abs(s - kg) < Math.abs(best - kg) ? s : best))
}

/** Erste echte Stufe über `kg`, oder null ohne Stufenliste bzw. am Blockende. */
export function nextStage(exerciseId: string, kg: number): number | null {
  const stages = WEIGHT_STAGES[exerciseId]
  if (!stages) return null
  return stages.find(s => s > kg) ?? null
}

/** Echte Stufe direkt unter `kg`, oder null ohne Stufenliste bzw. am Blockanfang. */
export function stageBelow(exerciseId: string, kg: number): number | null {
  const stages = WEIGHT_STAGES[exerciseId]
  if (!stages) return null
  const lower = stages.filter(s => s < kg)
  return lower.length > 0 ? lower[lower.length - 1] : null
}

/**
 * Reihe einer Übung aus dem schwersten Satz der letzten Einheit: Alle Arbeitssätze
 * liegen auf diesem Gewicht, der Aufwärmsatz eine Stufe darunter (am Blockanfang
 * auf derselben Stufe).
 */
export function setWeights(exerciseId: string, heaviest: number, warmupCount: number, workSets: number): number[] | null {
  if (!WEIGHT_STAGES[exerciseId] || heaviest <= 0) return null
  const top = snapToStage(exerciseId, heaviest)
  const work = Array.from({ length: workSets }, () => top)
  if (warmupCount === 0) return work
  return [stageBelow(exerciseId, top) ?? top, ...work]
}
