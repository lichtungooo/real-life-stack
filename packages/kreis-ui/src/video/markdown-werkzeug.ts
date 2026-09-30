// Die Knoepfe der Leiste ueber dem Textdokument, als reine Funktionen:
// Aus Text und Auswahl wird genau eine Aenderung. So sind sie ohne Editor
// pruefbar, und der Editor wendet sie nur an.

export type Format =
  | "fett" | "kursiv" | "code" | "link"
  | "h1" | "h2" | "liste" | "aufgabe" | "zitat"
  | "tabelle"

export interface Aenderung {
  /** Ersetzt wird der Bereich [von, bis) durch `einfuegen`. */
  von: number
  bis: number
  einfuegen: string
  /** Die Auswahl danach. */
  auswahl: { von: number; bis: number }
}

const ZEILEN_VORSATZ: Partial<Record<Format, string>> = {
  h1: "# ", h2: "## ", liste: "- ", aufgabe: "- [ ] ", zitat: "> ",
}

const UMSCHLIESSEN: Partial<Record<Format, [string, string, string]>> = {
  // [vorne, hinten, Platzhalter ohne Auswahl]
  fett: ["**", "**", "fett"],
  kursiv: ["*", "*", "kursiv"],
  code: ["`", "`", "Code"],
}

export function formatieren(text: string, von: number, bis: number, format: Format): Aenderung {
  const a = Math.min(von, bis), b = Math.max(von, bis)
  const auswahl = text.slice(a, b)

  const u = UMSCHLIESSEN[format]
  if (u) {
    const [vorne, hinten, platz] = u
    // Mehrzeiliger Code wird ein Block.
    if (format === "code" && auswahl.includes("\n")) {
      const block = "```\n" + auswahl + "\n```"
      return { von: a, bis: b, einfuegen: block, auswahl: { von: a + 4, bis: a + 4 + auswahl.length } }
    }
    // Schon umschlossen: aufheben.
    if (auswahl.startsWith(vorne) && auswahl.endsWith(hinten) && auswahl.length >= vorne.length + hinten.length) {
      const innen = auswahl.slice(vorne.length, auswahl.length - hinten.length)
      return { von: a, bis: b, einfuegen: innen, auswahl: { von: a, bis: a + innen.length } }
    }
    const innen = auswahl || platz
    return { von: a, bis: b, einfuegen: vorne + innen + hinten, auswahl: { von: a + vorne.length, bis: a + vorne.length + innen.length } }
  }

  if (format === "link") {
    const wort = auswahl || "Linktext"
    const einfuegen = `[${wort}](https://)`
    const ziel = a + wort.length + 3
    return { von: a, bis: b, einfuegen, auswahl: { von: ziel, bis: ziel + 8 } }
  }

  if (format === "tabelle") {
    const vorher = a > 0 && text[a - 1] !== "\n" ? "\n\n" : ""
    const tabelle = `${vorher}| Spalte 1 | Spalte 2 |\n| --- | --- |\n| | |\n`
    return { von: a, bis: b, einfuegen: tabelle, auswahl: { von: a + vorher.length + 2, bis: a + vorher.length + 10 } }
  }

  // Zeilenweise: der Vorsatz an jeder betroffenen Zeile, oder weg, wenn alle ihn tragen.
  const vorsatz = ZEILEN_VORSATZ[format] ?? ""
  const start = text.lastIndexOf("\n", a - 1) + 1
  const endeZeile = text.indexOf("\n", b)
  const ende = endeZeile === -1 ? text.length : endeZeile
  const zeilen = text.slice(start, ende).split("\n")
  const alleHaben = zeilen.every((z) => z.startsWith(vorsatz))
  // Andere Ueberschrift oder Liste zuerst loesen, damit "# " nicht zu "## # " wird.
  const ohneAlten = (z: string) => z.replace(/^(#{1,6} |- \[[ x]\] |- |> )/, "")
  const neu = zeilen.map((z) => (alleHaben ? z.slice(vorsatz.length) : vorsatz + ohneAlten(z))).join("\n")
  return { von: start, bis: ende, einfuegen: neu, auswahl: { von: start, bis: start + neu.length } }
}

/** Ein Titel fuer das Dokument: die erste Ueberschrift, sonst die erste Zeile. */
export function dokumentTitel(text: string, ersatz: string): string {
  const ueberschrift = text.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim()
  if (ueberschrift) return ueberschrift.slice(0, 120)
  const erste = text.split("\n").map((z) => z.trim()).find(Boolean)
  return (erste ? erste.replace(/^[-*>#\s]+/, "") : ersatz).slice(0, 120) || ersatz
}
