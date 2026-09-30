// Unsere Netzwerke als echte Spaces anlegen.
//
// Timo, 30.09.2026: Im Login standen die Gruppen flach durcheinander, in der
// Demo geordnet nach Netzwerken, Projekten und Stiftungen. "Unsere gehen
// vor." Dieser Vorgang legt die Spaces der Beispielwelt als echte an, mit
// dem, der ihn ausloest, als Verwalter. Sie synchronisieren danach ueber das
// Relay wie jeder andere Space.
//
// Was er NICHT tut: bestehende Gruppen anderer Menschen umhaengen. Das
// macht ihr Verwalter im Zahnrad (Netzwerk und Art), und Antons Gruppen nur
// mit Anton.
//
// Den Plan (Reihenfolge, Verweise, was ausgelassen wird) rechnet
// `netzwerkePlanen` in @trustdonation/core; hier wird nur geschrieben.
import { useEffect, useState } from "react"
import type { DataInterface, Group, GroupManager } from "@real-life-stack/data-interface"
import { netzwerkePlanen, type NetzwerkPlan } from "@trustdonation/core"

export type NetzwerkeStand =
  | { art: "ruht" }
  | { art: "fragt"; plan: NetzwerkPlan }
  | { art: "laeuft"; fertig: number; gesamt: number }
  | { art: "fertig"; angelegt: string[]; vorhanden: string[]; fehler: string[] }
  | { art: "fehler"; text: string }

type Schreiber = Pick<GroupManager, "getGroups"> & Partial<Pick<GroupManager, "createGroup" | "updateGroup">>

/** Den Plan gegen die Spaces rechnen, die es im Konto schon gibt. */
export async function netzwerkePlanHolen(connector: Schreiber): Promise<NetzwerkPlan> {
  const { musterGroups } = await import("@trustdonation/core/musterdaten")
  let vorhanden: Group[] = []
  try {
    vorhanden = await connector.getGroups()
  } catch {
    // Ohne Liste wird alles angelegt; verdoppelt wird dann hoechstens, was
    // der Mensch ohnehin sieht und loeschen kann.
  }
  return netzwerkePlanen(musterGroups, vorhanden)
}

/**
 * Legt die Spaces des Plans an, jedes Netzwerk vor seinen Spaces, und setzt
 * `data.network` auf die neue Id. Ein Fehler bei einem Space haelt die
 * uebrigen nicht auf; ein Space, dessen Netzwerk fehlt, entsteht ohne
 * Verweis.
 *
 * Zwei Schritte je Space, mit Absicht: Der WoT-Connector nimmt beim Anlegen
 * nur Name und Modul-Liste (`createGroup`, wot-connector.ts), alle weiteren
 * Angaben (Netzwerk, Verweis, Farbe, Bild, Arten) reisen erst mit
 * `updateGroup`. `module` ist die Grundausstattung der App; ohne sie setzte
 * der Connector seine eigene (Feed, Kanban, Kalender, Karte).
 */
export async function netzwerkeSchreiben(
  connector: Schreiber,
  plan: NetzwerkPlan,
  melden: (stand: NetzwerkeStand) => void,
  module?: readonly string[],
): Promise<void> {
  if (typeof connector.createGroup !== "function") {
    melden({ art: "fehler", text: "Dieser Connector kann keine Spaces anlegen." })
    return
  }
  const ids = new Map<string, string>()
  const angelegt: string[] = []
  const vorhanden: string[] = []
  const fehler: string[] = []
  for (const [nr, s] of plan.schritte.entries()) {
    melden({ art: "laeuft", fertig: nr, gesamt: plan.schritte.length })
    if (s.vorhandenId) {
      ids.set(s.musterId, s.vorhandenId)
      vorhanden.push(s.name)
      continue
    }
    const netz = s.netzwerkVon ? ids.get(s.netzwerkVon) : undefined
    try {
      const data = { ...s.data, ...(netz ? { network: netz } : {}) }
      const g = await connector.createGroup(s.name, { ...data, ...(module ? { modules: [...module] } : {}) })
      ids.set(s.musterId, g.id)
      if (typeof connector.updateGroup === "function") await connector.updateGroup(g.id, { data })
      angelegt.push(s.name)
    } catch {
      fehler.push(s.name)
    }
  }
  melden({ art: "fertig", angelegt, vorhanden, fehler })
}

