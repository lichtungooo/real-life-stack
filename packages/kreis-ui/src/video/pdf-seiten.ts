// Seiten einer PDF als Bild, mit pdf.js (Apache 2.0), im Browser jedes
// Menschen. Die Datei kam ueber den Raum; gezeichnet wird hier, damit kein
// Server die Folien sehen muss. pdf.js wird erst geladen, wenn jemand
// Folien auflegt.

export interface SeitenBild {
  /** Id fuer Excalidraw: Datei und Seite. */
  id: string
  dataURL: string
  breite: number
  hoehe: number
}

type PdfDokument = { numPages: number; getPage: (n: number) => Promise<PdfSeite> }
type PdfSeite = {
  getViewport: (o: { scale: number }) => { width: number; height: number }
  render: (o: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> }
}

let pdfjs: Promise<typeof import("pdfjs-dist")> | null = null
function laden() {
  // Der Worker als eigene Datei aus dem Bau (Vite `?url`), nicht aus einem fremden Netz.
  pdfjs ??= Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]).then(([m, worker]) => {
    m.GlobalWorkerOptions.workerSrc = worker.default
    return m
  })
  return pdfjs
}

const dokumente = new Map<string, Promise<PdfDokument>>()
const bilder = new Map<string, Promise<SeitenBild>>()

function dokument(datei: string, bytes: Uint8Array): Promise<PdfDokument> {
  let d = dokumente.get(datei)
  if (!d) {
    // pdf.js uebernimmt den Puffer; eine Kopie laesst das Original heil.
    d = laden().then((m) => m.getDocument({ data: bytes.slice() }).promise as unknown as Promise<PdfDokument>)
    dokumente.set(datei, d)
  }
  return d
}

/** Wie viele Seiten hat die PDF? */
export async function seitenZahl(datei: string, bytes: Uint8Array): Promise<number> {
  return (await dokument(datei, bytes)).numPages
}

/** Eine Seite als JPEG, etwa 1600 Pixel breit. Bereits gezeichnete Seiten kommen aus dem Speicher. */
export function seiteAlsBild(datei: string, bytes: Uint8Array, seite: number): Promise<SeitenBild> {
  const schluessel = `${datei}:${seite}`
  let b = bilder.get(schluessel)
  if (!b) {
    b = (async () => {
      const doc = await dokument(datei, bytes)
      const p = await doc.getPage(seite)
      const roh = p.getViewport({ scale: 1 })
      const massstab = 1600 / roh.width
      const vp = p.getViewport({ scale: massstab })
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(vp.width)
      canvas.height = Math.round(vp.height)
      const ctx = canvas.getContext("2d")!
      await p.render({ canvas, canvasContext: ctx, viewport: vp }).promise
      return { id: `folie-${schluessel}`, dataURL: canvas.toDataURL("image/jpeg", 0.85), breite: canvas.width, hoehe: canvas.height }
    })()
    bilder.set(schluessel, b)
  }
  return b
}
