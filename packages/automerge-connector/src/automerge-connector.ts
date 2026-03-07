import { Repo, type DocHandle, type DocumentId } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import type {
  DataInterface,
  Item,
  ItemFilter,
  Group,
  User,
  Observable,
  AuthState,
  AuthMethod,
  RelatedItemsOptions,
  Source,
} from "@real-life-stack/data-interface"
import { demoItems, demoGroups, demoUsers, demoGroupMembers } from "@real-life-stack/data-interface/demo-data"
import type { AutomergeRootDoc, AutomergeGroupDoc } from "./types.js"
import { createObservable } from "./observable.js"

const ROOT_DOC_KEY = "rls-automerge-root-doc-url"

// Items assigned to each group based on demo-data comments
const GROUP_ITEMS: Record<string, string[]> = {
  "group-1": ["task-1", "task-2", "task-3", "task-4", "task-5", "event-1", "event-2"],
  "group-2": ["post-1", "post-2", "post-3", "place-1", "place-2"],
  "group-3": [],
}

function matchesFilter(item: Item, filter: ItemFilter): boolean {
  if (filter.type && item.type !== filter.type) return false
  if (filter.createdBy && item.createdBy !== filter.createdBy) return false
  if (filter.hasField) {
    for (const field of filter.hasField) {
      if (!(field in item.data)) return false
    }
  }
  return true
}

export class AutomergeConnector implements DataInterface {
  private repo!: Repo
  private rootHandle!: DocHandle<AutomergeRootDoc>
  private groupHandles = new Map<string, DocHandle<AutomergeGroupDoc>>()
  private currentGroup: Group | null = null
  private authStateObservable = createObservable<AuthState>({ status: "loading" })
  private itemObservables = new Map<string, ReturnType<typeof createObservable<Item[]>>>()
  private singleItemObservables = new Map<string, ReturnType<typeof createObservable<Item | null>>>()
  private changeListeners: Array<() => void> = []

  async init(): Promise<void> {
    this.repo = new Repo({
      storage: new IndexedDBStorageAdapter(),
    })

    // Load or create root document
    const savedUrl = localStorage.getItem(ROOT_DOC_KEY)
    if (savedUrl) {
      this.rootHandle = this.repo.find<AutomergeRootDoc>(savedUrl as DocumentId)
      await this.rootHandle.whenReady()

      // Load existing group handles
      const doc = this.rootHandle.docSync()
      if (doc) {
        for (const group of doc.groups) {
          const handle = this.repo.find<AutomergeGroupDoc>(group.docUrl as DocumentId)
          this.groupHandles.set(group.id, handle)
        }
      }
    } else {
      await this.seedDemoData()
    }

    // Set initial state
    const doc = this.rootHandle.docSync()!
    this.currentGroup = doc.groups.length > 0
      ? { id: doc.groups[0].id, name: doc.groups[0].name, data: { ...doc.groups[0].data } }
      : null

    const currentUser = doc.currentUserId
      ? doc.users.find((u) => u.id === doc.currentUserId) ?? null
      : null
    this.authStateObservable.set(
      currentUser
        ? { status: "authenticated", user: currentUser }
        : { status: "unauthenticated" },
    )

    // Listen for changes on all group handles
    for (const [groupId, handle] of this.groupHandles) {
      this.listenToGroupChanges(groupId, handle)
    }
  }

  async dispose(): Promise<void> {
    for (const cleanup of this.changeListeners) cleanup()
    this.changeListeners = []
    for (const obs of this.itemObservables.values()) obs.destroy()
    this.itemObservables.clear()
    for (const obs of this.singleItemObservables.values()) obs.destroy()
    this.singleItemObservables.clear()
    this.authStateObservable.destroy()
  }

  // --- Groups ---

  async getGroups(): Promise<Group[]> {
    const doc = this.rootHandle.docSync()
    if (!doc) return []
    return doc.groups.map((g) => ({ id: g.id, name: g.name, data: { ...g.data } }))
  }

