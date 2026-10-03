// Die recherchierten Stiftungen in einen echten Space schreiben.
//
// Timo: "Warum ist es nicht möglich, diese Testdaten in der App mit allen
// anderen zu teilen, die jetzt schon im Web of Trust drin sind?"
//
// Es ist möglich, und das hier ist der Weg. Bisher lagen die Stiftungen als
// Seed im local-Connector: sichtbar für jeden, der die App ohne Anmeldung
// öffnet, aber unteilbar. Wer sie teilen will, muss sie in einen Space
// schreiben, den andere betreten können.
//
// Danach gehören sie dem Space, nicht dem Prüfstand: Sie synchronisieren
// über das Relay, jedes Mitglied sieht sie, und wer sie ändert, ändert sie
// für alle.
//
// Aufgerufen wird es über die Adresse, damit es keinen Knopf braucht, den
// eine Stiftung versehentlich drückt:
//
//     trustdonation.org/app/<space-id>/feed?connector=wot&import=stiftungen
import { useEffect, useRef, useState } from "react"
import type { DataInterface, CreateItemInput, Item } from "@real-life-stack/data-interface"

export type ImportStand =
  | { art: "ruht" }
  | { art: "fragt"; anzahl: number; vorhanden: number; reste: number; resteOrte?: string[] }
  | { art: "laeuft"; fertig: number; gesamt: number }
  | { art: "fertig"; geschrieben: number; uebersprungen: number; entfernt: number }
  | { art: "fehler"; text: string }

/** Nur die Stiftungen, nicht die übrigen Musterdaten.
 *
 * Nachgeladen statt mitgeliefert: Die Musterdaten wiegen 308 KB, und dieser
 * Vorgang läuft selten (er wird über die Adresse ausgelöst). Wer ihn nie
 * benutzt, lädt sie nie.
 */
async function stiftungen() {
  const { musterItems } = await import("@trustdonation/core/musterdaten")
  // Die erfundene Musterstiftung (`muster: true`) zeigt nur die Vorlage; in echte Spaces gehört sie nicht.
  return musterItems.filter((i) => String(i.id).startsWith("stiftung-") && (i.data as { muster?: boolean } | undefined)?.muster !== true)
}

/**
 * Wohin die Stiftungen gehoeren, wenn kein Space offen ist: das Netzwerk
 * "trustdonation", sonst ein Space dieses Namens, sonst keiner.
 */
export function importZiel<G extends { id: string; name: string; data?: unknown }>(groups: readonly G[]): G | undefined {
  const heisst = (g: G) => g.name.trim().toLowerCase() === "trustdonation"
  return groups.find((g) => heisst(g) && (g.data as { isNetwork?: boolean } | undefined)?.isNetwork) ?? groups.find(heisst)
}

/** Was ein zweiter Lauf an einer schon eingespielten Stiftung nachzieht. */
const NACHZUG = ["icon", "address", "position", "sitz", "ortGenauigkeit", "website", "anschriftQuelle"] as const

/**
 * Der Auftritt der Stiftung (DEFINITION Teil 8, 02.10.2026): Logo, Farben,
 * Texte. Kommt nur dazu, solange der Eintrag unsere Recherche ist, und nur
 * wo das Feld fehlt; was jemand im Space schon selbst bearbeitet hat, bleibt.
 */
const AUFTRITT = ["bild", "hausfarbe", "akzent", "kurz", "zweck", "zielgruppen", "hinweis", "foerderbereiche", "auftrittQuelle", "auftrittStand"] as const

/**
 * Namenlose Reste aus einem früheren Lauf (Kimi, 02.10.2026, kritisch).
 *
 * Bis proto-66 schickte der Nachtrag nur die geänderten Felder, und jeder
 * Connector ersetzt `data` ganz. Eine Stiftung, die schon vor dem 1. Oktober
 * im Space lag, schrumpfte so auf Symbol, Ort und Anschrift, ohne Namen. Der
 * nächste Lauf fand sie am Namen nicht mehr und schrieb sie neu. Übrig bleibt
 * ein Ort ohne Namen, dessen Felder alle aus dem Nachtrag stammen.
 *
 * Und er trägt das Symbol unserer Stiftungen (`icon: "hands"`): Ein fremder
 * Ort ohne Titel, nur mit Position und Farbe, ist kein Rest und bleibt
 * (Kimi, 03.10.2026, kritisch).
 */
