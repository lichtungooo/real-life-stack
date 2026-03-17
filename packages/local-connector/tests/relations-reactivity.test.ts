import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Item } from "@real-life-stack/data-interface"

// Mock idb-keyval (no IndexedDB in Node)
vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  createStore: vi.fn().mockReturnValue({}),
}))

// Mock BroadcastChannel (not available in Node)
vi.stubGlobal("BroadcastChannel", class {
  onmessage = null
  postMessage() {}
  close() {}
})

import { LocalConnector } from "../src/local-connector.js"

function makeItem(overrides: Partial<Item> & { type: string; createdBy: string }): Omit<Item, "id" | "createdAt"> {
  return {
    data: {},
    ...overrides,
  }
}

describe("LocalConnector — Relations Reactivity", () => {
  let connector: LocalConnector

  beforeEach(async () => {
    connector = new LocalConnector({
      items: [],
      groups: [{ id: "g1", name: "Test Group" }],
      users: [{ id: "user-1", displayName: "Alice" }],
      groupMembers: { g1: ["user-1"] },
    })
    await connector.init()
    await connector.authenticate("local", {})
  })

  it("observe with include resolves comments reactively", async () => {
    // 1. Create a post
    const post = await connector.createItem(
      makeItem({ type: "post", createdBy: "user-1", data: { title: "Hello" } })
    )

    // 2. Subscribe to posts with comments included
    const updates: Item[][] = []
    const observable = connector.observe({
      type: "post",
      include: [{ predicate: "commentOn", as: "comments" }],
    })
    observable.subscribe((items) => updates.push(items))

    // 3. Create a comment on the post
    await connector.createItem(
      makeItem({
        type: "comment",
        createdBy: "user-1",
        data: { content: "Nice post!" },
        relations: [{ predicate: "commentOn", target: `item:${post.id}` }],
      })
    )

    // 4. The observer should have fired with resolved _included.comments
    const lastUpdate = updates[updates.length - 1]
    const updatedPost = lastUpdate.find((i) => i.id === post.id)
    expect(updatedPost).toBeDefined()
    expect(updatedPost!._included?.comments).toHaveLength(1)
    expect(updatedPost!._included?.comments?.[0].data.content).toBe("Nice post!")
  })

  it("observe with include + limit only shows N newest comments", async () => {
    const post = await connector.createItem(
      makeItem({ type: "post", createdBy: "user-1", data: { title: "Hello" } })
    )

    // Create 3 comments with different timestamps
    for (let i = 1; i <= 3; i++) {
      await connector.createItem(
        makeItem({
          type: "comment",
          createdBy: "user-1",
          data: { content: `Comment ${i}` },
          relations: [{ predicate: "commentOn", target: `item:${post.id}` }],
        })
      )
    }

    // Observe with limit: 2
    const observable = connector.observe({
      type: "post",
      include: [{ predicate: "commentOn", as: "comments", limit: 2 }],
    })

    const posts = observable.current
    const observed = posts.find((i) => i.id === post.id)
    expect(observed!._included?.comments).toHaveLength(2)
  })

  it("observe with include + offset + limit enables paging", async () => {
    const post = await connector.createItem(
      makeItem({ type: "post", createdBy: "user-1", data: { title: "Paging Test" } })
    )

    // Create 5 comments
    const commentIds: string[] = []
    for (let i = 1; i <= 5; i++) {
      const comment = await connector.createItem(
        makeItem({
          type: "comment",
          createdBy: "user-1",
          data: { content: `Comment ${i}` },
          relations: [{ predicate: "commentOn", target: `item:${post.id}` }],
        })
      )
      commentIds.push(comment.id)
    }

    // Page 1: first 2 (newest)
    const page1 = connector.observe({
      type: "post",
      include: [{ predicate: "commentOn", as: "comments", limit: 2 }],
    })
    const p1 = page1.current.find((i) => i.id === post.id)
    expect(p1!._included?.comments).toHaveLength(2)

    // Page 2: next 2
    const page2 = connector.observe({
      type: "post",
      include: [{ predicate: "commentOn", as: "comments", limit: 2, offset: 2 }],
    })
    const p2 = page2.current.find((i) => i.id === post.id)
    expect(p2!._included?.comments).toHaveLength(2)

    // Pages should not overlap
    const page1Ids = p1!._included!.comments.map((c) => c.id)
    const page2Ids = p2!._included!.comments.map((c) => c.id)
    expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false)
  })

  it("observeItem with include resolves comments", async () => {
    const post = await connector.createItem(
      makeItem({ type: "post", createdBy: "user-1", data: { title: "Detail" } })
    )

    await connector.createItem(
      makeItem({
        type: "comment",
        createdBy: "user-1",
        data: { content: "First!" },
        relations: [{ predicate: "commentOn", target: `item:${post.id}` }],
      })
    )

    const observable = connector.observeItem(post.id, {
      include: [{ predicate: "commentOn", as: "comments" }],
    })

    const observed = observable.current
    expect(observed).not.toBeNull()
    expect(observed!._included?.comments).toHaveLength(1)
    expect(observed!._included?.comments?.[0].data.content).toBe("First!")
  })

  it("observeItem fires when a new comment is added", async () => {
    const post = await connector.createItem(
      makeItem({ type: "post", createdBy: "user-1", data: { title: "Live" } })
    )

    const observable = connector.observeItem(post.id, {
      include: [{ predicate: "commentOn", as: "comments" }],
    })

    // Initially no comments
    expect(observable.current!._included?.comments).toHaveLength(0)

    // Track updates
    const updates: (Item | null)[] = []
    observable.subscribe((item) => updates.push(item))

    // Add a comment
    await connector.createItem(
      makeItem({
        type: "comment",
        createdBy: "user-1",
        data: { content: "New comment!" },
        relations: [{ predicate: "commentOn", target: `item:${post.id}` }],
      })
    )

    // Observer should have fired
    const lastUpdate = updates[updates.length - 1]
    expect(lastUpdate).not.toBeNull()
    expect(lastUpdate!._included?.comments).toHaveLength(1)
    expect(lastUpdate!._included?.comments?.[0].data.content).toBe("New comment!")
  })

  it("getRelatedItems with direction 'to' finds incoming relations", async () => {
    const post = await connector.createItem(
      makeItem({ type: "post", createdBy: "user-1", data: { title: "Target" } })
    )

    await connector.createItem(
      makeItem({
        type: "comment",
        createdBy: "user-1",
        data: { content: "I point to the post" },
        relations: [{ predicate: "commentOn", target: `item:${post.id}` }],
      })
    )

    // Default (forward) — post has no outgoing commentOn relations
    const forward = await connector.getRelatedItems(post.id, "commentOn")
    expect(forward).toHaveLength(0)

    // Reverse — find items pointing to post
    const reverse = await connector.getRelatedItems(post.id, "commentOn", { direction: "to" })
    expect(reverse).toHaveLength(1)
    expect(reverse[0].data.content).toBe("I point to the post")
  })
})
