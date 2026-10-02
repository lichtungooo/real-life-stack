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
  const geschrieben: { title: string; eingang: Record<string, unknown> }[] = []
  return {
    geschrieben,
    connector: {
      getItems: vi.fn(async () => vorhandeneTitel.map((t) => ({ data: { title: t } }))),
      createItem: vi.fn(async (i: { data: { title?: string } } & Record<string, unknown>) => {
        const titel = String(i.data?.title ?? "")
        if (scheiternBei && titel === scheiternBei) throw new Error("abgelehnt")
        geschrieben.push({ title: titel, eingang: i })
        return i
      }),
    } as never,
  }
}

function laufen(connector: never) {
  const staende: ImportStand[] = []
  return stiftungenSchreiben(connector, (s) => staende.push(s), undefined, async () => {}).then(() => staende)
}

describe("Stiftungen schreiben", () => {
  it("schreibt Stiftungen und sonst nichts", async () => {
    const { connector, geschrieben } = attrappe()
    const staende = await laufen(connector)

    const ende = staende.at(-1)
    expect(ende?.art).toBe("fertig")
    expect(geschrieben.length).toBeGreaterThan(180)

    // Die Musterdaten tragen auch Spaces und Projekte. Der Import fasst sie
    // nicht an: Wer die Stiftungen holt (194 seit dem 01.10.2026), bekommt keine fremden Gruppen dazu.
    expect(geschrieben.every((g) => g.title.length > 0)).toBe(true)
  })

  it("gibt die Vokabular-Bindung mit, statt sie fallen zu lassen", async () => {
    // FND-0026: Die Musterdaten tragen `@context` (base/v1 + place/v1).
    // Ohne sie ist ein Item nicht mehr an das Vokabular gebunden, und was
    // daran hängt, greift nicht mehr.
    const { connector, geschrieben } = attrappe()
    await laufen(connector)

    expect(geschrieben.length).toBeGreaterThan(0)
    for (const g of geschrieben) {
      expect(g.eingang["@context"]).toEqual([
        "https://real-life-stack.org/vocab/base/v1",
        "https://real-life-stack.org/vocab/place/v1",
      ])
    }
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
    // Rund 200 Schreibvorgänge über ein Relay dauern. Ohne Anzeige hält ein Mensch
    // das für einen Absturz und lädt die Seite neu, mitten im Schreiben.
    const { connector } = attrappe()
    const staende = await laufen(connector)
    const laufend = staende.filter((s) => s.art === "laeuft")
    expect(laufend.length).toBeGreaterThan(180)
  })
})

describe("Ein zweiter Lauf traegt das Symbol nach (01.10.2026)", () => {
  it("eine schon eingespielte Stiftung ohne Symbol bekommt es, sonst wird nichts angefasst", async () => {
    const { stiftungenSchreiben } = await import("../src/stiftungen-import.js")
    const { musterItems } = await import("@trustdonation/core/musterdaten")
    const erste = musterItems.find((i) => String(i.id).startsWith("stiftung-"))!
    const titel = (erste.data as { title: string }).title
    const angelegt: unknown[] = []
    // Wie die echten Connectoren: `updateItem` ERSETZT data (Vertrag,
    // contract-suite). Die alte Attrappe schrieb nur mit und schrieb so den
    // Datenverlust als Erwartung fest (Kimi, 02.10.2026, kritisch).
    const gespeichert = new Map<string, Record<string, unknown>>([["schon-da", { title: titel, beschreibung: "von Hand gepflegt" }]])
    const connector = {
      getItems: async () => [...gespeichert].map(([id, data]) => ({ id, type: "place", data })),
      createItem: async (i: unknown) => { angelegt.push(i) },
      updateItem: async (id: string, u: { data?: Record<string, unknown> }) => { gespeichert.set(id, { ...(u.data ?? {}) }) },
    }
    let ende: unknown = null
    await stiftungenSchreiben(connector as never, (s) => { if (s.art === "fertig") ende = s }, undefined, async () => {})
    expect(gespeichert.get("schon-da")).toEqual({ title: titel, beschreibung: "von Hand gepflegt", icon: "hands" })
    expect(angelegt.some((i) => (i as { data: { title: string } }).data.title === titel)).toBe(false)
    expect(angelegt.every((i) => (i as { data: { icon?: string } }).data.icon === "hands")).toBe(true)
    expect(ende).toMatchObject({ art: "fertig" })
  })
})

describe("Was ein zweiter Lauf nachzieht (01.10.2026)", () => {
  it("zieht Ort und Anschrift nach, solange der Eintrag noch unsere Recherche ist", async () => {
    const { nachtrag } = await import("../src/stiftungen-import.js")
    const da = { title: "A", quelle: "Recherche X", address: "Essen", position: { type: "Point", coordinates: [7, 51] }, icon: "hands" }
    const neu = { title: "A", quelle: "Recherche X", address: "Huyssenallee 52, 45128 Essen", position: { type: "Point", coordinates: [7.01, 51.45] }, ortGenauigkeit: "anschrift", icon: "hands" }
    expect(nachtrag(da, neu)).toEqual({ address: neu.address, position: neu.position, ortGenauigkeit: "anschrift" })
  })

  it("laesst einen uebernommenen Eintrag in Ruhe, nur das fehlende Symbol kommt", async () => {
    const { nachtrag } = await import("../src/stiftungen-import.js")
    const da = { title: "A", quelle: "Die Stiftung selbst", address: "Ihre eigene Anschrift" }
    const neu = { title: "A", quelle: "Recherche X", address: "Andere Anschrift", icon: "hands" }
    expect(nachtrag(da, neu)).toEqual({ icon: "hands" })
    expect(nachtrag({ ...da, icon: "eigenes" }, neu)).toBeNull()
  })
})

describe("Wohin der Link schreibt (01.10.2026)", () => {
  it("das Netzwerk trustdonation vor einer gleichnamigen Gruppe, Schreibweise egal, sonst keins", async () => {
    const { importZiel } = await import("../src/stiftungen-import.js")
    const gruppe = { id: "g", name: "trustdonation", data: {} }
    const netz = { id: "n", name: " TrustDonation ", data: { isNetwork: true } }
    expect(importZiel([gruppe, netz])?.id).toBe("n")
    expect(importZiel([gruppe])?.id).toBe("g")
    expect(importZiel([{ id: "x", name: "Lichtung" }])).toBeUndefined()
  })
})

describe("Der Import laesst dem Browser Luft (01.10.2026: Seite reagierte nicht)", () => {
  it("macht nach jedem Eintrag eine Pause und schreibt in den genannten Space", async () => {
    const { stiftungenSchreiben } = await import("../src/stiftungen-import.js")
    const optionen: unknown[] = []
    let pausen = 0
    const connector = { getItems: async () => [], createItem: async (_i: unknown, o?: unknown) => { optionen.push(o) } }
    await stiftungenSchreiben(connector as never, () => {}, "space-td", async () => { pausen++ })
    expect(pausen).toBe(optionen.length)
    expect(optionen.every((o) => (o as { group?: string })?.group === "space-td")).toBe(true)
  })
})
