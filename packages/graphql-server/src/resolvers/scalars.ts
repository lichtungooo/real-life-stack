import { GraphQLScalarType, Kind } from "graphql"

export const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime scalar — ISO 8601 string ↔ Date",
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === "string") return value
    throw new Error("DateTime serialize: expected Date or string")
  },
  parseValue(value: unknown): Date {
    if (typeof value === "string") return new Date(value)
    throw new Error("DateTime parseValue: expected string")
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) return new Date(ast.value)
    throw new Error("DateTime parseLiteral: expected StringValue")
  },
})

export const JSON_SCALAR = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize(value: unknown): unknown {
    return value
  },
  parseValue(value: unknown): unknown {
    return value
  },
  parseLiteral(ast): unknown {
    return parseLiteralToJS(ast)
  },
})

function parseLiteralToJS(ast: { kind: string; value?: unknown; fields?: readonly { name: { value: string }; value: unknown }[]; values?: readonly unknown[] }): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value)
    case Kind.OBJECT:
      return Object.fromEntries(
        (ast.fields ?? []).map((f) => [f.name.value, parseLiteralToJS(f.value as Parameters<typeof parseLiteralToJS>[0])])
      )
    case Kind.LIST:
      return (ast.values ?? []).map((v) => parseLiteralToJS(v as Parameters<typeof parseLiteralToJS>[0]))
    case Kind.NULL:
      return null
    default:
      return null
  }
}
