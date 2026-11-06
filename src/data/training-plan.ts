/** Intervall-Konfiguration für HIIT-Einheiten (z.B. am Crosstrainer). */
export type HiitConfig = {
  warmupSeconds: number
  workSeconds: number
  restSeconds: number
  rounds: number
  cooldownSeconds: number
}

export type Exercise = {
  id: string
  name: string
  equipment: string
  equipmentImage: string
  sets: number
  reps?: string // e.g. '8-15'
  hints?: string
  shoulderWarning?: string
  isCardio?: boolean
  durationMinutes?: number
  hiit?: HiitConfig // wenn gesetzt → Intervall-Training statt Dauer-Cardio
  /** Dauer steigt wöchentlich: ab startWeek startMinutes, je Woche +stepMinutes bis maxMinutes */
  durationRamp?: { startWeek: number; startMinutes: number; stepMinutes: number; maxMinutes: number }
}

export type TrainingDay = {
  daysOfWeek: number[] // 1=Mon, 2=Tue, ..., 5=Fri
  name: string
  exercises: Exercise[]
}

export type Phase = {
  phase: 1 | 2 | 3
  name: string
  weeks: [number, number] // [start, end] inclusive
  gymDaysPerWeek: number
  days: TrainingDay[]
  alternating?: boolean // A/B alternation: days[0]=A, days[1]=B
  rir?: string // Reps in Reserve target
  restSeconds?: number // Rest between sets
  info?: string // Phase description shown in app
  label?: string // Tab-Beschriftung im Plan (Default: „Phase N“)
  loadFactor?: number // Vorbelegung = letztes Gewicht × Faktor (z. B. 0.6 nach langer Pause)
  alternationStartWeek?: number // A/B-Wechsel zählt ab dieser Woche (Default: Phasenbeginn)
}

export const PLAN_START_DATE = '2026-03-16'
export const START_WEIGHT_KG = 94
export const GOAL_WEIGHT_KG = 80

// ============================================================
// PHASE 1: Fundament & Gewöhnung (Woche 1-8)
// Ganzkörper 2x/Woche, 3 Sätze, RIR 3-5, Pausen 2-3 Min
// ============================================================

const PHASE1_GANZKOERPER: TrainingDay = {
  daysOfWeek: [1, 4], // Mo, Do — 2 Ruhetage dazwischen
  name: 'Ganzkörper',
  exercises: [
    {
      id: 'beinpresse-technogym',
      name: 'Beinpresse',
      equipment: 'Technogym Leg Press',
      equipmentImage: '/images/equipment/technogym-leg-press.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Füße schulterbreit, Knie nicht über Zehenspitzen. Schwere Grundübung für die Beine.',
    },
    {
      id: 'brustpresse-technogym',
      name: 'Brustpresse',
      equipment: 'Technogym Chest Press',
      equipmentImage: '/images/equipment/technogym-chest-press.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Fußpedal nutzen für sichere Startposition. Nicht aus extremer Dehnung starten.',
      shoulderWarning: 'ROM begrenzen — Startposition prüfen, nicht zu tief absenken',
    },
    {
      id: 'latzug-technogym',
      name: 'Latzug (Untergriff)',
      equipment: 'Technogym Vertical Traction',
      equipmentImage: '/images/equipment/technogym-vertical-traction.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Untergriff (Handflächen zu dir) — trainiert Bizeps stark mit. Zur Brust ziehen, nicht Nacken.',
    },
    {
      id: 'beinbeuger-technogym',
      name: 'Beinbeuger sitzend',
      equipment: 'Technogym Leg Curl',
      equipmentImage: '/images/equipment/technogym-leg-curl.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Kniegelenk passend zum Maschinenscharnier einstellen. Kontrolliert, kein Schwung.',
    },
    {
      id: 'rudern-technogym',
      name: 'Rudern',
      equipment: 'Technogym Low Row',
      equipmentImage: '/images/equipment/technogym-low-row.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Schulterblätter zusammenziehen. Aufrechte Haltung — gut gegen Schreibtisch-Haltung.',
    },
    {
      id: 'hintere-schulter-l410',
      name: 'Reverse Fly (Hintere Schulter)',
      equipment: 'L410 Rear Deltoid',
      equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Leichtes Gewicht, kontrolliert. Stärkt hintere Schulter + oberen Rücken — entlastet Schultergelenk langfristig.',
    },
    {
      id: 'bauchmaschine-technogym',
      name: 'Bauchmaschine',
      equipment: 'Technogym Abdominal Crunch',
      equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Starker Core stabilisiert den Rumpf und schützt die Wirbelsäule.',
    },
  ],
}

