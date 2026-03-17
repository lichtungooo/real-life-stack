# Reaktivität im Real Life Stack — Spezifikation & AI-Instruktionen

> Verbindliche Referenz für alle Entwickler und AI-Assistenten.
> Gilt für: data-interface, local-connector, wot-connector, toolkit (Hooks), UI-Module.

---

## 1. Datenfluss — Die Schichten

```
┌─────────────────────────────────────────────────────────┐
│  wot-core          Subscribable<T>                       │
│  (YjsStorageAdapter, YjsReplicationAdapter)              │
│  → watchContacts(), watchSpaces(), onRemoteUpdate()      │
├─────────────────────────────────────────────────────────┤
│  Connector          Observable<T>                        │
│  (WotConnector, LocalConnector)                          │
│  → observe(), observeItem(), observeGroups()             │
│  → notifyAllObservers() bei jeder Mutation               │
├─────────────────────────────────────────────────────────┤
│  Hooks              React State                          │
│  (useItems, useItem, useGroups, useContacts)             │
│  → useState + useEffect + subscribe                      │
├─────────────────────────────────────────────────────────┤
│  UI-Module          Reine Darstellung                    │
│  (Feed, Kanban, Kalender, Karte)                         │
│  → Empfangen Daten via Hooks, kein eigener State         │
└─────────────────────────────────────────────────────────┘
```

**Jede Schicht hat genau eine Verantwortung. Keine Schicht wird übersprungen.**

| Schicht | Verantwortung | Darf NICHT |
|---------|--------------|-----------|
| **wot-core** | CRDT-Events, Subscribable bereitstellen | UI kennen, React importieren |
| **Connector** | Subscribable → Observable übersetzen, Filter anwenden, Includes auflösen | Direkt React State setzen |
| **Hooks** | Observable → React State, Capability-Checks | Eigene Datenhaltung, Business-Logik |
| **UI-Module** | Rendern, User-Interaktion | Connector direkt ansprechen, Daten fetchen |

---

## 2. Observable-Vertrag

### Erstellen und Nutzen

```typescript
// Im Connector: Observable erstellen
import { createObservable } from "@real-life-stack/data-interface"

const obs = createObservable<Item[]>([])  // Startwert
obs.set(newItems)                          // Feuert alle Subscriber
obs.current                                // Synchroner Zugriff auf aktuellen Wert
obs.destroy()                              // Alle Subscriber entfernen (in dispose())
```

### Im Hook: Subscribe

```typescript
// RICHTIG — so sehen alle Hooks aus
function useItems(filter?: ItemFilter) {
  const connector = useConnector()
  const observable = useMemo(() => connector.observe(filter ?? {}), [connector, filterKey])
  const [data, setData] = useState<Item[]>(observable.current)

  useEffect(() => {
    setData(observable.current)        // Sync bei Observable-Wechsel
    return observable.subscribe(setData) // Live-Updates
  }, [observable])

  return { data }
}
```

### Regeln

- `observe(filter)` gibt eine **stabile Referenz** zurück (gecached per `JSON.stringify(filter)`)
- Der Connector ruft `notifyAllObservers()` bei **jeder** Mutation (create, update, delete)
- Hooks nutzen `useState` + `useEffect` mit `subscribe` — **NICHT** `useSyncExternalStore`
- Observables werden in `dispose()` via `destroy()` aufgeräumt

---

## 3. Relations & Kommentare

### Grundprinzip

Kommentare, Reaktionen und andere unbegrenzt wachsende Daten sind **eigene Items** mit einer Relation zum Eltern-Item. Sie werden NICHT in `data` eingebettet.

| Einbetten (in `data`) | Eigenes Item (mit Relation) |
|---|---|
| Gehört fest zum Item | Ist eigenständig |
| Wenige, begrenzte Einträge | Kann unbegrenzt wachsen |
| Kein eigener Lifecycle | Editierbar, löschbar, eigener Autor |

### Kommentar erstellen

```typescript
await connector.createItem({
  type: "comment",
  createdBy: currentUser.id,
  data: { content: "Mein Kommentar" },
  relations: [{ predicate: "commentOn", target: "item:post-abc" }]
})
// → notifyAllObservers() feuert → alle Observers updaten automatisch
```

### Kommentare laden — Inline via Include

