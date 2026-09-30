// Das Zeichenpad in der Mitte der Konferenz (Spec video, "Zeichenpad").
//
// Timo, 30.09.2026, mit Bildern aus Big Blue Button: zum Mitmalen,
// Aufzeichnen und Erklaeren, mit Folien. Wer es in die Mitte legt,
// praesentiert und zeichnet; ueber "Mehrere Benutzer" gibt er es fuer alle
// frei. Er kann eine PDF auflegen und blaettern; jede Folie hat ihre eigene
// Zeichnung. Unten die Leiste wie bei BBB. Die Zeichenflaeche (Excalidraw,
// MIT) und pdf.js laden erst, wenn sie gebraucht werden.

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, FileUp, MoveHorizontal, Users, X } from "lucide-react"
import {
  DATEI_HOECHSTENS, darfZeichnen, dateiId, padBlaettern, padFolienSetzen, padFreigeben, padSchluessel, padUebernehmen,
} from "@kreis/core"
import type { KreisKontext } from "../raum-kontext"
import type { ZeichenpadSteuerung } from "./zeichenpad-flaeche"
// Fest eingebunden und klein: pdf.js selbst laedt darin erst bei Bedarf nach.
import { seiteAlsBild, seitenZahl, type SeitenBild } from "./pdf-seiten"

const Flaeche = lazy(() => import("./zeichenpad-flaeche"))

