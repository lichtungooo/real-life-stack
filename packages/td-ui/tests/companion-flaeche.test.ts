/**
 * Die Begleitung, ohne Oberflaeche geprueft.
 *
 * Geprueft werden die Regeln aus `docs/DEFINITION.md` Teil 13.5 und die
 * beiden Muster, an denen ein Modul am ehesten bricht: eine zweite Liste
 * (Muster 1) und eine Verzweigung ueber den Typ (Muster 4).
 */

import { describe, it, expect } from "vitest"
import type { Item } from "@real-life-stack/data-interface"
import {
  COMPANION_WERKZEUGE,
  ueberblickAus,
  sichtbareWerkzeuge,
  type CompanionWerkzeug,
} from "../src/companion-flaeche.js"

function item(data: Record<string, unknown>, type = "note"): Item {
  return { id: Math.random().toString(36).slice(2), type, data } as unknown as Item
}

describe("Was die Begleitung ueber den Space weiss", () => {
  /**
   * ⚠ Muster 4: Was ein Modul anbieten kann, entscheiden die **Felder**,
   * nie der `type`. Zwei Items mit demselben Feld zaehlen zusammen, auch
   * wenn ihr Typ verschieden ist.
   */
  it("⚠ zaehlt Felder, nicht Typen", () => {
    const ueberblick = ueberblickAus([
      item({ position: { lat: 1, lon: 2 }, titel: "A" }, "stiftung"),
      item({ position: { lat: 3, lon: 4 } }, "projekt"),
      item({ start: "2026-09-19" }, "termin"),
    ])

    expect(ueberblick.eintraege).toBe(3)
    expect(ueberblick.felder).toEqual([
      { feld: "position", anzahl: 2 },
      { feld: "start", anzahl: 1 },
      { feld: "titel", anzahl: 1 },
    ])
  })

  it("sortiert nach Haeufigkeit, bei Gleichstand nach Namen", () => {
    const ueberblick = ueberblickAus([item({ b: 1, a: 1 }), item({ a: 1 })])
    expect(ueberblick.felder.map((f) => f.feld)).toEqual(["a", "b"])
  })

  /**
   * ⚠ `false` und `0` sind Werte. Wer sie wegwirft, verliert genau die
   * Felder, an denen eine Entscheidung haengt. Derselbe Fall wie
   * `feldTraegt` im Kern.
   */
  it("⚠ haelt false und 0 fuer Werte, leer und null nicht", () => {
    const ueberblick = ueberblickAus([
      item({ oeffentlich: false, anzahl: 0, leer: "", nichts: null, fehlt: undefined }),
    ])
    expect(ueberblick.felder.map((f) => f.feld).sort()).toEqual(["anzahl", "oeffentlich"])
  })

  it("kommt mit einem leeren Space zurecht", () => {
    expect(ueberblickAus([])).toEqual({ eintraege: 0, felder: [] })
  })

  it("kommt mit einem Item ohne data zurecht", () => {
    expect(ueberblickAus([{ id: "x", type: "note" } as unknown as Item]).felder).toEqual([])
  })
})

describe("Die Werkzeug-Liste", () => {
  /**
   * ⚠ Muster 1: eine Liste, eine Quelle. Jede Flaeche, die Werkzeuge
   * aufzaehlt, leitet sie aus `COMPANION_WERKZEUGE` ab.
   */
  it("⚠ traegt keine doppelte Kennung", () => {
    const ids = COMPANION_WERKZEUGE.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  /**
   * Regel 2: Ein Werkzeug ohne Beschreibung erscheint nicht. Was ein Mensch
   * nicht lesen kann, gibt er nicht frei.
   */
  it("zeigt kein Werkzeug ohne Beschreibung", () => {
    const stumm: CompanionWerkzeug = {
      id: "stumm",
      name: "Ohne Worte",
      beschreibung: "   ",
      art: "lesend",
    }
    const gezeigt = sichtbareWerkzeuge([...COMPANION_WERKZEUGE, stumm])
    expect(gezeigt.map((w) => w.id)).not.toContain("stumm")
    expect(gezeigt).toHaveLength(COMPANION_WERKZEUGE.length)
  })

  /**
   * ⚠ Regel aus DEFINITION 13.3: Lesend im ersten Schritt. Ein
   * schreibendes Werkzeug bekommt erst dann einen Platz, wenn die Freigabe
   * etwas verlangt, das der Agent nicht hat.
   *
   * Dieser Test faellt, sobald jemand eines hinzufuegt. Das ist der Zweck:
   * Dann gehoert die Freigabe-Regel mit dazu, und dieser Test wird
   * ausdruecklich geaendert statt still uebergangen.
   */
  it("⚠ traegt heute kein schreibendes Werkzeug", () => {
    expect(COMPANION_WERKZEUGE.filter((w) => w.art === "schreibend")).toEqual([])
  })

  it("beschreibt jedes Werkzeug in ganzen Worten", () => {
    for (const w of COMPANION_WERKZEUGE) {
      expect(w.beschreibung.length, `${w.id} braucht eine Beschreibung`).toBeGreaterThan(20)
      expect(w.name.length).toBeGreaterThan(0)
    }
  })
})