  getCurrentGroup(): Group | null {
    return this.currentGroup
  }

  setCurrentGroup(id: string): void {
    const doc = this.rootHandle.docSync()
    if (!doc) return
    const group = doc.groups.find((g) => g.id === id)
    if (group) {
      this.currentGroup = { id: group.id, name: group.name, data: { ...group.data } }
    }
  }

  async createGroup(name: string, data?: Record<string, unknown>): Promise<Group> {
    const groupId = `group-${crypto.randomUUID().slice(0, 8)}`

    // Create group document
    const groupHandle = this.repo.create<AutomergeGroupDoc>()
    groupHandle.change((d) => {
      d.groupId = groupId
      d.items = []
      d.members = []
      const doc = this.rootHandle.docSync()
      if (doc?.currentUserId) {
        d.members.push(doc.currentUserId)
      }
    })
    await groupHandle.whenReady()
    this.groupHandles.set(groupId, groupHandle)
    this.listenToGroupChanges(groupId, groupHandle)

    // Add to root document
    this.rootHandle.change((d) => {
      d.groups.push({
        id: groupId,
        name,
        data: data ?? {},
        docUrl: groupHandle.url,
      })
    })

    return { id: groupId, name, data }
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    const doc = this.rootHandle.docSync()
    if (!doc) throw new Error(`Group not found: ${id}`)
    const idx = doc.groups.findIndex((g) => g.id === id)
    if (idx === -1) throw new Error(`Group not found: ${id}`)

    this.rootHandle.change((d) => {
      if (updates.name !== undefined) d.groups[idx].name = updates.name
      if (updates.data !== undefined) {
        Object.assign(d.groups[idx].data, updates.data)
      }
    })

    const updated = this.rootHandle.docSync()!.groups[idx]
    return { id: updated.id, name: updated.name, data: { ...updated.data } }
  }

  async deleteGroup(id: string): Promise<void> {
    const doc = this.rootHandle.docSync()
    if (!doc) return
    const idx = doc.groups.findIndex((g) => g.id === id)
    if (idx === -1) return

    this.rootHandle.change((d) => {
      d.groups.splice(idx, 1)
    })

    this.groupHandles.delete(id)

    if (this.currentGroup?.id === id) {
      const newDoc = this.rootHandle.docSync()!
      this.currentGroup = newDoc.groups.length > 0
        ? { id: newDoc.groups[0].id, name: newDoc.groups[0].name, data: { ...newDoc.groups[0].data } }
        : null
    }
  }

  async getMembers(groupId: string): Promise<User[]> {
    const handle = this.groupHandles.get(groupId)
    if (!handle) return []
    const groupDoc = handle.docSync()
    if (!groupDoc) return []

    const rootDoc = this.rootHandle.docSync()!
    return groupDoc.members
      .map((memberId) => rootDoc.users.find((u) => u.id === memberId))
      .filter((u): u is User => u !== undefined)
  }

  async inviteMember(groupId: string, userId: string): Promise<void> {
    const handle = this.groupHandles.get(groupId)
    if (!handle) return
    handle.change((d) => {
      if (!d.members.includes(userId)) {
        d.members.push(userId)
      }
    })
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const handle = this.groupHandles.get(groupId)
    if (!handle) return
    handle.change((d) => {
      const idx = d.members.indexOf(userId)
      if (idx !== -1) d.members.splice(idx, 1)
    })
  }

  // --- Items ---

  async getItems(filter?: ItemFilter): Promise<Item[]> {
    const items = this.getAllItems()
    if (!filter) return items
    return items.filter((item) => matchesFilter(item, filter))
  }

  async getItem(id: string): Promise<Item | null> {
    const items = this.getAllItems()
    return items.find((i) => i.id === id) ?? null
  }

  observe(filter: ItemFilter): Observable<Item[]> {
    const key = JSON.stringify(filter)
    if (!this.itemObservables.has(key)) {
      const items = this.getAllItems().filter((item) => matchesFilter(item, filter))
      this.itemObservables.set(key, createObservable(items))
    }
    return this.itemObservables.get(key)!
  }