export function ZeichenPad({ kreis }: { kreis: KreisKontext }) {
  const { sitzung, ich, handle, teilnehmer, neben } = kreis
  const wer = ich ?? ""
  const pad = sitzung.pad ?? null
  const folien = pad?.folien ?? null
  const seite = pad?.seite ?? 1
  const schluessel = padSchluessel(sitzung)
  const darf = darfZeichnen(sitzung, wer)
  const ichPraesentiere = !!pad && pad.praesentiert === wer
  const praesentierender = teilnehmer.find((t) => t.id === pad?.praesentiert)
  const [steuerung, setSteuerung] = useState<ZeichenpadSteuerung | null>(null)
  const [hintergrund, setHintergrund] = useState<SeitenBild | null>(null)
  const [meldung, setMeldung] = useState<string | null>(null)
  const eingabe = useRef<HTMLInputElement | null>(null)
  const datei = folien ? neben.dateien.get(folien.datei) : undefined

  // Fehlt die PDF hier (Nachzuegler), wird sie erbeten.
  useEffect(() => {
    if (folien && !datei) neben.dateiAnfragen(folien.datei)
  }, [folien, datei, neben])

  // Die aktuelle Seite als Bild, erst wenn die Datei ganz da ist.
  useEffect(() => {
    let aktiv = true
    setHintergrund(null)
    if (!folien || !datei) return
    seiteAlsBild(folien.datei, datei.bytes, seite)
      .then((b) => { if (aktiv) setHintergrund(b) })
      .catch(() => { if (aktiv) setMeldung("Diese Folie ließ sich nicht zeichnen.") })
    return () => { aktiv = false }
  }, [folien, datei, seite])

  const hochladen = async (f: File) => {
    setMeldung(null)
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { setMeldung("Bitte eine PDF wählen."); return }
    if (f.size > DATEI_HOECHSTENS) { setMeldung("Die PDF ist größer als 15 MB. Bitte verkleinern."); return }
    try {
      const bytes = await dateiLesen(f)
      const id = dateiId()
      const seiten = await seitenZahl(id, bytes)
      neben.dateiTeilen(id, f.name, bytes)
      handle((s) => padFolienSetzen(s, { datei: id, name: f.name, seiten }, wer))
    } catch {
      setMeldung("Diese PDF ließ sich nicht öffnen.")
    }
  }

  const blaettern = (nach: number) => handle((s) => padBlaettern(s, nach, wer))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Das Zeichenpad lädt …</div>}>
          <Flaeche key={schluessel} elemente={neben.pad[schluessel] ?? []} onAenderung={(e) => neben.padSenden(schluessel, e)}
            nurLesen={!darf} onSteuerung={setSteuerung} hintergrund={hintergrund} />
        </Suspense>
        {folien && !datei && (
          <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
            <span className="rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground shadow">Die Folien kommen an …</span>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-3 py-2 text-sm">
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {!pad ? "Alle zeichnen"
            : ichPraesentiere ? (pad.alle ? "Du präsentierst, alle zeichnen mit" : "Du präsentierst")
            : praesentierender ? `${praesentierender.name} präsentiert${pad.alle ? ", alle zeichnen mit" : ""}`
            : "Niemand präsentiert gerade"}
          {folien ? ` · ${folien.name}` : ""}
        </span>

        {folien && (
          <span className="flex items-center gap-1">
            <button type="button" aria-label="Vorige Folie" disabled={!ichPraesentiere || seite <= 1} onClick={() => blaettern(seite - 1)}
              className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            {ichPraesentiere ? (
              <select aria-label="Folie wählen" value={seite} onChange={(e) => blaettern(Number(e.target.value))}
                className="rounded-lg bg-muted px-2 py-1 text-xs">
                {Array.from({ length: folien.seiten }, (_, i) => <option key={i + 1} value={i + 1}>Folie {i + 1}</option>)}
              </select>
            ) : (
              <span className="px-1 text-xs tabular-nums">Folie {seite} von {folien.seiten}</span>
            )}
            <button type="button" aria-label="Nächste Folie" disabled={!ichPraesentiere || seite >= folien.seiten} onClick={() => blaettern(seite + 1)}
              className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </span>
        )}

        {ichPraesentiere && pad && (
          <>
            <input ref={eingabe} type="file" accept="application/pdf,.pdf" hidden aria-label="PDF wählen"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void hochladen(f) }} />
            {folien ? (
              <button type="button" onClick={() => handle((s) => padFolienSetzen(s, null, wer))} title="Folien abnehmen, zurück zur freien Fläche"
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs hover:bg-muted/70">
                <X className="h-4 w-4" /> Folien abnehmen
              </button>
            ) : (
              <button type="button" onClick={() => eingabe.current?.click()} title="Eine PDF als Folien auflegen"
                className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs hover:bg-muted/70">
                <FileUp className="h-4 w-4" /> Folien hochladen
              </button>
            )}
            <button type="button" aria-pressed={pad.alle} title="Mehrere Benutzer: alle dürfen zeichnen"
              onClick={() => handle((s) => padFreigebenUmschalten(s, wer))}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${pad.alle ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
              <Users className="h-4 w-4" /> Mehrere Benutzer
            </button>
          </>
        )}
        {pad && !ichPraesentiere && !praesentierender && (
          <button type="button" onClick={() => handle((s) => padUebernehmen(s, wer, teilnehmer.map((t) => t.id)))}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            Präsentation übernehmen
          </button>
        )}
        <button type="button" onClick={() => steuerung?.anBreiteAnpassen()} disabled={!steuerung} title="An Breite anpassen" aria-label="An Breite anpassen"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
          <MoveHorizontal className="h-4 w-4" />
        </button>
      </footer>
      {meldung && <p role="alert" className="border-t border-border bg-rose-500/10 px-3 py-1.5 text-xs text-rose-700">{meldung}</p>}
    </div>
  )
}

function padFreigebenUmschalten(s: Parameters<typeof padUebernehmen>[0], wer: string) {
  return padFreigeben(s, !(s.pad?.alle ?? false), wer)
}

/** Eine gewaehlte Datei lesen; mit `arrayBuffer`, wo es das gibt, sonst mit dem FileReader. */
function dateiLesen(f: File): Promise<Uint8Array> {
  if (typeof f.arrayBuffer === "function") return f.arrayBuffer().then((b) => new Uint8Array(b))
  return new Promise((ja, nein) => {
    const r = new FileReader()
    r.onload = () => ja(new Uint8Array(r.result as ArrayBuffer))
    r.onerror = () => nein(r.error)
    r.readAsArrayBuffer(f)
  })
}
