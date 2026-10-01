#!/usr/bin/env node
/**
 * Der Einstieg: stdio, wie jeder MCP-Client ihn startet.
 *
 *   TD_APP_URL   wo die App läuft (Standard https://trustdonation.org/app)
 *
 * Einrichten: siehe packages/td-mcp/README.md.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createServer } from "./server.js"

const server = createServer({ appUrl: process.env.TD_APP_URL })
await server.connect(new StdioServerTransport())
