// Reinsprechen wie im Chat (DEFINITION 13.9, freigegeben von Timo am
// 03.10.2026), die Darstellung im Begleiter.
//
// Timo: *"Wichtig ist, dass ich wirklich rein sprechen kann, wie im normalen
// Chat. Dann wird meine Sprache verschlüsselt, transkribiert, und dann gibt
// die KI die MCP-Antwort."*
//
// Die Sprache schreibt dieselbe Mitschrift mit wie in Circeling; die App
// reicht sie als `diktat` herein, diese Fläche kennt keinen Dienst. Zum
// Testen geht der fertige Text per Knopf an den eigenen Agenten, der über
// den MCP-Server das Profil baut (13.8). Eine KI, die hier selbst antwortet,
// kommt später (13.4).
//
// Eigener Einstieg `@trustdonation/ui/begleiter`, nachgeladen.

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Loader2, Mic, Send, Square, Trash2 } from "lucide-react"

/** Was die App für das Reinsprechen bereitstellt. */
export interface Diktat {
  /** `hoert`: das Mikrofon ist offen; `verbindet`: Token und Mitschrift laufen an. */
  zustand: "aus" | "verbindet" | "hoert"
  /** Was gerade gesprochen wird und noch nicht fertig ist. */
  live: string
  fehler: string | null
  /** Startet das Mikrofon; jeder fertige Abschnitt kommt als Text in `fertig`. */
  starten: (fertig: (text: string) => void) => void
  stoppen: () => void
}

/** Die Adresse des MCP-Servers dieses Netzwerks (DEFINITION 13.7). */
export const MCP_ADRESSE = "https://trustdonation.org/mcp"

/** Der Auftrag, der mit dem Erzählten an den eigenen Agenten geht. */
export function auftragFuerAgent(text: string, mcp: string = MCP_ADRESSE): string {
  return [
    `Bau mir daraus ein Profil für trustdonation, mit den Werkzeugen des MCP-Servers ${mcp}.`,
    "Kläre zuerst, ob ein Projekt, eine Stiftung oder das Profil unserer Einrichtung entsteht. Frag nach, was fehlt. Erfinde nichts. Gib mir am Ende den Link.",
    "",
    text.trim(),
  ].join("\n")
}

const KNOPF = "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"

export function BegleiterGespraech({ diktat, mcp = MCP_ADRESSE }: { diktat: Diktat; mcp?: string }) {
  const [text, setText] = useState("")
  const [kopiert, setKopiert] = useState<"text" | "adresse" | null>(null)
  const feld = useRef<HTMLTextAreaElement>(null)
  const hoert = diktat.zustand !== "aus"

  // Beim Verlassen der Fläche das Mikrofon schließen.
  const { stoppen } = diktat
  useEffect(() => () => stoppen(), [stoppen])

  const anfuegen = (neu: string) => setText((alt) => (alt.trim() ? `${alt.trimEnd()} ${neu}` : neu))
  const mikro = () => (hoert ? diktat.stoppen() : diktat.starten(anfuegen))

  const kopieren = async (was: "text" | "adresse") => {
    try {
      await navigator.clipboard.writeText(was === "text" ? auftragFuerAgent(text, mcp) : mcp)
      setKopiert(was)
      setTimeout(() => setKopiert(null), 2500)
    } catch {
      feld.current?.select()
    }
  }
  const weitergeben = async () => {
    const auftrag = auftragFuerAgent(text, mcp)
    if (typeof navigator.share === "function") {
      try { await navigator.share({ text: auftrag }); return } catch { /* abgebrochen: kopieren */ }
    }
    await kopieren("text")
  }

  return (
    <section aria-label="Gespräch" className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-xl shadow-black/5 dark:shadow-black/30">
      <div>
        <h3 className="text-base font-semibold">Erzähl, was entstehen soll</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sprich einfach los: wer ihr seid, was ihr macht, was fehlt. Deine Sprache geht verschlüsselt an unsere eigene Mitschrift,
          dieselbe wie in Circeling, und erscheint hier als Text. Gespeichert wird nichts.
        </p>
      </div>

      <div className="relative">
        <textarea ref={feld} value={text} onChange={(e) => setText(e.target.value)} rows={6} aria-label="Deine Nachricht"
          placeholder="Wir sind der Verein … wir machen … uns fehlt …"
          className="w-full resize-y rounded-2xl bg-muted/50 px-4 py-3 pr-16 text-sm leading-relaxed outline-none ring-1 ring-transparent focus:bg-background focus:ring-2 focus:ring-ring" />
        <button type="button" onClick={mikro} aria-pressed={hoert} aria-label={hoert ? "Mikrofon aus" : "Reinsprechen"}
          title={hoert ? "Mikrofon aus" : "Reinsprechen"}
          className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-colors ${hoert ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}>
          {diktat.zustand === "verbindet" ? <Loader2 className="h-5 w-5 animate-spin" /> : hoert ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>

      {(diktat.zustand === "hoert" || diktat.live) && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground" aria-live="polite">
          <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-600" />
          {diktat.live || "Ich höre zu …"}
        </p>
      )}
      {diktat.zustand === "verbindet" && <p className="text-sm text-muted-foreground">Mikrofon und Mitschrift starten …</p>}
      {diktat.fehler && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{diktat.fehler}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void weitergeben()} disabled={!text.trim()} className={`${KNOPF} bg-emerald-700 text-white hover:bg-emerald-800`}>
          {kopiert === "text" ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />} {kopiert === "text" ? "Kopiert, jetzt beim Agenten einfügen" : "An meinen Agenten geben"}
        </button>
        <button type="button" onClick={() => setText("")} disabled={!text} className={`${KNOPF} bg-muted/60 hover:bg-muted`}>
          <Trash2 className="h-4 w-4" /> Leeren
        </button>
      </div>

      <div className="rounded-2xl bg-emerald-50/60 p-4 text-sm dark:bg-emerald-950/40">
        <p className="font-medium">So antwortet dein Agent</p>
        <p className="mt-1 text-muted-foreground">
          Verbinde deinen Agenten (etwa Claude) einmal mit dem MCP-Server dieses Netzwerks. Dann gib ihm deinen Text: Er fragt nach,
          prüft und schickt dir einen Link. Du öffnest ihn hier, siehst die Vorschau und speicherst selbst.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-background/80 px-3 py-2 text-xs">{mcp}</code>
          <button type="button" onClick={() => void kopieren("adresse")} className={`${KNOPF} bg-background/80 px-3 py-2 hover:bg-background`} aria-label="Adresse kopieren">
            {kopiert === "adresse" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  )
}

export default BegleiterGespraech
