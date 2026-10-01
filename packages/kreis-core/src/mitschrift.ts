// Die Mitschrift (Spec video, "Mitschrift"): wer wann wie lange was sagte.
//
// Timo, 01.10.2026: "da steht der Name drin, wenn man was spricht … wenn
// jemand anders spricht, muss das System erkennen, jetzt spricht der … und
// auch die Zeiten … wie lang … dass wir das messen."
//
// Jeder Browser schreibt nur sein eigenes Mikrofon mit; darum stimmt der Name
// von selbst. Hier liegt, was dafuer ohne Oberflaeche geht: der Waechter, der
// Sprache von Stille trennt, die Redezeiten und das Protokoll als Datei.

/** Eine Zeile der Mitschrift: Name, Beginn und Ende (ms seit 1970), Text. */
export interface MitschriftZeile {
  name: string
  text: string
  wann: number
  bis?: number
  vorlaeufig?: boolean
}

// --- Der Waechter: wann spricht mein Mensch -----------------------------------

export interface WaechterEinstellung {
  /** Pegel (RMS), unter dem nie Sprache gilt. */
  schwelleMin: number
  /** Um so viel muss die Sprache ueber dem Grundrauschen liegen. */
  ueberRauschen: number
  /** So lange muss es laut sein, bis ein Abschnitt beginnt. */
  anMs: number
  /** So lange Stille beendet einen Abschnitt. */
  ausMs: number
  /** Laenger wird kein Abschnitt; dann wird geschnitten und weiter gehoert. */
  maxMs: number
  /** Kuerzere Abschnitte (Huesteln, Klopfen) fallen weg. */
  minMs: number
}

export const WAECHTER_STANDARD: WaechterEinstellung = {
  schwelleMin: 0.012, // wie im Redekreis (PEGEL_SCHWELLE)
  ueberRauschen: 2.5,
  anMs: 200,
  ausMs: 900,
  maxMs: 25_000,
  minMs: 500,
}

export interface WaechterZustand {
  /** Seit wann der laufende Abschnitt geht, `null` in der Stille. */
  seit: number | null
  /** Laut am Stueck, noch vor dem Beginn. */
  lautMs: number
  /** Still am Stueck, im Abschnitt. */
  stillMs: number
  /** Gleitendes Grundrauschen. */
  rauschen: number
}

export type WaechterEreignis =
  | { art: "beginn"; wann: number }
  /** `behalten`: lang genug, um erkannt zu werden. `weiter`: geschnitten, es geht nahtlos weiter. */
  | { art: "ende"; beginn: number; ende: number; behalten: boolean; weiter: boolean }

export const waechterNeu = (): WaechterZustand => ({ seit: null, lautMs: 0, stillMs: 0, rauschen: 0.004 })

/**
 * Ein Block Ton (Pegel und Laenge) geht durch den Waechter. `jetzt` ist das
 * Ende des Blocks. Gibt den neuen Zustand und hoechstens ein Ereignis.
 */
export function waechterSchritt(
  z: WaechterZustand, pegel: number, blockMs: number, jetzt: number,
  e: WaechterEinstellung = WAECHTER_STANDARD,
): { zustand: WaechterZustand; ereignis?: WaechterEreignis } {
  const schwelle = Math.max(e.schwelleMin, z.rauschen * e.ueberRauschen)
  const laut = pegel > schwelle

  if (z.seit === null) {
    // In der Stille lernt der Waechter das Grundrauschen, langsam.
    const rauschen = laut ? z.rauschen : z.rauschen * 0.95 + pegel * 0.05
    const lautMs = laut ? z.lautMs + blockMs : 0
    if (lautMs >= e.anMs) {
      const wann = jetzt - lautMs
      return { zustand: { seit: wann, lautMs: 0, stillMs: 0, rauschen }, ereignis: { art: "beginn", wann } }
    }
    return { zustand: { ...z, lautMs, rauschen } }
  }

  const stillMs = laut ? 0 : z.stillMs + blockMs
  const dauer = jetzt - z.seit
  if (stillMs >= e.ausMs) {
    // Die Stille am Ende gehoert nicht zur Redezeit.
    const ende = jetzt - stillMs
    return {
      zustand: { seit: null, lautMs: 0, stillMs: 0, rauschen: z.rauschen },
      ereignis: { art: "ende", beginn: z.seit, ende, behalten: ende - z.seit >= e.minMs, weiter: false },
    }
  }
  if (dauer >= e.maxMs) {
    return {
      zustand: { seit: jetzt, lautMs: 0, stillMs: 0, rauschen: z.rauschen },
      ereignis: { art: "ende", beginn: z.seit, ende: jetzt, behalten: true, weiter: true },
    }
  }
  return { zustand: { ...z, stillMs } }
}

