// Kreis — die Typen.
//
// Spec: docs/spec/modules/kreis.md
//
// Zwei Arten von Wissen liegen hier: der **Prozess** ist eine Vorlage und
// damit Daten, die ein Space auch selbst tragen kann; der **Sitzungszustand**
// ist fluechtig und lebt nur, solange Menschen im Raum sind.

/**
 * Was in einem Schritt geschieht.
 *
 * - `stille`: ankommen, atmen, niemand spricht
 * - `offen`: der Redestab liegt in der Mitte, wer den Impuls spuert, nimmt ihn
 * - `reihum`: der Stab wandert von einem zum naechsten im Kreis
 * - `kleingruppen`: der Kreis teilt sich
 * - `pause`: frische Luft
 *
 * Eine unbekannte Art aus einer fremden Vorlage wird wie `offen` gezeigt und
 * bleibt erhalten (Muster: Unbekanntes bleibt erhalten).
 */
export type SchrittArt = "stille" | "offen" | "reihum" | "kleingruppen" | "pause"

export const SCHRITT_ARTEN: readonly SchrittArt[] = ["stille", "offen", "reihum", "kleingruppen", "pause"]

export interface Schritt {
  id: string
  titel: string
  /** Richtwert in Minuten. Die Zeit laeuft sichtbar mit, sie bricht nichts ab. */
  minuten: number
  art: SchrittArt | (string & {})
  /** Was der Kreis in diesem Schritt tut, in zwei, drei Saetzen. */
  anleitung: string
  /** Fragen, die der Schritt stellt. */
  fragen?: readonly string[]
  /** Nur bei `kleingruppen`: wie viele Menschen eine Gruppe ungefaehr hat. */
  gruppenGroesse?: number
}

export interface Prozess {
  id: string
  name: string
  /** Woher der Prozess kommt: Mensch, Buch, Gemeinschaft. */
  herkunft: string
  /** Ein Satz: wofuer. */
  kurz: string
  /** Fuer wen, wann. */
  wofuer: string
  /** Die Empfehlungen, die waehrend des Prozesses sichtbar im Raum haengen. */
  empfehlungen: readonly string[]
  /**
   * Nur wer den Redestab haelt, spricht. Nimmt jemand den Stab, gehen die
   * Mikrofone der anderen aus; das eigene geht an. Jeder kann es jederzeit
   * selbst wieder einschalten, der Stab regelt nur, er sperrt nicht.
   */
  nurStabSpricht: boolean
  /** Wie lange nach der Klangschale Stille herrscht, in Sekunden. */
  stilleSekunden: number
  schritte: readonly Schritt[]
}

/** Wer den Redestab haelt. `halter: null` heisst: er liegt in der Mitte. */
export interface Stab {
  halter: string | null
  name: string | null
  seit: number
}

/**
 * Der Zustand einer Sitzung. Er reist als ganze kleine Nachricht durch den
 * Raum; wer die hoehere Fassung hat, hat recht.
 */
export interface Sitzung {
  /** Fassung. Jede Aenderung zaehlt sie hoch. */
  v: number
  /** Wer die letzte Aenderung schrieb. Entscheidet bei gleicher Fassung. */
  von: string
  prozessId: string | null
  schritt: number
  schrittSeit: number
  stab: Stab
  /** Die Klangschale. `nr` zaehlt jeden Schlag, damit jeder Schlag einmal klingt. */
  schale: { nr: number; von: string | null; stilleBis: number }
  pause: { bis: number } | null
  /** Einteilung in Kleingruppen: Teilnehmer-Id → Gruppe (ab 1). */
  gruppen: Readonly<Record<string, number>> | null
  /**
   * Was in der Mitte der Konferenz liegt, fuer alle: `null` (die Menschen),
   * `"tafel"` oder die Id eines Moduls. Wer etwas in die Mitte legt, legt es
   * fuer alle hinein, wie der Praesentator bei Big Blue Button. Fehlt das Feld
   * (aeltere Fassung), gilt `null`.
   */
  mitte?: string | null
  /** Der Kurzzeitwecker, fuer alle. Fehlt (aeltere Fassung) oder `null`: keiner. */
  wecker?: { bis: number; minuten: number; von: string } | null
  /** Das Los: wer zuletzt gezogen wurde. `nr` zaehlt jeden Zug, damit er einmal erscheint. */
  los?: { nr: number; id: string; name: string; wann: number } | null
  /**
   * Die Regeln des Raums, fuer alle gleich (Einstellungen). Fehlt das Feld
   * (aeltere Fassung): keine Redezeit.
   */
  regeln?: Regeln
  /** Der Gong am Ende einer Redezeit. `nr` zaehlt jeden, damit er einmal klingt. */
  gong?: { nr: number; wann: number } | null
  /**
   * Das Zeichenpad in der Mitte: wer praesentiert und ob alle zeichnen
   * duerfen ("Mehrere Benutzer" wie in Big Blue Button). Fehlt es, zeichnen
   * alle (aeltere Fassung).
   */
  pad?: {
    praesentiert: string
    alle: boolean
    /** Folien aus einer PDF: welche Datei (Id im Raum), ihr Name, wie viele Seiten. */
    folien?: { datei: string; name: string; seiten: number } | null
    /** Die Seite, die alle sehen (ab 1). Ohne Folien die freie Flaeche. */
    seite?: number
  } | null
  /**
   * Ein Layout fuer alle ("Fuer alle aktualisieren" wie in Big Blue Button).
   * `nr` zaehlt jede Uebernahme, damit sie einmal ankommt; danach darf jeder
   * fuer sich wieder umstellen.
   */
  layout?: { art: string; nr: number } | null
  /** Die Tagesordnung des Meetings (siehe tagesordnung.ts). */
  tagesordnung?: import("./tagesordnung").Tagesordnung | null
  /** Die Moderation (siehe moderation.ts). Fehlt sie, ist alles offen. */
  moderation?: Partial<import("./moderation").Moderation> | null
  /** Laufende Gruppenraeume (siehe gruppenraeume.ts). */
  gruppenraeume?: import("./gruppenraeume").Gruppenraeume | null
  /**
   * Das Textdokument in der Mitte: ein ganz normales Item im Space (Antons
   * Entscheidung, 30.09.2026), hier nur seine Id. Geschrieben wird es ueber
   * die Hooks des Stacks.
   */
  dokument?: { item: string } | null
}

/** Was nach Ablauf der Redezeit mit dem Redestab geschieht. */
export type NachDerRedezeit = "weiter" | "mitte"

export interface Regeln {
  /** Redezeit in Minuten, 0 heisst: keine. */
  redezeit: number
  /** `weiter`: an den Naechsten im Kreis. `mitte`: zurueck in die Mitte. */
  danach: NachDerRedezeit
  /** Stille nach der Klangschale in Sekunden. Fehlt sie, gilt die des Prozesses. */
  stille?: number
  /** Wie lange das Treffen dauert, in Minuten. 0 oder fehlend: offen. */
  sitzungsdauer?: number
  /** Seit wann die Sitzungsdauer laeuft (gesetzt, wenn sie festgelegt wird). */
  sitzungSeit?: number
}

export const STANDARD_REGELN: Regeln = { redezeit: 0, danach: "mitte" }

/** Nachrichten, die der Kreis ueber den Daten-Kanal des Raums schickt. */
export type KreisNachricht =
  | { art: "kreis-sitzung"; sitzung: Sitzung }
  | { art: "kreis-frage" }
