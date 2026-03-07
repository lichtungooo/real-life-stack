import * as store from "../store.js"

export const Query = {
  items: (_root: unknown, args: { filter?: { type?: string; hasField?: string[]; createdBy?: string } }) => {
    return store.getItems(args.filter ?? undefined)
  },

  item: (_root: unknown, args: { id: string }) => {
    return store.getItem(args.id)
  },

  groups: () => {
    return store.getGroups()
  },

  members: (_root: unknown, args: { groupId: string }) => {
    return store.getMembers(args.groupId)
  },

  relatedItems: (_root: unknown, args: { itemId: string; predicate?: string }) => {
    return store.getRelatedItems(args.itemId, args.predicate ?? undefined)
  },

  currentUser: () => {
    return store.getCurrentUser()
  },

  user: (_root: unknown, args: { id: string }) => {
    return store.getUser(args.id)
  },

  currentGroup: () => {
    return store.getCurrentGroup()
  },

  authState: () => {
    return store.getAuthState()
  },

  authMethods: () => {
    return store.getAuthMethods()
  },

  sources: () => {
    return store.getSources()
  },

  activeSource: () => {
    return store.getActiveSource()
  },
}
