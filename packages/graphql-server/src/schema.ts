export const typeDefs = `
  scalar JSON
  scalar DateTime

  type Item {
    id: ID!
    type: String!
    createdAt: DateTime!
    createdBy: String!
    schema: String
    schemaVersion: Int
    data: JSON!
    relations: [Relation!]
    _source: String
    _included: JSON
  }

  type Relation {
    predicate: String!
    target: String!
    meta: JSON
  }

  type Group {
    id: ID!
    name: String!
    data: JSON
    members: [User!]!
  }

  type User {
    id: ID!
    displayName: String
    avatarUrl: String
  }

  type AuthState {
    status: String!
    user: User
  }

  type AuthMethod {
    method: String!
    label: String!
  }

  type Source {
    id: ID!
    name: String!
  }

  input ItemFilterInput {
    type: String
    hasField: [String!]
    createdBy: String
  }

  input ItemInput {
    type: String!
    createdBy: String!
    data: JSON!
    relations: [RelationInput!]
  }

  input ItemUpdateInput {
    data: JSON
    relations: [RelationInput!]
  }

  input RelationInput {
    predicate: String!
    target: String!
    meta: JSON
  }

  input GroupUpdateInput {
    name: String
    data: JSON
  }

  type Query {
    items(filter: ItemFilterInput): [Item!]!
    item(id: ID!): Item
    groups: [Group!]!
    members(groupId: ID!): [User!]!
    relatedItems(itemId: ID!, predicate: String): [Item!]!
    currentUser: User
    user(id: ID!): User
    currentGroup: Group
    authState: AuthState!
    authMethods: [AuthMethod!]!
    sources: [Source!]!
    activeSource: Source!
  }

  type Mutation {
    createItem(input: ItemInput!): Item!
    updateItem(id: ID!, input: ItemUpdateInput!): Item!
    deleteItem(id: ID!): Boolean!
    createGroup(name: String!, data: JSON): Group!
    updateGroup(id: ID!, input: GroupUpdateInput!): Group!
    deleteGroup(id: ID!): Boolean!
    inviteMember(groupId: ID!, userId: ID!): Boolean!
    removeMember(groupId: ID!, userId: ID!): Boolean!
    setCurrentGroup(id: ID!): Group
    authenticate(method: String!, credentials: JSON): User!
    logout: Boolean!
  }

  type Subscription {
    itemsChanged(filter: ItemFilterInput): [Item!]!
    itemChanged(id: ID!): Item
    authStateChanged: AuthState!
  }
`
