/**
 * Vollständiger Gerätekatalog des Studios
 *
 * Jedes Gerät hat:
 * - Welche Muskeln es trainiert (primär + sekundär)
 * - Bewegungstyp und -richtung
 * - Vorteile & Nachteile
 * - Überlappungen mit anderen Geräten (Alternativen)
 * - Besondere Hinweise (Schulter-Problematik, etc.)
 */

export type MuscleGroup =
  | 'quadrizeps' | 'hamstrings' | 'gluteus' | 'waden' | 'adduktoren' | 'abduktoren'
  | 'brust' | 'oberer-ruecken' | 'latissimus' | 'unterer-ruecken' | 'schultern'
  | 'bizeps' | 'trizeps' | 'bauch' | 'hintere-schulter'
  | 'herz-kreislauf'

export type EquipmentCategory = 'technogym' | 'bh-fitness' | 'freihanteln' | 'cardio'

export type EquipmentInfo = {
  id: string
  name: string
  model: string
  category: EquipmentCategory
  image: string
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  movementType: string // z.B. "Drücken", "Ziehen", "Beugung", "Streckung"
  pros: string[]
  cons: string[]
  alternatives: string[] // IDs von Geräten die ähnliche Funktion haben
  notes?: string
  shoulderWarning?: string
}

