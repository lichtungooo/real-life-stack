// Die Zeichenflaeche selbst: Excalidraw (MIT), nachgeladen, sobald jemand
// das Pad oeffnet. Sie kennt keinen Raum: Sie bekommt die Elemente aller und
// meldet, was sich bei ihr geaendert hat. Die Einigung steht in
// @kreis/core/zeichnung (wie Excalidraw selbst: hoehere Fassung gewinnt).
//
// ⚠ Excalidraw laedt Schriften sonst von einem fremden Netz. Die App legt sie
// selbst aus und setzt `window.EXCALIDRAW_ASSET_PATH` (App.tsx).

import { useEffect, useRef } from "react"
import { CaptureUpdateAction, Excalidraw } from "@excalidraw/excalidraw"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import "@excalidraw/excalidraw/index.css"
import { elementeEinmischen, geaenderteElemente, type ZeichenElement } from "@kreis/core"

export interface ZeichenpadSteuerung {
  anBreiteAnpassen: () => void
}

export default function ZeichenpadFlaeche({ elemente, onAenderung, nurLesen, onSteuerung }: {
  elemente: readonly ZeichenElement[]
  onAenderung: (geaendert: readonly ZeichenElement[]) => void
  nurLesen: boolean
  onSteuerung?: (s: ZeichenpadSteuerung) => void
}) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
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

  const beiAenderung = () => {
    if (warte.current) return
    // Gebuendelt: ein Strich besteht aus vielen Bewegungen.
    warte.current = window.setTimeout(() => {
      warte.current = null
      const alle = (apiRef.current?.getSceneElementsIncludingDeleted() ?? []) as unknown as readonly ZeichenElement[]
      const geaendert = geaenderteElemente(alle, bekannt.current)
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
