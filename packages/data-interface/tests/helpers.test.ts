import { describe, it, expect, vi } from "vitest"
import { createObservable, matchesFilter, findRelatedItems, resolveIncludes } from "../src/base-connector.js"
import type { Item, ItemFilter } from "../src/index.js"

// Helper: create a minimal Item
function createItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    type: "task",
    createdAt: new Date("2026-01-01"),
    createdBy: "user-1",
    data: {},
    ...overrides,
  }
}

describe("createObservable", () => {
  it("has initial value as current", () => {
    const obs = createObservable(42)
    expect(obs.current).toBe(42)
  })

  it("updates current on set", () => {
    const obs = createObservable("hello")
    obs.set("world")
    expect(obs.current).toBe("world")
  })

  it("notifies subscribers on set", () => {
    const obs = createObservable(0)
    const values: number[] = []
    obs.subscribe((v) => values.push(v))

    obs.set(1)
    obs.set(2)
    obs.set(3)

    expect(values).toEqual([1, 2, 3])
  })

  it("does not notify after unsubscribe", () => {
    const obs = createObservable(0)
    const values: number[] = []
    const unsub = obs.subscribe((v) => values.push(v))

    obs.set(1)
    unsub()
    obs.set(2)

    expect(values).toEqual([1])
  })

  it("supports multiple subscribers", () => {
    const obs = createObservable(0)
    const a: number[] = []
    const b: number[] = []
    obs.subscribe((v) => a.push(v))
    obs.subscribe((v) => b.push(v))

    obs.set(5)

    expect(a).toEqual([5])
    expect(b).toEqual([5])
  })

  it("clears all subscribers on destroy", () => {
    const obs = createObservable(0)
    const values: number[] = []
    obs.subscribe((v) => values.push(v))

    obs.destroy()
    obs.set(1)

    expect(values).toEqual([])
  })
})

describe("matchesFilter", () => {
  it("matches all items when filter is empty", () => {
    const item = createItem()
    expect(matchesFilter(item, {})).toBe(true)
  })

  it("filters by type", () => {
    const task = createItem({ type: "task" })
    const event = createItem({ type: "event" })

    expect(matchesFilter(task, { type: "task" })).toBe(true)
    expect(matchesFilter(event, { type: "task" })).toBe(false)
  })

  it("filters by createdBy", () => {
    const item = createItem({ createdBy: "user-1" })

    expect(matchesFilter(item, { createdBy: "user-1" })).toBe(true)
    expect(matchesFilter(item, { createdBy: "user-2" })).toBe(false)
  })

  it("filters by hasField — single field", () => {
    const item = createItem({ data: { title: "Hello" } })

    expect(matchesFilter(item, { hasField: ["title"] })).toBe(true)
    expect(matchesFilter(item, { hasField: ["description"] })).toBe(false)
  })

  it("filters by hasField — multiple fields (all must exist)", () => {
    const item = createItem({ data: { title: "Hello", status: "done" } })

    expect(matchesFilter(item, { hasField: ["title", "status"] })).toBe(true)
    expect(matchesFilter(item, { hasField: ["title", "priority"] })).toBe(false)
  })

  it("combines type + createdBy + hasField", () => {
    const item = createItem({
      type: "task",
      createdBy: "user-1",
      data: { title: "Hello", status: "todo" },
    })

    expect(matchesFilter(item, { type: "task", createdBy: "user-1", hasField: ["status"] })).toBe(true)
    expect(matchesFilter(item, { type: "event", createdBy: "user-1", hasField: ["status"] })).toBe(false)
    expect(matchesFilter(item, { type: "task", createdBy: "user-2", hasField: ["status"] })).toBe(false)
    expect(matchesFilter(item, { type: "task", createdBy: "user-1", hasField: ["priority"] })).toBe(false)
  })
})

