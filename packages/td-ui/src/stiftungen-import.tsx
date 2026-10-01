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
import { useEffect, useState } from "react"
import type { DataInterface, CreateItemInput, Item } from "@real-life-stack/data-interface"

export type ImportStand =
  | { art: "ruht" }
  | { art: "fragt"; anzahl: number }
  | { art: "laeuft"; fertig: number; gesamt: number }
  | { art: "fertig"; geschrieben: number; uebersprungen: number }
  | { art: "fehler"; text: string }

/** Nur die Stiftungen, nicht die übrigen Musterdaten.
 *
 * Nachgeladen statt mitgeliefert: Die Musterdaten wiegen 308 KB, und dieser
 * Vorgang läuft selten (er wird über die Adresse ausgelöst). Wer ihn nie
 * benutzt, lädt sie nie.
 */
async function stiftungen() {
  const { musterItems } = await import("@trustdonation/core/musterdaten")
  return musterItems.filter((i) => String(i.id).startsWith("stiftung-"))
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
 * Was an einer schon eingespielten Stiftung nachgezogen wird, oder `null`.
 *
 * Das Symbol (01.10.2026) kommt immer, wenn es fehlt. Ort, Anschrift und
 * Website nur, solange der Eintrag noch unsere Recherche ist (`quelle`
 * unveraendert): Hat eine Stiftung ihn uebernommen und selbst gepflegt,
 * bleibt er, wie sie ihn haben will.
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
    createItem?: (i: CreateItemInput) => Promise<unknown>
    updateItem?: (id: string, updates: Partial<Item>) => Promise<unknown>
  },
  melden: (stand: ImportStand) => void,
): Promise<void> {
  if (typeof connector.createItem !== "function") {
    melden({ art: "fehler", text: "Dieser Connector kann nicht schreiben." })
    return
  }

  const liste = await stiftungen()
  // Titel -> was schon da ist, damit ein zweiter Lauf nachtraegt, was neu
  // dazukam, statt nur nichts zu verdoppeln.
  let vorhanden = new Map<string, { id: string; data: Record<string, unknown> }>()
  try {
    const da = await connector.getItems({ type: "place" })
    vorhanden = new Map(da.map((i) => [String((i.data as { title?: string })?.title ?? ""), { id: i.id, data: (i.data ?? {}) as Record<string, unknown> }]))
  } catch {
    // Wenn die Liste nicht kommt, wird eben alles versucht. Doppelte sind
    // ärgerlich, ein Abbruch wäre schlimmer.
  }

  let geschrieben = 0
  let uebersprungen = 0
  for (const [nr, item] of liste.entries()) {
    melden({ art: "laeuft", fertig: nr, gesamt: liste.length })
    const titel = String((item.data as { title?: string })?.title ?? "")
    const da = titel ? vorhanden.get(titel) : undefined
    if (da) {
      const patch = nachtrag(da.data, item.data as Record<string, unknown>)
      if (patch && typeof connector.updateItem === "function") {
        try { await connector.updateItem(da.id, { data: patch }); geschrieben++ } catch { uebersprungen++ }
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
      await connector.createItem(rest)
      geschrieben++
    } catch {
      uebersprungen++
    }
  }
  melden({ art: "fertig", geschrieben, uebersprungen })
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
}: {
  connector: DataInterface | null
  aktiv: boolean
  spaceName?: string
  /** Der local-Connector kann schreiben, nur nützt es hier nichts: Die
      Stiftungen liegen dort bereits als Seed. */
  beispielwelt?: boolean
  /** Kein Ziel-Space: der Grund, den die Flaeche nennt, statt ins Leere zu schreiben. */
  ohneZiel?: string
}) {
  const [stand, setStand] = useState<ImportStand>({ art: "ruht" })

  useEffect(() => {
    if (aktiv && stand.art === "ruht") {
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
      void stiftungen().then((liste) => setStand({ art: "fragt", anzahl: liste.length }))
    }
  }, [aktiv, beispielwelt, ohneZiel, stand.art])

  if (!aktiv || stand.art === "ruht") return null

  const schliessen = () => setStand({ art: "ruht" })

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
              Was schon da ist, bleibt unberührt.
            </p>
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
                  void stiftungenSchreiben(connector as never, setStand)
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
              {stand.uebersprungen > 0 ? `, ${stand.uebersprungen} übersprungen (waren schon da)` : ""}.
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
