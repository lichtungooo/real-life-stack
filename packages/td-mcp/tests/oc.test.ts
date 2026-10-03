/**
 * Der Stand einer Open-Collective-Seite (DEFINITION Teil 8): GET /oc/<name>,
 * zehn Minuten Zwischenspeicher, gleichzeitige Anfragen teilen einen Abruf,
 * bei Fehler der letzte Stand, offen für jede Seite (CORS).
 */
import { afterEach, describe, expect, it, vi } from "vitest"
import type { AddressInfo } from "node:net"
import antwort from "./oc-webpack.json"
import { netzwerkServer } from "../src/http"
import { ocDienst } from "../src/oc"

const offen: { close: () => void }[] = []
afterEach(() => { offen.splice(0).forEach((s) => s.close()) })

describe("Der Abrufer mit Zwischenspeicher", () => {
  it("fragt Open Collective einmal in zehn Minuten", async () => {
    let zeit = 0
    const holen = vi.fn(async () => antwort)
    const abrufen = ocDienst(holen, () => zeit)
    expect((await abrufen("webpack")).status).toBe(200)
    zeit += 9 * 60_000
    await abrufen("webpack")
    expect(holen).toHaveBeenCalledTimes(1)
    zeit += 2 * 60_000
    await abrufen("webpack")
    expect(holen).toHaveBeenCalledTimes(2)
  })

  it("gleichzeitige Anfragen teilen sich einen Abruf", async () => {
    const holen = vi.fn(async () => antwort)
    const abrufen = ocDienst(holen)
    await Promise.all([abrufen("webpack"), abrufen("webpack"), abrufen("webpack")])
    expect(holen).toHaveBeenCalledTimes(1)
  })

  it("bei einem Fehler der letzte Stand, ohne Stand ein 502", async () => {
    let zeit = 0
    let kaputt = false
    const abrufen = ocDienst(async () => { if (kaputt) throw new Error("weg"); return antwort }, () => zeit)
    await abrufen("webpack")
    kaputt = true
    zeit += 11 * 60_000
    expect((await abrufen("webpack")).status).toBe(200)
    expect((await abrufen("andere")).status).toBe(502)
  })

  it("unbekannte Seite 404, ungültiger Name 400 ohne Abruf", async () => {
    const holen = vi.fn(async () => ({ data: { account: null } }))
    const abrufen = ocDienst(holen)
    expect((await abrufen("gibtsnicht")).status).toBe(404)
    expect((await abrufen("../etc")).status).toBe(400)
    expect(holen).toHaveBeenCalledTimes(1)
  })
})

describe("GET /oc/<name> am Server", () => {
  it("liefert den Stand als JSON, offen für jede Seite", async () => {
    const { server } = netzwerkServer({ ocHolen: async () => antwort, geocode: async () => null })
    await new Promise<void>((r) => server.listen(0, r))
    offen.push(server)
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const r = await fetch(`${url}/oc/webpack`)
    expect(r.status).toBe(200)
    expect(r.headers.get("access-control-allow-origin")).toBe("*")
    const stand = await r.json()
    expect(stand).toMatchObject({ name: "webpack", waehrung: "USD" })
    expect((await fetch(`${url}/oc/%E0%A4%A`)).status).toBe(400)
    expect((await fetch(`${url}/oc/webpack`, { method: "POST" })).status).toBe(405)
  })
})