/** Der Vorgang mit Rueckfrage. Angelegte Spaces lassen sich nicht mit einem Klick zuruecknehmen. */
export function NetzwerkeImport({
  connector, aktiv, beispielwelt, module, onZu,
}: {
  connector: DataInterface | null
  aktiv: boolean
  beispielwelt?: boolean
  /** Die Grundausstattung der App fuer jeden neuen Space. */
  module?: readonly string[]
  onZu: () => void
}) {
  const [stand, setStand] = useState<NetzwerkeStand>({ art: "ruht" })

  useEffect(() => {
    if (!aktiv || stand.art !== "ruht") return
    if (beispielwelt) {
      setStand({ art: "fehler", text: "Die Demo zeigt diese Netzwerke schon. Zum Übernehmen zuerst über „Login“ anmelden." })
      return
    }
    if (!connector) {
      setStand({ art: "fehler", text: "Keine Verbindung." })
      return
    }
    void netzwerkePlanHolen(connector as never).then((plan) => setStand({ art: "fragt", plan }))
  }, [aktiv, beispielwelt, connector, stand.art])

  if (!aktiv || stand.art === "ruht") return null
  const schliessen = () => { setStand({ art: "ruht" }); onZu() }
  const neu = stand.art === "fragt" ? stand.plan.schritte.filter((s) => !s.vorhandenId) : []

  return (
    <div role="dialog" aria-modal="true" aria-label="Netzwerke übernehmen" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-lg">
        {stand.art === "fragt" && (
          <>
            <h2 className="text-lg font-semibold">Unsere Netzwerke übernehmen</h2>
            {neu.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Alle Netzwerke gibt es in deinem Konto schon.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Diese Spaces entstehen in deinem Konto, geordnet wie in der Demo. Du verwaltest sie und lädst die anderen ein.
                </p>
                <ul className="mt-3 flex flex-col gap-1 text-sm">
                  {stand.plan.schritte.map((s) => {
                    const netz = stand.plan.schritte.find((n) => n.musterId === s.netzwerkVon)?.name
                    return (
                      <li key={s.musterId} className={s.vorhandenId ? "text-muted-foreground line-through" : ""}>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">
                          {s.data.isNetwork ? " · Netzwerk" : ""}{netz ? ` · in ${netz}` : ""}{s.vorhandenId ? " · gibt es schon" : ""}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {stand.plan.ausgelassen.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Bleibt in der Demo: {stand.plan.ausgelassen.map((a) => `${a.name} (${a.grund})`).join(", ")}.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Bestehende Gruppen bleiben, wie sie sind. Ihr Verwalter ordnet sie im Zahnrad einem Netzwerk zu.
                </p>
              </>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={schliessen} className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">
                {neu.length === 0 ? "Schließen" : "Abbrechen"}
              </button>
              {neu.length > 0 && (
                <button type="button" onClick={() => void netzwerkeSchreiben(connector as never, stand.plan, setStand, module)}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                  {neu.length} Spaces anlegen
                </button>
              )}
            </div>
          </>
        )}

        {stand.art === "laeuft" && (
          <>
            <h2 className="text-lg font-semibold">Wird angelegt …</h2>
            <p className="mt-2 text-sm text-muted-foreground">{stand.fertig} von {stand.gesamt}</p>
            <p className="mt-3 text-xs text-muted-foreground">Das Fenster bitte offen lassen.</p>
          </>
        )}

        {stand.art === "fertig" && (
          <>
            <h2 className="text-lg font-semibold">Fertig</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {stand.angelegt.length > 0 ? `Angelegt: ${stand.angelegt.join(", ")}.` : "Nichts neu angelegt."}
              {stand.vorhanden.length > 0 ? ` Schon da: ${stand.vorhanden.join(", ")}.` : ""}
            </p>
            {stand.fehler.length > 0 && (
              <p className="mt-2 text-sm text-destructive">Nicht angelegt: {stand.fehler.join(", ")}. Ein zweiter Lauf versucht es erneut.</p>
            )}
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={schliessen} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Schließen</button>
            </div>
          </>
        )}

        {stand.art === "fehler" && (
          <>
            <h2 className="text-lg font-semibold">Nicht möglich</h2>
            <p className="mt-2 text-sm text-muted-foreground">{stand.text}</p>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={schliessen} className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">Schließen</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
