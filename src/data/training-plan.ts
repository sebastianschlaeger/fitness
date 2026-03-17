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
}

export const PLAN_START_DATE = '2026-03-16'
export const MAMMUTMARSCH_DATE = '2026-09-05'
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
      hints: 'Füße schulterbreit, Knie nicht über Zehenspitzen. Schwere Grundübung für Mammutmarsch-Kraft.',
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
      hints: 'Schulterblätter zusammenziehen. Aufrechte Haltung — wichtig für lange Märsche.',
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
      hints: 'Starker Core überträgt Kraft beim Gehen und schützt die Wirbelsäule.',
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
      hints: 'Schwere Grundkraft für Mammutmarsch.',
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
      hints: 'Oberschenkelrückseite — wichtig fürs Gehen.',
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
      equipment: 'Technogym Leg Extension',
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
// PHASE 3: Ausdauer-Fokus & Muskelerhalt (Woche 17-24)
// Nur Oberkörper 1x/Woche, 3 Sätze, gleiche Intensität wie Phase 2
// Beine pausiert (werden durch Märsche beansprucht)
// ============================================================

const PHASE3_MUSKELERHALT: TrainingDay = {
  daysOfWeek: [3], // Mi — genug Abstand zu Wochenend-Märschen
  name: 'Muskelerhalt (Oberkörper)',
  exercises: [
    {
      id: 'brustpresse-technogym',
      name: 'Brustpresse',
      equipment: 'Technogym Chest Press',
      equipmentImage: '/images/equipment/technogym-chest-press.jpg',
      sets: 3,
      reps: '8-15',
      shoulderWarning: 'ROM begrenzen',
    },
    {
      id: 'latzug-technogym',
      name: 'Latzug (Untergriff)',
      equipment: 'Technogym Vertical Traction',
      equipmentImage: '/images/equipment/technogym-vertical-traction.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Untergriff für Bizeps-Beteiligung.',
    },
    {
      id: 'rudern-technogym',
      name: 'Rudern',
      equipment: 'Technogym Low Row',
      equipmentImage: '/images/equipment/technogym-low-row.jpg',
      sets: 3,
      reps: '8-15',
      hints: 'Aufrechte Haltung für Marsch-Stabilität.',
    },
  ],
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
    name: 'Ausdauer-Fokus & Muskelerhalt',
    weeks: [17, 24],
    gymDaysPerWeek: 1,
    rir: '1-2',
    restSeconds: 150,
    info: 'Nur Oberkörper erhalten. Beine pausiert — Märsche reichen. Kraft-Volumen auf 1/3 reduziert.',
    days: [PHASE3_MUSKELERHALT],
  },
]