export function stiftungsReste<I extends { id: string; type?: string; data?: unknown }>(items: readonly I[]): I[] {
  const erlaubt = new Set<string>([...NACHZUG, "color"])
  return items.filter((i) => {
    if (i.type !== undefined && i.type !== "place") return false
    const d = (i.data ?? {}) as Record<string, unknown>
    const titel = typeof d.title === "string" ? d.title.trim() : ""
    const felder = Object.keys(d)
    return titel === "" && d.icon === "hands" && felder.every((k) => erlaubt.has(k))
  })
}

/** Die Orte im Ziel-Space, nicht in allen Spaces des Menschen. */
async function orteImSpace(connector: DataInterface, ziel?: string): Promise<Item[]> {
  return connector.getItems({ type: "place", ...(ziel ? { group: ziel } : {}) })
}

/**
 * Was an einer schon eingespielten Stiftung nachgezogen wird, oder `null`.
 *
 * Das Symbol (01.10.2026) kommt immer, wenn es fehlt. Ort, Anschrift und
 * Website nur, solange der Eintrag noch unsere Recherche ist (`quelle`
 * unveraendert): Hat eine Stiftung ihn uebernommen und selbst gepflegt,
 * bleibt er, wie sie ihn haben will. Der Auftritt (Logo, Farben, Texte)
 * kommt nur dazu, wo er fehlt.
 */
export function nachtrag(da: Record<string, unknown>, neu: Record<string, unknown>): Record<string, unknown> | null {
  const unsere = da.quelle === neu.quelle
  const patch: Record<string, unknown> = {}
  for (const k of NACHZUG) {
    if (neu[k] === undefined) continue
    const fehlt = da[k] === undefined || da[k] === null || da[k] === ""
    const anders = JSON.stringify(da[k]) !== JSON.stringify(neu[k])
    if (k === "icon" ? fehlt : unsere && anders) patch[k] = neu[k]
  }
  for (const k of AUFTRITT) {
    const fehlt = da[k] === undefined || da[k] === null || da[k] === "" || (Array.isArray(da[k]) && (da[k] as unknown[]).length === 0)
    if (neu[k] !== undefined && unsere && fehlt) patch[k] = neu[k]
  }
  return Object.keys(patch).length ? patch : null
}

/**
 * Schreibt die Stiftungen in den aktiven Space.
 *
 * Was schon da ist, bleibt: Der Vergleich läuft über den Titel, damit ein
 * zweiter Lauf nichts verdoppelt. Ein Fehler bei einem Eintrag hält den Rest
 * nicht auf; am Ende steht, was ankam.
 */
