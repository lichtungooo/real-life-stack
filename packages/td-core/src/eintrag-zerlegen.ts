// Aus recherchiertem Fließtext werden Felder.
//
// Die 234 Stiftungen tragen ihre Recherche als einen Absatz in `description`:
//
//     "Förderschwerpunkte: jugend, bildung. Förderrahmen: 300 bis 5.000 Euro.
//      Antragsweg: Formular auf der Website, laufend. Zustiftung ist möglich.
//      Website: https://beispiel.de Quelle: Recherche Foerder-Landschaft."
//
// Ein Mensch liest das. Eine Karte zeigt davon nichts, ein Vergleich findet
// nichts, und ein Matching kann damit nicht arbeiten. Darum werden die
// Angaben zu Feldern (siehe `docs/13-profil.md`).
//
// **Die Regel beim Zerlegen:** Was dasteht, wird übernommen. Was fehlt,
// bleibt leer. Nichts wird geraten, nichts ergänzt. Wo das Muster nicht
// greift, bleibt der Text erhalten und die Felder leer (Muster 5).

/** Was aus einem Fließtext gewonnen wurde. */
export interface ZerlegterEintrag {
  /** Die gewonnenen Felder, nach `13-profil.md` benannt. */
  felder: Record<string, unknown>
  /** Was in kein Feld passte. Leer, wenn alles aufgegangen ist. */
  rest: string
}

/**
 * Zeichen, die in der Recherche für "hier steht nichts" stehen.
 *
 * Ein Gedankenstrich ist keine Angabe. Er sieht auf einer Karte aus wie eine
 * Antwort und ist keine: Ein leeres Feld erscheint gar nicht, ein Strich
 * erscheint und sagt nichts.
 */
const PLATZHALTER = new Set(["—", "-", "–", "?", "n/a", "ka", "keine angabe", "unbekannt"])

/**
 * Ist dieser Wert ein Platzhalter?
 *
 * Verglichen wird ohne Punkte und ohne Groß und Klein: Der Satzpunkt am Ende
 * fällt beim Zerlegen weg, und aus "k.A." wird "kA". Ein Vergleich gegen die
 * Schreibweise allein geht daran vorbei.
 */
function istPlatzhalter(wert: string): boolean {
  return PLATZHALTER.has(wert.toLowerCase().replace(/\./g, "").trim())
}

/** Die Sätze, die in jedem Eintrag stehen und keine Angabe tragen. */
const FLOSKELN = [
  "Dieser Eintrag stammt aus öffentlicher Recherche.",
  "Die Stiftung pflegt ihn selbst, sobald sie ihn übernimmt.",
  "Der Punkt zeigt die Stadt, nicht die Anschrift.",
]

/**
 * Eine Zahl aus einem Förderrahmen lesen.
 *
 * "300 bis 5.000 Euro" trägt deutsche Tausenderpunkte. `parseInt` liest
 * daraus 5, nicht 5000: Der Punkt muss weg, bevor gezählt wird.
 */
function zahl(roh: string): number | null {
  const sauber = roh.replace(/\./g, "").replace(/,/g, ".").trim()
  const n = Number.parseFloat(sauber)
  return Number.isFinite(n) ? n : null
}

/**
 * Zerlegt den recherchierten Text einer Stiftung in Felder.
 *
 * Die Muster stammen aus dem Bestand vom 20.09.2026: 100 Prozent tragen
 * "Quelle:", 86 Prozent "Förderschwerpunkte:", 70 Prozent "Antragsweg:".
 */
