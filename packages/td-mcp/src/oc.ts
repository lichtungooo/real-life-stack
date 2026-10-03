/**
 * Der Stand einer Open-Collective-Seite für den Baustein Open Collective
 * (DEFINITION Teil 8, freigegeben von Timo am 03.10.2026).
 *
 * GET /oc/<name> fragt die öffentliche Schnittstelle von Open Collective und
 * merkt sich die Antwort zehn Minuten. So geht keine Adresse eines Besuchers
 * an Open Collective, und viele Besuche fragen dort selten. Gerechnet wird mit
 * dem Kern aus td-core, nur öffentliche Zahlen, bei Eingängen keine Namen.
 */
import { OC_ABFRAGE, ocStandAusAntwort, type OcStand } from "@trustdonation/core"

const SCHNITTSTELLE = "https://api.opencollective.com/graphql/v2"
const NAME = /^[a-z0-9][a-z0-9-]{0,62}$/
const GUELTIG_MS = 10 * 60_000
const FEHLT_MS = 2 * 60_000
const HOECHSTENS_EINTRAEGE = 500

export type OcHolen = (name: string) => Promise<unknown>

/** Der echte Abruf bei Open Collective. */
export const ocHolen: OcHolen = async (name) => {
  const antwort = await fetch(SCHNITTSTELLE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "trustdonation (mail@reallife.network)" },
    body: JSON.stringify({ query: OC_ABFRAGE, variables: { slug: name } }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!antwort.ok) throw Object.assign(new Error(`Open Collective antwortet ${antwort.status}`), { status: 502 })
  return antwort.json()
}

export interface OcAntwort {
  status: number
  stand?: OcStand
  fehler?: string
}

/** Ein Abrufer mit Zwischenspeicher. `jetzt` und `holen` lassen sich für Tests setzen. */
export function ocDienst(holen: OcHolen = ocHolen, jetzt: () => number = Date.now) {
  const speicher = new Map<string, { bis: number; stand: OcStand | null }>()
  const laufend = new Map<string, Promise<OcAntwort>>()

  async function frisch(name: string): Promise<OcAntwort> {
    try {
      const stand = ocStandAusAntwort(await holen(name), name, new Date(jetzt()))
      speicher.set(name, { bis: jetzt() + (stand ? GUELTIG_MS : FEHLT_MS), stand })
      if (speicher.size > HOECHSTENS_EINTRAEGE) speicher.delete(speicher.keys().next().value as string)
      return stand ? { status: 200, stand } : { status: 404, fehler: "Diese Seite gibt es bei Open Collective nicht." }
    } catch {
      // Ein Fehler bei Open Collective: der letzte Stand, wenn es einen gibt.
      const alt = speicher.get(name)?.stand
      return alt ? { status: 200, stand: alt } : { status: 502, fehler: "Open Collective ist gerade nicht erreichbar." }
    }
  }

  return async function abrufen(name: string): Promise<OcAntwort> {
    if (!NAME.test(name)) return { status: 400, fehler: "Kein gültiger Name einer Seite." }
    const da = speicher.get(name)
    if (da && da.bis > jetzt()) {
      return da.stand ? { status: 200, stand: da.stand } : { status: 404, fehler: "Diese Seite gibt es bei Open Collective nicht." }
    }
    // Gleichzeitige Anfragen zu derselben Seite teilen sich einen Abruf.
    const offen = laufend.get(name)
    if (offen) return offen
    const lauf = frisch(name).finally(() => laufend.delete(name))
    laufend.set(name, lauf)
    return lauf
  }
}
