/** Eine Datei in Stuecken durch den Raum, und die Folien des Zeichenpads. */
import { describe, expect, it } from "vitest"
import {
  ausBase64, eingangNeu, inStuecke, leereSitzung, nachBase64, padBlaettern, padFolienSetzen,
  padOeffnen, padSchluessel, stueckDazu,
} from "../src"

describe("Dateien in Stuecken", () => {
  it("kommt heil an, auch in anderer Reihenfolge", () => {
    const bytes = new Uint8Array(50_000).map((_, i) => (i * 31) % 256)
    const stuecke = inStuecke(nachBase64(bytes), 7_000)
    expect(stuecke.length).toBeGreaterThan(5)
    const e = eingangNeu("a.pdf", stuecke.length)
    const reihenfolge = stuecke.map((_, i) => i).reverse()
    let fertig: Uint8Array | null = null
    for (const nr of reihenfolge) fertig = stueckDazu(e, nr, stuecke[nr])
    expect(fertig).toEqual(bytes)
  })

  it("meldet erst fertig, wenn alle Stuecke da sind, und uebersieht falsche Nummern", () => {
    const e = eingangNeu("a", 2)
    expect(stueckDazu(e, 5, "x")).toBeNull()
    expect(stueckDazu(e, 0, nachBase64(new Uint8Array([1, 2, 3])).slice(0, 2))).toBeNull()
  })

  it("Base64 hin und zurueck", () => {
    const b = new Uint8Array([0, 255, 128, 7])
    expect(ausBase64(nachBase64(b))).toEqual(b)
  })
})

describe("Folien auf dem Zeichenpad", () => {
  const offen = padOeffnen(leereSitzung(0), "pad", "anna")
  const mitFolien = padFolienSetzen(offen, { datei: "d1", name: "Vortrag.pdf", seiten: 3 }, "anna")

  it("nur wer praesentiert, legt Folien auf; es beginnt bei Seite 1", () => {
    expect(padFolienSetzen(offen, { datei: "d1", name: "x", seiten: 3 }, "bert")).toBe(offen)
    expect(mitFolien.pad?.seite).toBe(1)
    expect(padSchluessel(mitFolien)).toBe("d1:1")
    expect(padSchluessel(offen)).toBe("frei")
  })

  it("blaettern bleibt zwischen erster und letzter Seite, nur fuer den Praesentierenden", () => {
    expect(padBlaettern(mitFolien, 2, "bert")).toBe(mitFolien)
    expect(padBlaettern(mitFolien, 2, "anna").pad?.seite).toBe(2)
    expect(padBlaettern(mitFolien, 9, "anna").pad?.seite).toBe(3)
    expect(padBlaettern(mitFolien, 0, "anna")).toBe(mitFolien)
  })

  it("Folien abnehmen fuehrt zur freien Flaeche zurueck", () => {
    expect(padSchluessel(padFolienSetzen(mitFolien, null, "anna"))).toBe("frei")
  })
})