  observeItem(id: string): Observable<Item | null> {
    if (!this.singleItemObservables.has(id)) {
      const item = this.getAllItems().find((i) => i.id === id) ?? null
      this.singleItemObservables.set(id, createObservable(item))
    }
    return this.singleItemObservables.get(id)!
  }

  async createItem(item: Omit<Item, "id" | "createdAt">): Promise<Item> {
    if (!this.currentGroup) throw new Error("No current group selected")

    const handle = this.groupHandles.get(this.currentGroup.id)
    if (!handle) throw new Error(`Group handle not found: ${this.currentGroup.id}`)

    const newId = `item-${crypto.randomUUID().slice(0, 8)}`
    const createdAt = new Date().toISOString()

    handle.change((d) => {
      d.items.push({
        id: newId,
        type: item.type,
        createdAt,
        createdBy: item.createdBy,
        data: { ...item.data },
        relations: item.relations ? [...item.relations] : undefined,
      })
    })

    this.notifyObservers()

    return {
      id: newId,
      type: item.type,
      createdAt,
      createdBy: item.createdBy,
      data: item.data,
      relations: item.relations,
    }
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    for (const [, handle] of this.groupHandles) {
      const doc = handle.docSync()
      if (!doc) continue
      const idx = doc.items.findIndex((i) => i.id === id)
      if (idx === -1) continue

      handle.change((d) => {
        if (updates.data !== undefined) {
          Object.assign(d.items[idx].data, updates.data)
        }
        if (updates.relations !== undefined) {
          d.items[idx].relations = updates.relations ? [...updates.relations] : undefined
        }
        if (updates.type !== undefined) {
          d.items[idx].type = updates.type
        }
      })

      this.notifyObservers()

      const updated = handle.docSync()!.items[idx]
      return this.materializeItem(updated)
    }
    throw new Error(`Item not found: ${id}`)
  }

  async deleteItem(id: string): Promise<void> {
    for (const [, handle] of this.groupHandles) {
      const doc = handle.docSync()
      if (!doc) continue
      const idx = doc.items.findIndex((i) => i.id === id)
      if (idx === -1) continue

      handle.change((d) => {
        d.items.splice(idx, 1)
      })

      this.notifyObservers()
      return
    }
  }

  // --- Relations ---

  async getRelatedItems(
    itemId: string,
    predicate?: string,
    _options?: RelatedItemsOptions,
  ): Promise<Item[]> {
    const item = await this.getItem(itemId)
    if (!item?.relations) return []

    const matchingRelations = predicate
      ? item.relations.filter((r) => r.predicate === predicate)
      : item.relations

    const targetIds = matchingRelations
      .map((r) => r.target.replace(/^(item:|global:)/, ""))
      .filter((t) => !t.startsWith("space:"))

    const allItems = this.getAllItems()
    return allItems.filter((i) => targetIds.includes(i.id))
  }

  // --- Users ---

  async getCurrentUser(): Promise<User | null> {
    const doc = this.rootHandle.docSync()
    if (!doc?.currentUserId) return null
    return doc.users.find((u) => u.id === doc.currentUserId) ?? null
  }

  async getUser(id: string): Promise<User | null> {
    const doc = this.rootHandle.docSync()
    if (!doc) return null
    return doc.users.find((u) => u.id === id) ?? null
  }

  // --- Auth ---

  getAuthState(): Observable<AuthState> {
    return this.authStateObservable
  }

  getAuthMethods(): AuthMethod[] {
    return [{ method: "local", label: "Local Login" }]
  }

  async authenticate(_method: string, _credentials: unknown): Promise<User> {
    const doc = this.rootHandle.docSync()!
    const user = doc.users[0]
    if (!user) throw new Error("No users available")

    this.rootHandle.change((d) => {
      d.currentUserId = user.id
    })

    this.authStateObservable.set({ status: "authenticated", user })
    return user
  }

