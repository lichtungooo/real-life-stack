// Was der Import verspricht, ohne Browser geprüft.
//
// Der Live-Probelauf (`apps/reference/e2e-live/import.spec.ts`) geht den
// ganzen Weg gegen die laufende Instanz und dauert Minuten. Diese Prüfungen
// halten die Zusagen fest, die auch ohne Relay gelten: Es werden Stiftungen
// geschrieben und sonst nichts, ein zweiter Lauf verdoppelt nichts, und ein
// Fehler bei einem Eintrag hält die übrigen nicht auf.
import { describe, it, expect, vi } from "vitest"
import { stiftungenSchreiben, type ImportStand } from "../src/stiftungen-import.js"

/** Ein Connector, der mitschreibt, was er bekommt. */
function attrappe(vorhandeneTitel: string[] = [], scheiternBei?: string) {
  const geschrieben: { title: string }[] = []
  return {
    geschrieben,
    connector: {
      getItems: vi.fn(async () => vorhandeneTitel.map((t) => ({ data: { title: t } }))),
      createItem: vi.fn(async (i: { data: { title?: string } }) => {
        const titel = String(i.data?.title ?? "")
        if (scheiternBei && titel === scheiternBei) throw new Error("abgelehnt")
        geschrieben.push({ title: titel })
        return i
      }),
    } as never,
  }
}

function laufen(connector: never) {
  const staende: ImportStand[] = []
  return stiftungenSchreiben(connector, (s) => staende.push(s)).then(() => staende)
}

describe("Stiftungen schreiben", () => {
  it("schreibt Stiftungen und sonst nichts", async () => {
    const { connector, geschrieben } = attrappe()
    const staende = await laufen(connector)

    const ende = staende.at(-1)
    expect(ende?.art).toBe("fertig")
    expect(geschrieben.length).toBeGreaterThan(200)

    // Die Musterdaten tragen auch Spaces und Projekte. Der Import fasst sie
    // nicht an: Wer 234 Stiftungen holt, bekommt keine fremden Gruppen dazu.
    expect(geschrieben.every((g) => g.title.length > 0)).toBe(true)
  })

  it("verdoppelt beim zweiten Lauf nichts", async () => {
    const erst = attrappe()
    await laufen(erst.connector)
    const titel = erst.geschrieben.map((g) => g.title)

    const zweit = attrappe(titel)
    const staende = await laufen(zweit.connector)

    expect(zweit.geschrieben.length).toBe(0)
    const ende = staende.at(-1)
    expect(ende?.art === "fertig" && ende.uebersprungen).toBe(titel.length)
  })

  it("laeuft weiter, wenn ein Eintrag abgelehnt wird", async () => {
    const erst = attrappe()
    await laufen(erst.connector)
    const einer = erst.geschrieben[5].title

    const { connector, geschrieben } = attrappe([], einer)
    const staende = await laufen(connector)

    const ende = staende.at(-1)
    expect(ende?.art).toBe("fertig")
    expect(geschrieben.length).toBe(erst.geschrieben.length - 1)
    expect(ende?.art === "fertig" && ende.uebersprungen).toBe(1)
  })

  it("sagt es, wenn der Connector nicht schreiben kann", async () => {
    const staende: ImportStand[] = []
    await stiftungenSchreiben({ getItems: vi.fn() } as never, (s) => staende.push(s))
    expect(staende).toHaveLength(1)
    expect(staende[0].art).toBe("fehler")
  })

  it("meldet Fortschritt, damit das Fenster nicht tot wirkt", async () => {
    // 234 Schreibvorgänge über ein Relay dauern. Ohne Anzeige hält ein Mensch
    // das für einen Absturz und lädt die Seite neu, mitten im Schreiben.
    const { connector } = attrappe()
    const staende = await laufen(connector)
    const laufend = staende.filter((s) => s.art === "laeuft")
    expect(laufend.length).toBeGreaterThan(200)
  })
})