// ============================================================
// PHASE 2: Progression & Recomp-Peak (Woche 9-16)
// Ganzkörper 3x/Woche, A/B-Alternation, 3 Sätze, RIR 1-2
// Woche A: A-B-A, Woche B: B-A-B
// ============================================================

const PHASE2_TAG_A: TrainingDay = {
  daysOfWeek: [1, 3, 5], // Mo, Mi, Fr — actual days determined by alternation logic
  name: 'Ganzkörper A (Maschinen)',
  exercises: [
    {
      id: 'beinpresse-technogym',
      name: 'Beinpresse',
      equipment: 'Technogym Leg Press',
      equipmentImage: '/images/equipment/technogym-leg-press.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Schwere Grundkraft für die Beine.',
    },
    {
      id: 'brustpresse-technogym',
      name: 'Brustpresse',
      equipment: 'Technogym Chest Press',
      equipmentImage: '/images/equipment/technogym-chest-press.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Fußpedal für sichere Startposition nutzen.',
      shoulderWarning: 'ROM begrenzen — nicht zu tief absenken',
    },
    {
      id: 'latzug-technogym',
      name: 'Latzug (Untergriff)',
      equipment: 'Technogym Vertical Traction',
      equipmentImage: '/images/equipment/technogym-vertical-traction.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Untergriff = starke Bizeps-Beteiligung.',
    },
    {
      id: 'beinbeuger-technogym',
      name: 'Beinbeuger sitzend',
      equipment: 'Technogym Leg Curl',
      equipmentImage: '/images/equipment/technogym-leg-curl.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Oberschenkelrückseite — Gegenspieler zum Beinstrecker.',
    },
    {
      id: 'rudern-technogym',
      name: 'Rudern',
      equipment: 'Technogym Low Row',
      equipmentImage: '/images/equipment/technogym-low-row.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Schulterblätter zusammen, aufrechte Haltung.',
    },
    {
      id: 'bauchmaschine-technogym',
      name: 'Bauchmaschine',
      equipment: 'Technogym Abdominal Crunch',
      equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg',
      sets: 3,
      reps: '8-15',
    },
  ],
}

const PHASE2_TAG_B: TrainingDay = {
  daysOfWeek: [1, 3, 5],
  name: 'Ganzkörper B (Freihantel)',
  exercises: [
    {
      id: 'beinstrecker-technogym',
      name: 'Beinstrecker',
      equipment: 'BH Leg Extension',
      equipmentImage: '/images/equipment/technogym-leg-extension.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Isolation statt schwere Beinpresse — schont ZNS an Tag B.',
    },
    {
      id: 'beinbeuger-l030',
      name: 'Beinbeuger liegend',
      equipment: 'L030',
      equipmentImage: '/images/equipment/bh-l030-lying-leg-curl.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Kontrolliert, kein Schwung.',
    },
    {
      id: 'kh-schraegbank',
      name: 'KH Schrägbankdrücken',
      equipment: 'Kurzhanteln + Schrägbank',
      equipmentImage: '/images/equipment/kurzhanteln.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Bank 15-30°, Schulterblätter fixieren. Ellbogen in Linie mit Bewegung.',
      shoulderWarning: 'NICHT steiler als 30° — sonst zu viel Last auf vorderer Schulter',
    },
    {
      id: 'latzug-pl110',
      name: 'Latzug (Variation)',
      equipment: 'PL110 Lat Pulldown',
      equipmentImage: '/images/equipment/bh-pl110-lat-pulley.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Variation zum Technogym — anderer Griff möglich.',
    },
    {
      id: 'hintere-schulter-l410',
      name: 'Reverse Fly (Hintere Schulter)',
      equipment: 'L410 Rear Deltoid',
      equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Hintere Schulter + oberer Rücken. Gesunde Schulterhaltung.',
    },
    {
      id: 'kabel-crunches-l480',
      name: 'Kabel-Crunches',
      equipment: 'L480 Multifunktionsturm',
      equipmentImage: '/images/equipment/bh-l480-multistation.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Beste Bauchübung — volle Dehnung ohne Wirbelsäulen-Zwangslage.',
    },
  ],
}

// ============================================================
// PHASE 3: Progression fortgeführt (ab Woche 17)
// Volles Ganzkörper-A/B-Programm wie Phase 2 läuft normal weiter.
// ============================================================

// ============================================================
// WIEDEREINSTIEG (ab 02.11.2026, Woche 34–35) nach gut zwei Monaten Pause:
// gleiche A/B-Tage, aber 2 Sätze à 10–12, Gewichte vorbelegt mit 60 % des
// letzten Trainings, 3–4 Wiederholungen im Tank. Zählt in der DB als Phase 3.
// ============================================================

