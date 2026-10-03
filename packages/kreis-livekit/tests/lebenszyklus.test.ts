/**
 * Der Lebenszyklus des LiveKit-Raums (Prüfkreis Kimi, 02.10.2026):
 * Beitreten, Verlassen und erneutes Beitreten laufen der Reihe nach, und ein
 * werfender Empfänger hält die übrigen nicht auf. LiveKit und der
 * Token-Dienst sind nachgebaut; jede Verbindung lässt sich von Hand lösen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

interface Offen { loesen: () => void; promise: Promise<void> }
const offen = (): Offen => {
  let loesen = () => {}
  const promise = new Promise<void>((r) => { loesen = r })
  return { loesen, promise }
}

const raeume: NachgebauterRaum[] = []

class NachgebauterRaum {
  verbunden = false
  getrennt = false
  verbinden = offen()
  trennen = offen()
  griffe = new Map<string, ((...a: unknown[]) => void)[]>()
  localParticipant = { identity: "ich", setMicrophoneEnabled: vi.fn(async () => {}) }
  remoteParticipants = new Map()
  constructor() { raeume.push(this) }
  on(ereignis: string, fn: (...a: unknown[]) => void) {
    this.griffe.set(ereignis, [...(this.griffe.get(ereignis) ?? []), fn])
    return this
  }
  off() { return this }
  async connect() { await this.verbinden.promise; this.verbunden = true }
  async disconnect() { await this.trennen.promise; this.getrennt = true }
  ausloesen(ereignis: string, ...a: unknown[]) { for (const fn of this.griffe.get(ereignis) ?? []) fn(...a) }
}

vi.mock("livekit-client", () => ({
  Room: NachgebauterRaum,
  RoomEvent: new Proxy({}, { get: (_z, name) => String(name) }),
  VideoPresets: new Proxy({}, { get: () => ({ resolution: {}, encoding: {} }) }),
}))

const { liveKitKreisRaum } = await import("../src/index")

const warten = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  raeume.length = 0
  vi.stubGlobal("fetch", vi.fn(async (adresse: string) => ({
    ok: true,
    json: async () => (String(adresse).includes("/raum?") ? { moderator: "zugang" } : { token: "token" }),
  })))
})
afterEach(() => vi.unstubAllGlobals())

const optionen = { serverUrl: "wss://test", tokenUrl: "https://test/token" }

describe("Beitreten, gehen, wieder beitreten (Befund 1)", () => {
  it("wer während eines laufenden Beitritts geht und neu beitritt, ist danach im neuen Raum", async () => {
    const k = liveKitKreisRaum(optionen)
    const erster = k.betreten("raum-a", "Anna")
    await warten(); await warten()
    expect(raeume).toHaveLength(1)
    await k.verlassen()
    const zweiter = k.betreten("raum-b", "Anna")
    // Der alte Beitritt läuft aus: er verbindet und trennt sofort wieder.
    raeume[0].verbinden.loesen()
    raeume[0].trennen.loesen()
    await erster
    await warten(); await warten()
    expect(raeume).toHaveLength(2)
    raeume[1].verbinden.loesen()
    await zweiter
    expect(raeume[0].getrennt).toBe(true)
    expect(k.ich()).toBe("ich")
  })

  it("ein zweiter Klick auf Beitreten ohne Gehen dazwischen öffnet keinen zweiten Raum", async () => {
    const k = liveKitKreisRaum(optionen)
    const a = k.betreten("raum-a", "Anna")
    const b = k.betreten("raum-a", "Anna")
    await warten(); await warten()
    raeume[0].verbinden.loesen()
    await Promise.all([a, b])
    expect(raeume).toHaveLength(1)
  })
})

describe("Beitreten, während der alte Raum noch trennt (Befund 2)", () => {
  it("der neue Raum entsteht erst, wenn der alte getrennt ist", async () => {
    const k = liveKitKreisRaum(optionen)
    const a = k.betreten("raum-a", "Anna")
    await warten(); await warten()
    raeume[0].verbinden.loesen()
    await a
    const gehen = k.verlassen()
    const neu = k.betreten("raum-a", "Anna")
    await warten(); await warten()
    expect(raeume).toHaveLength(1)
    raeume[0].trennen.loesen()
    await gehen
    await warten(); await warten()
    expect(raeume).toHaveLength(2)
    raeume[1].verbinden.loesen()
    await neu
    expect(raeume[0].getrennt).toBe(true)
  })
})

describe("Gehen, während ein Beitritt auf das Trennen wartet (Prüfkreis Kimi, 03.10.2026, Befund 1)", () => {
  it("wer erneut geht, bevor das alte Trennen fertig ist, bleibt draußen und ohne Mikrofon", async () => {
    const k = liveKitKreisRaum(optionen)
    const a = k.betreten("raum-a", "Anna")
    await warten(); await warten()
    raeume[0].verbinden.loesen()
    await a
    const gehen = k.verlassen()
    const neu = k.betreten("raum-a", "Anna")
    const nochmalGehen = k.verlassen()
    await warten(); await warten()
    raeume[0].trennen.loesen()
    await Promise.all([gehen, nochmalGehen])
    await warten(); await warten()
    // Öffnet der wartende Beitritt doch einen Raum, darf er ihn verbinden.
    for (const r of raeume.slice(1)) r.verbinden.loesen()
    await neu
    await warten(); await warten()
    expect(raeume.filter((r) => r.verbunden && !r.getrennt)).toHaveLength(0)
    expect(raeume.slice(1).every((r) => r.localParticipant.setMicrophoneEnabled.mock.calls.length === 0)).toBe(true)
    expect(k.ich()).toBeNull()
  })

  it("geht jemand, während der neue Raum verbindet, wird er sofort wieder getrennt", async () => {
    const k = liveKitKreisRaum(optionen)
    const a = k.betreten("raum-a", "Anna")
    await warten(); await warten()
    raeume[0].verbinden.loesen()
    await a
    const gehen = k.verlassen()
    const neu = k.betreten("raum-a", "Anna")
    raeume[0].trennen.loesen()
    await gehen
    await warten(); await warten()
    expect(raeume).toHaveLength(2)
    await k.verlassen()
    raeume[1].trennen.loesen()
    raeume[1].verbinden.loesen()
    await neu
    expect(raeume[1].getrennt).toBe(true)
    expect(raeume[1].localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled()
    expect(k.ich()).toBeNull()
  })
})

describe("Nachrichten (Befund 3)", () => {
  it("wirft ein Empfänger, bekommen die übrigen die Nachricht trotzdem", async () => {
    const warnung = vi.spyOn(console, "warn").mockImplementation(() => {})
    const k = liveKitKreisRaum(optionen)
    const a = k.betreten("raum-a", "Anna")
    await warten(); await warten()
    raeume[0].verbinden.loesen()
    await a
    const angekommen: unknown[] = []
    k.beiNachricht(() => { throw new Error("kaputt") })
    k.beiNachricht((n) => angekommen.push(n))
    raeume[0].ausloesen("DataReceived", new TextEncoder().encode(JSON.stringify({ kreis: { hallo: 1 } })), { identity: "bert" })
    expect(angekommen).toEqual([{ hallo: 1 }])
    expect(warnung).toHaveBeenCalled()
    warnung.mockRestore()
  })
})
