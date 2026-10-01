// Eine Komponente ansehen, wie ein Mensch sie sieht: Bildschirmfotos der
// Karte in der Detail-Leiste und der ganzen Ansicht, auf Rechner, Handy und
// dunkel. Fehler der Seite werden mitgezaehlt.
//
//   node td-tools/komponente-ansehen.mjs <pfad> [knopf] [ausgabe]
//
//   pfad     Weg in der App, etwa
//            30455be1-a5f9-465d-8d19-a72dd8da2d83/map/projekt-gruenes-klassenzimmer
//   knopf    Beschriftung des Knopfs zur ganzen Ansicht (Standard:
//            "Ganzes Profil öffnen"); "-" fuer keine
//   ausgabe  Ordner fuer die Bilder (Standard: <temp>/td-ansicht; Bilder
//            gehoeren nicht ins Repo)
//
// Umgebung: BASIS (Standard http://localhost:5173), CONNECTOR (Standard local).
// Vorher die App starten: pnpm --filter reference dev
//
// Entstanden am 01.10.2026 beim Project Profile, der ersten Komponente der
// Erweiterungen. Ohne Augenschein haette der Text ueber dem Etikett gelegen.

import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

let chromium
try {
  ;({ chromium } = await import("playwright-core"))
} catch {
  // Im Monorepo liegt playwright-core unter .pnpm, nicht im Wurzel-node_modules.
  const { readdirSync } = await import("node:fs")
  const pnpm = join(process.cwd(), "node_modules", ".pnpm")
  const ordner = readdirSync(pnpm).find((d) => d.startsWith("playwright-core@"))
  if (!ordner) throw new Error("playwright-core fehlt. pnpm install im Monorepo.")
  ;({ chromium } = await import(new URL(`file:///${join(pnpm, ordner, "node_modules", "playwright-core", "index.mjs").replace(/\\/g, "/")}`).href))
}

const [pfadArg, knopfArg, ausgabeArg] = process.argv.slice(2)
// Ohne fuehrenden Schraegstrich angeben: Git Bash macht aus "/abc" sonst
// einen Windows-Pfad ("C:/Program Files/Git/abc").
const pfad = pfadArg ? `/${pfadArg.replace(/^.*?Git\//, "").replace(/^\/+/, "")}` : null
if (!pfad) {
  console.error("Aufruf: node td-tools/komponente-ansehen.mjs <pfad> [knopf] [ausgabe]")
  process.exit(2)
}
const knopf = knopfArg === "-" ? null : (knopfArg ?? "Ganzes Profil öffnen")
const ausgabe = ausgabeArg ?? join(tmpdir(), "td-ansicht")
const BASIS = process.env.BASIS ?? "http://localhost:5173"
const CONNECTOR = process.env.CONNECTOR ?? "local"
mkdirSync(ausgabe, { recursive: true })

const LAEUFE = [
  { name: "rechner", breite: 1440, hoehe: 900, farbe: "light" },
  { name: "handy", breite: 390, hoehe: 844, farbe: "light" },
  { name: "dunkel", breite: 1440, hoehe: 900, farbe: "dark" },
]

const browser = await chromium.launch({ channel: process.env.KANAL ?? "msedge" })
const bericht = {}
for (const lauf of LAEUFE) {
  const ctx = await browser.newContext({ viewport: { width: lauf.breite, height: lauf.hoehe }, colorScheme: lauf.farbe })
  const p = await ctx.newPage()
  const fehler = []
  p.on("pageerror", (e) => fehler.push(e.message))
  const trenner = pfad.includes("?") ? "&" : "?"
  await p.goto(`${BASIS}${pfad}${trenner}connector=${CONNECTOR}`, { waitUntil: "networkidle" })
  await p.waitForTimeout(5000)
  const bilder = [join(ausgabe, `${lauf.name}-karte.png`)]
  await p.screenshot({ path: bilder[0] })
  if (knopf) {
    const k = p.getByRole("button", { name: knopf }).last()
    if (await k.count()) {
      await k.click()
      await p.waitForTimeout(1200)
      const d = p.locator('[data-slot="dialog-content"]').last()
      const h = await d.evaluate((el) => el.scrollHeight).catch(() => 0)
      for (let i = 0; i * lauf.hoehe * 0.9 < h && i < 6; i++) {
        await d.evaluate((el, y) => { el.scrollTop = y }, Math.round(i * lauf.hoehe * 0.9))
        await p.waitForTimeout(350)
        const datei = join(ausgabe, `${lauf.name}-voll-${i + 1}.png`)
        await p.screenshot({ path: datei })
        bilder.push(datei)
      }
    } else {
      fehler.push(`Knopf "${knopf}" nicht gefunden`)
    }
  }
  bericht[lauf.name] = { bilder: bilder.length, fehler }
  await ctx.close()
}
await browser.close()
console.log(JSON.stringify({ ausgabe, ...bericht }, null, 2))
process.exit(Object.values(bericht).some((b) => b.fehler.length) ? 1 : 0)
