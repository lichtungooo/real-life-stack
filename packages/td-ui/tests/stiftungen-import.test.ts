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
    const erste = musterItems.find((i) => String(i.id).startsWith("stiftung-") && (i.data as { muster?: boolean }).muster !== true)!
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

describe("Die Musterstiftung bleibt Muster (02.10.2026)", () => {
  it("schreibt die erfundene Musterstiftung nie in einen echten Space", async () => {
    const { connector, geschrieben } = attrappe()
    await laufen(connector)
    expect(geschrieben.some((g) => g.title === "Löwenherz Stiftung")).toBe(false)
    expect(geschrieben.every((g) => (g.eingang as { data: { muster?: boolean } }).data.muster !== true)).toBe(true)
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

  it("der Auftritt kommt nur, wo er fehlt; Bearbeitetes bleibt (02.10.2026)", async () => {
    const { nachtrag } = await import("../src/stiftungen-import.js")
    const neu = { title: "A", quelle: "Recherche X", icon: "hands", bild: "stiftungen/a.svg", hausfarbe: "#961e82", kurz: "Neu recherchiert.", foerderbereiche: ["bildung"] }
    expect(nachtrag({ title: "A", quelle: "Recherche X", icon: "hands", foerderbereiche: [] }, neu))
      .toEqual({ bild: "stiftungen/a.svg", hausfarbe: "#961e82", kurz: "Neu recherchiert.", foerderbereiche: ["bildung"] })
    expect(nachtrag({ title: "A", quelle: "Recherche X", icon: "hands", kurz: "Von Hand geschrieben.", foerderbereiche: ["kinder"] }, neu))
      .toEqual({ bild: "stiftungen/a.svg", hausfarbe: "#961e82" })
    // Eine übernommene Stiftung bleibt, wie sie ist, auch ohne Logo.
    expect(nachtrag({ title: "A", quelle: "Die Stiftung selbst", icon: "hands" }, neu)).toBeNull()
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

describe("Namenlose Reste aus einem früheren Lauf (Kimi, 02.10.2026, kritisch)", () => {
  it("erkennt nur Orte ohne Namen, deren Felder alle aus dem Nachtrag stammen", async () => {
    const { stiftungsReste } = await import("../src/stiftungen-import.js")
    const reste = stiftungsReste([
      { id: "rest-1", type: "place", data: { icon: "hands" } },
      { id: "rest-2", type: "place", data: { address: "Kölnische Straße 8, Kassel", position: { type: "Point", coordinates: [9.49, 51.31] }, ortGenauigkeit: "anschrift", icon: "hands" } },
      { id: "heil", type: "place", data: { title: "Bürgerstiftung", icon: "hands" } },
      { id: "fremder-ort", type: "place", data: { beschreibung: "Ein Garten ohne Titel" } },
      { id: "leer", type: "place", data: {} },
      { id: "aufgabe", type: "task", data: { icon: "hands" } },
      // Kimi, 03.10.2026, kritisch: fremde Orte ohne Titel bleiben, auch mit Feldern aus der Nachtrag-Menge.
      { id: "fremd-position", type: "place", data: { position: { type: "Point", coordinates: [9, 51] }, color: "#ff0000" } },
      { id: "fremd-website", type: "place", data: { website: "https://garten.de" } },
      { id: "fremd-anderes-symbol", type: "place", data: { icon: "tree", address: "Weg 1" } },
    ])
    expect(reste.map((r) => r.id)).toEqual(["rest-1", "rest-2"])
  })

  it("ein Lauf räumt die Reste fort und schreibt die Stiftung vollständig", async () => {
    const { stiftungenSchreiben } = await import("../src/stiftungen-import.js")
    const { musterItems } = await import("@trustdonation/core/musterdaten")
    const erste = musterItems.find((i) => String(i.id).startsWith("stiftung-") && (i.data as { muster?: boolean }).muster !== true)!
    const titel = (erste.data as { title: string }).title
    // Der Zustand nach dem alten Fehler: die Stiftung nur noch als Rest.
    const gespeichert = new Map<string, { type: string; data: Record<string, unknown> }>([
      ["rest", { type: "place", data: { icon: "hands", address: (erste.data as { address?: string }).address ?? "x" } }],
    ])
    const connector = {
      getItems: async () => [...gespeichert].map(([id, i]) => ({ id, ...i })),
      createItem: async (i: { type: string; data: Record<string, unknown> }) => { gespeichert.set(`neu-${gespeichert.size}`, { type: i.type, data: { ...i.data } }) },
      updateItem: async (id: string, u: { data?: Record<string, unknown> }) => { gespeichert.set(id, { ...gespeichert.get(id)!, data: { ...(u.data ?? {}) } }) },
      deleteItem: async (id: string) => { gespeichert.delete(id) },
    }
    let ende: { entfernt?: number } | null = null
    await stiftungenSchreiben(connector as never, (s) => { if (s.art === "fertig") ende = s }, undefined, async () => {})
    expect(gespeichert.has("rest")).toBe(false)
    expect([...gespeichert.values()].some((i) => i.data.title === titel)).toBe(true)
    expect(ende).toMatchObject({ entfernt: 1 })
  })
})
