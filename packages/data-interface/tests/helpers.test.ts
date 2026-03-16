import { describe, it, expect, vi } from "vitest"
import { createObservable, matchesFilter } from "../src/base-connector.js"
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
