// @vitest-environment jsdom
/**
 * Profil übernehmen (DEFINITION Teil 8): „Das ist meine Stiftung“ mit Name,
 * Rolle, Mail; die Verwaltenden sehen die Anfrage mit Bestätigen und
 * Ablehnen; danach „Gepflegt von der Stiftung seit …“ statt der Recherche.
 * Ohne App-Anbindung bleibt der Weg per Mail.
 */
import { act, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"
import { uebernahmeAblehnen, uebernahmeAnfragen, uebernahmeBestaetigen } from "@trustdonation/core"
import { StiftungsProfilAusDaten } from "@trustdonation/ui/stiftungs-profil"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const wurzeln: Root[] = []
afterEach(() => { act(() => { wurzeln.forEach((w) => w.unmount()) }); wurzeln.length = 0; document.body.innerHTML = "" })

function zeigen(knoten: React.ReactNode) {
  const ort = document.createElement("div")
  document.body.appendChild(ort)
  const w = createRoot(ort)
  wurzeln.push(w)
  act(() => w.render(knoten))
}

const knopf = (name: string) => [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)
async function klicken(name: string) {
  const b = knopf(name)
  if (!b) throw new Error(`Kein Knopf „${name}“`)
  await act(async () => b.click())
}
function tippen(el: HTMLInputElement, wert: string) {
  const setzen = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!
  act(() => {
    setzen.call(el, wert)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}
const feld = (text: string) => [...document.querySelectorAll("label")].find((l) => l.textContent?.startsWith(text))!.querySelector("input")!

const recherche: Record<string, unknown> = {
  title: "Kleine Stiftung", foerdererart: "Stiftung", foerderbereiche: ["Bildung"], quelle: "Recherche 2026",
  website: "https://kleine.example.org", fremd: { bleibt: true },
}

/** Ein Eintrag mit echtem Zustand: Die Aktionen schreiben über die Kernschritte. */
function Buehne({ ich, istAdmin, start = recherche }: { ich: string | null; istAdmin: boolean; start?: Record<string, unknown> }) {
  const [daten, setDaten] = useState(start)
  const schreiben = async (neu: Record<string, unknown> | null) => { if (!neu) throw new Error("passt nicht"); setDaten(neu) }
  return (
    <>
      <output data-testid="daten">{JSON.stringify(daten)}</output>
      <StiftungsProfilAusDaten daten={daten} uebernahme={{
        ich, istAdmin,
        anfragen: (a) => schreiben(uebernahmeAnfragen(daten, { von: ich ?? "", ...a })),
        bestaetigen: () => schreiben(uebernahmeBestaetigen(daten)),
        ablehnen: () => schreiben(uebernahmeAblehnen(daten)),
      }} />
    </>
  )
}
const gespeichert = () => JSON.parse(document.querySelector("[data-testid=daten]")!.textContent!)

describe("Profil übernehmen", () => {
  it("ohne Anbindung bleibt der Weg per Mail", () => {
    zeigen(<StiftungsProfilAusDaten daten={recherche} />)
    const link = [...document.querySelectorAll("a")].find((a) => a.textContent === "Profil übernehmen")!
    expect(link.getAttribute("href")).toMatch(/^mailto:/)
    expect(knopf("Das ist meine Stiftung")).toBeUndefined()
  })

  it("ein Mitglied fragt an und sieht danach, dass die Anfrage vorliegt", async () => {
    zeigen(<Buehne ich="mensch-anna" istAdmin={false} />)
    await klicken("Das ist meine Stiftung")
    tippen(feld("Ihr Name"), "Anna Berg")
    tippen(feld("Ihre Rolle"), "Vorstand")
    tippen(feld("Ihre Mail"), "anna@kleine.example.org")
    await klicken("Anfrage senden")
    expect(gespeichert()).toMatchObject({ fremd: { bleibt: true }, uebernahme: { von: "mensch-anna", name: "Anna Berg", rolle: "Vorstand", stand: "angefragt" } })
    expect(document.body.textContent).toContain("Ihre Anfrage zur Übernahme liegt vor")
    expect(knopf("Bestätigen")).toBeUndefined()
  })

  it("die Verwaltenden bestätigen: gepflegt von der Stiftung, Recherche-Hinweis weg", async () => {
    const angefragt = uebernahmeAnfragen(recherche, { von: "mensch-anna", name: "Anna Berg", rolle: "Vorstand" })!
    zeigen(<Buehne ich="mensch-timo" istAdmin start={angefragt} />)
    expect(document.body.textContent).toContain("Übernahme angefragt")
    expect(document.body.textContent).toContain("Anna Berg, Vorstand")
    await klicken("Bestätigen")
    expect(gespeichert()).toMatchObject({ quelle: "Gepflegt von der Stiftung", gepflegtVon: "mensch-anna", fremd: { bleibt: true } })
    expect(document.body.textContent).toContain("Gepflegt von der Stiftung seit")
    expect(document.body.textContent).not.toContain("Aus öffentlicher Recherche")
  })

  it("die Verwaltenden lehnen ab: die Anfrage verschwindet", async () => {
    const angefragt = uebernahmeAnfragen(recherche, { von: "mensch-anna", name: "Anna Berg" })!
    zeigen(<Buehne ich="mensch-timo" istAdmin start={angefragt} />)
    await klicken("Ablehnen")
    expect(gespeichert()).toEqual(recherche)
    expect(knopf("Das ist meine Stiftung")).toBeDefined()
  })
})
