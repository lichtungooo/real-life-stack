// Das Textdokument in der Mitte der Konferenz (Spec video, "Textdokument").
//
// Timo, 30.09.2026: "dass jeder wie im HedgeDoc zeitgleich mitschreiben kann
// im Markdown-Format, mit oben einer kleinen Leiste … und dann als Dokument".
// Anton, am selben Tag: ganz normale Real Life Stack Items. Das Dokument IST
// darum ein Beitrag im Space (`post`, Markdown in `content`); diese Flaeche
// kennt den Stack nicht, sie bekommt Inhalt und meldet Aenderungen. Die App
// verbindet sie mit dem Item (video-flaeche.tsx).

import { lazy, Suspense, useState, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import {
  Bold, CheckSquare, Code, Columns2, Download, Eye, FilePlus2, Heading1, Heading2, Italic, Link2, List, PenLine,
  Quote, Redo2, Table, Undo2,
} from "lucide-react"
import { dokumentTitel, type Format } from "./markdown-werkzeug"
import type { EditorSteuerung } from "./textdokument-editor"

const Editor = lazy(() => import("./textdokument-editor"))

/**
 * Wie die App das Textdokument anschliesst: Sie zeigt das Item mit der Id
 * (oder das Anlegen, wenn es noch keines gibt) und meldet ein neues Item.
 */
export type TextdokumentAnschluss = (p: { itemId: string | null; onAngelegt: (id: string) => void; gruppe: string }) => ReactNode

type Ansicht = "schreiben" | "beides" | "vorschau"

const KNOEPFE: { format: Format; titel: string; zeichen: ReactNode }[] = [
  { format: "fett", titel: "Fett", zeichen: <Bold className="h-4 w-4" /> },
  { format: "kursiv", titel: "Kursiv", zeichen: <Italic className="h-4 w-4" /> },
  { format: "h1", titel: "Überschrift", zeichen: <Heading1 className="h-4 w-4" /> },
  { format: "h2", titel: "Unterüberschrift", zeichen: <Heading2 className="h-4 w-4" /> },
  { format: "liste", titel: "Liste", zeichen: <List className="h-4 w-4" /> },
  { format: "aufgabe", titel: "Aufgabe", zeichen: <CheckSquare className="h-4 w-4" /> },
  { format: "zitat", titel: "Zitat", zeichen: <Quote className="h-4 w-4" /> },
  { format: "code", titel: "Code", zeichen: <Code className="h-4 w-4" /> },
  { format: "link", titel: "Link", zeichen: <Link2 className="h-4 w-4" /> },
  { format: "tabelle", titel: "Tabelle", zeichen: <Table className="h-4 w-4" /> },
]

function Knopf({ titel, onClick, aktiv, children, disabled }: { titel: string; onClick: () => void; aktiv?: boolean; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" title={titel} aria-label={titel} aria-pressed={aktiv} onClick={onClick} disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-40 ${aktiv ? "bg-indigo-100 text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}>
      {children}
    </button>
  )
}

