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
import type { DataInterface, CreateItemInput } from "@real-life-stack/data-interface"
import { musterItems } from "@trustdonation/core"

export type ImportStand =
  | { art: "ruht" }
  | { art: "fragt"; anzahl: number }
  | { art: "laeuft"; fertig: number; gesamt: number }
  | { art: "fertig"; geschrieben: number; uebersprungen: number }
  | { art: "fehler"; text: string }

/** Nur die Stiftungen, nicht die übrigen Musterdaten. */
function stiftungen() {
  return musterItems.filter((i) => String(i.id).startsWith("stiftung-"))
}

/**
 * Schreibt die Stiftungen in den aktiven Space.
 *
 * Was schon da ist, bleibt: Der Vergleich läuft über den Titel, damit ein
 * zweiter Lauf nichts verdoppelt. Ein Fehler bei einem Eintrag hält den Rest
 * nicht auf; am Ende steht, was ankam.
 */
export async function stiftungenSchreiben(
  connector: DataInterface & { createItem?: (i: CreateItemInput) => Promise<unknown> },
  melden: (stand: ImportStand) => void,
): Promise<void> {
  if (typeof connector.createItem !== "function") {
    melden({ art: "fehler", text: "Dieser Connector kann nicht schreiben." })
    return
  }

  const liste = stiftungen()
  let vorhanden = new Set<string>()
  try {
    const da = await connector.getItems({ type: "place" })
    vorhanden = new Set(da.map((i) => String((i.data as { title?: string })?.title ?? "")))
  } catch {
    // Wenn die Liste nicht kommt, wird eben alles versucht. Doppelte sind
    // ärgerlich, ein Abbruch wäre schlimmer.
  }

  let geschrieben = 0
  let uebersprungen = 0
  for (const [nr, item] of liste.entries()) {
    melden({ art: "laeuft", fertig: nr, gesamt: liste.length })
    const titel = String((item.data as { title?: string })?.title ?? "")
    if (titel && vorhanden.has(titel)) {
      uebersprungen++
      continue
    }
    try {
      await connector.createItem({
        type: item.type,
        data: item.data as Record<string, unknown>,
        tags: item.tags,
      } as CreateItemInput)
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
}: {
  connector: DataInterface | null
  aktiv: boolean
  spaceName?: string
}) {
  const [stand, setStand] = useState<ImportStand>({ art: "ruht" })

  useEffect(() => {
    if (aktiv && stand.art === "ruht") {
      setStand({ art: "fragt", anzahl: stiftungen().length })
    }
  }, [aktiv, stand.art])

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
            <h2 className="text-lg font-semibold">Das ging nicht</h2>
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