function wiedereinstieg(day: TrainingDay): TrainingDay {
  return { ...day, exercises: day.exercises.map(e => ({ ...e, sets: 2, reps: '10-12' })) }
}

// ============================================================
// CARDIO: phasenunabhängig Di + Do → HIIT am Crosstrainer
// Intervall-Training (HiitBlock) mit Ansagen & Beep pro Wechsel.
// Greift als Fallback an Kraft-Ruhetagen (siehe getTodaysTraining).
// ============================================================

export const CARDIO_DAYS_OF_WEEK = [2, 4] // Di, Do

// 3:00 Aufwärmen + 16×(0:30 hart / 1:00 locker) + 3:00 Auslaufen = 30:00
export const HIIT_CROSSTRAINER: TrainingDay = {
  daysOfWeek: CARDIO_DAYS_OF_WEEK,
  name: 'HIIT (Crosstrainer)',
  exercises: [
    {
      id: 'hiit-crosstrainer',
      name: 'HIIT (Crosstrainer)',
      equipment: 'Ellipsentrainer / Crosstrainer',
      equipmentImage: '/images/equipment/ellipsentrainer.jpg',
      sets: 1,
      isCardio: true,
      durationMinutes: 30,
      hiit: {
        warmupSeconds: 180,
        workSeconds: 30,
        restSeconds: 60,
        rounds: 16,
        cooldownSeconds: 180,
      },
      hints: 'Gelenk- & schulterschonend. In der Belastung zügiger Widerstand/Tempo (8–9 von 10), in der Erholung locker weiterkurbeln — nicht ganz stoppen. Ansagen & Beep führen durch die Runden.',
    },
  ],
}

// ============================================================
// PLAN AB 03.11.2026 (Bausteine 1–6, ~/dokumente/gesundheit/training/plan-bausteine.md)
// Mo/Mi/Fr: erst Kraft (A/B im Wechsel), direkt danach Ausdauer — nach A
// Ergometer, nach B Rudergerät. Di/Do kein Studio. Sa oder So eine längere
// Ausdauereinheit allein. Dauer steigt wöchentlich (Praxiswert).
// ============================================================

const MODERAT = 'Moderat: Du kannst dich noch bequem unterhalten, es fühlt sich „etwas anstrengend“ an (nicht ganz locker).'

const NACH_KRAFT_ERGOMETER: Exercise = {
  id: 'cardio-ergometer',
  name: 'Ergometer (nach Kraft)',
  equipment: 'Fahrrad-Ergometer',
  equipmentImage: '/images/equipment/placeholder.svg',
  sets: 1,
  isCardio: true,
  durationMinutes: 15,
  durationRamp: { startWeek: 34, startMinutes: 15, stepMinutes: 5, maxMinutes: 30 },
  hints: `${MODERAT} Durchschnitts-Watt notieren — steigt das bei gleichem Gefühl, bist du fitter. Dazu Podcast.`,
}

const NACH_KRAFT_RUDERN: Exercise = {
  id: 'cardio-rudern',
  name: 'Rudergerät (nach Kraft)',
  equipment: 'Rudermaschine',
  equipmentImage: '/images/equipment/placeholder.svg',
  sets: 1,
  isCardio: true,
  durationMinutes: 15,
  durationRamp: { startWeek: 34, startMinutes: 15, stepMinutes: 5, maxMinutes: 30 },
  hints: `${MODERAT} Je Zug: Beine – Oberkörper – Arme, zurück umgekehrt. Zeit pro 500 m notieren. Zwickt die linke Schulter, auf Ergometer wechseln.`,
}

const WOCHENENDE_AUSDAUER: TrainingDay = {
  daysOfWeek: [6, 7],
  name: 'Ausdauer lang (Sa oder So)',
  exercises: [
    {
      id: 'cardio-wochenende',
      name: 'Rad, Wandern oder Ellipsentrainer',
      equipment: 'Draußen oder zu Hause',
      equipmentImage: '/images/equipment/ellipsentrainer.jpg',
      sets: 1,
      isCardio: true,
      durationMinutes: 45,
      durationRamp: { startWeek: 34, startMinutes: 45, stepMinutes: 10, maxMinutes: 75 },
      hints: `Einmal am Wochenende, Samstag oder Sonntag — der andere Tag ist frei. ${MODERAT}`,
    },
  ],
}

