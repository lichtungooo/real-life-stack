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
│  → observe(), observeItem(), observeRelatedItems()       │
│  → notifyAllObservers() bei jeder Mutation               │
├─────────────────────────────────────────────────────────┤
│  Hooks              React State                          │
│  (useItems, useItem, useRelatedItems, useGroups)         │
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
| **Connector** | Subscribable → Observable übersetzen, Filter anwenden | Direkt React State setzen |
| **Hooks** | Observable → React State, Capability-Checks | Eigene Datenhaltung, Business-Logik |
| **UI-Module** | Rendern, User-Interaktion | Connector direkt ansprechen, Daten fetchen |

---

## 2. Item-Typ — createdAt ist ein ISO-String

```typescript
interface Item {
  id: string
  type: string
  createdAt: string    // ISO-8601 (z.B. "2026-03-17T14:30:00.000Z")
  createdBy: string
  data: Record<string, unknown>
  relations?: Relation[]
  _source?: string
}
```

**`createdAt` ist ein String, KEIN Date-Objekt.** Das vermeidet Serialisierungs-Overhead (kein `new Date()` bei jedem Lesen). Wenn die UI ein Date braucht: `new Date(item.createdAt)`.

ISO-8601 Strings sortieren lexikographisch korrekt: `"2026-01-01" < "2026-01-02"`.

---

## 3. Observable-Vertrag

### Erstellen und Nutzen

```typescript
import { createObservable } from "@real-life-stack/data-interface"

const obs = createObservable<Item[]>([])  // Startwert
obs.set(newItems)                          // Feuert alle Subscriber
obs.current                                // Synchroner Zugriff auf aktuellen Wert
obs.destroy()                              // Alle Subscriber entfernen (in dispose())
```

### Im Hook: Subscribe

```typescript
function useItems(filter?: ItemFilter) {
  const connector = useConnector()
  const observable = useMemo(() => connector.observe(filter ?? {}), [connector, filterKey])
  const [data, setData] = useState<Item[]>(observable.current)

  useEffect(() => {
    setData(observable.current)
    return observable.subscribe(setData)
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

## 4. Relations & Kommentare

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
```

### Kommentare reaktiv laden — useRelatedItems (PRIMÄRER WEG)

Jede Komponente die Related Items anzeigt, nutzt `useRelatedItems` **in der Kind-Komponente**:

```typescript
// Feed.tsx — lädt nur Posts
function Feed() {
  const { data: posts } = useItems({ type: "post" })
  return posts.map(post => <PostCard key={post.id} post={post} />)
}

// PostCard.tsx — lädt eigene Kommentare
function PostCard({ post }: { post: Item }) {
  const { data: comments } = useRelatedItems(post.id, "commentOn", { direction: "to" })
  return (
    <div>
      <h2>{post.data.title}</h2>
      {comments.map(c => <Comment key={c.id} comment={c} />)}
    </div>
  )
}
```

**Warum in der Kind-Komponente?** Wenn ein Kommentar zu Post 5 kommt, re-rendert nur PostCard 5 — nicht der ganze Feed. Das ist erheblich performanter als alle Kommentare aller Posts bei jeder Änderung neu zu berechnen.

### Kommentare laden — Explizit (für einmalige Abfragen)

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

Alle Connectors nutzen denselben Helper — **keine eigene Implementierung in Connectors!**

```typescript
import { findRelatedItems } from "@real-life-stack/data-interface"

// Connector-intern (in getRelatedItems + notifyObservers):
findRelatedItems(itemId, allItems, predicate?, options?)
```

---

## 5. Gruppen-Kontext

- Items leben in der **aktuellen Gruppe/Space**
- `setCurrentGroup(id)` wechselt den Kontext → `notifyAllObservers()` mit neuem Doc
- `observeCurrentGroup()` ist reaktiv — feuert bei Gruppenwechsel und Metadaten-Änderungen
- Feature-Items (`type: "feature"`) sind gruppenübergreifend sichtbar