export const equipmentCatalog: EquipmentInfo[] = [
  // ============================================
  // TECHNOGYM — Geführte Maschinen (Selectorized)
  // ============================================
  {
    id: 'technogym-leg-press',
    name: 'Beinpresse',
    model: 'Technogym Leg Press',
    category: 'technogym',
    image: '/images/equipment/technogym-leg-press.jpg',
    primaryMuscles: ['quadrizeps', 'gluteus'],
    secondaryMuscles: ['hamstrings', 'waden'],
    movementType: 'Drücken (Beine)',
    pros: [
      'Geführte Bewegung → sicher für Anfänger',
      'Gewichtsblock → schnelle Gewichtswechsel',
      'Rücken ist gestützt → schont Wirbelsäule',
      'Verschiedene Fußpositionen möglich (hoch/tief, eng/weit)',
    ],
    cons: [
      'Weniger Maximalgewicht als PL700 (Plate Loaded)',
      'Feste Bewegungsbahn → weniger natürlich',
      'Gewichtssprünge können groß sein',
    ],
    alternatives: ['bh-pl700-leg-press', 'bh-pl200-hack-squat'],
    notes: 'Fußposition hoch = mehr Gluteus/Hamstrings, tief = mehr Quadrizeps. Füße schulterbreit.',
  },
  {
    id: 'technogym-chest-press',
    name: 'Brustpresse',
    model: 'Technogym Chest Press',
    category: 'technogym',
    image: '/images/equipment/technogym-chest-press.jpg',
    primaryMuscles: ['brust'],
    secondaryMuscles: ['trizeps', 'schultern'],
    movementType: 'Horizontales Drücken',
    pros: [
      'Geführte Bahn → kein Spotter nötig',
      'Sicher bei Schulter-Problemen (ROM begrenzbar)',
      'Guter Einstieg für Bankdrücken-Bewegung',
    ],
    cons: [
      'Feste Bahn trainiert weniger Stabilisatoren',
      'Nicht so effektiv wie freie Gewichte für Muskelaufbau',
      'Griff-Position nicht individuell anpassbar',
    ],
    alternatives: ['bh-l080-chest-shoulder', 'kurzhanteln'],
    shoulderWarning: 'ROM begrenzen! Nicht zu tief absenken. 2-3 Wiederholungen Reserve lassen.',
  },
  {
    id: 'technogym-abdominal-crunch',
    name: 'Bauchmaschine',
    model: 'Technogym Abdominal Crunch',
    category: 'technogym',
    image: '/images/equipment/technogym-abdominal-crunch.jpg',
    primaryMuscles: ['bauch'],
    secondaryMuscles: [],
    movementType: 'Rumpfbeugung',
    pros: [
      'Isoliert den Bauch sehr gut',
      'Einstellbarer Widerstand',
      'Kein Nacken-Zug wie bei freien Crunches',
    ],
    cons: [
      'Nur Beugung, keine Rotation oder Seitbewegung',
      'Kann bei falschem Setup den Hüftbeuger belasten',
    ],
    alternatives: [],
    notes: 'Langsam und kontrolliert. Auf Ausatmen bei der Kontraktion achten.',
  },
  {
    id: 'technogym-lower-back',
    name: 'Rückenstrecker',
    model: 'Technogym Lower Back',
    category: 'technogym',
    image: '/images/equipment/technogym-lower-back.jpg',
    primaryMuscles: ['unterer-ruecken'],
    secondaryMuscles: ['gluteus'],
    movementType: 'Rumpfstreckung',
    pros: [
      'Isoliert den unteren Rücken',
      'Geführte Bewegung → sicher',
      'Wichtig für Rückengesundheit und Haltung',
    ],
    cons: [
      'Gefahr der Überstreckung',
      'Nicht funktional (isolierte Bewegung)',
    ],
    alternatives: [],
    notes: 'Kein Überstrecken! Nur bis zur neutralen Position zurückgehen.',
  },
  {
    id: 'technogym-leg-extension',
    name: 'Beinstrecker',
    model: 'Technogym Leg Extension',
    category: 'technogym',
    image: '/images/equipment/technogym-leg-extension.jpg',
    primaryMuscles: ['quadrizeps'],
    secondaryMuscles: [],
    movementType: 'Kniestreckung (Isolation)',
    pros: [
      'Beste Quadrizeps-Isolation überhaupt',
      'Geführte Bewegung → perfekte Form',
      'Gut für Aufwärmen und Finisher',
    ],
    cons: [
      'Hohe Scherkraft auf Knie bei voller Extension',
      'Nicht funktional',
    ],
    alternatives: ['bh-l010-leg-extension'],
    notes: 'Nicht ganz durchstrecken bei Knieproblemen. Kontrolliert arbeiten.',
  },
  {
    id: 'technogym-adductor',
    name: 'Adduktoren',
    model: 'Technogym Adductor',
    category: 'technogym',
    image: '/images/equipment/technogym-adductor.jpg',
    primaryMuscles: ['adduktoren'],
    secondaryMuscles: [],
    movementType: 'Bein-Adduktion (zusammenführen)',
    pros: [
      'Einzige Möglichkeit für gezielte Adduktoren-Isolation',
      'Wichtig für Bein-Stabilität und Verletzungsprävention',
    ],
    cons: [
      'Isolationsübung',
      'Kann bei zu viel Gewicht die Hüfte belasten',
    ],
    alternatives: [],
    notes: 'Moderates Gewicht, kontrollierte Bewegung. Ideal als Ergänzung zu Compound-Übungen.',
  },
  {
    id: 'technogym-abductor',
    name: 'Abduktoren',
    model: 'Technogym Abductor',
    category: 'technogym',
    image: '/images/equipment/technogym-abductor.jpg',
    primaryMuscles: ['abduktoren'],
    secondaryMuscles: ['gluteus'],
    movementType: 'Bein-Abduktion (auseinanderführen)',
    pros: [
      'Gezieltes Training der seitlichen Hüftmuskulatur',
      'Wichtig für Knie-Stabilität (besonders beim Laufen!)',
      'Gluteus medius Aktivierung',
    ],
    cons: [
      'Isolationsübung',
    ],
    alternatives: [],
    notes: 'Besonders relevant für Mammutmarsch — stabilisiert das Knie beim langen Gehen!',
  },
  {
    id: 'technogym-vertical-traction',
    name: 'Latzug',
    model: 'Technogym Vertical Traction',
    category: 'technogym',
    image: '/images/equipment/technogym-vertical-traction.jpg',
    primaryMuscles: ['latissimus'],
    secondaryMuscles: ['bizeps', 'oberer-ruecken'],
    movementType: 'Vertikales Ziehen',
    pros: [
      'Geführte Bahn → konstante Spannung',
      'Kein Körperschwung möglich wie beim Kabelzug',
      'Guter Einstieg für Klimmzug-Bewegung',
    ],
    cons: [
      'Weniger natürliche Bahn als Kabel-Latzug',
      'Grip-Optionen eingeschränkt',
    ],
    alternatives: ['bh-pl110-lat-pulley'],
    notes: 'Zur Brust ziehen, NICHT zum Nacken. Weiter Griff für mehr Lat-Aktivierung.',
  },
  {
    id: 'technogym-pectoral',
    name: 'Butterfly',
    model: 'Technogym Pectoral',
    category: 'technogym',
    image: '/images/equipment/technogym-pectoral.jpg',
    primaryMuscles: ['brust'],
    secondaryMuscles: ['schultern'],
    movementType: 'Horizontale Adduktion (Flyes)',
    pros: [
      'Isoliert die Brust ohne Trizeps-Beteiligung',
      'Gute Peak-Kontraktion',
      'Schulter-schonender als freie Flyes',
    ],
    cons: [
      'Nicht zu weit öffnen → Schulterbelastung',
      'Weniger natürliche Bewegung als Kabel-Flyes',
    ],
    alternatives: ['kurzhanteln'],
    notes: 'Nicht zu weit öffnen! Ellbogen bleiben leicht gebeugt.',
  },
  {
    id: 'technogym-upper-back',
    name: 'Oberer Rücken',
    model: 'Technogym Upper Back',
    category: 'technogym',
    image: '/images/equipment/technogym-upper-back.jpg',
    primaryMuscles: ['oberer-ruecken', 'hintere-schulter'],
    secondaryMuscles: ['bizeps'],
    movementType: 'Horizontales Ziehen (hoch)',
    pros: [
      'Gezieltes Training des oberen Rückens und Rhomboiden',
      'Gut für Haltung',
      'Ergänzt den unteren Rücken-Strecker',
    ],
    cons: [
      'Überlappung mit Rudermaschinen',
    ],
    alternatives: ['bh-pl300-seated-row'],
    notes: 'Unterschied zur Rudermaschine: höherer Ansatzpunkt, mehr oberer Trapez und hintere Schulter.',
  },
  {
    id: 'technogym-low-row',
    name: 'Rudern (Technogym)',
    model: 'Technogym Low Row',
    category: 'technogym',
    image: '/images/equipment/technogym-low-row.jpg',
    primaryMuscles: ['latissimus', 'oberer-ruecken'],
    secondaryMuscles: ['bizeps', 'hintere-schulter'],
    movementType: 'Horizontales Ziehen (tief)',
    pros: [
      'Geführte Bahn → kein Schwung möglich',
      'Brustpolster stützt → schont unteren Rücken',
      'Gleichmäßige Belastung beider Seiten',
    ],
    cons: [
      'Feste Bewegungsbahn',
      'Überlappung mit PL300',
    ],
    alternatives: ['bh-pl300-seated-row'],
    notes: 'Schulterblätter zusammen am Ende der Bewegung. Langsames Ablassen.',
  },
  {
    id: 'technogym-leg-curl',
    name: 'Beinbeuger (Technogym)',
    model: 'Technogym Leg Curl',
    category: 'technogym',
    image: '/images/equipment/technogym-leg-curl.jpg',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['waden'],
    movementType: 'Kniebeugung (sitzend)',
    pros: [
      'Geführte Bewegung',
      'Sitzende Position → weniger Hüftbeuger-Beteiligung',
      'Gewichtsblock → schnelle Anpassung',
    ],
    cons: [
      'Sitzend weniger Hamstring-Dehnung als liegend',
    ],
    alternatives: ['bh-l030-lying-leg-curl'],
    notes: 'Liegend (L030) und sitzend (Technogym) trainieren die Hamstrings leicht unterschiedlich. Abwechslung ist ideal.',
  },

  // ============================================
  // BH FITNESS — Plate Loaded & Selectorized
  // ============================================
  {
    id: 'bh-l030-lying-leg-curl',
    name: 'Beinbeuger liegend',
    model: 'BH Fitness L030',
    category: 'bh-fitness',
    image: '/images/equipment/bh-l030-lying-leg-curl.jpg',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['waden', 'gluteus'],
    movementType: 'Kniebeugung (liegend)',
    pros: [
      'Liegende Position → maximale Hamstring-Dehnung',
      'Stärkere Gluteus-Aktivierung als sitzend',
      'Gute Peak-Kontraktion',
    ],
    cons: [
      'Hüftbeuger kann bei falscher Positionierung belasten',
      'Schwieriger die Hüfte ruhig zu halten bei schwerem Gewicht',
    ],
    alternatives: ['technogym-leg-curl'],
    notes: 'Kontrolliert, kein Schwung. Hüfte auf der Bank lassen.',
  },
  {
    id: 'bh-pl300-seated-row',
    name: 'Rudermaschine',
    model: 'BH Fitness PL300 Seated Row',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl300-seated-row.jpg',
    primaryMuscles: ['latissimus', 'oberer-ruecken'],
    secondaryMuscles: ['bizeps', 'hintere-schulter'],
    movementType: 'Horizontales Ziehen',
    pros: [
      'Plate Loaded → feingranulare Gewichtssteuerung',
      'Brustpolster → schont unteren Rücken',
      'Sehr effektiv für Rückenbreite und -dicke',
    ],
    cons: [
      'Scheiben auflegen nötig → mehr Setup-Zeit',
    ],
    alternatives: ['technogym-low-row', 'technogym-upper-back'],
    notes: 'Schulterblätter zusammen, Ellbogen nah am Körper. Hauptübung für den Rücken.',
  },
  {
    id: 'bh-pl110-lat-pulley',
    name: 'Latzug (Kabel)',
    model: 'BH Fitness PL110',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl110-lat-pulley.jpg',
    primaryMuscles: ['latissimus'],
    secondaryMuscles: ['bizeps', 'oberer-ruecken'],
    movementType: 'Vertikales Ziehen (Kabel)',
    pros: [
      'Freies Kabel → natürlichere Bewegungsbahn',
      'Verschiedene Griffe möglich (breit, eng, neutral)',
      'Mehr Stabilisatoren als Technogym Vertical Traction',
    ],
    cons: [
      'Körperschwung möglich → Technik wichtiger',
      'Oberschenkel-Fixierung manchmal rutschig',
    ],
    alternatives: ['technogym-vertical-traction'],
    notes: 'Breiter Griff = mehr Lat, enger Griff = mehr unterer Lat + Bizeps. Zur Brust ziehen, NICHT Nacken!',
  },
  {
    id: 'bh-pl700-leg-press',
    name: 'Beinpresse (Plate Loaded)',
    model: 'BH Fitness PL700',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl700-leg-press.jpg',
    primaryMuscles: ['quadrizeps', 'gluteus'],
    secondaryMuscles: ['hamstrings', 'waden'],
    movementType: 'Drücken (Beine)',
    pros: [
      'Plate Loaded → sehr schwere Gewichte möglich',
      '45°-Winkel → natürlichere Belastung',
      'Mehr Gewicht möglich als Technogym Leg Press',
      'Verschiedene Fußpositionen für unterschiedliche Muskelbetonung',
    ],
    cons: [
      'Scheiben laden = mehr Aufwand',
      'Bei sehr schwerem Gewicht → Spotter empfehlenswert',
      'Größer und sperriger als die Technogym-Variante',
    ],
    alternatives: ['technogym-leg-press', 'bh-pl200-hack-squat'],
    notes: 'Hauptübung Beine in Phase 2! Hier darfst du richtig schwer gehen. Füße hoch = mehr Glutes.',
  },
  {
    id: 'bh-pl200-hack-squat',
    name: 'Hack Squat',
    model: 'BH Fitness PL200',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl200-hack-squat.jpg',
    primaryMuscles: ['quadrizeps'],
    secondaryMuscles: ['gluteus', 'hamstrings'],
    movementType: 'Kniebeuge (geführt)',
    pros: [
      'Kniebeuge-Bewegung ohne Wirbelsäulenbelastung',
      'Stärkere Quadrizeps-Betonung als Beinpresse',
      'Plate Loaded → schwere Gewichte möglich',
      'Tiefe Bewegung → guter Stretch',
    ],
    cons: [
      'Knie können bei falscher Fußposition belastet werden',
      'Nicht für jeden Körperbau geeignet',
    ],
    alternatives: ['bh-pl700-leg-press', 'bh-pl320-belt-squat'],
    notes: 'Füße etwas vor dem Körpermittelpunkt. Knie nicht über die Fußspitzen schieben.',
  },
  {
    id: 'bh-pl340-hip-thrust',
    name: 'Hip Thrust',
    model: 'BH Fitness PL340',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl340-hip-thrust.jpg',
    primaryMuscles: ['gluteus'],
    secondaryMuscles: ['hamstrings'],
    movementType: 'Hüftstreckung',
    pros: [
      'Beste Übung für Gluteus-Isolation',
      'Maschine macht Setup einfach (kein Langhantel-Setup nötig)',
      'Wichtig für Lauf-/Gehleistung (Mammutmarsch!)',
    ],
    cons: [
      'Kann bei falschem Setup den unteren Rücken belasten',
    ],
    alternatives: [],
    notes: 'Kinn Richtung Brust, Rippen runter. Oben 1 Sekunde halten und Glutes bewusst anspannen.',
  },
  {
    id: 'bh-pl210-seated-calf',
    name: 'Waden (sitzend)',
    model: 'BH Fitness PL210',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl210-seated-calf.jpg',
    primaryMuscles: ['waden'],
    secondaryMuscles: [],
    movementType: 'Plantarflexion (sitzend)',
    pros: [
      'Isoliert den Soleus (tiefe Wadenmuskulatur)',
      'Sitzende Position → reiner Wadenfokus',
      'Wichtig für Ausdauer beim Gehen/Laufen',
    ],
    cons: [
      'Sitzend weniger Gastrocnemius-Aktivierung als stehend',
    ],
    alternatives: [],
    notes: 'Voller ROM: ganz runter dehnen, ganz hoch drücken. Langsam!',
  },
  {
    id: 'bh-l410-rear-deltoid',
    name: 'Hintere Schulter',
    model: 'BH Fitness L410',
    category: 'bh-fitness',
    image: '/images/equipment/bh-l410-rear-deltoid.jpg',
    primaryMuscles: ['hintere-schulter'],
    secondaryMuscles: ['oberer-ruecken'],
    movementType: 'Reverse Fly',
    pros: [
      'Isoliert die oft vernachlässigte hintere Schulter',
      'Geführte Bewegung → sicher',
      'Wichtig für Schulter-Balance und Haltung',
    ],
    cons: [
      'Wenig Gewicht nötig → Ego-Check',
    ],
    alternatives: [],
    notes: 'Leichtes Gewicht, hohe Wiederholungen. Schulter-safe! Nicht mit Schwung arbeiten.',
  },
  {
    id: 'bh-l080-chest-shoulder',
    name: 'Schrägbrustpresse',
    model: 'BH Fitness L080',
    category: 'bh-fitness',
    image: '/images/equipment/bh-l080-chest-shoulder.jpg',
    primaryMuscles: ['brust', 'schultern'],
    secondaryMuscles: ['trizeps'],
    movementType: 'Schräges Drücken',
    pros: [
      'Trainiert den oberen Brustanteil (Clavicularis)',
      'Schräger Winkel → mehr Schulter-Beteiligung',
      'Gute Ergänzung zur flachen Brustpresse',
    ],
    cons: [
      'Schräger Winkel kann Schulter belasten',
      'Überlappung mit Technogym Chest Press',
    ],
    alternatives: ['technogym-chest-press', 'kurzhanteln'],
    shoulderWarning: 'Bei Schulter-Problemen: vorsichtig, ROM begrenzen.',
  },
  {
    id: 'bh-l480-multistation',
    name: 'Multifunktionsturm / Kabelzug',
    model: 'BH Fitness L480',
    category: 'bh-fitness',
    image: '/images/equipment/bh-l480-multistation.jpg',
    primaryMuscles: ['trizeps', 'bizeps'],
    secondaryMuscles: ['schultern', 'brust', 'latissimus'],
    movementType: 'Vielseitig (Kabelzug)',
    pros: [
      'Extremst vielseitig: Trizeps Pushdown, Bizeps Curl, Face Pulls, Kabel-Flyes, etc.',
      'Konstante Spannung über gesamten ROM',
      'Viele Griffoptionen',
      'Unilateral (einarmig) möglich',
    ],
    cons: [
      'Oft besetzt im Studio',
      'Technik variiert je nach Übung → Lernkurve',
    ],
    alternatives: ['kurzhanteln'],
    notes: 'Trizeps: Seil oder V-Griff, Ellbogen fixiert. Bizeps: EZ-Bar oder Seil.',
  },
  {
    id: 'bh-pl320-belt-squat',
    name: 'Belt Squat',
    model: 'BH Fitness PL320',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl320-belt-squat.jpg',
    primaryMuscles: ['quadrizeps', 'gluteus'],
    secondaryMuscles: ['hamstrings'],
    movementType: 'Kniebeuge (Gürtel-beladen)',
    pros: [
      'Null Wirbelsäulenbelastung (Gewicht hängt am Gürtel)',
      'Kniebeuge-Bewegung ohne Rückenrisiko',
      'Ideal bei Rückenproblemen',
      'Tiefe Bewegung möglich',
    ],
    cons: [
      'Gewicht begrenzt vs. Hack Squat',
      'Setup mit Gürtel kann umständlich sein',
    ],
    alternatives: ['bh-pl200-hack-squat', 'bh-pl700-leg-press'],
    notes: 'Perfekte Alternative zu freien Kniebeugen ohne Wirbelsäulenbelastung.',
  },
  {
    id: 'bh-l010-leg-extension',
    name: 'Beinstrecker (BH)',
    model: 'BH Fitness L010',
    category: 'bh-fitness',
    image: '/images/equipment/bh-l010-leg-extension.jpg',
    primaryMuscles: ['quadrizeps'],
    secondaryMuscles: [],
    movementType: 'Kniestreckung (Isolation)',
    pros: [
      'Gleiche Funktion wie Technogym Leg Extension',
      'Alternative wenn Technogym besetzt',
    ],
    cons: [
      'Gleiche Einschränkungen wie alle Beinstrecker',
    ],
    alternatives: ['technogym-leg-extension'],
    notes: 'Funktional identisch zur Technogym-Variante. Gut als Backup.',
  },
  {
    id: 'bh-pl330-rear-kick',
    name: 'Rear Kick',
    model: 'BH Fitness PL330',
    category: 'bh-fitness',
    image: '/images/equipment/bh-pl330-rear-kick.jpg',
    primaryMuscles: ['gluteus'],
    secondaryMuscles: ['hamstrings'],
    movementType: 'Hüftstreckung (einbeinig)',
    pros: [
      'Unilateral → gleicht Dysbalancen aus',
      'Gute Gluteus-Isolation',
      'Ergänzt Hip Thrust',
    ],
    cons: [
      'Nur ein Bein → doppelte Zeit',
      'Leichtes Gewicht nötig für gute Form',
    ],
    alternatives: ['bh-pl340-hip-thrust'],
    notes: 'Langsam und kontrolliert. Fokus auf Gluteus-Kontraktion am obersten Punkt.',
  },

  // ============================================
  // FREIHANTELN
  // ============================================
  {
    id: 'kurzhanteln',
    name: 'Kurzhanteln',
    model: 'Kurzhantel-Set (1–50 kg)',
    category: 'freihanteln',
    image: '/images/equipment/kurzhanteln.jpg',
    primaryMuscles: ['brust', 'schultern', 'bizeps', 'trizeps'],
    secondaryMuscles: ['bauch', 'oberer-ruecken'],
    movementType: 'Vielseitig (Frei)',
    pros: [
      'Maximale Bewegungsfreiheit → natürliche Bewegungsbahnen',
      'Trainiert Stabilisatoren mit',
      'Unilateral möglich → Dysbalancen ausgleichen',
      'Riesige Übungsvielfalt: Bankdrücken, Curls, Seitheben, Schulterdrücken, etc.',
    ],
    cons: [
      'Technik/Form wichtiger → höheres Verletzungsrisiko',
      'Spotter empfehlenswert bei schweren Gewichten',
      'Setup aufwändiger als Maschinen',
    ],
    alternatives: ['technogym-chest-press', 'bh-l480-multistation'],
    notes: 'Ideal für: Kurzhantel-Bankdrücken, Seitheben, Bizeps Curls, Trizeps Kickbacks, einarmiges Rudern.',
  },

  // ============================================
  // CARDIO
  // ============================================
  {
    id: 'stairmaster',
    name: 'Stairmaster',
    model: 'Stairmaster (Treppensteiger)',
    category: 'cardio',
    image: '/images/equipment/stairmaster.jpg',
    primaryMuscles: ['herz-kreislauf', 'quadrizeps', 'gluteus', 'waden'],
    secondaryMuscles: ['hamstrings'],
    movementType: 'Treppensteigen (Ausdauer)',
    pros: [
      'Höchster Kalorienverbrauch aller Cardio-Geräte',
      'Gleichzeitig Bein-Kraft + Ausdauer',
      'Perfekte Mammutmarsch-Vorbereitung (Steigungen!)',
      'Gelenkschonender als Laufen',
    ],
    cons: [
      'Sehr anstrengend → Einsteiger vorsichtig',
      'Monoton',
      'Oft nur 1-2 Geräte im Studio',
    ],
    alternatives: ['laufband', 'ellipsentrainer'],
    notes: 'Top-Gerät für Mammutmarsch-Prep! Simuliert Anstiege. 20-30 Min bei moderatem Tempo.',
  },
  {
    id: 'laufband',
    name: 'Laufband',
    model: 'Laufband (Treadmill)',
    category: 'cardio',
    image: '/images/equipment/laufband.jpg',
    primaryMuscles: ['herz-kreislauf', 'quadrizeps', 'waden'],
    secondaryMuscles: ['hamstrings', 'gluteus'],
    movementType: 'Gehen / Laufen',
    pros: [
      'Direkte Mammutmarsch-Vorbereitung (Gehen trainieren!)',
      'Steigung einstellbar → Bergtraining möglich',
      'Tempo genau steuerbar',
      'Wetterunabhängig',
    ],
    cons: [
      'Laufen = höhere Gelenkbelastung als Ellipse/Stairmaster',
      'Keine seitliche Bewegung',
    ],
    alternatives: ['stairmaster', 'ellipsentrainer'],
    notes: 'Für Mammutmarsch: Gehen bei 5-6 km/h mit 5-10% Steigung. Trainiert die Gehausdauer direkt.',
  },
  {
    id: 'ellipsentrainer',
    name: 'Ellipsentrainer / Crosstrainer',
    model: 'Ellipsentrainer',
    category: 'cardio',
    image: '/images/equipment/ellipsentrainer.jpg',
    primaryMuscles: ['herz-kreislauf'],
    secondaryMuscles: ['quadrizeps', 'hamstrings', 'gluteus', 'schultern'],
    movementType: 'Elliptische Ganzkörperbewegung',
    pros: [
      'Gelenkschonend (kein Impact wie beim Laufen)',
      'Ganzkörper (Arme + Beine)',
      'Guter Einstieg für untrainierte Ausdauer',
      'Moderate Intensität bei hohem Kalorienverbrauch',
    ],
    cons: [
      'Weniger spezifisch als Laufband für Geh-Training',
      'Keine reine Bein-Ausdauer',
      'Bewegungsmuster nicht 1:1 übertragbar auf Gehen',
    ],
    alternatives: ['laufband', 'stairmaster'],
    notes: 'Gut für Aufwärmen (10 Min) oder moderate Cardio-Einheiten. Weniger spezifisch für Mammutmarsch als Laufband/Stairmaster.',
  },
]

