import { describe, it, expect } from "vitest"
import {
  isWritable,
  hasRelations,
  hasGroups,
  isAuthenticatable,
  hasMultiSource,
  hasContacts,
  hasMessaging,
  hasSignedClaims,
  hasProfile,
  hasEventListener,
} from "../src/index.js"
import type { DataInterface } from "../src/index.js"

// Minimal DataInterface stub
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

describe("Type Guards", () => {
  describe("isWritable", () => {
    it("returns false for plain DataInterface", () => {
      expect(isWritable(createStub())).toBe(false)
    })

    it("returns false when only some write methods present", () => {
      expect(isWritable(createStub({ createItem: () => {} }))).toBe(false)
    })

    it("returns true when all write methods present", () => {
      const connector = createStub({
        createItem: async () => ({}),
        updateItem: async () => ({}),
        deleteItem: async () => {},
      })
      expect(isWritable(connector)).toBe(true)
    })
  })

  describe("hasRelations", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasRelations(createStub())).toBe(false)
    })

    it("returns true when getRelatedItems and observeRelatedItems are present", () => {
      expect(hasRelations(createStub({
        getRelatedItems: async () => [],
        observeRelatedItems: () => ({ current: [], subscribe: () => () => {} }),
      }))).toBe(true)
    })
  })

  describe("hasGroups", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasGroups(createStub())).toBe(false)
    })

    it("returns false when only some group methods present", () => {
      expect(hasGroups(createStub({ getGroups: async () => [] }))).toBe(false)
    })

    it("returns true when all required group methods present", () => {
      const connector = createStub({
        getGroups: async () => [],
        observeGroups: () => ({ current: [], subscribe: () => () => {} }),
        getMembers: async () => [],
      })
      expect(hasGroups(connector)).toBe(true)
    })
  })

  describe("isAuthenticatable", () => {
    it("returns false for plain DataInterface", () => {
      expect(isAuthenticatable(createStub())).toBe(false)
    })

    it("returns true when auth methods present", () => {
      const connector = createStub({
        getAuthState: () => ({ current: { status: "unauthenticated" }, subscribe: () => () => {} }),
        authenticate: async () => ({}),
      })
      expect(isAuthenticatable(connector)).toBe(true)
    })
  })

  describe("hasMultiSource", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasMultiSource(createStub())).toBe(false)
    })

    it("returns true when source methods present", () => {
      const connector = createStub({
        getSources: () => [],
        getActiveSource: () => ({}),
      })
      expect(hasMultiSource(connector)).toBe(true)
    })
  })

  describe("hasContacts", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasContacts(createStub())).toBe(false)
    })

    it("returns true when contact methods present", () => {
      const connector = createStub({
        getContacts: async () => [],
        observeContacts: () => ({ current: [], subscribe: () => () => {} }),
        addContact: async () => ({}),
      })
      expect(hasContacts(connector)).toBe(true)
    })
  })

  describe("hasMessaging", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasMessaging(createStub())).toBe(false)
    })

    it("returns true when messaging methods present", () => {
      const connector = createStub({
        getRelayState: () => ({ current: "disconnected", subscribe: () => () => {} }),
        getOutboxPendingCount: () => ({ current: 0, subscribe: () => () => {} }),
      })
      expect(hasMessaging(connector)).toBe(true)
    })
  })

  describe("hasSignedClaims", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasSignedClaims(createStub())).toBe(false)
    })

    it("returns true when claim methods present", () => {
      const connector = createStub({
        createClaim: async () => ({}),
        observeClaims: () => ({ current: [], subscribe: () => () => {} }),
        createChallenge: async () => ({}),
      })
      expect(hasSignedClaims(connector)).toBe(true)
    })
  })

  describe("hasProfile", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasProfile(createStub())).toBe(false)
    })

    it("returns true when profile methods present", () => {
      const connector = createStub({
        getMyProfile: async () => null,
        observeMyProfile: () => ({ current: null, subscribe: () => () => {} }),
        syncProfile: async () => {},
      })
      expect(hasProfile(connector)).toBe(true)
    })
  })

  describe("hasEventListener", () => {
    it("returns false for plain DataInterface", () => {
      expect(hasEventListener(createStub())).toBe(false)
    })

    it("returns true when onIncomingEvent is present", () => {
      const connector = createStub({
        onIncomingEvent: () => () => {},
      })
      expect(hasEventListener(connector)).toBe(true)
    })
  })
})