// --- Messen --------------------------------------------------------------------

/** Wie lange eine Zeile dauerte, in ms (0 ohne Ende). */
export const zeilenDauer = (z: MitschriftZeile): number => (z.bis && z.bis > z.wann ? z.bis - z.wann : 0)

export interface Redezeit { name: string; beitraege: number; ms: number; anteil: number }

/** Redezeit je Mensch, die meiste zuerst. Vorlaeufige Zeilen zaehlen nicht. */
export function redezeiten(zeilen: readonly MitschriftZeile[]): Redezeit[] {
  const je = new Map<string, { beitraege: number; ms: number }>()
  for (const z of zeilen) {
    if (z.vorlaeufig) continue
    const bisher = je.get(z.name) ?? { beitraege: 0, ms: 0 }
    je.set(z.name, { beitraege: bisher.beitraege + 1, ms: bisher.ms + zeilenDauer(z) })
  }
  const gesamt = [...je.values()].reduce((s, w) => s + w.ms, 0)
  return [...je.entries()]
    .map(([name, w]) => ({ name, ...w, anteil: gesamt ? w.ms / gesamt : 0 }))
    .sort((a, b) => b.ms - a.ms || a.name.localeCompare(b.name))
}

/** "0:42", "12:05", "1:02:09". */
export function dauerText(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`
}

const uhr = (ms: number, zone?: string) =>
  new Date(ms).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: zone })

// --- Die Datei -----------------------------------------------------------------

export interface ProtokollKopf {
  /** Titel des Raums, etwa der Name der Gruppe. */
  raum: string
  /** Wer im Raum war, auch wer nichts sagte. */
  teilnehmer?: readonly string[]
  /** Zeitzone fuer die Uhrzeiten; ohne sie die des Geraets. */
  zone?: string
}

/**
 * Das Protokoll als Markdown: Kopf, jede Zeile mit Name, Uhrzeit von bis und
 * Dauer, am Ende die Redezeiten. So liegt es als Beitrag im Space und als Datei.
 */
export function protokollMarkdown(zeilen: readonly MitschriftZeile[], kopf: ProtokollKopf): string {
  const fest = zeilen.filter((z) => !z.vorlaeufig && z.text.trim()).slice().sort((a, b) => a.wann - b.wann)
  const datum = new Date(fest[0]?.wann ?? Date.now()).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: kopf.zone })
  const aus: string[] = [`# Protokoll ${kopf.raum}, ${datum}`, ""]
  if (fest.length) {
    const von = fest[0].wann
    const bis = Math.max(...fest.map((z) => z.bis ?? z.wann))
    aus.push(`**Zeit:** ${uhr(von, kopf.zone)} bis ${uhr(bis, kopf.zone)} (${dauerText(bis - von)})`)
  }
  if (kopf.teilnehmer?.length) aus.push(`**Dabei:** ${[...kopf.teilnehmer].join(", ")}`)
  aus.push("", "## Verlauf", "")
  if (!fest.length) aus.push("_Noch nichts gesagt._", "")
  for (const z of fest) {
    const zeit = z.bis ? `${uhr(z.wann, kopf.zone)} bis ${uhr(z.bis, kopf.zone)} · ${dauerText(zeilenDauer(z))}` : uhr(z.wann, kopf.zone)
    aus.push(`**${z.name}** · ${zeit}  `, z.text.trim(), "")
  }
  const rz = redezeiten(fest)
  if (rz.length) {
    aus.push("## Redezeit", "", "| Name | Beiträge | Redezeit | Anteil |", "|---|---:|---:|---:|")
    for (const r of rz) aus.push(`| ${r.name} | ${r.beitraege} | ${dauerText(r.ms)} | ${Math.round(r.anteil * 100)} % |`)
    aus.push("")
  }
  return aus.join("\n")
}
