/**
 * Echte Gewichtsstufen je Übung (Stand 06.11.2026).
 *
 * Quelle sind die Herstellerangaben und Sebastians Einträge von vor der
 * Wiedereinstiegs-Rundung; vollständige Stufenlisten veröffentlichen die
 * Hersteller nicht. Die BH-Blöcke fehlen hier, bis ihre Stufen bestätigt sind.
 * Herleitung: ~/dokumente/gesundheit/training/gewichtsstufen.md
 */

function ladder(from: number, to: number, step: number): number[] {
  const stages: number[] = []
  for (let w = from; w <= to; w += step) stages.push(w)
  return stages
}

const TECHNOGYM_5KG = ladder(5, 130, 5)
const TECHNOGYM_BEINPRESSE = ladder(10, 190, 10)
const SCHEIBEN = ladder(2.5, 150, 2.5)
const KURZHANTELN = ladder(2.5, 50, 2.5)

const WEIGHT_STAGES: Record<string, number[]> = {
  'latzug-technogym': TECHNOGYM_5KG,
  'brustpresse-technogym': TECHNOGYM_5KG,
  'rudern-technogym': TECHNOGYM_5KG,
  'beinbeuger-technogym': TECHNOGYM_5KG,
  'bauchmaschine-technogym': TECHNOGYM_5KG,
  'beinpresse-technogym': TECHNOGYM_BEINPRESSE,
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
