import * as store from "../store.js"

export const Mutation = {
  createItem: (_root: unknown, args: { input: { type: string; createdBy: string; data: Record<string, unknown>; relations?: { predicate: string; target: string; meta?: Record<string, unknown> }[] } }) => {
    return store.createItem(args.input)
  },

  updateItem: (_root: unknown, args: { id: string; input: { data?: Record<string, unknown>; relations?: { predicate: string; target: string; meta?: Record<string, unknown> }[] } }) => {
    return store.updateItem(args.id, args.input)
  },

  deleteItem: (_root: unknown, args: { id: string }) => {
    return store.deleteItem(args.id)
  },

  createGroup: (_root: unknown, args: { name: string; data?: Record<string, unknown> }) => {
    return store.createGroup(args.name, args.data ?? undefined)
  },

  updateGroup: (_root: unknown, args: { id: string; input: { name?: string; data?: Record<string, unknown> } }) => {
    return store.updateGroup(args.id, args.input)
  },

  deleteGroup: (_root: unknown, args: { id: string }) => {
    return store.deleteGroup(args.id)
  },

  inviteMember: (_root: unknown, args: { groupId: string; userId: string }) => {
    return store.inviteMember(args.groupId, args.userId)
  },

  removeMember: (_root: unknown, args: { groupId: string; userId: string }) => {
    return store.removeMember(args.groupId, args.userId)
  },

  setCurrentGroup: (_root: unknown, args: { id: string }) => {
    return store.setCurrentGroup(args.id)
  },

  authenticate: (_root: unknown, args: { method: string; credentials: unknown }) => {
    return store.authenticate(args.method, args.credentials)
  },

  logout: () => {
    store.logout()
    return true
  },
}
