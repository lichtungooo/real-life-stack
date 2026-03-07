import * as store from "../store.js"
import { subscribe } from "../pubsub.js"

export const Subscription = {
  itemsChanged: {
    subscribe: async function* (_root: unknown, args: { filter?: { type?: string } }) {
      // Emit current state immediately
      yield { itemsChanged: store.getItems(args.filter ?? undefined) }

      // Then listen for changes
      for await (const _event of subscribe("ITEMS_CHANGED")) {
        yield { itemsChanged: store.getItems(args.filter ?? undefined) }
      }
    },
  },

  itemChanged: {
    subscribe: async function* (_root: unknown, args: { id: string }) {
      yield { itemChanged: store.getItem(args.id) }

      for await (const event of subscribe("ITEM_CHANGED")) {
        if (event.itemId === args.id) {
          yield { itemChanged: store.getItem(args.id) }
        }
      }
    },
  },

  authStateChanged: {
    subscribe: async function* () {
      yield { authStateChanged: store.getAuthState() }

      for await (const _event of subscribe("AUTH_STATE_CHANGED")) {
        yield { authStateChanged: store.getAuthState() }
      }
    },
  },
}