```typescript
const posts = connector.observe({
  type: "post",
  include: [
    { predicate: "commentOn", as: "comments", limit: 3 }
  ]
})
// → posts[0]._included?.comments = [neuester, ..., ältester]
```

Die `include`-Direktive nutzt intern **Reverse-Lookup** (`direction: "to"`) — sie findet alle Items, deren Relation auf den Post zeigt.

### Sortierung

Includes liefern Ergebnisse **newest-first** (`createdAt` absteigend). Das ist absichtlich so:
- `limit: 3` ergibt "die 3 neuesten Kommentare" — der häufigste Use Case
- Die UI kann nach Bedarf umsortieren (z.B. chronologisch für Chat-artige Kommentare)

```typescript
// Connector liefert: [neuester, ..., ältester]
const comments = post._included?.comments

// UI sortiert chronologisch wenn nötig:
const chronological = [...comments].reverse()
```

### Paging — "Mehr laden" via offset

```typescript
// Erste 3 Kommentare
connector.observe({
  type: "post",
  include: [{ predicate: "commentOn", as: "comments", limit: 3 }]
})

// Nächste 3 (offset = 3, also überspringe die ersten 3)
connector.observe({
  type: "post",
  include: [{ predicate: "commentOn", as: "comments", limit: 3, offset: 3 }]
})
```

`offset` wird **nach** der Sortierung angewendet: erst newest-first sortieren, dann `offset` überspringen, dann `limit` anwenden.

### Einzelnes Item mit Kommentaren — observeItem

```typescript
// Post-Detailseite: Post mit den 10 neuesten Kommentaren beobachten
const post$ = connector.observeItem("post-abc", {
  include: [{ predicate: "commentOn", as: "comments", limit: 10 }]
})
// → post$.current._included?.comments = [neuester, ..., ältester]
// → Feuert automatisch wenn ein neuer Kommentar erstellt wird
```

### Kommentare laden — Explizit

```typescript
// Alle Kommentare zu einem Post (Reverse-Lookup)
const comments = await connector.getRelatedItems("post-abc", "commentOn", { direction: "to" })

// Forward-Lookup (Item's eigene Relations auflösen)
const targets = await connector.getRelatedItems("task-1", "assignedTo")
// → direction: "from" ist der Default
```

### Direction-Semantik

| Direction | Bedeutung | Beispiel |
|-----------|-----------|---------|
| `"from"` (Default) | Item hat Relation → finde Targets | Task → assignedTo → User |
| `"to"` | Finde Items die auf mich zeigen | Post ← commentOn ← Comments |
| `"both"` | Beides | Alle Verbindungen eines Items |

### Prädikat-Katalog

| Prädikat | Bedeutung | Richtung |
|----------|-----------|----------|
| `commentOn` | Kommentar zu Item | Comment → Post |
| `childOf` | Sub-Item | Sub-Task → Task |
| `assignedTo` | Zugewiesen an Person | Task → User |
| `likedBy` | Gefällt einer Person | Post → User |
| `blocks` | Blockiert anderes Item | Task → Task |
| `relatedTo` | Allgemeine Verknüpfung | Item → Item |
| `locatedAt` | Verortung | Event → Place |

### Shared Helper (data-interface)

Beide Connectors nutzen dieselben Helper — **keine eigene Implementierung in Connectors!**

```typescript
import { findRelatedItems, resolveIncludes } from "@real-life-stack/data-interface"

// Connector-intern:
findRelatedItems(itemId, allItems, predicate?, options?)
resolveIncludes(items, allItems, includeDirectives)
```

---

## 4. Gruppen-Kontext

- Items leben in der **aktuellen Gruppe/Space**
- `setCurrentGroup(id)` wechselt den Kontext → `notifyAllObservers()` mit neuem Doc
- Observers bekommen automatisch die Items der neuen Gruppe
- Feature-Items (`type: "feature"`) sind gruppenübergreifend sichtbar

### Metagruppe (geplant)

Eine übergreifende Gruppe, die alle anderen Gruppen aggregiert. Scope: `"aggregate"` im LocalConnector. Details werden noch definiert.

---

## 5. Capability-Checks

Hooks und UI **müssen** Capabilities prüfen, bevor sie Features nutzen:

```typescript
import { isWritable, hasRelations, hasGroups, hasContacts } from "@real-life-stack/data-interface"

// Im Hook oder UI:
if (isWritable(connector)) {
  await connector.createItem(...)
}

if (hasRelations(connector)) {
  const comments = await connector.getRelatedItems(...)
}
```

