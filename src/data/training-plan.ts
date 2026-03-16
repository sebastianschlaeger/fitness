export type Exercise = {
  id: string
  name: string
  equipment: string
  equipmentImage: string
  sets: number
  hints?: string
  shoulderWarning?: string
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
}

export const PLAN_START_DATE = '2026-03-16'
export const MAMMUTMARSCH_DATE = '2026-09-05'
export const START_WEIGHT_KG = 94
export const GOAL_WEIGHT_KG = 80

export const phases: Phase[] = [
  {
    phase: 1,
    name: 'Wiedereinstieg',
    weeks: [1, 4],
    gymDaysPerWeek: 3,
    days: [
      {
        daysOfWeek: [1, 3, 5], // Mo, Mi, Fr
        name: 'Ganzkörper',
        exercises: [
          {
            id: 'beinpresse-technogym',
            name: 'Beinpresse',
            equipment: 'Technogym Leg Press',
            equipmentImage: '/images/equipment/technogym-leg-press.jpg',
            sets: 3,
            hints: 'Füße schulterbreit, nicht zu tief',
          },
          {
            id: 'beinbeuger-l030',
            name: 'Beinbeuger liegend',
            equipment: 'L030',
            equipmentImage: '/images/equipment/bh-l030-lying-leg-curl.jpg',
            sets: 3,
            hints: 'Kontrolliert, kein Schwung',
          },
          {
            id: 'brustpresse-technogym',
            name: 'Brustpresse',
            equipment: 'Technogym Chest Press',
            equipmentImage: '/images/equipment/technogym-chest-press.jpg',
            sets: 3,
            hints: 'Nicht zu tief absenken',
            shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve',
          },
          {
            id: 'rudermaschine-pl300',
            name: 'Rudermaschine',
            equipment: 'PL300 Seated Row',
            equipmentImage: '/images/equipment/bh-pl300-seated-row.jpg',
            sets: 3,
            hints: 'Schulterblätter zusammen, Ellbogen nah am Körper',
          },
          {
            id: 'latzug-pl110',
            name: 'Latzug',
            equipment: 'PL110',
            equipmentImage: '/images/equipment/bh-pl110-lat-pulley.jpg',
            sets: 3,
            hints: 'Weiter Griff, zur Brust ziehen (nicht Nacken!)',
          },
          {
            id: 'bauchmaschine-technogym',
            name: 'Bauchmaschine',
            equipment: 'Technogym Abdominal Crunch',
            equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg',
            sets: 3,
            hints: 'Langsam und kontrolliert',
          },
          {
            id: 'rueckenstrecker-technogym',
            name: 'Rückenstrecker',
            equipment: 'Technogym Lower Back',
            equipmentImage: '/images/equipment/technogym-lower-back.jpg',
            sets: 3,
            hints: 'Kein Überstrecken',
          },
        ],
      },
    ],
  },
  {
    phase: 2,
    name: 'Aufbau',
    weeks: [5, 12],
    gymDaysPerWeek: 4,
    days: [
      {
        daysOfWeek: [1, 4], // Mo, Do
        name: 'Unterkörper',
        exercises: [
          { id: 'beinpresse-pl700', name: 'Beinpresse', equipment: 'PL700 (Plate Loaded)', equipmentImage: '/images/equipment/bh-pl700-leg-press.jpg', sets: 4, hints: 'Hauptübung, hier darfst du schwer gehen' },
          { id: 'hack-squat-pl200', name: 'Hack Squat', equipment: 'PL200', equipmentImage: '/images/equipment/bh-pl200-hack-squat.jpg', sets: 3 },
          { id: 'beinstrecker-technogym', name: 'Beinstrecker', equipment: 'Technogym Leg Extension', equipmentImage: '/images/equipment/technogym-leg-extension.jpg', sets: 3 },
          { id: 'beinbeuger-l030', name: 'Beinbeuger liegend', equipment: 'L030', equipmentImage: '/images/equipment/bh-l030-lying-leg-curl.jpg', sets: 3 },
          { id: 'hip-thrust-pl340', name: 'Hip Thrust', equipment: 'PL340', equipmentImage: '/images/equipment/bh-pl340-hip-thrust.jpg', sets: 3 },
          { id: 'waden-pl210', name: 'Waden', equipment: 'PL210 Seated Calf', equipmentImage: '/images/equipment/bh-pl210-seated-calf.jpg', sets: 3 },
          { id: 'adduktoren-technogym', name: 'Adduktoren', equipment: 'Technogym Adductor', equipmentImage: '/images/equipment/technogym-adductor.jpg', sets: 3 },
          { id: 'abduktoren-technogym', name: 'Abduktoren', equipment: 'Technogym Abductor', equipmentImage: '/images/equipment/technogym-abductor.jpg', sets: 3 },
        ],
      },
      {
        daysOfWeek: [2, 5], // Di, Fr
        name: 'Oberkörper',
        exercises: [
          { id: 'brustpresse-technogym', name: 'Brustpresse', equipment: 'Technogym Chest Press', equipmentImage: '/images/equipment/technogym-chest-press.jpg', sets: 4, shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve' },
          { id: 'rudermaschine-pl300', name: 'Rudermaschine', equipment: 'PL300 Seated Row', equipmentImage: '/images/equipment/bh-pl300-seated-row.jpg', sets: 4 },
          { id: 'latzug-technogym', name: 'Latzug', equipment: 'Technogym Vertical Traction', equipmentImage: '/images/equipment/technogym-vertical-traction.jpg', sets: 3 },
          { id: 'butterfly-technogym', name: 'Butterfly', equipment: 'Technogym Pectoral', equipmentImage: '/images/equipment/technogym-pectoral.jpg', sets: 3, hints: 'Nicht zu weit öffnen' },
          { id: 'hintere-schulter-l410', name: 'Hintere Schulter', equipment: 'L410 Rear Deltoid', equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg', sets: 3, hints: 'Leichtes Gewicht, schulter-safe' },
          { id: 'oberer-ruecken-technogym', name: 'Oberer Rücken', equipment: 'Technogym Upper Back', equipmentImage: '/images/equipment/technogym-upper-back.jpg', sets: 3 },
          { id: 'bauchmaschine-technogym', name: 'Bauchmaschine', equipment: 'Technogym Abdominal Crunch', equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg', sets: 3 },
          { id: 'rueckenstrecker-technogym', name: 'Rückenstrecker', equipment: 'Technogym Lower Back', equipmentImage: '/images/equipment/technogym-lower-back.jpg', sets: 3 },
        ],
      },
    ],
  },
  {
    phase: 3,
    name: 'Leistung',
    weeks: [13, 24],
    gymDaysPerWeek: 5,
    days: [
      {
        daysOfWeek: [1], // Mo
        name: 'Push',
        exercises: [
          { id: 'brustpresse-technogym', name: 'Brustpresse', equipment: 'Technogym Chest Press', equipmentImage: '/images/equipment/technogym-chest-press.jpg', sets: 4, shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve' },
          { id: 'schraegbrustpresse-l080', name: 'Schrägbrustpresse', equipment: 'L080', equipmentImage: '/images/equipment/bh-l080-chest-shoulder.jpg', sets: 3 },
          { id: 'butterfly-technogym', name: 'Butterfly', equipment: 'Technogym Pectoral', equipmentImage: '/images/equipment/technogym-pectoral.jpg', sets: 3 },
          { id: 'kabelzug-trizeps-l480', name: 'Kabelzug Trizeps', equipment: 'L480 Multifunktionsturm', equipmentImage: '/images/equipment/bh-l480-multistation.jpg', sets: 3 },
          { id: 'bauchmaschine-technogym', name: 'Bauch', equipment: 'Technogym Abdominal Crunch', equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg', sets: 4 },
        ],
      },
      {
        daysOfWeek: [2], // Di
        name: 'Pull',
        exercises: [
          { id: 'latzug-pl110', name: 'Latzug', equipment: 'PL110', equipmentImage: '/images/equipment/bh-pl110-lat-pulley.jpg', sets: 4 },
          { id: 'rudermaschine-pl300', name: 'Rudern', equipment: 'PL300 Seated Row', equipmentImage: '/images/equipment/bh-pl300-seated-row.jpg', sets: 4 },
          { id: 'oberer-ruecken-technogym', name: 'Oberer Rücken', equipment: 'Technogym Upper Back', equipmentImage: '/images/equipment/technogym-upper-back.jpg', sets: 3 },
          { id: 'hintere-schulter-l410', name: 'Hintere Schulter', equipment: 'L410 Rear Deltoid', equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg', sets: 3 },
          { id: 'kabelzug-bizeps-l480', name: 'Kabelzug Bizeps', equipment: 'L480 Multifunktionsturm', equipmentImage: '/images/equipment/bh-l480-multistation.jpg', sets: 3 },
          { id: 'rueckenstrecker-technogym', name: 'Rückenstrecker', equipment: 'Technogym Lower Back', equipmentImage: '/images/equipment/technogym-lower-back.jpg', sets: 3 },
        ],
      },
      {
        daysOfWeek: [3], // Mi
        name: 'Legs',
        exercises: [
          { id: 'hack-squat-pl200', name: 'Hack Squat', equipment: 'PL200', equipmentImage: '/images/equipment/bh-pl200-hack-squat.jpg', sets: 4 },
          { id: 'belt-squat-pl320', name: 'Belt Squat', equipment: 'PL320', equipmentImage: '/images/equipment/bh-pl320-belt-squat.jpg', sets: 3 },
          { id: 'beinbeuger-l030', name: 'Beinbeuger', equipment: 'L030', equipmentImage: '/images/equipment/bh-l030-lying-leg-curl.jpg', sets: 4 },
          { id: 'beinstrecker-technogym', name: 'Beinstrecker', equipment: 'Technogym Leg Extension', equipmentImage: '/images/equipment/technogym-leg-extension.jpg', sets: 3 },
          { id: 'hip-thrust-pl340', name: 'Hip Thrust', equipment: 'PL340', equipmentImage: '/images/equipment/bh-pl340-hip-thrust.jpg', sets: 3 },
          { id: 'waden-pl210', name: 'Waden', equipment: 'PL210', equipmentImage: '/images/equipment/bh-pl210-seated-calf.jpg', sets: 4 },
        ],
      },
      {
        daysOfWeek: [4], // Do
        name: 'Upper',
        exercises: [
          { id: 'rudern-technogym', name: 'Rudern', equipment: 'Technogym Low Row', equipmentImage: '/images/equipment/technogym-low-row.jpg', sets: 4 },
          { id: 'brustpresse-technogym', name: 'Brustpresse', equipment: 'Technogym Chest Press', equipmentImage: '/images/equipment/technogym-chest-press.jpg', sets: 3, shoulderWarning: 'ROM begrenzen, 2-3 Wdh Reserve' },
          { id: 'latzug-technogym', name: 'Latzug', equipment: 'Technogym Vertical Traction', equipmentImage: '/images/equipment/technogym-vertical-traction.jpg', sets: 3 },
          { id: 'butterfly-technogym', name: 'Butterfly', equipment: 'Technogym Pectoral', equipmentImage: '/images/equipment/technogym-pectoral.jpg', sets: 3 },
          { id: 'hintere-schulter-l410', name: 'Hintere Schulter', equipment: 'L410', equipmentImage: '/images/equipment/bh-l410-rear-deltoid.jpg', sets: 3 },
          { id: 'kabelzug-trizeps-l480', name: 'Kabelzug Trizeps + Bizeps', equipment: 'L480', equipmentImage: '/images/equipment/bh-l480-multistation.jpg', sets: 3 },
          { id: 'bauch-ruecken-technogym', name: 'Bauch + Rücken', equipment: 'Technogym Abdominal + Lower Back', equipmentImage: '/images/equipment/technogym-abdominal-crunch.jpg', sets: 3 },
        ],
      },
      {
        daysOfWeek: [5], // Fr
        name: 'Lower',
        exercises: [
          { id: 'beinpresse-technogym', name: 'Beinpresse', equipment: 'Technogym Leg Press', equipmentImage: '/images/equipment/technogym-leg-press.jpg', sets: 4 },
          { id: 'beinbeuger-technogym', name: 'Beinbeuger', equipment: 'Technogym Leg Curl', equipmentImage: '/images/equipment/technogym-leg-curl.jpg', sets: 3 },
          { id: 'beinstrecker-l010', name: 'Beinstrecker', equipment: 'L010', equipmentImage: '/images/equipment/bh-l010-leg-extension.jpg', sets: 3 },
          { id: 'adduktoren-technogym', name: 'Adduktoren', equipment: 'Technogym Adductor', equipmentImage: '/images/equipment/technogym-adductor.jpg', sets: 3 },
          { id: 'abduktoren-technogym', name: 'Abduktoren', equipment: 'Technogym Abductor', equipmentImage: '/images/equipment/technogym-abductor.jpg', sets: 3 },
          { id: 'rear-kick-pl330', name: 'Rear Kick', equipment: 'PL330', equipmentImage: '/images/equipment/bh-pl330-rear-kick.jpg', sets: 3 },
          { id: 'waden-pl210', name: 'Waden', equipment: 'PL210', equipmentImage: '/images/equipment/bh-pl210-seated-calf.jpg', sets: 3 },
        ],
      },
    ],
  },
]
