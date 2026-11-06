/**
 * Echte Gewichtsstufen je Übung (Stand 06.11.2026).
 *
 * BH: Beschriftung abgelesen vom Blockfoto (bis 70 kg), Rest aus dem Plattenaufbau.
 * Technogym: Herstellerangaben und Sebastians Einträge.
 * Herleitung: ~/dokumente/gesundheit/training/gewichtsstufen.md
 */

function ladder(from: number, to: number, step: number): number[] {
  const stages: number[] = []
  for (let w = from; w <= to; w += step) stages.push(w)
  return stages
}

const TECHNOGYM_5KG = ladder(5, 130, 5)
const TECHNOGYM_BEINPRESSE = ladder(10, 190, 10)
const BH_BLOCK = [5, 7.5, 10, 12.5, 17.5, 22.5, 30, 35, 42.5, 50, 57.5, 62.5, 70, 77.5, 85, 90]
const SCHEIBEN = ladder(2.5, 150, 2.5)
const KURZHANTELN = ladder(2.5, 50, 2.5)

const WEIGHT_STAGES: Record<string, number[]> = {
  'latzug-technogym': TECHNOGYM_5KG,
  'brustpresse-technogym': TECHNOGYM_5KG,
  'rudern-technogym': TECHNOGYM_5KG,
  'beinbeuger-technogym': TECHNOGYM_5KG,
  'bauchmaschine-technogym': TECHNOGYM_5KG,
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
