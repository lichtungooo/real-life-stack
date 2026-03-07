import { Query } from "./query.js"
import { Mutation } from "./mutation.js"
import { Subscription } from "./subscription.js"
import { DateTime, JSON_SCALAR } from "./scalars.js"
import * as store from "../store.js"

export const resolvers = {
  DateTime,
  JSON: JSON_SCALAR,
  Query,
  Mutation,
  Subscription,
  Group: {
    members: (group: { id: string }) => store.getMembers(group.id),
  },
}