export async function stiftungenSchreiben(
  connector: DataInterface & {
    createItem?: (i: CreateItemInput, options?: { group?: string }) => Promise<unknown>
    updateItem?: (id: string, updates: Partial<Item>) => Promise<unknown>
    deleteItem?: (id: string) => Promise<unknown>
  },
  melden: (stand: ImportStand) => void,
  /** Der Space, in den geschrieben wird; ohne Angabe der gerade offene. */
  ziel?: string,
  /** Atempause fuer den Browser nach jedem Eintrag (Test: sofort). */
  pause: () => Promise<void> = () => new Promise((r) => setTimeout(r, 40)),
): Promise<void> {
  if (typeof connector.createItem !== "function") {
    melden({ art: "fehler", text: "Dieser Connector kann nicht schreiben." })
    return
  }

  const liste = await stiftungen()
  // Titel -> was schon da ist, damit ein zweiter Lauf nachtraegt, was neu
  // dazukam, statt nur nichts zu verdoppeln.
  let vorhanden = new Map<string, { id: string; data: Record<string, unknown> }>()
  let reste: Item[] = []
  try {
    const da = await orteImSpace(connector, ziel)
    reste = stiftungsReste(da)
    vorhanden = new Map(
      da
        .filter((i) => String((i.data as { title?: string })?.title ?? "").trim() !== "")
        .map((i) => [String((i.data as { title?: string }).title), { id: i.id, data: (i.data ?? {}) as Record<string, unknown> }]),
    )
  } catch {
    // Wenn die Liste nicht kommt, wird eben alles versucht. Doppelte sind
    // ärgerlich, ein Abbruch wäre schlimmer.
  }

  // Zuerst die namenlosen Reste fort: Sie tragen nichts, was die Stiftungen
  // unten nicht vollständig mitbringen.
  let entfernt = 0
  if (typeof connector.deleteItem === "function") {
    for (const rest of reste) {
      await pause()
      try { await connector.deleteItem(rest.id); entfernt++ } catch { /* bleibt, wird gemeldet */ }
    }
  }

  let geschrieben = 0
  let uebersprungen = 0
  for (const [nr, item] of liste.entries()) {
    melden({ art: "laeuft", fertig: nr, gesamt: liste.length })
    // Timo, 01.10.2026: "Seite reagiert nicht" nach Ja. Jeder Eintrag wird im
    // Web of Trust signiert, verschluesselt und abgeglichen, danach zeichnet
    // die Seite Feed und Karte neu. Ohne Pause dazwischen kam der Browser bei
    // rund 200 Eintraegen nicht mehr zum Zeichnen. Was geschrieben ist,
    // bleibt; ein zweiter Lauf ueberspringt es (Vergleich ueber den Titel).
    await pause()
    const titel = String((item.data as { title?: string })?.title ?? "")
    const da = titel ? vorhanden.get(titel) : undefined
    if (da) {
      const patch = nachtrag(da.data, item.data as Record<string, unknown>)
      if (patch && typeof connector.updateItem === "function") {
        // Ergänzen, nie ersetzen: Alle Connectoren ersetzen `data` ganz
        // (Vertrag, contract-suite). Nur den Nachtrag zu schicken hätte Titel,
        // Beschreibung und alles Übrige gelöscht (Kimi, 02.10.2026, kritisch).
        try { await connector.updateItem(da.id, { data: { ...(da.data as Record<string, unknown>), ...patch } }); geschrieben++ } catch { uebersprungen++ }
      } else {
        uebersprungen++
      }
      continue
    }
    try {
      // Das ganze Item durchreichen, nur was der Connector selbst setzt
      // abziehen. Wer einzelne Felder auswählt, wirft unbemerkt weg, was
      // dazukommt — die Musterdaten tragen `@context`, und ohne Vokabular-
      // Bindung greift nichts mehr, was daran hängt (Spec 06).
      const { id: _id, createdAt, updatedAt, updatedBy, ...rest } = item
      await connector.createItem(rest, ziel ? { group: ziel } : undefined)
      geschrieben++
    } catch {
      uebersprungen++
    }
  }
  melden({ art: "fertig", geschrieben, uebersprungen, entfernt })
}

/**
 * Der Vorgang mit Rückfrage.
 *
 * Die Rückfrage ist kein Zierrat: 234 Einträge in einen fremden Space zu
 * schreiben lässt sich nicht mit einem Klick zurücknehmen.
 */
