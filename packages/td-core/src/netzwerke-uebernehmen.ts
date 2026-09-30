// Die Ordnung der Beispielwelt in echte Spaces tragen.
//
// Timo, 30.09.2026: Im Login standen seine Gruppen flach durcheinander, in
// der Demo geordnet nach Netzwerken, Projekten und Stiftungen. *"Unsere
// gehen vor. Die Netzwerke, die Gruppen, die Stiftungen, die Projekte."*
//
// Hier steht nur der Plan, ohne Connector: welche Spaces angelegt werden, in
// welcher Reihenfolge, mit welchen Angaben. Das Schreiben macht td-ui.
//
// Die Regeln:
// 1. Ein Netzwerk entsteht vor den Spaces, die auf es verweisen
//    (`data.network`); der Verweis wird beim Schreiben auf die neue Id
//    umgesetzt.
// 2. Was es unter diesem Namen schon gibt, wird nicht verdoppelt. Sein
//    Verweisziel gilt dann als vorhanden.
// 3. Erfundenes bleibt in der Demo: Ein Space mit einer Beispiel-Adresse
//    (`beispiel.de`) ist ein Muster, kein echter Ort.
// 4. Mit hinueber gehen nur die Angaben, die den Space beschreiben. Was der
//    Connector selbst fuehrt (Zugang, Rollen, Mitgliederzahl), bleibt; die
//    Modul-Liste auch, damit die Grundausstattung gilt.

import type { Group } from "@real-life-stack/data-interface"

/** Was der Connector selbst setzt oder was nicht hinueber soll. */
const NICHT_UEBERNEHMEN = new Set(["scope", "access", "roles", "memberCount", "modules", "network"])

export interface NetzwerkSchritt {
  /** Id in der Beispielwelt, nur fuer die Zuordnung der Verweise. */
  musterId: string
  name: string
  /** Die Angaben ohne `network`; der Verweis steht in `netzwerkVon`. */
  data: Record<string, unknown>
  /** Muster-Id des Netzwerks, zu dem dieser Space gehoert. */
  netzwerkVon?: string
  /** Gibt es ihn schon, seine echte Id: dann wird nichts angelegt. */
  vorhandenId?: string
}

export interface NetzwerkPlan {
  schritte: NetzwerkSchritt[]
  /** Was in der Demo bleibt, mit Grund. */
  ausgelassen: { name: string; grund: string }[]
}

const erfunden = (g: Group) => /(^|\/\/|\.)beispiel\.(de|org|com)\b/i.test(String(g.data?.website ?? ""))

export function netzwerkePlanen(muster: readonly Group[], vorhanden: readonly Group[]): NetzwerkPlan {
  const ausgelassen: NetzwerkPlan["ausgelassen"] = []
  const echt = muster.filter((g) => {
    if (!erfunden(g)) return true
    ausgelassen.push({ name: g.name, grund: "ein erfundenes Muster (Adresse beispiel.de)" })
    return false
  })
  const vorhandenNach = new Map(vorhanden.map((g) => [g.name.trim().toLowerCase(), g.id]))
  const bekannt = new Set(echt.map((g) => g.id))

  const schritt = (g: Group): NetzwerkSchritt => {
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(g.data ?? {})) if (!NICHT_UEBERNEHMEN.has(k)) data[k] = v
    const netz = typeof g.data?.network === "string" && bekannt.has(g.data.network) ? g.data.network : undefined
    return {
      musterId: g.id,
      name: g.name,
      data,
      ...(netz ? { netzwerkVon: netz } : {}),
      ...(vorhandenNach.has(g.name.trim().toLowerCase()) ? { vorhandenId: vorhandenNach.get(g.name.trim().toLowerCase()) } : {}),
    }
  }

  // Reihenfolge: jeder Space nach seinem Netzwerk. Die Tiefe ist klein, eine
  // einfache Schleife reicht; ein Ring (A in B, B in A) bricht sie ab.
  const offen = echt.map(schritt)
  const fertig: NetzwerkSchritt[] = []
  const gesetzt = new Set<string>()
  while (offen.length > 0) {
    const i = offen.findIndex((s) => !s.netzwerkVon || gesetzt.has(s.netzwerkVon))
    const naechster = offen.splice(i === -1 ? 0 : i, 1)[0]
    if (i === -1) delete naechster.netzwerkVon
    fertig.push(naechster)
    gesetzt.add(naechster.musterId)
  }
  return { schritte: fertig, ausgelassen }
}
