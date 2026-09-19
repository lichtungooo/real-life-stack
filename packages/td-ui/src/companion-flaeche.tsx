/**
 * Der Companion.
 *
 * Eine Begleitung im Space, die die Sachen darin kennt. Erstes Modul einer
 * Familie; Vorbild ist `lichtungooo/rln`, `src/modules/companion/`.
 *
 * Definiert in `docs/DEFINITION.md` Teil 13. Drei Saetze daraus, weil sie
 * das Verhalten dieser Datei bestimmen:
 *
 *   1. **`presents` bleibt leer.** Der Companion ist keine Sicht auf Items.
 *      Er liest sie, er zeigt sie nicht.
 *   2. **Lesend im ersten Schritt.** Kein Werkzeug schreibt. Ein
 *      schreibendes bekommt erst dann einen Platz, wenn die Freigabe etwas
 *      verlangt, das der Agent nicht hat.
 *   3. **Eine fehlende Anbindung degradiert sichtbar.** Die Flaeche steht,
 *      das Gespraech fehlt, und sie sagt warum. Nie eine leere Flaeche.
 *
 * ⚠ Darum gibt es hier **kein Eingabefeld fuer einen Schluessel**. Das
 * Vorbild legt ihn im `localStorage` ab, und das traegt fuer einen
 * Prototypen und nicht fuer eine Instanz: Jedes Skript auf der Seite liest
 * ihn. Woher das Modell kommt, ist eine offene Entscheidung (DEFINITION
 * 13.4), und solange sie offen ist, sagt die Flaeche das.
 */

import { useMemo } from "react"
import { Sparkles } from "lucide-react"
import type { Item } from "@real-life-stack/data-interface"
import { useItems } from "@real-life-stack/toolkit"

/**
 * Ein Werkzeug, das der Companion in die Hand bekommt.
 *
 * ⚠ **Eine Liste, eine Quelle** (Muster 1). Jede Flaeche, die Werkzeuge
 * aufzaehlt, leitet sie hier ab. Eine zweite Aufzaehlung ist ein Fehler.
 *
 * `beschreibung` ist Pflicht und nicht Beiwerk: Was ein Mensch nicht lesen
 * kann, gibt er nicht frei. Ein Werkzeug ohne Beschreibung erscheint nicht
 * (DEFINITION 13.5, Regel 2).
 */
export interface CompanionWerkzeug {
  readonly id: string
  readonly name: string
  readonly beschreibung: string
  /** `lesend` sieht nur nach. `schreibend` gibt es noch nicht. */
  readonly art: "lesend" | "schreibend"
}

export const COMPANION_WERKZEUGE: readonly CompanionWerkzeug[] = [
  {
    id: "suche-im-space",
    name: "Im Space suchen",
    beschreibung:
      "Sieht die Eintraege dieses Space durch und nennt die, die zu einer Frage passen. Liest nur.",
    art: "lesend",
  },
]

/** Was der Companion ueber diesen Space weiss. Allein Felder, niemals `type`. */
export interface SpaceUeberblick {
  readonly eintraege: number
  /** Wieviele Eintraege ein Feld tragen, absteigend. */
  readonly felder: readonly { readonly feld: string; readonly anzahl: number }[]
}

/**
 * Zaehlt, welche Felder in diesem Space wirklich vorkommen.
 *
 * ⚠ **Kein `if (type === ...)`** (Muster 4). Was der Companion anbieten
 * kann, entscheidet die Feld-Praesenz: Ein Space mit `position` laesst sich
 * nach Orten fragen, einer mit `start` nach Zeiten. Der Item-Typ sagt
 * darueber nichts.
 *
 * Steht als eigene Funktion, damit ein Test sie ohne Oberflaeche pruefen
 * kann.
 */
export function ueberblickAus(items: readonly Item[]): SpaceUeberblick {
  const zaehler = new Map<string, number>()

  for (const item of items) {
    const daten = (item as { data?: Record<string, unknown> }).data
    if (!daten) continue

    for (const [feld, wert] of Object.entries(daten)) {
      // Ein Feld, das nichts traegt, ist kein Feld. `false` und `0` zaehlen.
      if (wert === undefined || wert === null || wert === "") continue
      zaehler.set(feld, (zaehler.get(feld) ?? 0) + 1)
    }
  }

  const felder = [...zaehler.entries()]
    .map(([feld, anzahl]) => ({ feld, anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl || a.feld.localeCompare(b.feld))

  return { eintraege: items.length, felder }
}

/** Die Werkzeuge, die ein Mensch sehen und freigeben darf. */
export function sichtbareWerkzeuge(
  alle: readonly CompanionWerkzeug[] = COMPANION_WERKZEUGE,
): readonly CompanionWerkzeug[] {
  return alle.filter((w) => w.beschreibung.trim().length > 0)
}

export function CompanionFlaeche(): React.ReactElement {
  const { data: items } = useItems()
  const ueberblick = useMemo(() => ueberblickAus(items ?? []), [items])
  const werkzeuge = sichtbareWerkzeuge()

  return (
    <div className="space-y-6 p-4">
      <header className="flex items-start gap-3">
        <Sparkles className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-medium">Begleitung</h2>
          <p className="text-sm text-muted-foreground">
            Eine Begleitung, die die Eintraege dieses Space kennt.
          </p>
        </div>
      </header>

      {/*
        ⚠ Die sichtbare Degradierung (DEFINITION 13.5, Regel 3).
        Nicht ein Fehler, nicht eine leere Flaeche: der Stand, und warum.
      */}
      <section
        className="rounded-md border border-dashed p-4 text-sm"
        aria-label="Stand der Anbindung"
      >
        <p className="font-medium">Das Gespraech fehlt noch.</p>
        <p className="mt-1 text-muted-foreground">
          Woher das Modell kommt, ist noch nicht entschieden. Ein Schluessel im Browser
          waere ein Schluessel in fremder Hand, darum steht hier keiner. Der Weg, der zum
          Rest passt: ein MCP-Server, den dieser Space nennt, und jeder bringt seinen
          eigenen Agenten mit.
        </p>
      </section>

      <section aria-label="Was die Begleitung weiss">
        <h3 className="text-sm font-medium">Was sie ueber diesen Space weiss</h3>
        {ueberblick.eintraege === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            In diesem Space liegt noch kein Eintrag.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {ueberblick.eintraege} Eintraege, {ueberblick.felder.length} verschiedene Felder.
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {ueberblick.felder.slice(0, 8).map(({ feld, anzahl }) => (
                <li key={feld} className="flex justify-between gap-4">
                  <code className="text-xs">{feld}</code>
                  <span className="text-muted-foreground">{anzahl}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Werkzeuge">
        <h3 className="text-sm font-medium">Werkzeuge</h3>
        <ul className="mt-2 space-y-3">
          {werkzeuge.map((w) => (
            <li key={w.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{w.name}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {w.art}
                </span>
              </div>
              <p className="mt-0.5 text-muted-foreground">{w.beschreibung}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Schreibende Werkzeuge gibt es bewusst noch keine.
        </p>
      </section>
    </div>
  )
}