**Nie annehmen, dass ein Connector alles kann.** Ein CalDAV-Import-Connector hat kein `createItem`. Ein Read-Only-Feed hat keine Relations.

---

## 6. Anti-Patterns — Was AI NICHT tun darf

### ❌ Direkte wot-core Imports in UI

```typescript
// FALSCH — überspringt den Connector
import { getYjsPersonalDoc } from "@real-life/wot-core"
const doc = getYjsPersonalDoc()
```

```typescript
// RICHTIG — über Connector + Hooks
const { data } = useItems({ type: "contact" })
```

### ❌ Polling / setTimeout als Reaktivitäts-Ersatz

```typescript
// FALSCH — Polling statt Observable
useEffect(() => {
  const interval = setInterval(async () => {
    const items = await connector.getItems(filter)
    setData(items)
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

```typescript
// RICHTIG — Observable subscribe
useEffect(() => {
  return observable.subscribe(setData)
}, [observable])
```

### ❌ Eigene Datenhaltung in Hooks

```typescript
// FALSCH — eigener Cache neben dem Connector
const [cache, setCache] = useState<Map<string, Item>>(new Map())
// ...manuelle Cache-Verwaltung...
```

```typescript
// RICHTIG — Connector ist Single Source of Truth
const { data } = useItems(filter)  // Connector cached intern
```

### ❌ forceUpdate / Key-Reset statt Subscription

```typescript
// FALSCH — UI neu mounten statt Observable nutzen
const [key, setKey] = useState(0)
const refresh = () => setKey(k => k + 1)
return <Feed key={key} />
```

### ❌ Relations in data einbetten statt als eigene Items

```typescript
// FALSCH — Kommentare eingebettet
await connector.updateItem("post-1", {
  data: { ...post.data, comments: [...post.data.comments, newComment] }
})
```

```typescript
// RICHTIG — Kommentar als eigenes Item mit Relation
await connector.createItem({
  type: "comment",
  createdBy: user.id,
  data: { content: "..." },
  relations: [{ predicate: "commentOn", target: "item:post-1" }]
})
```

### ❌ Include-Logik im Hook oder UI auflösen

```typescript
// FALSCH — manueller Reverse-Lookup in der UI
const { data: posts } = useItems({ type: "post" })
const { data: allComments } = useItems({ type: "comment" })
const commentsForPost = allComments.filter(c =>
  c.relations?.some(r => r.target === `item:${post.id}`)
)
```

```typescript
// RICHTIG — Connector löst Includes auf
const { data: posts } = useItems({
  type: "post",
  include: [{ predicate: "commentOn", as: "comments", limit: 3 }]
})
// posts[0]._included?.comments ist automatisch befüllt
```

---

## 7. Subscription-Cleanup

Jeder Connector **muss** in `dispose()` alle Subscriptions aufräumen:

```typescript
async dispose(): Promise<void> {
  // 1. Alle externen Subscriptions unsubsciben
  this.spacesSubscriptionUnsub?.()
  this.personalDocUnsub?.()
  this.contactsUnsub?.()
  this.verificationsUnsub?.()
  this.attestationsUnsub?.()

  // 2. Netzwerk-Adapter stoppen
  await this.replication?.stop()
  await this.wsAdapter?.disconnect()

  // 3. Alle Observables destroyen
  for (const obs of this.itemObservables.values()) obs.destroy()
  this.itemObservables.clear()
  // ...
}
```

**Regel:** Jede `subscribe()`-Rückgabe wird in einer Member-Variable gespeichert und in `dispose()` aufgerufen.

---

## 8. Checkliste für neue Features

Wenn du ein neues reaktives Feature baust (z.B. Kommentare, Reaktionen, Benachrichtigungen):

- [ ] Daten als **eigene Items** mit Relations modelliert (nicht eingebettet)?
- [ ] `getRelatedItems()` mit korrekter `direction` genutzt?
- [ ] `include`-Direktive in `getItems()`/`observe()` statt manueller Filterung?
- [ ] Nur über Connector + Hooks auf Daten zugegriffen (kein wot-core Bypass)?
- [ ] Capability-Check (`isWritable`, `hasRelations`, etc.) vor Nutzung?
- [ ] Subscription-Cleanup in `dispose()`?
- [ ] Kein Polling, kein setTimeout, kein forceUpdate?