/** Noch kein Dokument: eines anlegen. Es wird sofort ein Beitrag im Space. */
export function TextdokumentAnlegen({ gruppe, onAnlegen }: { gruppe: string; onAnlegen: (titel: string) => Promise<void> }) {
  const vorschlag = `Mitschrift ${gruppe}, ${new Date().toLocaleDateString("de-DE")}`
  const [titel, setTitel] = useState(vorschlag)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState(false)
  return (
    <form className="mx-auto flex h-full max-w-md flex-col justify-center gap-3 p-6"
      onSubmit={async (e) => { e.preventDefault(); setLaeuft(true); setFehler(false); try { await onAnlegen(titel.trim() || vorschlag) } catch { setFehler(true) } finally { setLaeuft(false) } }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Textdokument</p>
      <h2 className="text-2xl font-semibold text-foreground">Gemeinsam schreiben</h2>
      <p className="text-sm text-muted-foreground">Alle im Raum schreiben zugleich in Markdown. Das Dokument ist gleich ein Beitrag im Space und bleibt nach dem Meeting dort.</p>
      <input value={titel} onChange={(e) => setTitel(e.target.value)} aria-label="Titel des Dokuments"
        className="rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
      <button type="submit" disabled={laeuft} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
        <FilePlus2 className="h-4 w-4" /> {laeuft ? "Einen Moment …" : "Dokument anlegen"}
      </button>
      {fehler && <p className="text-sm text-rose-600">Das Anlegen ging nicht. In der Demo ohne Anmeldung ist der Space nur zur Probe.</p>}
    </form>
  )
}

export function TextDokument({ inhalt, gruppe, laedt = false, onAendern, nurLesen = false }: {
  inhalt: string
  gruppe: string
  laedt?: boolean
  onAendern: (inhalt: string) => void
  nurLesen?: boolean
}) {
  const [ansicht, setAnsicht] = useState<Ansicht>("beides")
  const [steuerung, setSteuerung] = useState<EditorSteuerung | null>(null)
  const ersatz = `Dokument ${gruppe}, ${new Date().toLocaleDateString("de-DE")}`

  const herunterladen = () => {
    const url = URL.createObjectURL(new Blob([inhalt], { type: "text/markdown;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${dokumentTitel(inhalt, ersatz).replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "Dokument"}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (laedt) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Das Dokument lädt …</div>

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      {/* Die Leiste, im Stil der Zeichenleiste */}
      <div className="flex shrink-0 justify-center px-3 pt-3">
        <div role="toolbar" aria-label="Textdokument" className="flex flex-wrap items-center gap-0.5 rounded-xl bg-white p-1 shadow-md ring-1 ring-slate-200">
          {KNOEPFE.map((k) => (
            <Knopf key={k.format} titel={k.titel} disabled={nurLesen || !steuerung || ansicht === "vorschau"} onClick={() => steuerung?.format(k.format)}>{k.zeichen}</Knopf>
          ))}
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <Knopf titel="Rückgängig" disabled={nurLesen || !steuerung} onClick={() => steuerung?.rueckgaengig()}><Undo2 className="h-4 w-4" /></Knopf>
          <Knopf titel="Wiederholen" disabled={nurLesen || !steuerung} onClick={() => steuerung?.wiederholen()}><Redo2 className="h-4 w-4" /></Knopf>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <Knopf titel="Schreiben" aktiv={ansicht === "schreiben"} onClick={() => setAnsicht("schreiben")}><PenLine className="h-4 w-4" /></Knopf>
          <Knopf titel="Schreiben und Vorschau" aktiv={ansicht === "beides"} onClick={() => setAnsicht("beides")}><Columns2 className="h-4 w-4" /></Knopf>
          <Knopf titel="Vorschau" aktiv={ansicht === "vorschau"} onClick={() => setAnsicht("vorschau")}><Eye className="h-4 w-4" /></Knopf>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <Knopf titel="Als .md herunterladen" disabled={!inhalt.trim()} onClick={herunterladen}><Download className="h-4 w-4" /></Knopf>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-slate-500">Liegt als Beitrag im Space; alle sehen jede Änderung.</p>

      <div className={`grid min-h-0 flex-1 gap-3 p-3 ${ansicht === "beides" ? "md:grid-cols-2" : ""}`}>
        {ansicht !== "vorschau" && (
          <div className="min-h-[200px] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">Der Editor lädt …</div>}>
              <Editor inhalt={inhalt} onAendern={onAendern} onSteuerung={setSteuerung} nurLesen={nurLesen} />
            </Suspense>
          </div>
        )}
        {ansicht !== "schreiben" && (
          <article aria-label="Vorschau"
            className="min-h-[200px] overflow-y-auto rounded-xl bg-white px-6 py-5 text-[15px] leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-200
              [&_a]:text-indigo-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600
              [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold
              [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3
              [&_table]:my-3 [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-6">
            {inhalt.trim() ? <ReactMarkdown>{inhalt}</ReactMarkdown> : <p className="italic text-slate-400">Noch leer. Links schreiben, hier erscheint es.</p>}
          </article>
        )}
      </div>
    </div>
  )
}
