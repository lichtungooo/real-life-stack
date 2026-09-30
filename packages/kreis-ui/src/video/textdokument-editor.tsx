// Der Editor des Textdokuments: CodeMirror 6 (MIT) mit Markdown.
//
// Das Dokument ist ein ganz normales Item im Space (Antons Entscheidung,
// 30.09.2026); der Stack synchronisiert es. Der Editor zeigt den Inhalt,
// meldet eigene Aenderungen gebuendelt zurueck und uebernimmt eine neue
// Fassung von aussen, sobald man nicht gerade tippt. Schreiben zwei an
// derselben Stelle zugleich, gilt die zuletzt gespeicherte Fassung.

import { useEffect, useRef } from "react"
import { Annotation, EditorState } from "@codemirror/state"
import { EditorView, keymap, placeholder } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap, indentWithTab, redo, undo } from "@codemirror/commands"
import { markdown } from "@codemirror/lang-markdown"
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { formatieren, type Format } from "./markdown-werkzeug"

export interface EditorSteuerung {
  format: (f: Format) => void
  rueckgaengig: () => void
  wiederholen: () => void
}

/** Markiert Aenderungen, die von aussen kamen: Sie werden nicht zurueckgemeldet. */
const vonAussen = Annotation.define<boolean>()

/** Wie lange nach dem letzten Tastendruck eine Fassung von aussen warten muss. */
const RUHE_MS = 1500
/** Gebuendelt speichern: nicht jeden Buchstaben einzeln. */
const SPEICHERN_MS = 700

export default function TextdokumentEditor({ inhalt, onAendern, onSteuerung, nurLesen = false }: {
  inhalt: string
  onAendern: (inhalt: string) => void
  onSteuerung?: (s: EditorSteuerung) => void
  nurLesen?: boolean
}) {
  const huelle = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const zuletztGetippt = useRef(0)
  const warte = useRef<number | null>(null)
  const melden = useRef(onAendern)
  melden.current = onAendern

  useEffect(() => {
    if (!huelle.current) return
    const view = new EditorView({
      parent: huelle.current,
      state: EditorState.create({
        doc: inhalt,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          markdown(),
          syntaxHighlighting(defaultHighlightStyle),
          EditorView.lineWrapping,
          EditorState.readOnly.of(nurLesen),
          placeholder("Hier schreibt ihr gemeinsam, in Markdown …"),
          EditorView.updateListener.of((u) => {
            if (!u.docChanged || u.transactions.every((t) => t.annotation(vonAussen))) return
            zuletztGetippt.current = Date.now()
            if (warte.current) window.clearTimeout(warte.current)
            warte.current = window.setTimeout(() => { warte.current = null; melden.current(u.view.state.doc.toString()) }, SPEICHERN_MS)
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "15px" },
            ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", lineHeight: "1.6" },
            ".cm-content": { padding: "16px 20px" },
            "&.cm-focused": { outline: "none" },
          }),
        ],
      }),
    })
    viewRef.current = view
    onSteuerung?.({
      format: (f) => {
        const r = view.state.selection.main
        const a = formatieren(view.state.doc.toString(), r.from, r.to, f)
        view.dispatch({ changes: { from: a.von, to: a.bis, insert: a.einfuegen }, selection: { anchor: a.auswahl.von, head: a.auswahl.bis } })
        view.focus()
      },
      rueckgaengig: () => { undo(view); view.focus() },
      wiederholen: () => { redo(view); view.focus() },
    })
    return () => {
      // Was noch nicht gespeichert ist, geht nicht verloren.
      if (warte.current) { window.clearTimeout(warte.current); melden.current(view.state.doc.toString()) }
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nurLesen])

  // Eine neue Fassung von aussen, wenn man gerade nicht tippt.
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const jetzt = view.state.doc.toString()
    if (jetzt === inhalt) return
    const uebernehmen = () => {
      const v = viewRef.current
      if (!v || v.state.doc.toString() === inhalt) return
      const pos = Math.min(v.state.selection.main.head, inhalt.length)
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: inhalt }, selection: { anchor: pos }, annotations: vonAussen.of(true) })
    }
    const seit = Date.now() - zuletztGetippt.current
    if (seit >= RUHE_MS && !warte.current) { uebernehmen(); return }
    const t = window.setTimeout(uebernehmen, Math.max(RUHE_MS - seit, SPEICHERN_MS) + 50)
    return () => window.clearTimeout(t)
  }, [inhalt])

  return <div ref={huelle} className="h-full min-h-0 overflow-hidden bg-white text-slate-900" />
}