export function StiftungenImport({
  connector,
  aktiv,
  spaceName,
  beispielwelt,
  ohneZiel,
  zielId,
}: {
  connector: DataInterface | null
  aktiv: boolean
  spaceName?: string
  /** Der local-Connector kann schreiben, nur nützt es hier nichts: Die
      Stiftungen liegen dort bereits als Seed. */
  beispielwelt?: boolean
  /** Kein Ziel-Space: der Grund, den die Flaeche nennt, statt ins Leere zu schreiben. */
  ohneZiel?: string
  /** Der Space, in den geschrieben wird. */
  zielId?: string
}) {
  const [stand, setStand] = useState<ImportStand>({ art: "ruht" })
  // Geschlossen bleibt geschlossen: Die Adresse trägt `?import=stiftungen`
  // weiter, und ohne das lud der Dialog gleich wieder (Kimi, 02.10.2026).
  const [weg, setWeg] = useState(false)
  // Eine Antwort, die nach dem Schließen ankommt, öffnet nichts mehr.
  const lauf = useRef(0)

  useEffect(() => {
    if (aktiv && !weg && stand.art === "ruht") {
      if (beispielwelt) {
        setStand({
          art: "fehler",
          text: "Die App zeigt gerade Beispieldaten, und dort liegen die Stiftungen schon. "
            + "Zum Übernehmen zuerst anmelden: ?connector=wot",
        })
        return
      }
      if (ohneZiel) {
        setStand({ art: "fehler", text: ohneZiel })
        return
      }
      const meins = ++lauf.current
      Promise.all([stiftungen(), connector ? orteImSpace(connector, zielId).catch(() => [] as Item[]) : Promise.resolve([] as Item[])])
        .then(([liste, orte]) => {
          if (lauf.current !== meins) return
          const gefunden = stiftungsReste(orte)
          const reste = gefunden.length
          // Was gelöscht wird, sieht der Mensch vorher (Kimi, 03.10.2026).
          const resteOrte = gefunden.map((r) => {
            const d = (r.data ?? {}) as { address?: unknown; sitz?: unknown }
            return typeof d.address === "string" && d.address.trim() ? d.address.trim() : typeof d.sitz === "string" && d.sitz.trim() ? d.sitz.trim() : "ohne Anschrift"
          })
          const titel = new Set(liste.map((i) => String((i.data as { title?: string })?.title ?? "")))
          const vorhanden = orte.filter((o) => titel.has(String((o.data as { title?: string })?.title ?? ""))).length
          setStand({ art: "fragt", anzahl: liste.length, vorhanden, reste, resteOrte })
        })
        .catch(() => { if (lauf.current === meins) setStand({ art: "fehler", text: "Die Daten ließen sich nicht laden. Seite neu laden und noch einmal versuchen." }) })
    }
  }, [aktiv, weg, beispielwelt, ohneZiel, stand.art])

  if (!aktiv || weg || stand.art === "ruht") return null

  const schliessen = () => { lauf.current++; setWeg(true); setStand({ art: "ruht" }) }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-lg">
        {stand.art === "fragt" && (
          <>
            <h2 className="text-lg font-semibold">Stiftungen übernehmen</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {stand.anzahl} recherchierte Stiftungen werden in den Space
              {spaceName ? ` „${spaceName}“` : ""} geschrieben. Danach sehen alle Mitglieder
              sie, und sie synchronisieren über das Relay.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {stand.vorhanden > 0
                ? `${stand.vorhanden} davon liegen schon im Space; bei ihnen wird nur ergänzt, was fehlt.`
                : "Was schon da ist, bleibt unberührt."}
            </p>
            {stand.reste > 0 && (
              <p className="mt-2 rounded-md bg-amber-50/70 p-2 text-sm dark:bg-amber-950/40">
                {stand.reste} namenlose Reste aus einem früheren Lauf gefunden: Orte nur mit dem
                Stiftungs-Symbol und Anschrift, ohne Namen. Sie werden entfernt; die Stiftungen selbst
                werden vollständig geschrieben.
                {stand.resteOrte && stand.resteOrte.length > 0 && (
                  <span className="mt-1 block max-h-28 overflow-y-auto text-xs text-muted-foreground">
                    {stand.resteOrte.slice(0, 50).join(" · ")}{stand.resteOrte.length > 50 ? ` · und ${stand.resteOrte.length - 50} weitere` : ""}
                  </span>
                )}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={schliessen}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!connector) {
                    setStand({ art: "fehler", text: "Keine Verbindung." })
                    return
                  }
                  void stiftungenSchreiben(connector as never, setStand, zielId)
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
              >
                Übernehmen
              </button>
            </div>
          </>
        )}

        {stand.art === "laeuft" && (
          <>
            <h2 className="text-lg font-semibold">Wird geschrieben …</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {stand.fertig} von {stand.gesamt}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round((stand.fertig / stand.gesamt) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Das Fenster bitte offen lassen.
            </p>
          </>
        )}

        {stand.art === "fertig" && (
          <>
            <h2 className="text-lg font-semibold">Fertig</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {stand.geschrieben} Stiftungen geschrieben
              {stand.uebersprungen > 0 ? `, ${stand.uebersprungen} übersprungen (waren schon da)` : ""}
              {stand.entfernt > 0 ? `, ${stand.entfernt} namenlose Reste entfernt` : ""}.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={schliessen}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
              >
                Schließen
              </button>
            </div>
          </>
        )}

        {stand.art === "fehler" && (
          <>
            <h2 className="text-lg font-semibold">{stand.text.startsWith("Die App zeigt") ? "Schon da" : "Das ging nicht"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{stand.text}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={schliessen}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-muted"
              >
                Schließen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
