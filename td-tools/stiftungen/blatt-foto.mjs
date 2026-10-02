// Den Kontaktbogen von auftritt.py fotografieren, in Stücken zum Ansehen.
//
//   node td-tools/stiftungen/blatt-foto.mjs [html] [ausgabe-ordner]
//
// Ohne Angabe: %TEMP%/td-auftritt/blatt.html, Bilder daneben (blatt-1.png …).
// Über goto auf die Datei, nicht setContent: sonst laden die Bilder nicht.

import { readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"

const pnpm = join(process.cwd(), "node_modules", ".pnpm")
const ordner = readdirSync(pnpm).find((d) => d.startsWith("playwright-core@"))
if (!ordner) throw new Error("playwright-core fehlt. pnpm install im Monorepo.")
const { chromium } = await import(new URL(`file:///${join(pnpm, ordner, "node_modules", "playwright-core", "index.mjs").replace(/\\/g, "/")}`).href)

const blatt = process.argv[2] ?? join(tmpdir(), "td-auftritt", "blatt.html")
const aus = process.argv[3] ?? dirname(blatt)
const browser = await chromium.launch({ channel: process.env.KANAL ?? "msedge" })
const p = await browser.newPage({ viewport: { width: 1200, height: 1400 } })
await p.goto(`file:///${blatt.replace(/\\/g, "/")}`, { waitUntil: "load" })
await p.waitForTimeout(800)
const hoehe = await p.evaluate(() => document.body.scrollHeight)
const bilder = []
for (let i = 0; i * 1400 < hoehe && i < 40; i++) {
  await p.evaluate((y) => window.scrollTo(0, y), i * 1400)
  await p.waitForTimeout(150)
  const datei = join(aus, `blatt-${i + 1}.png`)
  await p.screenshot({ path: datei })
  bilder.push(datei)
}
await browser.close()
console.log(bilder.join("\n"))