/** Kraft-Tag mit Ausdauer direkt danach (A → Ergometer, B → Rudergerät) */
function mitAusdauer(day: TrainingDay, cardio: Exercise): TrainingDay {
  return { ...day, exercises: [...day.exercises, cardio] }
}

/** Aufbau: 3 Arbeitssätze à 8–15 (plus 1 Aufwärmsatz, den die App selbst zeigt) */
function aufbau(day: TrainingDay): TrainingDay {
  return { ...day, exercises: day.exercises.map(e => ({ ...e, sets: 3, reps: '8-15' })) }
}

/** Ausdauer an Tagen ohne Kraft: nur noch das Wochenende (Di/Do kein Studio) */
export const AUSDAUER_JE_TAG: Record<number, TrainingDay> = {
  6: WOCHENENDE_AUSDAUER,
  7: WOCHENENDE_AUSDAUER,
}

/** Tatsächliche Dauer einer Cardio-Übung in der gegebenen Plan-Woche */
export function cardioMinutes(e: Exercise, week: number): number | undefined {
  const r = e.durationRamp
  if (!r) return e.durationMinutes
  const steps = Math.max(0, week - r.startWeek)
  return Math.min(r.maxMinutes, r.startMinutes + steps * r.stepMinutes)
}

// ============================================================
// PHASES
// ============================================================

export const phases: Phase[] = [
  {
    phase: 1,
    name: 'Fundament & Gewöhnung',
    weeks: [1, 8],
    gymDaysPerWeek: 2,
    rir: '3-5',
    restSeconds: 150, // 2.5 Min (2-3 Min empfohlen)
    info: 'Wiedereinstieg: Passive Strukturen anpassen, Bewegungen lernen. 3-5 Wiederholungen im Tank lassen.',
    days: [PHASE1_GANZKOERPER],
  },
  {
    phase: 2,
    name: 'Progression & Recomp-Peak',
    weeks: [9, 16],
    gymDaysPerWeek: 3,
    alternating: true, // A-B-A / B-A-B
    rir: '1-2',
    restSeconds: 150,
    info: 'Intensität steigt: Näher ans Muskelversagen. A/B-Tage wechseln sich ab.',
    days: [PHASE2_TAG_A, PHASE2_TAG_B],
  },
  {
    phase: 3,
    name: 'Progression & Recomp-Peak',
    weeks: [17, 24],
    gymDaysPerWeek: 3,
    alternating: true, // A-B-A / B-A-B
    rir: '1-2',
    restSeconds: 150,
    info: 'Volles Ganzkörper-Programm Mo/Mi/Fr (A/B im Wechsel), Cardio Di/Do.',
    days: [PHASE2_TAG_A, PHASE2_TAG_B],
  },
  {
    phase: 3,
    label: 'Wiedereinstieg',
    name: 'Wiedereinstieg nach Pause',
    weeks: [34, 35],
    gymDaysPerWeek: 3,
    alternating: true, // Woche 34 = Phasenwoche 1 → Mo A, Mi B, Fr A
    rir: '3-4',
    restSeconds: 150,
    loadFactor: 0.6,
    alternationStartWeek: 34,
    info: '2 Sätze à 10–12, Gewichte auf 60 % vom letzten Mal vorbelegt. Nach jedem Satz sollten noch 3–4 Wiederholungen drin sein. Danach Ausdauer (15 Min., nächste Woche 20). Di/Do kein Studio, Sa oder So lange Ausdauer.',
    days: [
      mitAusdauer(wiedereinstieg(PHASE2_TAG_A), NACH_KRAFT_ERGOMETER),
      mitAusdauer(wiedereinstieg(PHASE2_TAG_B), NACH_KRAFT_RUDERN),
    ],
  },
  {
    phase: 3,
    label: 'Aufbau',
    name: 'Aufbau ab 16.11.2026',
    weeks: [36, 60],
    gymDaysPerWeek: 3,
    alternating: true,
    alternationStartWeek: 34,
    rir: '2-3',
    restSeconds: 120,
    info: '1 Aufwärmsatz + 3 Arbeitssätze à 8–15. Jeder Arbeitssatz endet mit 2–3 Wiederholungen Reserve (Pyramide nur mit kleinen Stufen). Alle Sätze am oberen Ende → nächste Gewichtsstufe. Echte Wiederholungen eintragen. Danach Ausdauer (25 Min., ab 23.11. 30).',
    days: [
      mitAusdauer(aufbau(PHASE2_TAG_A), NACH_KRAFT_ERGOMETER),
      mitAusdauer(aufbau(PHASE2_TAG_B), NACH_KRAFT_RUDERN),
    ],
  },
]
