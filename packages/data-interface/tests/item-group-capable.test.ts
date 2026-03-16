import { describe, it, expect } from "vitest"
import type { DataInterface, ItemFilter, Item, Observable } from "../src/index.js"

// Test will fail until ItemGroupCapable + hasItemGroups are implemented
// import { hasItemGroups } from "../src/index.js"
// import type { ItemGroupCapable } from "../src/index.js"

describe("ItemGroupCapable", () => {
  // Helper: minimal DataInterface stub
  function createStub(extra: Record<string, unknown> = {}): DataInterface {
    return {
      init: async () => {},
      dispose: async () => {},
      getItems: async () => [],
      getItem: async () => null,
      observe: () => ({ current: [], subscribe: () => () => {} }),
      observeItem: () => ({ current: null, subscribe: () => () => {} }),
      ...extra,
    }
  }

  describe("hasItemGroups type guard", () => {
    it("returns false for a plain DataInterface", async () => {
      const { hasItemGroups } = await import("../src/index.js")
      const connector = createStub()
      expect(hasItemGroups(connector)).toBe(false)
    })

    it("returns false when only getItemGroupId is present", async () => {
      const { hasItemGroups } = await import("../src/index.js")
      const connector = createStub({
        getItemGroupId: () => null,
      })
      expect(hasItemGroups(connector)).toBe(false)
    })

    it("returns false when only moveItemToGroup is present", async () => {
      const { hasItemGroups } = await import("../src/index.js")
      const connector = createStub({
        moveItemToGroup: async () => {},
      })
      expect(hasItemGroups(connector)).toBe(false)
    })

    it("returns true when both methods are present", async () => {
      const { hasItemGroups } = await import("../src/index.js")
      const connector = createStub({
        getItemGroupId: () => null,
        moveItemToGroup: async () => {},
      })
      expect(hasItemGroups(connector)).toBe(true)
    })
  })

  describe("ItemGroupCapable contract", () => {
    it("getItemGroupId returns null for unknown items", async () => {
      const { hasItemGroups } = await import("../src/index.js")
      const connector = createStub({
        getItemGroupId: (id: string) => null,
        moveItemToGroup: async () => {},
      })

      if (hasItemGroups(connector)) {
        expect(connector.getItemGroupId("nonexistent")).toBeNull()
      } else {
        throw new Error("Type guard should return true")
      }
    })

    it("getItemGroupId returns group ID for assigned items", async () => {
      const { hasItemGroups } = await import("../src/index.js")
      const assignments = new Map<string, string>([["item-1", "group-a"]])
      const connector = createStub({
        getItemGroupId: (id: string) => assignments.get(id) ?? null,
        moveItemToGroup: async () => {},
      })

      if (hasItemGroups(connector)) {
        expect(connector.getItemGroupId("item-1")).toBe("group-a")
      }
    })

    it("moveItemToGroup moves an item to a new group", async () => {
      const { hasItemGroups } = await import("../src/index.js")
      const assignments = new Map<string, string>([["item-1", "group-a"]])
      const connector = createStub({
        getItemGroupId: (id: string) => assignments.get(id) ?? null,
        moveItemToGroup: async (itemId: string, targetGroupId: string) => {
          assignments.set(itemId, targetGroupId)
        },
      })

      if (hasItemGroups(connector)) {
        expect(connector.getItemGroupId("item-1")).toBe("group-a")
        await connector.moveItemToGroup("item-1", "group-b")
        expect(connector.getItemGroupId("item-1")).toBe("group-b")
      }
    })
  })
})
