import type { Relation } from "@real-life-stack/data-interface"

export interface AutomergeRootDoc {
  groups: Array<{
    id: string
    name: string
    data: Record<string, unknown>
    docUrl: string
  }>
  users: Array<{
    id: string
    displayName?: string
    avatarUrl?: string
  }>
  currentUserId: string | null
}

export interface AutomergeGroupDoc {
  groupId: string
  items: Array<{
    id: string
    type: string
    createdAt: string
    createdBy: string
    data: Record<string, unknown>
    relations?: Relation[]
  }>
  members: string[]
}
