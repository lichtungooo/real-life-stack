// Der Baukasten als Fläche in der App.
//
// Timo am 18.09.2026: *"Ich finde, der Baukasten gehört in die Einstellungen
// vom Netzwerk. Allerdings ist er da eigenständig wie ein Dashboard, was über
// den ganzen Bildschirm geht, mit verschiedenen Kategorien, wo man die Module
// anwählen kann, wo man diese ganzen Komponenten anwählen kann."*
//
// Davor gab es den Baukasten nur als Dateien im Repo und als Seite zum Lesen.
// Hier wird er zu dem, was er sein soll: einer Fläche, auf der man auswählt.
//
// **Was hier wirklich etwas ändert:** die Module. Ein Klick schreibt
// `Group.data.modules`, und der Reiter erscheint oder verschwindet. Alles
// andere zeigt heute nur, was es gibt: Arten, Bauteile, Muster, Vorlagen und
// Texte sind Bausteine, die noch niemand zur Laufzeit in einen Space nimmt.
// Das steht auf jeder Kachel, statt eine Möglichkeit vorzutäuschen.
//
// **Die Grenze:** Antons Spec 01, Regel 4 sagt, das Modul-Register steht vor
// dem ersten Render fest. Ein Space wählt aus dem Katalog, er trägt nichts
// bei. Diese Fläche wählt darum aus, sie lädt nichts nach.
import { useMemo, useState } from "react"
import type { Group } from "@real-life-stack/data-interface"
import { baukasten, type BaukastenSchicht, type BaukastenStueck } from "@trustdonation/core"

export interface BaukastenFlaecheProps {
  /** Der Space, dessen Module hier gewählt werden. */
  group: Group | null
  /** Ob der Betrachter den Space verändern darf. */
  darfAendern: boolean
  /** Schreibt die neue Modulliste. */
  aufModule: (ids: string[]) => void | Promise<void>
}

/** Welche Schicht gerade offen ist. */
type Auswahl = BaukastenSchicht["id"]

export function BaukastenFlaeche({ group, darfAendern, aufModule }: BaukastenFlaecheProps) {
  const [offen, setOffen] = useState<Auswahl>("module")
  const [suche, setSuche] = useState("")

  const aktiveModule = useMemo<string[]>(() => {
    const roh = (group?.data as { modules?: unknown })?.modules
    return Array.isArray(roh) ? roh.map(String) : []
  }, [group])

  const schicht = baukasten.schichten.find((s) => s.id === offen) ?? baukasten.schichten[0]

  const gezeigt = useMemo(() => {
    const wort = suche.trim().toLowerCase()
    if (!wort) return schicht.stuecke
    return schicht.stuecke.filter(
      (s) =>
        s.name.toLowerCase().includes(wort) ||
        s.zweck.toLowerCase().includes(wort) ||
        s.id.toLowerCase().includes(wort),
    )
  }, [schicht, suche])

  function umschalten(id: string) {
    const drin = aktiveModule.includes(id)
    // Ein Space ohne Module hat keine Fläche mehr, auf der er sich zeigt.
    // Antons Dialog hält dieselbe Regel (rls#249).
    if (drin && aktiveModule.length <= 1) return
    void aufModule(drin ? aktiveModule.filter((m) => m !== id) : [...aktiveModule, id])
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b px-5 py-4">
        <h1 className="text-xl font-bold tracking-tight">Der Baukasten</h1>
        <p className="text-sm text-muted-foreground">
          Woraus dieser Space gebaut wird. {baukasten.anzahl} Bausteine in acht Schichten.
        </p>
        <input
          type="search"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suchen"
          aria-label="Im Baukasten suchen"
          className="ml-auto h-8 w-44 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Die Kategorien. Links, weil man sie einmal wählt und dann rechts
            arbeitet: Ein waagerechter Reiter-Streifen wäre bei acht Einträgen
            auf dem Telefon nicht mehr lesbar. */}
        <nav
          aria-label="Schichten des Baukastens"
          className="w-48 shrink-0 overflow-y-auto border-r p-2"
        >
          {baukasten.schichten.map((s) => {
            const aktiv = s.id === offen
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setOffen(s.id)}
                aria-current={aktiv ? "true" : undefined}
                className={
                  "mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors " +
                  (aktiv ? "bg-primary text-primary-foreground" : "hover:bg-muted/60")
                }
              >
                <span className="flex-1 truncate">{s.titel}</span>
                <span
                  className={
                    "text-xs tabular-nums " +
                    (aktiv ? "text-primary-foreground/70" : "text-muted-foreground")
                  }
                >
                  {s.stuecke.length}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1 overflow-y-auto p-5">
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{schicht.zweck}</p>

          {schicht.id === "module" && !darfAendern && (
            <p className="mb-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              Module wählt, wer den Space verwaltet.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {gezeigt.map((s) => (
              <Kachel
                key={s.id}
                stueck={s}
                waehlbar={schicht.id === "module" && darfAendern}
                gewaehlt={schicht.id === "module" && aktiveModule.includes(s.id)}
                aufWahl={() => umschalten(s.id)}
              />
            ))}
          </div>

          {gezeigt.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nichts gefunden. {schicht.stuecke.length} Bausteine liegen in dieser Schicht.
            </p>
          )}

          {schicht.fehlt.length > 0 && !suche && (
            <section className="mt-8 border-l-2 border-primary/40 pl-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Was hier noch fehlt
              </h2>
              <ul className="mt-2 space-y-1.5">
                {schicht.fehlt.map((f) => (
                  <li key={f.id} className="text-sm">
                    <span className="font-medium">{f.name}</span>{" "}
                    <span className="text-muted-foreground">{f.warum}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Kachel({
  stueck,
  waehlbar,
  gewaehlt,
  aufWahl,
}: {
  stueck: BaukastenStueck
  waehlbar: boolean
  gewaehlt: boolean
  aufWahl: () => void
}) {
  // Eine Farbe zeigt sich selbst. Ein Wort darüber ist nutzlos, wenn man
  // sie sehen kann.
  const probe = stueck.wert?.startsWith("#") ? stueck.wert : null

  const inhalt = (
    <>
      <div className="flex items-center gap-2">
        {probe && (
          <span
            className="h-4 w-4 shrink-0 rounded border border-foreground/10"
            style={{ background: probe }}
          />
        )}
        <span className="flex-1 truncate font-semibold">{stueck.name}</span>
        {waehlbar && (
          <span
            aria-hidden
            className={
              "h-4 w-4 shrink-0 rounded-full border-2 " +
              (gewaehlt ? "border-primary bg-primary" : "border-muted-foreground/40")
            }
          />
        )}
      </div>
      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
        {stueck.wert && !probe && <code className="text-xs">{stueck.wert} · </code>}
        {stueck.zweck}
      </p>
      {stueck.regel && (
        <p className="mt-2 border-t pt-2 text-xs text-muted-foreground line-clamp-2">
          {stueck.regel}
        </p>
      )}
      {stueck.herkunft && (
        <p className="mt-2 text-xs text-muted-foreground">von {stueck.herkunft}</p>
      )}
    </>
  )

  if (!waehlbar) {
    return <div className="rounded-xl border p-3.5">{inhalt}</div>
  }

  return (
    <button
      type="button"
      onClick={aufWahl}
      aria-pressed={gewaehlt}
      className={
        "rounded-xl border p-3.5 text-left transition-colors hover:bg-muted/40 " +
        (gewaehlt ? "border-primary/60 bg-primary/5" : "")
      }
    >
      {inhalt}
    </button>
  )
}
