// Die Musterdaten des Prototyps trustdonation.
//
// Sie liegen hier und nicht in `packages/data-interface/data/`, weil sie uns
// gehören und nicht dem Baukasten. Beide Connectoren nehmen einen Seed als
// Parameter; damit bleiben Antons Demodaten unberührt, und ein Update seiner
// Beispiele trifft uns nicht (ARCHITEKTUR Teil 4, NAEHTE Abschnitt C).
//
// Der Inhalt stammt aus Timos eigenen Spaces vom Dev-Server, ausgelesen aus
// den Yjs-Dokumenten der IndexedDB. Nichts ist hinzuerfunden (Entscheidung E3).
import type { Item, Group, User } from "@real-life-stack/data-interface"

import rohGroups from "../daten/groups.json" with { type: "json" }
import rohUsers from "../daten/users.json" with { type: "json" }
import rohGroupMembers from "../daten/group-members.json" with { type: "json" }
import rohGroupItems from "../daten/group-items.json" with { type: "json" }
import rohItems from "../daten/items.json" with { type: "json" }

/**
 * Ein Item, wie es in der JSON-Datei steht.
 *
 * TypeScript leitet aus einem leeren JSON-Array `never[]` ab. Der Prototyp
 * bringt die Spaces mit und laesst die Inhalte leer, darum steht die Form
 * hier ausdruecklich statt aus der Datei erraten.
 */
type RohItem = Omit<Item, "data" | "relations"> & {
  data?: unknown
  relations?: unknown
}

export const musterGroups: Group[] = rohGroups as unknown as Group[]
export const musterUsers: User[] = rohUsers as unknown as User[]
export const musterGroupMembers: Record<string, string[]> = rohGroupMembers
export const musterGroupItems: Record<string, string[]> = rohGroupItems

export const musterItems: Item[] = (rohItems as unknown as RohItem[]).map((item) => ({
  ...item,
  data: item.data as Record<string, unknown>,
  relations: item.relations as Item["relations"],
}))

/**
 * Der vollstaendige Satz, wie ihn `new LocalConnector(...)` und
 * `new MockConnector(...)` erwarten.
 */
export const musterdaten = {
  items: musterItems,
  groups: musterGroups,
  users: musterUsers,
  groupMembers: musterGroupMembers,
  groupItems: musterGroupItems,
}

/**
 * Wird mit den Daten hochgesetzt.
 *
 * Der local-Connector legt seinen Stand in der IndexedDB ab und laedt ihn beim
 * naechsten Besuch statt der Musterdaten. Ohne eine neue Zahl sieht niemand
 * die Aenderung, der die App schon einmal offen hatte. Das ist dreimal
 * passiert, bevor es hier stand.
 *
 * Solange `SEED_VERSION` im local-Connector die Wahrheit ist (Naht A5), muss
 * dort dieselbe Zahl stehen. Faellt die Naht, zaehlt allein diese hier.
 */
export const MUSTERDATEN_VERSION = 12