// ============================================
// ÜBERLAPPUNGS-ANALYSE: Welche Geräte können sich ersetzen?
// ============================================

export const overlapGroups = [
  {
    name: 'Beinpresse (Drücken)',
    devices: ['technogym-leg-press', 'bh-pl700-leg-press', 'bh-pl200-hack-squat', 'bh-pl320-belt-squat'],
    explanation: 'Alle 4 trainieren primär Quadrizeps + Gluteus durch eine Druckbewegung. Technogym = Einstieg (geführt), PL700 = schweres Training (Plate Loaded), Hack Squat = Quad-Fokus, Belt Squat = rückenschonend.',
  },
  {
    name: 'Beinbeuger (Hamstrings)',
    devices: ['bh-l030-lying-leg-curl', 'technogym-leg-curl'],
    explanation: 'Liegend (L030) = mehr Stretch + Gluteus-Beteiligung. Sitzend (Technogym) = isolierter. Ideal: abwechseln.',
  },
  {
    name: 'Beinstrecker (Quadrizeps-Isolation)',
    devices: ['technogym-leg-extension', 'bh-l010-leg-extension'],
    explanation: 'Funktional identisch. Nimm was frei ist.',
  },
  {
    name: 'Horizontales Rudern (Rücken)',
    devices: ['bh-pl300-seated-row', 'technogym-low-row', 'technogym-upper-back'],
    explanation: 'PL300 und Low Row = unterer/mittlerer Rücken, breiter Lat. Upper Back = oberer Rücken, Rhomboiden, hintere Schulter. Unterschied: Ansatzpunkt und Winkel.',
  },
  {
    name: 'Latzug (Vertikales Ziehen)',
    devices: ['bh-pl110-lat-pulley', 'technogym-vertical-traction'],
    explanation: 'PL110 = freies Kabel, mehr Griffoptionen. Technogym = geführt, stabilere Form. Beide trainieren den Latissimus.',
  },
  {
    name: 'Brustpresse (Drücken)',
    devices: ['technogym-chest-press', 'bh-l080-chest-shoulder', 'kurzhanteln'],
    explanation: 'Technogym = flach (mittlere Brust). L080 = schräg (obere Brust). Kurzhanteln = freie Bewegung, mehr Stabilisatoren.',
  },
  {
    name: 'Gluteus (Hüftstreckung)',
    devices: ['bh-pl340-hip-thrust', 'bh-pl330-rear-kick'],
    explanation: 'Hip Thrust = bilateral, schweres Gewicht. Rear Kick = unilateral, Dysbalancen ausgleichen. Ideal: beides nutzen.',
  },
  {
    name: 'Arm-Isolation',
    devices: ['bh-l480-multistation', 'kurzhanteln'],
    explanation: 'Kabelzug = konstante Spannung über ganzen ROM. Kurzhanteln = natürlichere Bewegung. Kabelzug besser für Trizeps, Kurzhanteln besser für Bizeps.',
  },
  {
    name: 'Cardio (Ausdauer)',
    devices: ['stairmaster', 'laufband', 'ellipsentrainer'],
    explanation: 'Mammutmarsch-Priorität: Laufband (Gehen!) > Stairmaster (Steigungen) > Ellipse (gelenkschonend). Laufband + Steigung ist die spezifischste Vorbereitung.',
  },
]
