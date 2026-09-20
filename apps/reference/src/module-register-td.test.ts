/**
 * Unsere Schicht im Modul-Register, in unserer eigenen Datei.
 *
 * Antons `module-register.test.ts` prueft seine Regeln. Unsere Regeln stehen
 * hier, weil eine Erwartung von uns in seiner Datei bei jedem Update seiner
 * Tests kollidiert. Das ist der Weg, den `docs/NAEHTE.md` unter D1 als
 * Loesung nennt: zwei getrennte Dateien, eine Quelle je Verantwortung.
 *
 * Geprueft wird die Schicht `trustdonation` aus `module-register.tsx`.
 */

import { describe, it, expect } from "vitest"
import { getModules } from "@real-life-stack/toolkit"
import "./module-register"

describe("Die Schicht trustdonation", () => {
  /**
   * ⚠ Die Begleitung traegt mit Absicht kein `presents`.
   *
   * `presents` sagt, welches Item-Feld in diese Sicht fuehrt: die Karte
   * nennt `position`, der Kalender `start`. Die Begleitung ist keine Sicht
   * auf ein Feld — sie liest die Items, sie zeigt sie nicht. Wer ihr ein
   * Feld gibt, macht sie zur Karte fuer etwas, das es nicht gibt, und ein
   * Item mit diesem Feld landete dann dort statt in seiner Sicht.
   *
   * Steht als Test, weil `presents` das Feld ist, das am haeufigsten
   * nachtraeglich "zur Sicherheit" ergaenzt wird (DEFINITION Teil 13.2).
   */
  it("⚠ gibt der Begleitung kein presents", () => {
    const begleitung = getModules().find((m) => m.id === "companion")
    expect(begleitung, "das Modul companion fehlt im Register").toBeTruthy()
    expect(begleitung?.presents ?? []).toEqual([])
  })

  it("bringt Baukasten und Begleitung mit", () => {
    const ids = getModules().map((m) => m.id)
    for (const id of ["baukasten", "companion"]) {
      expect(ids, `${id} fehlt im Register`).toContain(id)
    }
  })

  /**
   * ⚠ Das Profil ist eine Komponente, kein Modul.
   *
   * Timo am 20.09.2026: *"Es sollte nicht oben in diesem Header-Bereich
   * auftauchen als Profil, sondern rechts."* Ein Reiter ist eine
   * Arbeitsflaeche; ein Profil ist die Identitaetskarte dessen, mit dem man
   * es zu tun hat. Es erscheint im Panel (`views/profil-panel.tsx`), auf der
   * Karte, auf einer Landingpage und in einer Liste (docs/13-profil.md).
   *
   * Steht als Test, weil ein Eintrag im Register zwei Zeilen kostet und die
   * Einordnung still umdreht.
   */
  it("⚠ fuehrt das Profil nicht als Modul", () => {
    const ids = getModules().map((m) => m.id)
    expect(ids, "das Profil gehoert ins Panel, nicht in die Reiterleiste").not.toContain("profil")
  })
})