  async logout(): Promise<void> {
    this.rootHandle.change((d) => {
      d.currentUserId = null
    })
    this.authStateObservable.set({ status: "unauthenticated" })
  }

  // --- Sources ---

  getSources(): Source[] {
    return [{ id: "automerge", name: "Automerge (Local)", connector: this }]
  }

  getActiveSource(): Source {
    return { id: "automerge", name: "Automerge (Local)", connector: this }
  }

  setActiveSource(_sourceId: string): void {
    // Single source
  }

  // --- Internal ---

  private async seedDemoData(): Promise<void> {
    // Create root document
    this.rootHandle = this.repo.create<AutomergeRootDoc>()
    this.rootHandle.change((d) => {
      d.groups = []
      d.users = []
      d.currentUserId = demoUsers[0]?.id ?? null

      // Seed users
      for (const user of demoUsers) {
        d.users.push({ id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl })
      }
    })

    // Create group documents
    for (const group of demoGroups) {
      const groupHandle = this.repo.create<AutomergeGroupDoc>()
      const groupItemIds = GROUP_ITEMS[group.id] ?? []
      const groupItems = demoItems.filter((item) => groupItemIds.includes(item.id))
      const members = demoGroupMembers[group.id] ?? []

      groupHandle.change((d) => {
        d.groupId = group.id
        d.items = []
        d.members = []

        for (const member of members) {
          d.members.push(member)
        }

        for (const item of groupItems) {
          d.items.push({
            id: item.id,
            type: item.type,
            createdAt: item.createdAt,
            createdBy: item.createdBy,
            data: { ...item.data },
            relations: item.relations ? [...item.relations] : undefined,
          })
        }
      })

      await groupHandle.whenReady()
      this.groupHandles.set(group.id, groupHandle)

      this.rootHandle.change((d) => {
        d.groups.push({
          id: group.id,
          name: group.name,
          data: (group.data ?? {}) as Record<string, unknown>,
          docUrl: groupHandle.url,
        })
      })
    }

    // Also seed the feature item into group-1
    const featureItem = demoItems.find((i) => i.id === "feature-mock")
    if (featureItem) {
      const group1Handle = this.groupHandles.get("group-1")
      if (group1Handle) {
        group1Handle.change((d) => {
          d.items.push({
            id: "feature-automerge",
            type: featureItem.type,
            createdAt: featureItem.createdAt,
            createdBy: featureItem.createdBy,
            data: { ...featureItem.data },
          })
        })
      }
    }

    await this.rootHandle.whenReady()
    localStorage.setItem(ROOT_DOC_KEY, this.rootHandle.url)
  }

  private getAllItems(): Item[] {
    const items: Item[] = []
    for (const [, handle] of this.groupHandles) {
      const doc = handle.docSync()
      if (!doc) continue
      for (const item of doc.items) {
        items.push(this.materializeItem(item))
      }
    }
    return items
  }

  private materializeItem(raw: AutomergeGroupDoc["items"][number]): Item {
    return {
      id: raw.id,
      type: raw.type,
      createdAt: raw.createdAt,
      createdBy: raw.createdBy,
      data: { ...raw.data },
      relations: raw.relations ? [...raw.relations] : undefined,
    }
  }

  private notifyObservers(): void {
    const allItems = this.getAllItems()
    for (const [key, observable] of this.itemObservables) {
      const filter: ItemFilter = JSON.parse(key)
      const filtered = allItems.filter((item) => matchesFilter(item, filter))
      observable.set(filtered)
    }
    for (const [id, observable] of this.singleItemObservables) {
      const item = allItems.find((i) => i.id === id) ?? null
      observable.set(item)
    }
  }

  private listenToGroupChanges(groupId: string, handle: DocHandle<AutomergeGroupDoc>): void {
    const listener = () => this.notifyObservers()
    handle.on("change", listener)
    this.changeListeners.push(() => handle.off("change", listener))
  }
}
