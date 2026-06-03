/**
 * Mögliche (verstellbare) Einstellungen pro Studio-Gerät — recherchiert je Modell
 * und am echten Gerätefoto gegroundet. Keyed nach machineId (= Bild-/Modell-
 * Basename, identisch zur Equipment-Katalog-ID). Die persönlichen WERTE des
 * Nutzers liegen separat in localStorage (siehe lib/machineSettings.ts).
 *
 * "Gewicht" ist bewusst nicht enthalten — das wird pro Satz erfasst.
 */

export type MachineAdjustment = {
  key: string       // stabiler Schlüssel für die Wert-Speicherung
  label: string     // z.B. "Sitzhöhe"
  records: string   // was man einträgt, z.B. "Lochnummer 1–8"
  hint?: string     // kurzer Einstell-Tipp
}

export const machineAdjustments: Record<string, MachineAdjustment[]> = {
  "technogym-leg-press": [
    { key: "rueckenlehne-winkel", label: "Rückenlehne-Winkel", records: "Stufe / Winkel in ° (25 / 30 / 35 / 40)", hint: "4 Stufen: flacher (25°) = mehr Hüftbeugung/Glutes, steiler (40°) = mehr Kniebeugung/Quads — immer dieselbe Stufe wählen." },
    { key: "rom-startwinkel-hebel", label: "ROM-Startwinkel (Hebel)", records: "Position des ROM-Hebels (Stufe)", hint: "Über die Aktivierungstaste im Sitzen einstellen — legt fest, wie weit der Sitz vorne startet (Einstiegs-/Startabstand zur Fußplatte)." },
    { key: "rom-begrenzung-beugeti", label: "ROM-Begrenzung (Beugetiefe)", records: "Stufe 1-5", hint: "5 Stufen begrenzen die maximale Beugung — gleiche Stufe sichert konstante Tiefe und schützt vor zu tiefer Kniebeugung." },
    { key: "sitzposition", label: "Sitzposition", records: "Position / Lochnummer (gasdruckunterstützt)", hint: "Sitz so einstellen, dass Knie im gebeugten Zustand etwa 90° erreichen, Rücken bleibt an der Lehne." },
  ],
  "technogym-chest-press": [
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Lochnummer / Stufe auf der Skala", hint: "So einstellen, dass die Griffe etwa auf Höhe der unteren Brust/Achselhöhe liegen und die Handgelenke gerade bleiben." },
    { key: "griffwahl", label: "Griffwahl", records: "Position: vertikaler oder horizontaler Griff", hint: "Vertikaler Griff = mehr Brustfokus/schulterschonender, horizontaler = breiter; immer denselben Griff für vergleichbare Last wählen." },
  ],
  "technogym-abdominal-crunch": [
    { key: "griffposition-schulter", label: "Griffposition Schultergurte/-pads", records: "Position (oben/Mitte/unten)", hint: "Die Schultergurte haben mehrere Griffpositionen je nach Körpergröße und gewünschtem Bewegungsumfang - immer dieselbe wählen." },
    { key: "fussstuetze-oben-unten", label: "Fußstütze (oben/unten)", records: "obere oder untere Stufe", hint: "Die Doppel-Fußstütze hat zwei Höhen für unterschiedliche Beinlängen - so wählen, dass die Hüftbeuger nicht mitziehen." },
    { key: "rom-startposition-fall", label: "ROM-/Startposition (falls vorhanden)", records: "Stufe / Lochnummer", hint: "Nur falls dein Gerät einen ROM-Hebel/Pin am Drehpunkt hat - Startwinkel der Vorbeugung festlegen; viele Selection-Crunch haben das nicht." },
  ],
  "technogym-lower-back": [
    { key: "rom-startwinkel-begren", label: "ROM-/Startwinkel-Begrenzung", records: "Lochnummer / Stufe am Hebel (z.B. 1-6)", hint: "Startposition so wählen, dass der Rumpf leicht gebeugt startet, ohne die Lendenwirbel zu überstrecken." },
    { key: "sitz-rueckenpolster-po", label: "Sitz-/Rückenpolster-Position", records: "Lochnummer der Sitztiefe (z.B. 1-5)", hint: "So einstellen, dass das Drehgelenk der Maschine auf Höhe deiner Hüfte/Lendenwirbel liegt." },
    { key: "beinpolster-oberschenk", label: "Beinpolster / Oberschenkel-Fixierung", records: "Lochnummer oder Stufe (z.B. 1-4)", hint: "Polster fest über die Oberschenkel klemmen, damit das Becken fixiert ist und nur der Rumpf arbeitet." },
  ],
  "technogym-leg-extension": [
    { key: "rueckenlehne-sitztiefe", label: "Rückenlehne / Sitztiefe", records: "Lochnummer bzw. Position 1-8", hint: "Kniegelenk muss exakt auf der Drehachse des Hebelarms liegen — Rücken fest anlehnen, dann Tiefe wählen." },
    { key: "schienbein-fusspolster", label: "Schienbein-/Fußpolster-Länge", records: "Lochnummer bzw. Stufe", hint: "Polster sitzt knapp oberhalb des Fußrists (am unteren Schienbein), nicht auf dem Spann." },
    { key: "start-rom-begrenzung-s", label: "Start-/ROM-Begrenzung (Startwinkel)", records: "Stufe bzw. Lochnummer", hint: "Startwinkel so wählen, dass die Knie zu Beginn nicht über 90° hinaus gebeugt werden — schont die Kniescheibe." },
  ],
  "technogym-adductor": [
    { key: "start-rom-begrenzung-b", label: "Start-/ROM-Begrenzung (Beinspreizung)", records: "Stufe/Position des Hebels (z.B. 1-5)", hint: "Der gelbe Hebel vorne stellt ein, wie weit die Beine zu Beginn gespreizt starten - so weit wählen, dass du einen guten Dehnreiz spürst, aber keinen Schmerz in der Leiste." },
    { key: "sitzposition-beinpolst", label: "Sitzposition / Beinpolster-Abstand", records: "Lochnummer/Stufe der Polster-Verriegelung", hint: "Die Innenschenkel sollen flächig an den Polstern anliegen, Knie etwa hüftbreit - immer gleiche Stufe nutzen." },
  ],
  "technogym-abductor": [
    { key: "start-rom-hebel-beinpo", label: "Start-/ROM-Hebel (Beinpolster-Startposition)", records: "Stufe/Lochnummer des gelben Hebels", hint: "Legt fest, wie weit die Beine zu Beginn geschlossen stehen - groesserer Dehnungs-Start = mehr Range, aber nur so weit, wie es schmerzfrei ist." },
    { key: "sitzposition-beinpolst", label: "Sitzposition / Beinpolster-Breite", records: "Position der Beinpolster (innen/aussen) bzw. eingestellte Stufe", hint: "Polster sollten aussen an den Knien/Oberschenkeln anliegen, ohne dass die Huefte schon zu Beginn ueberdehnt." },
  ],
  "technogym-vertical-traction": [
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Lochnummer / Stufe (z.B. 1-8)", hint: "Hebel/Pin vorne unter dem Sitz (gelber Griff) so wählen, dass du die Griffe oben gut erreichst und am Ende des Zugs leicht gestreckt bleibst." },
    { key: "beinpolster-position", label: "Beinpolster-Position", records: "Lochnummer / Stufe oder Position vorne/hinten", hint: "Oberschenkelpolster so einstellen, dass es die Beine fest fixiert und der Körper beim Ziehen nicht nach oben gerissen wird." },
    { key: "griffwahl", label: "Griffwahl", records: "weit/eng bzw. neutral/proniert", hint: "Keine echte Verstellung, aber notieren welche der Mehrfachgriffe du nutzt, damit der Reiz konstant bleibt." },
  ],
  "technogym-pectoral": [
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Lochnummer/Stufe (z.B. 1-6)", hint: "So einstellen, dass die Hebelpolster etwa auf Brust-/Schulterhöhe liegen und die Oberarme parallel zum Boden sind." },
    { key: "start-rom-position-der", label: "Start-/ROM-Position der Arme", records: "Stufe der Startwinkel-Begrenzung (z.B. 1-4)", hint: "Über den Pin/Hebel am Hebelarm den Startwinkel setzen — nur so weit Dehnung zulassen, dass die Schultern nicht nach hinten überdehnt werden." },
  ],
  "technogym-upper-back": [
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Lochnummer / Stufe (z.B. 1-6)", hint: "So einstellen, dass die Arme/Griffe auf Schulterhöhe liegen und die Ellbogen leicht unter Schulterniveau bleiben." },
    { key: "brustpolster-position", label: "Brustpolster-Position (Tiefe)", records: "Lochnummer / Stufe der vorderen Polster-Verstellung", hint: "Brust liegt satt am Polster an, Arme können knapp vor dem Körper zusammenkommen ohne dass die Schultern nach vorne kippen." },
    { key: "start-rom-position-der", label: "Start-/ROM-Position der Armhebel", records: "Lochnummer / Stufe der Startwinkel-Verstellung (z.B. 1-4)", hint: "Vordere Startposition so wählen, dass im Anfang ein leichter Dehnreiz auf der Brust entsteht, aber die Schulter nicht überstreckt wird." },
    { key: "griff-armpolster-posit", label: "Griff-/Armpolster-Position", records: "Position vorne/hinten bzw. Griff- vs. Polster-Variante", hint: "Immer dieselbe Griffvariante nutzen, damit Hebelweg und Belastung der Schulter konstant bleiben." },
  ],
  "technogym-low-row": [
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Lochnummer/Stufe oder Höhenmarkierung", hint: "Hebel unter dem Sitz ziehen und so einstellen, dass das Brustpolster mittig auf dem Brustbein liegt; zum Hochstellen aufstehen, zum Runterstellen mit Körpergewicht absenken." },
  ],
  "technogym-leg-curl": [
    { key: "rueckenlehne-sitztiefe", label: "Rückenlehne / Sitztiefe", records: "Lochnummer / Stufe (z.B. 1-6)", hint: "So einstellen, dass die Kniegelenkachse exakt mit der Drehachse (Cam) der Maschine fluchtet." },
    { key: "beinpolster-laenge-fus", label: "Beinpolster-Länge (Fußrolle)", records: "Lochnummer / Stufe der Teleskopstange", hint: "Die Wadenrolle sitzt knapp oberhalb der Achillessehne/über dem Knöchel, nicht auf der Ferse." },
    { key: "oberschenkel-haltepols", label: "Oberschenkel-Haltepolster", records: "Lochnummer / Stufe der Höhe", hint: "Polster fest auf die Oberschenkel absenken, damit das Becken beim Beugen nicht abhebt." },
    { key: "rom-startwinkel-begren", label: "ROM-/Startwinkel-Begrenzung", records: "Stufe / Position des Begrenzungshebels", hint: "Startwinkel so wählen, dass die Knie nicht überstreckt starten und die volle Beugung erreicht wird." },
  ],
  "bh-l030-lying-leg-curl": [
    { key: "beinpolster-position-k", label: "Beinpolster-Position (Knöchelrolle)", records: "Lochnummer / Stufe der Polster-Verschiebung", hint: "Knöchelrolle so einstellen, dass sie knapp oberhalb der Ferse an der Achillessehne anliegt, nicht auf der Wade." },
    { key: "vordehnung-rom-begrenz", label: "Vordehnung / ROM-Begrenzung", records: "Stufe / Position des Vordehn-Verstellers (gelber Hebel)", hint: "Startposition so wählen, dass die Beine fast gestreckt unter leichter Vorspannung der hinteren Oberschenkel beginnen." },
  ],
  "bh-pl300-seated-row": [
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Höhen-Position bzw. Hebel-Raste (Skala/Stufe)", hint: "Pneumatik-Hebel (gelb) unter dem Sitz ziehen, hochkommen und absenken, bis die Hände auf Höhe des unteren Brustkorbs ziehen und das Brustpolster mittig auf der Brust sitzt." },
    { key: "griffwahl-am-mehrposit", label: "Griffwahl am Mehrpositions-Lenker", records: "Welcher Griff: enger/vertikaler Innengriff oder breiter/horizontaler Außengriff", hint: "Immer denselben Griff nutzen — vertikaler Griff = neutraler Zug (mehr unterer Rücken/Lat), horizontaler Griff = breiter Zug (mehr oberer Rücken)." },
  ],
  "bh-pl110-lat-pulley": [
    { key: "beinpolster-hoehe-ober", label: "Beinpolster-Höhe (Oberschenkel-Pad)", records: "Lochnummer / Stufe des Pop-Pins (z.B. 1-6)", hint: "Pad so einstellen, dass die Oberschenkel fest fixiert sind und der Körper beim Ziehen nicht vom Sitz abhebt — dann arbeitet wirklich der Rücken." },
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Stufe / Position (pneumatischer Hebel)", hint: "So hoch, dass die ausgestreckten Arme oben die Griffe gerade fassen und das Polster bequem auf den Oberschenkeln liegt." },
    { key: "griff-hebelarm-seite-l", label: "Griff-/Hebelarm-Seite (links/rechts)", records: "Symmetrische Sitzposition mittig — gleiche Armhaltung bei beiden Hebeln", hint: "Mittig setzen, beide unabhängigen Hebelarme gleich greifen — wichtig für gleichmäßige Belastung, da die Arme einzeln pivotieren." },
  ],
  "bh-pl700-leg-press": [
    { key: "sitz-rueckenlehnen-pos", label: "Sitz-/Rückenlehnen-Position", records: "Lochnummer / Raste der Sitzschiene (z.B. 1-6)", hint: "Mit dem gelben Pop-Pin unten links einstellen: weiter weg = größere Tiefe/ROM, näher dran = kürzerer Weg und mehr Schutz fürs Knie. Immer dieselbe Raste wählen." },
    { key: "fussposition-auf-der-p", label: "Fußposition auf der Platte", records: "Höhe (hoch/mitte/tief) und Stand-Breite (schmal/schulterbreit/weit)", hint: "Höher = mehr Gesäß/Beinbeuger, tiefer = mehr Quadrizeps. Markante Stelle auf der Riffelplatte merken, damit jede Einheit gleich ist." },
  ],
  "bh-pl200-hack-squat": [
    { key: "sicherheits-start-stop", label: "Sicherheits-/Start-Stopp-Position", records: "Lochnummer / Raststufe der Sicherheitsklinke", hint: "Pull-Pin bzw. Dreh-Hebel auf die gewohnte Rast setzen, damit Startposition und Tiefe jede Einheit gleich sind." },
    { key: "rom-tiefenbegrenzung-u", label: "ROM-/Tiefenbegrenzung (untere Stops)", records: "Lochnummer der unteren Anschläge", hint: "Tiefste Stufe nutzen, die deine Knie/Schultern schmerzfrei zulassen - immer dieselbe Stufe einstellen." },
    { key: "fussposition-auf-der-f", label: "Fußposition auf der Fußplatte", records: "Position hoch/tief und Standbreite (z.B. Markierung/Lochreihe der Platte)", hint: "Fersen auf gleicher Höhe und Breite platzieren - hoch = mehr Gesaess, tief = mehr Quadrizeps; konstant halten." },
    { key: "schulterpolster-schlit", label: "Schulterpolster-/Schlitten-Startrast", records: "Raststufe, in der der Schlitten beim Einsteigen verriegelt wird", hint: "Immer in derselben Rast einsteigen, damit die Schulterpolster bei gleicher Beugung sitzen." },
  ],
  "bh-pl320-belt-squat": [
    { key: "gurt-anlenkpunkt-rom", label: "Gurt-Anlenkpunkt (ROM)", records: "Lochnummer 1-3 am Hebelarm-Verbinder", hint: "Die sichtbare 3-Loch-Lasche am Hebelarm bestimmt Starthoehe und Bewegungsumfang - immer dasselbe Loch waehlen." },
    { key: "gurt-befestigungspunkt", label: "Gurt-Befestigungspunkt", records: "Einhaengepunkt 1-3 am Hebelarm", hint: "BH PL320 hat 3 Gurt-Einhaengepunkte; tieferer Punkt = mehr Tiefe/anderer Muskel-Fokus." },
    { key: "hueftguertel-sitz", label: "Hueftguertel-Sitz", records: "Gurt-Lochstufe / Sitz auf Beckenkamm", hint: "Guertel knapp ueber den Hueftknochen schnallen und Lochstufe merken, sonst rutscht die Last." },
    { key: "fussposition-auf-platt", label: "Fussposition auf Plattform", records: "Standbreite + Position vorne/hinten (Markierung)", hint: "Auf den beiden Trittflaechen denselben Standpunkt nutzen - aendert Knie- vs. Hueftbelastung." },
  ],
  "bh-pl340-hip-thrust": [
    { key: "sitzposition-hebel", label: "Sitzposition (Hebel)", records: "Lochnummer/Stufe am Sitz-Hebel", hint: "Per gelbem Hebel unter dem Sitz einstellen, bis das Hüftpolster genau auf dem Beckenkamm liegt und das Schienbein bei abgelegter Hüfte senkrecht steht." },
    { key: "hueftpolster-lap-pad-h", label: "Hüftpolster / Lap-Pad-Höhe", records: "Lochnummer/Stufe der Polster-Verstellung", hint: "So einstellen, dass das gepolsterte Hüftpolster direkt über der Hüfte sitzt und in der Endposition volle Hüftstreckung ohne Hohlkreuz erlaubt." },
    { key: "rueckenpolster-schulte", label: "Rückenpolster / Schulterauflage", records: "Position vorne/hinten bzw. Lochnummer", hint: "Schulterauflage so wählen, dass die Schulterblätter aufliegen und der Oberkörper am tiefsten Punkt etwa horizontal kippt." },
  ],
  "bh-pl330-rear-kick": [
    { key: "brustpolster-hoehe-tor", label: "Brustpolster-Höhe (Torso-Stütze)", records: "Lochnummer / Stufe am Verstellrohr", hint: "So einstellen, dass die Hüfte frei auf Höhe der Hebel-Drehachse liegt und der Oberkörper bequem aufliegt – das ist der wichtigste Wert für gleiche Hebelmechanik." },
    { key: "fusspolster-hebel-star", label: "Fußpolster-/Hebel-Startposition", records: "Lochnummer / Stufe der Pendelarm-Begrenzung", hint: "Begrenzt den Bewegungsumfang nach vorne; gleiche Startposition sorgt für identische ROM und gleiche Dehnung im Anfang." },
    { key: "handgriff-position", label: "Handgriff-Position", records: "Position / Stufe falls verstellbar", hint: "Griffe so wählen, dass der Stand stabil und aufrecht bleibt – nur notieren, wenn sie wirklich verstellbar sind." },
  ],
  "bh-pl210-seated-calf": [
    { key: "knie-oberschenkelpolst", label: "Knie-/Oberschenkelpolster-Höhe", records: "Lochnummer / Stufe des Pop-Pins", hint: "Polster so einstellen, dass es bei aufrechtem Oberkörper satt oberhalb der Knie auf den unteren Oberschenkeln sitzt - nicht auf der Kniescheibe." },
    { key: "fussballen-position-au", label: "Fußballen-Position auf der Fußplatte", records: "Position vorne/mittig (kein Gerätewert, nur Merkhilfe)", hint: "Nur die Fußballen auf die Trittstange, Fersen frei nach unten hängen lassen fuer vollen ROM." },
  ],
  "bh-l410-rear-deltoid": [
    { key: "startposition-arme-heb", label: "Startposition Arme (Hebelarm-Pin)", records: "Lochnummer/Stufe des gelben Pop-Pins am oberen Rahmen", hint: "Arme so weit nach vorne stellen, dass die Schultern beim Start leicht gedehnt sind, aber kein Zug im Schultergelenk entsteht - bei Arthrose nicht zu weit vorne starten." },
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Lochnummer/Stufe am Sitz-Schnellverstellhebel", hint: "So einstellen, dass die Griffe/Arme auf Schulterhöhe sind und die Oberarme beim Ziehen parallel zum Boden bleiben - so trifft die Last die hintere Schulter, nicht den Nacken." },
    { key: "brustpolster-tiefe", label: "Brustpolster-Tiefe", records: "Lochnummer/Position des verstellbaren Brust-/Stützpolsters (falls vorhanden)", hint: "Polster so nah einstellen, dass die Brust anliegt und die Arme bei gestreckten/leicht gebeugten Ellbogen die Griffe gut erreichen." },
  ],
  "bh-l080-chest-shoulder": [
    { key: "backrest-winkel-funkti", label: "Backrest-Winkel / Funktion", records: "Position 1-4 bzw. Winkel 0-90° (Brust-/Schulterdrücken)", hint: "Schräges Brustdrücken = mittlere Neigung, Schulterdrücken = aufrecht (90°). Immer dieselbe Position für vergleichbare Sätze wählen." },
    { key: "sitzhoehe", label: "Sitzhöhe", records: "Lochnummer/Stufe am gelben Pop-Pin", hint: "So einstellen, dass die Griffe auf Höhe der oberen Brust/Schlüsselbein liegen und Handgelenke gerade bleiben." },
    { key: "trainingsarm-startposi", label: "Trainingsarm / Startposition", records: "Position 1-4 des verstellbaren Hebelarms", hint: "Legt den Startwinkel und damit die Bewegungsamplitude fest - kürzer für mehr Schulterschonung, länger für vollen ROM." },
  ],
  "bh-l010-leg-extension": [
    { key: "rueckenlehne-sitztiefe", label: "Rückenlehne / Sitztiefe", records: "Lochnummer / Stufe (laut Skala am Schnellverstell-Hebel)", hint: "So einstellen, dass dein Knie-Drehpunkt genau auf der Drehachse der Maschine (Cam) liegt — Rücken liegt voll an." },
    { key: "beinpolster-position-s", label: "Beinpolster-Position (Schienbein)", records: "Lochnummer / Stufe am Pop-Pin der Polsterstange", hint: "Polster liegt knapp oberhalb des Fußgelenks/auf dem unteren Schienbein, nicht auf dem Spann." },
    { key: "pre-stretch-rom-startw", label: "Pre-Stretch / ROM-Startwinkel", records: "Stufe / Lochnummer der Vordehnungs-Verstellung", hint: "Startwinkel knieschonend wählen — bei Beschwerden Beuge-Stretch nicht zu tief stellen." },
  ],
  "bh-l480-multistation": [
    { key: "kabel-anhaengehoehe-an", label: "Kabel-Anhängehöhe / Ansatzpunkt", records: "Karabiner-Position (oben/Mitte/unten) bzw. Loch- oder Schienen-Nummer", hint: "Bei Trizeps/Bizeps/Face Pull immer gleiche Höhe einhängen, damit der Zugwinkel identisch bleibt." },
    { key: "griff-aufsatz", label: "Griff/Aufsatz", records: "Welcher Aufsatz: Strick, Einzelgriff, V-Bar, Stange", hint: "Aufsatz notieren — Strick für Trizeps/Face Pull, Stange für Bizeps; gleicher Aufsatz = vergleichbare Last." },
    { key: "rollenpolster-hoehe-be", label: "Rollenpolster-Höhe (Bein-/Sitzstation)", records: "Lochnummer/Stufe der Beinpolster-Rolle", hint: "Polster so einstellen, dass es am unteren Schienbein bzw. Oberschenkel sitzt — gleiche Stufe jedes Mal." },
    { key: "steh-sitzposition-zum", label: "Steh-/Sitzposition zum Turm", records: "Abstand bzw. Position: nah/mittel/weit am Geräteturm", hint: "Fußposition merken (z.B. Fußspitzen an der Markierung), damit Kabelvorspannung und ROM konstant sind." },
  ],
  "kurzhanteln": [
    { key: "bankwinkel-rueckenlehn", label: "Bankwinkel (Rückenlehne)", records: "Lochnummer bzw. Winkel in ° (z.B. flach / 30° / 45° / 60° / 90°)", hint: "Wichtigste Einstellung: gleiche Lochstufe = gleicher Reizwinkel. Für Schrägbankdrücken meist 30-45°." },
    { key: "sitzpolster-winkel", label: "Sitzpolster-Winkel", records: "Lochnummer / Stufe des Sitzpolsters", hint: "Bei steilen Winkeln das Sitzpolster leicht anstellen, damit du nicht von der Bank rutschst - Stufe notieren." },
  ],
}

/** machineId aus einem Equipment-Bildpfad ableiten ('/images/equipment/x.jpg' → 'x'). */
export function machineIdFromImage(image: string): string {
  const base = image.split('/').pop() || ''
  return base.replace(/\.(jpe?g|png|svg)$/i, '')
}

export function getMachineAdjustments(image: string): MachineAdjustment[] {
  return machineAdjustments[machineIdFromImage(image)] ?? []
}
