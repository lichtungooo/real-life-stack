// Das eigene Profil eines Menschen (DEFINITION 9.1), die Bindung.
//
// Gespeichert als `person`-Eintrag nach Antons Spec 12: `id = DID`, im
// persönlichen Space, alle Angaben plus `data.sichtbar`. Was öffentlich ist
// (Name, Über mich, Bild), geht zusätzlich über Antons `updateMyProfile`
// an Kopfzeile, Kontakte und Profil-Server. Ohne persönlichen Space (die
// Beispielwelt) zeigt die Seite ein Musterprofil zum Ansehen.

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { hasProfile, type DataInterface, type Item, type User } from "@real-life-stack/data-interface"
import { MUSTER_PERSON, oeffentlichesProfil, sichtbarkeitSetzen, type Sichtbarkeit } from "@trustdonation/core"

const PersonProfilVoll = lazy(() => import("@trustdonation/ui/person-profil"))

type Roh = Record<string, unknown>
type Schreiber = {
  createItem?: (i: unknown, o?: { group?: string }) => Promise<unknown>
  updateItem?: (id: string, u: Partial<Item>) => Promise<unknown>
}

/**
 * Der erste Stand, solange es noch keinen Eintrag gibt: was Antons Profil
 * heute zeigt, mit den Stufen, die es heute schon hat. So löscht das erste
 * Speichern kein veröffentlichtes „Über mich“.
 */
export function ersterStand(ich: { id: string; displayName?: string; avatarUrl?: string } | null, bio: string): Roh {
  if (!ich) return {}
  const d: Roh = { did: ich.id, displayName: ich.displayName ?? "", sichtbar: { displayName: "oeffentlich" } as Record<string, Sichtbarkeit> }
  const sichtbar = d.sichtbar as Record<string, Sichtbarkeit>
  if (bio.trim()) { d.bio = bio; sichtbar.bio = "oeffentlich" }
  if (ich.avatarUrl) { d.avatarUrl = ich.avatarUrl; sichtbar.avatarUrl = "oeffentlich" }
  return d
}

/** Das eigene Profil speichern: Eintrag anlegen oder ändern, Öffentliches an Antons Profil. */
export async function meinProfilSpeichern(connector: DataInterface, a: { did: string; persoenlich: string; vorhanden: boolean; data: Roh }): Promise<void> {
  const c = connector as unknown as Schreiber
  const data = { ...a.data, did: a.did }
  if (a.vorhanden) {
    if (typeof c.updateItem !== "function") throw new Error("Dieser Zugang kann nichts ändern.")
    await c.updateItem(a.did, { data })
  } else {
    if (typeof c.createItem !== "function") throw new Error("Dieser Zugang kann nichts anlegen.")
    await c.createItem({ id: a.did, type: "person", createdBy: a.did, data }, { group: a.persoenlich })
  }
  if (hasProfile(connector)) await connector.updateMyProfile(oeffentlichesProfil(data))
}

/** Der persönliche Space, wenn der Connector einen hat (WoT). Ohne: kein eigenes Profil-Item. */
export function persoenlicherSpace(connector: DataInterface): string | null {
  const c = connector as unknown as Schreiber & { getPersonalGroupId?: () => string | null }
  return typeof c.createItem === "function" && typeof c.getPersonalGroupId === "function" ? c.getPersonalGroupId() : null
}

/**
 * Der Connector kommt von der App (wie bei Antons Profil-Panel), nicht aus
 * einem Haken: Das Panel steht auch dort, wo kein Connector-Rahmen ist.
 */
export function MeinProfil({ connector, persoenlich, ich, bio, offen, onOffen, profilLink }: {
  connector: DataInterface
  /** `null`: Beispielwelt, dort ein Musterprofil zum Ansehen. */
  persoenlich: string | null
  ich: User | null | undefined
  bio: string
  offen: boolean
  onOffen: (an: boolean) => void
  profilLink: string
}) {
  const did = ich?.id ?? ""
  const [eintrag, setEintrag] = useState<Item | null>(null)
  useEffect(() => {
    if (!did || !persoenlich) return
    const o = connector.observeItem(did)
    setEintrag(o.current)
    return o.subscribe((i) => setEintrag(i))
  }, [connector, did, persoenlich])
  const kann = Boolean(did && persoenlich)
  const vorhanden = Boolean(eintrag && eintrag.type === "person")
  const daten = useMemo<Roh>(() => (vorhanden ? (eintrag!.data as Roh) : ersterStand(ich ?? null, bio)), [vorhanden, eintrag, ich, bio])

  const speichern = useCallback(async (data: Roh) => {
    if (!persoenlich) throw new Error("Ohne persönlichen Space lässt sich das Profil nicht speichern.")
    await meinProfilSpeichern(connector, { did, persoenlich, vorhanden, data })
  }, [connector, did, persoenlich, vorhanden])

  const bearbeitung = useMemo(() => (kann ? { daten, speichern: (aenderung: Roh) => speichern((aenderung.data ?? {}) as Roh) } : undefined), [kann, daten, speichern])
  const onSichtbarkeit = useCallback((feld: string, stufe: Sichtbarkeit) => speichern(sichtbarkeitSetzen(daten, feld, stufe)), [daten, speichern])

  return (
    <Suspense fallback={null}>
      {kann ? (
        <PersonProfilVoll daten={daten} offen={offen} onOffen={onOffen} bearbeitung={bearbeitung} onSichtbarkeit={onSichtbarkeit} did={did} profilLink={profilLink} />
      ) : (
        <PersonProfilVoll daten={MUSTER_PERSON as Roh} offen={offen} onOffen={onOffen}
          hinweis={<p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm shadow-sm dark:bg-amber-950">Beispielwelt: ein Musterprofil zum Ansehen. Dein eigenes Profil legst du an, wenn du eingeloggt bist.</p>} />
      )}
    </Suspense>
  )
}
