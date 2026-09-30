// Der Meeting-Ueberblick, nach dem Lernanalyse-Dashboard von Big Blue Button
// (Timo, 30.09.2026, mit Bildschirmfoto): je Mensch Onlinezeit, Redezeit,
// Kamerazeit, Nachrichten, Reaktionen, gehobene Haende.
//
// Datensparsam: Jedes Geraet zaehlt, was es selbst seit dem Betreten
// gesehen hat. Nichts verlaesst das Geraet, nichts bleibt nach dem Meeting;
// herunterladen kann man es bewusst als Datei.

import { useEffect, useRef, useState } from "react"
import { Download, X } from "lucide-react"
import type { KreisKontext } from "../raum-kontext"

export interface Zahlen {
  name: string
  seit: number
  onlineMs: number
  redeMs: number
  kameraMs: number
  haende: number
  reaktionen: number
  da: boolean
}

/** Zaehlt mit, solange die Konferenz offen ist. Ein Takt je Sekunde genuegt. */
export function useUeberblick(kreis: KreisKontext): ReadonlyMap<string, Zahlen> {
  const { teilnehmer, jetzt, neben } = kreis
  const zahlen = useRef(new Map<string, Zahlen>())
  const letzterTakt = useRef(Date.now())
  const haendeVorher = useRef<ReadonlySet<string>>(new Set())
  const zeichenVorher = useRef(new Map<string, number>())
  const [, neu] = useState(0)

  // Jede Sekunde: wer da ist, wer spricht, wer die Kamera an hat.
  useEffect(() => {
    const dt = Math.min(5_000, Math.max(0, jetzt - letzterTakt.current))
    letzterTakt.current = jetzt
    const da = new Set(teilnehmer.map((t) => t.id))
    for (const t of teilnehmer) {
      const z = zahlen.current.get(t.id) ?? { name: t.name, seit: jetzt, onlineMs: 0, redeMs: 0, kameraMs: 0, haende: 0, reaktionen: 0, da: true }
      z.name = t.name
      z.da = true
      z.onlineMs += dt
      if (t.spricht) z.redeMs += dt
      if (t.kameraAn) z.kameraMs += dt
      zahlen.current.set(t.id, z)
    }
    for (const [id, z] of zahlen.current) if (!da.has(id)) z.da = false
    neu((n) => n + 1)
  }, [jetzt, teilnehmer])

  // Gehobene Haende und Zeichen: jedes neue zaehlt einmal.
  useEffect(() => {
    for (const id of neben.haende) {
      if (!haendeVorher.current.has(id)) { const z = zahlen.current.get(id); if (z) z.haende += 1 }
    }
    haendeVorher.current = neben.haende
  }, [neben.haende])
  useEffect(() => {
    for (const [id, { wann }] of neben.zeichen) {
      if (zeichenVorher.current.get(id) !== wann) { zeichenVorher.current.set(id, wann); const z = zahlen.current.get(id); if (z) z.reaktionen += 1 }
    }
  }, [neben.zeichen])

  return zahlen.current
}

const dauer = (ms: number) => {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sek).padStart(2, "0")}`
}

/** Die Zahlen als CSV (Semikolon, fuer Tabellen im deutschen Raum). */
export function ueberblickAlsCsv(zahlen: readonly (Zahlen & { nachrichten: number })[]): string {
  const kopf = "Name;Onlinezeit;Redezeit;Kamerazeit;Nachrichten;Reaktionen;Gehobene Haende;Status"
  const zeilen = zahlen.map((z) => [z.name.replace(/;/g, ","), dauer(z.onlineMs), dauer(z.redeMs), dauer(z.kameraMs), z.nachrichten, z.reaktionen, z.haende, z.da ? "online" : "gegangen"].join(";"))
  return [kopf, ...zeilen].join("\n") + "\n"
}

export function UeberblickDialog({ kreis, raumName, zahlen, seit, onZu }: {
  kreis: KreisKontext
  raumName: string
  zahlen: ReadonlyMap<string, Zahlen>
  seit: number
  onZu: () => void
}) {
  const nachrichten = (id: string) => kreis.neben.chat.filter((c) => c.wer === id).length
  const liste = [...zahlen.entries()].map(([id, z]) => ({ id, ...z, nachrichten: nachrichten(id) }))
    .sort((a, b) => Number(b.da) - Number(a.da) || a.name.localeCompare(b.name, "de"))
  const redeGesamt = liste.reduce((s, z) => s + z.redeMs, 0)
  const karten = [
    { wert: liste.filter((z) => z.da).length, name: "Aktive Teilnehmer" },
    { wert: kreis.neben.chat.length, name: "Nachrichten" },
    { wert: dauer(redeGesamt), name: "Redezeit gesamt" },
    { wert: kreis.neben.umfrage ? 1 : 0, name: "Umfragen" },
  ]
  const herunterladen = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + ueberblickAlsCsv(liste)], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `Meeting ${raumName} ${new Date().toLocaleDateString("de-DE")}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Meeting-Überblick" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onZu}>
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start gap-3 px-6 pt-5">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-semibold">Meeting-Überblick</h3>
            <p className="text-sm font-medium text-slate-600">{raumName}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-slate-700">{new Date().toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })} <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Aktiv</span></p>
            <p className="text-slate-500">Dauer: {dauer(Date.now() - seit)}</p>
          </div>
          <button type="button" onClick={onZu} aria-label="Schließen" className="rounded-lg p-1.5 hover:bg-slate-200"><X className="h-5 w-5" /></button>
        </header>
        <div className="overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {karten.map((k) => (
              <div key={k.name} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <p className="text-2xl font-semibold tabular-nums">{k.wert}</p>
                <p className="text-sm text-slate-600">{k.name}</p>
              </div>
            ))}
          </div>
          <h4 className="mb-2 mt-6 text-lg font-semibold">Übersicht</h4>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  {["Teilnehmer", "Onlinezeit", "Redezeit", "Kamerazeit", "Nachrichten", "Reaktionen", "Gehobene Hände", "Status"].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {liste.map((z) => (
                  <tr key={z.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5 font-medium">{z.name}</td>
                    <td className="px-3 py-2.5 tabular-nums">{dauer(z.onlineMs)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{dauer(z.redeMs)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{dauer(z.kameraMs)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{z.nachrichten}</td>
                    <td className="px-3 py-2.5 tabular-nums">{z.reaktionen}</td>
                    <td className="px-3 py-2.5 tabular-nums">{z.haende}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${z.da ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{z.da ? "Online" : "Gegangen"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="flex-1 text-xs text-slate-500">Gezählt hat dieses Gerät, seit du im Meeting bist. Nichts davon wird gespeichert oder verschickt.</p>
            <button type="button" onClick={herunterladen} className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100">
              <Download className="h-4 w-4" /> Konferenzdaten herunterladen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
