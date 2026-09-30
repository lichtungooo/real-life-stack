/** Die Knoepfe ueber dem Textdokument: aus Text und Auswahl wird eine Aenderung. */
import { describe, expect, it } from "vitest"
import { dokumentTitel, formatieren, type Aenderung } from "../src/video/markdown-werkzeug"

const anwenden = (text: string, a: Aenderung) => text.slice(0, a.von) + a.einfuegen + text.slice(a.bis)

describe("Umschliessen", () => {
  it("fett um die Auswahl, und wieder weg", () => {
    const t = "Hallo Welt"
    const a = formatieren(t, 6, 10, "fett")
    const neu = anwenden(t, a)
    expect(neu).toBe("Hallo **Welt**")
    expect(neu.slice(a.auswahl.von, a.auswahl.bis)).toBe("Welt")
    expect(anwenden(neu, formatieren(neu, 6, 14, "fett"))).toBe("Hallo Welt")
  })

  it("ohne Auswahl ein Platzhalter, der ausgewaehlt ist", () => {
    const a = formatieren("", 0, 0, "kursiv")
    expect(a.einfuegen).toBe("*kursiv*")
    expect(a.auswahl).toEqual({ von: 1, bis: 7 })
  })

  it("mehrzeiliger Code wird ein Block", () => {
    expect(formatieren("a\nb", 0, 3, "code").einfuegen).toBe("```\na\nb\n```")
  })

  it("Link mit dem Wort als Text, die Adresse ausgewaehlt", () => {
    const t = "siehe hier"
    const a = formatieren(t, 6, 10, "link")
    const neu = anwenden(t, a)
    expect(neu).toBe("siehe [hier](https://)")
    expect(neu.slice(a.auswahl.von, a.auswahl.bis)).toBe("https://")
  })
})

describe("Zeilen", () => {
  it("Ueberschrift an der Zeile des Cursors, eine andere wird ersetzt, dieselbe aufgehoben", () => {
    const t = "Eins\nZwei\nDrei"
    const h1 = anwenden(t, formatieren(t, 6, 6, "h1"))
    expect(h1).toBe("Eins\n# Zwei\nDrei")
    const h2 = anwenden(h1, formatieren(h1, 7, 7, "h2"))
    expect(h2).toBe("Eins\n## Zwei\nDrei")
    expect(anwenden(h2, formatieren(h2, 7, 7, "h2"))).toBe("Eins\nZwei\nDrei")
  })

  it("Liste und Aufgaben ueber mehrere Zeilen", () => {
    const t = "a\nb\nc"
    expect(anwenden(t, formatieren(t, 0, 5, "liste"))).toBe("- a\n- b\n- c")
    expect(anwenden(t, formatieren(t, 2, 3, "aufgabe"))).toBe("a\n- [ ] b\nc")
  })

  it("Tabelle auf eigener Zeile", () => {
    expect(formatieren("Text", 4, 4, "tabelle").einfuegen.startsWith("\n\n| Spalte 1")).toBe(true)
  })
})

describe("Titel des Dokuments", () => {
  it("erste Ueberschrift, sonst erste Zeile, sonst Ersatz", () => {
    expect(dokumentTitel("Vorwort\n# Ergebnisse vom Kreis\n", "X")).toBe("Ergebnisse vom Kreis")
    expect(dokumentTitel("\n- Punkt eins\n", "X")).toBe("Punkt eins")
    expect(dokumentTitel("  ", "Dokument Garten")).toBe("Dokument Garten")
  })
})