export function zerlegeEintrag(text: string | null | undefined): ZerlegterEintrag {
  const felder: Record<string, unknown> = {}
  let rest = (text ?? "").trim()
  if (!rest) return { felder, rest: "" }

  // Förderschwerpunkte: eine Liste, mit Komma getrennt, bis zum Punkt.
  const bereiche = rest.match(/Förderschwerpunkte:\s*([^.]+)\./)
  if (bereiche) {
    const liste = bereiche[1]
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
    if (liste.length > 0) felder.foerderbereiche = liste
    rest = rest.replace(bereiche[0], "").trim()
  }

  // Förderrahmen: "300 bis 5.000 Euro" oder "bis 20.000 Euro".
  //
  // Der Ausdruck läuft bis zum Wort "Euro", nicht bis zum nächsten Punkt:
  // Ein deutscher Tausenderpunkt steht mitten in der Zahl, und ein Muster,
  // das dort stoppt, liest aus "20.000 bis 500.000" nichts.
  const rahmen = rest.match(/Förderrahmen:\s*((?:bis\s*)?[\d.,]+(?:\s*bis\s*[\d.,]+)?)\s*Euro\.?/)
  if (rahmen) {
    const spanne = rahmen[1].match(/([\d.,]+)\s*bis\s*([\d.,]+)/)
    if (spanne) {
      const von = zahl(spanne[1])
      const bis = zahl(spanne[2])
      if (von !== null) felder.summeVon = von
      if (bis !== null) felder.summeBis = bis
    } else {
      const nurBis = rahmen[1].match(/bis\s*([\d.,]+)/)
      if (nurBis) {
        const bis = zahl(nurBis[1])
        if (bis !== null) felder.summeBis = bis
      }
    }
    rest = rest.replace(rahmen[0], "").trim()
  }

  // Antragsweg: alles bis zum nächsten bekannten Satzanfang.
  const weg = rest.match(/Antragsweg:\s*(.+?)(?=\s*(?:Zustiftung ist möglich|Website:|Quelle:)|$)/s)
  if (weg) {
    const inhalt = weg[1].replace(/\.\s*$/, "").trim()
    if (inhalt && !istPlatzhalter(inhalt)) felder.antragsweg = inhalt
    rest = rest.replace(weg[0], "").trim()
  }

  // Zustiftung: ein Satz, der eine Möglichkeit nennt.
  if (/Zustiftung ist möglich/.test(rest)) {
    felder.zustiftung = true
    rest = rest.replace(/Zustiftung ist möglich\.?/, "").trim()
  }

  // Website: bis zum Leerzeichen.
  const seite = rest.match(/Website:\s*(https?:\/\/\S+?)(?=\s|$)/)
  if (seite) {
    felder.website = seite[1].replace(/[.,]$/, "")
    rest = rest.replace(seite[0], "").trim()
  }

  // Quelle: bis zum Ende oder bis zur ersten Floskel.
  const quelle = rest.match(/Quelle:\s*(.+?)(?=\s*Dieser Eintrag stammt|$)/s)
  if (quelle) {
    const inhalt = quelle[1].replace(/\.\s*$/, "").trim()
    if (inhalt) felder.quelle = inhalt
    rest = rest.replace(quelle[0], "").trim()
  }

  for (const f of FLOSKELN) {
    rest = rest.replace(f, "").trim()
  }

  // Was übrig bleibt, ist entweder eine echte Beschreibung oder Rauschen.
  // Punkte und Leerzeichen allein zählen als leer.
  rest = rest.replace(/\s+/g, " ").replace(/^[.\s]+|[.\s]+$/g, "").trim()

  return { felder, rest }
}

/**
 * Was ein Sitz aus einer Anschrift verrät.
 *
 * Die Einträge tragen "Karl-Hessenberger-Str. 20, 64354 Reinheim" oder
 * schlicht "Darmstadt". Das Profil zeigt den Sitz, nicht die Hausnummer:
 * Wer eine Stiftung sucht, will die Stadt sehen.
 */
export function sitzAusAnschrift(anschrift: string | null | undefined): string | null {
  const roh = (anschrift ?? "").trim()
  if (!roh) return null

  // "Straße 1, 12345 Stadt" → "Stadt"
  const mitPlz = roh.match(/\b\d{5}\s+(.+)$/)
  if (mitPlz) return mitPlz[1].trim()

  // "Straße 1, Stadt" → "Stadt"
  if (roh.includes(",")) {
    const letzter = roh.split(",").pop()?.trim()
    if (letzter && !/\d/.test(letzter)) return letzter
  }

  // Schon nur eine Stadt.
  return /\d/.test(roh) ? null : roh
}
