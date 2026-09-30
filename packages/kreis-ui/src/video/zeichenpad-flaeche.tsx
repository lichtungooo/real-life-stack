// Die Zeichenflaeche selbst: Excalidraw (MIT), nachgeladen, sobald jemand
// das Pad oeffnet. Sie kennt keinen Raum: Sie bekommt die Elemente aller und
// meldet, was sich bei ihr geaendert hat. Die Einigung steht in
// @kreis/core/zeichnung (wie Excalidraw selbst: hoehere Fassung gewinnt).
//
// ⚠ Excalidraw laedt Schriften sonst von einem fremden Netz. Die App legt sie
// selbst aus und setzt `window.EXCALIDRAW_ASSET_PATH` (App.tsx).

import { useEffect, useRef, useState } from "react"
import { CaptureUpdateAction, Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import "@excalidraw/excalidraw/index.css"
import { elementeEinmischen, geaenderteElemente, type ZeichenElement } from "@kreis/core"
import type { SeitenBild } from "./pdf-seiten"

/** Das Bild der Folie: gesperrt, ganz unten, auf jedem Geraet selbst gebaut, nie versandt. */
const FOLIE = "folie-bild"

export interface ZeichenpadSteuerung {
  anBreiteAnpassen: () => void
}

export default function ZeichenpadFlaeche({ elemente, onAenderung, nurLesen, onSteuerung, hintergrund }: {
  elemente: readonly ZeichenElement[]
  onAenderung: (geaendert: readonly ZeichenElement[]) => void
  nurLesen: boolean
  onSteuerung?: (s: ZeichenpadSteuerung) => void
  /** Die Folie unter der Zeichnung, wenn eine PDF aufliegt. */
  hintergrund?: SeitenBild | null
}) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const [bereit, setBereit] = useState(false)
  // Je Element die zuletzt gesendete oder empfangene Fassung: So geht nur
  // hinaus, was hier entstanden ist, und nichts kommt als Echo zurueck.
  const bekannt = useRef(new Map<string, number>())
  const warte = useRef<number | null>(null)
  const startElemente = useRef(elemente)

  const merken = (liste: readonly ZeichenElement[]) => {
    for (const e of liste) bekannt.current.set(e.id, Math.max(bekannt.current.get(e.id) ?? 0, e.version))
  }

  // Was von den anderen kommt, in die Szene einmischen, ohne es in die
  // eigene Rueckgaengig-Liste zu schreiben.
  useEffect(() => {
    merken(elemente)
    const api = apiRef.current
    if (!api) return
    const szene = api.getSceneElementsIncludingDeleted() as unknown as readonly ZeichenElement[]
    const neu = elementeEinmischen(szene, elemente)
    if (neu !== szene) api.updateScene({ elements: neu as never, captureUpdate: CaptureUpdateAction.NEVER })
  }, [elemente])

  useEffect(() => () => { if (warte.current) window.clearTimeout(warte.current) }, [])

  // Die Folie als Bild ganz unten, und die Sicht auf sie.
  useEffect(() => {
    const api = apiRef.current
    if (!api || !bereit || !hintergrund) return
    api.addFiles([{ id: hintergrund.id as never, dataURL: hintergrund.dataURL as never, mimeType: "image/jpeg", created: Date.now() }])
    const [bild] = convertToExcalidrawElements([{
      type: "image", id: FOLIE, fileId: hintergrund.id as never, x: 0, y: 0,
      width: hintergrund.breite, height: hintergrund.hoehe, locked: true, status: "saved",
    }])
    const rest = api.getSceneElementsIncludingDeleted().filter((e) => e.id !== FOLIE)
    api.updateScene({ elements: [bild, ...rest], captureUpdate: CaptureUpdateAction.NEVER })
    api.scrollToContent(bild, { fitToContent: true })
  }, [bereit, hintergrund])

  const beiAenderung = () => {
    if (warte.current) return
    // Gebuendelt: ein Strich besteht aus vielen Bewegungen.
    warte.current = window.setTimeout(() => {
      warte.current = null
      const alle = (apiRef.current?.getSceneElementsIncludingDeleted() ?? []) as unknown as readonly ZeichenElement[]
      const geaendert = geaenderteElemente(alle.filter((e) => e.id !== FOLIE), bekannt.current)
      if (geaendert.length === 0) return
      merken(geaendert)
      onAenderung(geaendert)
    }, 120)
  }

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api
          merken(startElemente.current)
          setBereit(true)
          onSteuerung?.({
            anBreiteAnpassen: () => api.scrollToContent(undefined, { fitToContent: true, animate: true }),
          })
        }}
        initialData={{ elements: startElemente.current as never, appState: { viewBackgroundColor: "#ffffff" } }}
        onChange={beiAenderung}
        viewModeEnabled={nurLesen}
        langCode="de-DE"
        theme="light"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: !nurLesen,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
            saveAsImage: true,
          },
        }}
      />
    </div>
  )
}