---

## 6. Capability-Checks

Hooks und UI **müssen** Capabilities prüfen, bevor sie Features nutzen:

```typescript
import { isWritable, hasRelations, hasGroups, hasContacts } from "@real-life-stack/data-interface"

if (isWritable(connector)) {
  await connector.createItem(...)
}

if (hasRelations(connector)) {
  const obs = connector.observeRelatedItems(itemId, "commentOn", { direction: "to" })
}
```

**Nie annehmen, dass ein Connector alles kann.**

---

## 7. Anti-Patterns — Was AI NICHT tun darf

### ❌ Direkte wot-core Imports in UI

```typescript
// FALSCH
import { getYjsPersonalDoc } from "@real-life/wot-core"

// RICHTIG
const { data } = useItems({ type: "contact" })
```

### ❌ Polling / setTimeout als Reaktivitäts-Ersatz

```typescript
// FALSCH
useEffect(() => {
  const interval = setInterval(async () => {
    const items = await connector.getItems(filter)
    setData(items)
  }, 1000)
  return () => clearInterval(interval)
}, [])

// RICHTIG
useEffect(() => {
  return observable.subscribe(setData)
}, [observable])
```

### ❌ Relations in data einbetten

```typescript
// FALSCH
await connector.updateItem("post-1", {
  data: { ...post.data, comments: [...post.data.comments, newComment] }
})

// RICHTIG
await connector.createItem({
  type: "comment",
  createdBy: user.id,
  data: { content: "..." },
  relations: [{ predicate: "commentOn", target: "item:post-1" }]
})
```

### ❌ Manueller Reverse-Lookup in der UI

```typescript
// FALSCH — alle Kommentare laden und manuell filtern
const { data: allComments } = useItems({ type: "comment" })
const commentsForPost = allComments.filter(c =>
  c.relations?.some(r => r.target === `item:${post.id}`)
)

// RICHTIG — useRelatedItems in der Kind-Komponente
function PostCard({ post }) {
  const { data: comments } = useRelatedItems(post.id, "commentOn", { direction: "to" })
}
```

### ❌ createdAt als Date behandeln

```typescript
// FALSCH
item.createdAt.toLocaleDateString("de-DE")

// RICHTIG
new Date(item.createdAt).toLocaleDateString("de-DE")
```

---

## 8. Subscription-Cleanup

Jeder Connector **muss** in `dispose()` alle Subscriptions aufräumen:

```typescript
async dispose(): Promise<void> {
  this.spacesSubscriptionUnsub?.()
  this.personalDocUnsub?.()
  this.contactsUnsub?.()
  this.verificationsUnsub?.()
  this.attestationsUnsub?.()
  this.profileUnsub?.()

  await this.replication?.stop()
  await this.wsAdapter?.disconnect()

  for (const obs of this.itemObservables.values()) obs.destroy()
  for (const obs of this.relatedObservables.values()) obs.destroy()
  for (const obs of this.memberObservables.values()) obs.destroy()
  this.itemObservables.clear()
  this.relatedObservables.clear()
  this.memberObservables.clear()
}
```

---

## 9. Checkliste für neue Features

Wenn du ein neues reaktives Feature baust (z.B. Kommentare, Reaktionen, Benachrichtigungen):

- [ ] Daten als **eigene Items** mit Relations modelliert (nicht eingebettet)?
- [ ] `useRelatedItems()` in der Kind-Komponente statt manuellem Lookup?
- [ ] `getRelatedItems()` mit korrekter `direction` genutzt?
- [ ] `createdAt` als ISO-String behandelt (kein `new Date()` beim Erstellen)?
- [ ] Nur über Connector + Hooks auf Daten zugegriffen (kein wot-core Bypass)?
- [ ] Capability-Check (`isWritable`, `hasRelations`, etc.) vor Nutzung?
- [ ] Subscription-Cleanup in `dispose()`?
- [ ] Kein Polling, kein setTimeout, kein forceUpdate?