describe("findRelatedItems", () => {
  const post = createItem({ id: "post-1", type: "post" })
  const comment1 = createItem({
    id: "comment-1",
    type: "comment",
    createdAt: new Date("2026-01-01"),
    relations: [{ predicate: "commentOn", target: "item:post-1" }],
  })
  const comment2 = createItem({
    id: "comment-2",
    type: "comment",
    createdAt: new Date("2026-01-02"),
    relations: [{ predicate: "commentOn", target: "item:post-1" }],
  })
  const task = createItem({
    id: "task-1",
    type: "task",
    relations: [{ predicate: "assignedTo", target: "global:user-1" }],
  })
  const allItems = [post, comment1, comment2, task]

  it("forward lookup (default) — finds targets of item's relations", () => {
    const result = findRelatedItems("task-1", allItems, "assignedTo")
    expect(result).toEqual([])  // user-1 is not an item
  })

  it("reverse lookup (to) — finds items pointing to me", () => {
    const result = findRelatedItems("post-1", allItems, "commentOn", { direction: "to" })
    expect(result).toHaveLength(2)
    expect(result.map((i) => i.id)).toContain("comment-1")
    expect(result.map((i) => i.id)).toContain("comment-2")
  })

  it("reverse lookup without predicate — finds all items pointing to me", () => {
    const result = findRelatedItems("post-1", allItems, undefined, { direction: "to" })
    expect(result).toHaveLength(2)
  })

  it("reverse lookup returns empty for unrelated item", () => {
    const result = findRelatedItems("task-1", allItems, "commentOn", { direction: "to" })
    expect(result).toEqual([])
  })

  it("both direction — forward + reverse", () => {
    const itemWithRelation = createItem({
      id: "post-2",
      type: "post",
      relations: [{ predicate: "relatedTo", target: "item:post-1" }],
    })
    const comment3 = createItem({
      id: "comment-3",
      type: "comment",
      relations: [{ predicate: "commentOn", target: "item:post-2" }],
    })
    const items = [post, itemWithRelation, comment3]

    const result = findRelatedItems("post-2", items, undefined, { direction: "both" })
    // Forward: post-1 (via relatedTo), Reverse: comment-3 (via commentOn)
    expect(result).toHaveLength(2)
    expect(result.map((i) => i.id)).toContain("post-1")
    expect(result.map((i) => i.id)).toContain("comment-3")
  })
})

describe("resolveIncludes", () => {
  const post = createItem({ id: "post-1", type: "post" })
  const comment1 = createItem({
    id: "comment-1",
    type: "comment",
    createdAt: new Date("2026-01-01"),
    relations: [{ predicate: "commentOn", target: "item:post-1" }],
  })
  const comment2 = createItem({
    id: "comment-2",
    type: "comment",
    createdAt: new Date("2026-01-02"),
    relations: [{ predicate: "commentOn", target: "item:post-1" }],
  })
  const comment3 = createItem({
    id: "comment-3",
    type: "comment",
    createdAt: new Date("2026-01-03"),
    relations: [{ predicate: "commentOn", target: "item:post-1" }],
  })
  const allItems = [post, comment1, comment2, comment3]

  it("resolves included items via reverse lookup", () => {
    const result = resolveIncludes([post], allItems, [
      { predicate: "commentOn", as: "comments" },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]._included?.comments).toHaveLength(3)
  })

  it("respects limit", () => {
    const result = resolveIncludes([post], allItems, [
      { predicate: "commentOn", as: "comments", limit: 2 },
    ])
    expect(result[0]._included?.comments).toHaveLength(2)
  })

  it("sorts newest first", () => {
    const result = resolveIncludes([post], allItems, [
      { predicate: "commentOn", as: "comments" },
    ])
    const ids = result[0]._included?.comments?.map((i) => i.id)
    expect(ids).toEqual(["comment-3", "comment-2", "comment-1"])
  })

  it("returns empty array when no related items exist", () => {
    const lonely = createItem({ id: "lonely", type: "post" })
    const result = resolveIncludes([lonely], allItems, [
      { predicate: "commentOn", as: "comments" },
    ])
    expect(result[0]._included?.comments).toEqual([])
  })

  it("respects offset (skip first N)", () => {
    const result = resolveIncludes([post], allItems, [
      { predicate: "commentOn", as: "comments", offset: 1 },
    ])
    // Sorted newest first: comment-3, comment-2, comment-1
    // offset 1 → skip comment-3 → [comment-2, comment-1]
    expect(result[0]._included?.comments).toHaveLength(2)
    expect(result[0]._included?.comments?.map((i) => i.id)).toEqual(["comment-2", "comment-1"])
  })

  it("combines offset + limit for paging", () => {
    const result = resolveIncludes([post], allItems, [
      { predicate: "commentOn", as: "comments", offset: 1, limit: 1 },
    ])
    // offset 1 → skip comment-3, limit 1 → [comment-2]
    expect(result[0]._included?.comments).toHaveLength(1)
    expect(result[0]._included?.comments?.[0].id).toBe("comment-2")
  })

  it("offset beyond count returns empty", () => {
    const result = resolveIncludes([post], allItems, [
      { predicate: "commentOn", as: "comments", offset: 10 },
    ])
    expect(result[0]._included?.comments).toEqual([])
  })
})
