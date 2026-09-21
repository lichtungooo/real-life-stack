// Das Profil einer Einrichtung, als Collage aus Kacheln.
//
// **Die Vorgabe stammt von Janosch** (UX im Kernteam), 21.09.2026: Bild mit
// Platzhalter, Name, Mitwirkende, relevante Details, Hashtags, Gründung und
// Meilensteine, Karte, Rechtliches, freies Textfeld, Kontakt. Wichtiges oben,
// Details unten, als Collage, die sich per Drag and Drop umsortieren lässt.
//
// **Der Kopf bleibt oben.** Bild, Name und Einordnung sind die Identität; sie
// stehen fest. Alles darunter verschiebt sich.
//
// **Was hier steht und was nicht:** Welche Kacheln ein Profil hat und was
// darin steht, rechnet `@trustdonation/core` aus, ohne Browser und geprüft.
// Diese Datei zeigt allein an (ARCHITEKTUR Teil 3).
//
// **Drag and Drop ohne Bibliothek.** Antons Kanban-Brett nutzt die
// HTML5-Schnittstelle (`dataTransfer`); dem folgen wir. Eine Bibliothek für
// diese eine Fläche wöge mehr als der Nutzen.
//
// **Die Design-Doktrin gilt** (memory/feedback_design_doktrin.md, 12.05.2026):
// Farbflächen statt weißer Karten mit Rahmen, Atemraum statt Trennstriche,
// `rounded-2xl`, keine schwarzen Umrandungen.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react"
import type { Profil, Kachel, ProfilFeld, Meilenstein, Ort } from "@trustdonation/core"
import { kachelnOrdnen, kartenAusschnitt } from "@trustdonation/core"

/**
 * Text in der Hausfarbe, der in beiden Ansichten lesbar bleibt.
 *
 * Eine Hausfarbe ist für weißen Grund gewählt: Das Blau der Software
 * AG-Stiftung (#194294) verschwindet auf einer dunklen Fläche. Ein Inline-Stil
 * lässt sich von CSS nicht zurücknehmen, darum reist die Farbe als Variable
 * und die dunkle Ansicht greift auf den Vordergrund zurück.
 */
const HAUSFARBE = "text-[color:var(--td-hausfarbe)] dark:text-foreground"

/** Die Hausfarbe an die Variable binden. */
function hausfarbe(farbe: string): CSSProperties {
  return { "--td-hausfarbe": farbe } as CSSProperties
}

/** Welche Farbfläche welche Kachel trägt. */
const FLAECHEN: Record<string, string> = {
  hashtags: "bg-violet-50/60 dark:bg-violet-950/40",
  details: "bg-amber-50/60 dark:bg-amber-950/40",
  geschichte: "bg-blue-50/60 dark:bg-blue-950/40",
  karte: "bg-emerald-50/60 dark:bg-emerald-950/40",
  mitwirkende: "bg-orange-50/60 dark:bg-orange-950/40",
  kontakt: "bg-green-50/60 dark:bg-green-950/40",
  rechtliches: "bg-slate-50/60 dark:bg-slate-900/40",
  notiz: "bg-yellow-50/60 dark:bg-yellow-950/40",
}

export interface ProfilFlaecheProps {
  /**
   * Der Name. Er steht über allem.
   *
   * Leer gelassen, erscheinen Cover und Name nicht. So steht die Collage im
   * Item-Detail unter dem Titel, den jene Ansicht schon trägt.
   */
  name?: string
  /** Die Hausfarbe. Sonst das Blau der Stiftungsart. */
  farbe?: string
  /** Das fertige Profil, ausgerechnet von `profilAufbauen`. */
  profil: Profil
  /** Woher die Angaben stammen, solange niemand den Eintrag übernommen hat. */
  quelle?: string
  /**
   * Die Kennung, unter der die eigene Reihenfolge der Kacheln liegt.
   *
   * Ohne sie bleibt die Collage bei der Rangfolge des Bauplans; ein Profil
   * ohne feste Kennung soll keine fremde Reihenfolge erben.
   */
  ordnungsId?: string
  /** Ein Bild ergänzen. Fehlt der Haken, bleibt der Platzhalter still. */
  onBildAendern?: () => void
}

/** Wo die eigene Reihenfolge liegt. */
const ORDNUNG_SCHLUESSEL = (id: string) => `td-profil-ordnung-${id}`

export function ProfilFlaeche({
  name,
  farbe,
  profil,
  quelle,
  ordnungsId,
  onBildAendern,
}: ProfilFlaecheProps) {
  const eigen = farbe || "#194294"

  // Die eigene Reihenfolge lebt im Browser dessen, der sie gewählt hat.
  // Ein recherchierter Eintrag gehört niemandem, also darf niemand die
  // Reihenfolge für alle anderen festlegen.
  const [ordnung, setOrdnung] = useState<string[] | null>(null)
  useEffect(() => {
    if (!ordnungsId) {
      setOrdnung(null)
      return
    }
    try {
      const roh = window.localStorage.getItem(ORDNUNG_SCHLUESSEL(ordnungsId))
      setOrdnung(roh ? (JSON.parse(roh) as string[]) : null)
    } catch {
      // Ein Browser ohne Speicher ist kein Fehler, nur kein Gedächtnis.
      setOrdnung(null)
    }
  }, [ordnungsId])

  const kacheln = useMemo(
    () => kachelnOrdnen(profil.kacheln, ordnung),
    [profil.kacheln, ordnung],
  )

  const [gezogen, setGezogen] = useState<string | null>(null)
  const [ueber, setUeber] = useState<string | null>(null)

  const verschieben = useCallback(
    (vonId: string, nachId: string) => {
      if (vonId === nachId) return
      const ids = kacheln.map((k) => k.id as string)
      const von = ids.indexOf(vonId)
      const nach = ids.indexOf(nachId)
      if (von < 0 || nach < 0) return
      ids.splice(nach, 0, ids.splice(von, 1)[0])
      setOrdnung(ids)
      if (ordnungsId) {
        try {
          window.localStorage.setItem(ORDNUNG_SCHLUESSEL(ordnungsId), JSON.stringify(ids))
        } catch {
          // Gespeichert oder nicht: Die Ansicht folgt trotzdem.
        }
      }
    },
    [kacheln, ordnungsId],
  )

  // Nichts zu zeigen heißt: nichts zeigen (`traegtProfil` hält es vorher
  // zurück). Eine Fläche, die "hier steht nichts" sagt, wirkt kaputt.
  if (profil.kacheln.length === 0 && profil.einordnung.length === 0) return null

  return (
    <div className="@container mx-auto w-full max-w-3xl">
      {name && (
        <Kopf
          name={name}
          bild={profil.bild}
          farbe={eigen}
          einordnung={profil.einordnung}
          onBildAendern={onBildAendern}
        />
      )}

      <div className={name ? "px-5 pb-6 @lg:px-7" : "pb-2"}>
        {!name && profil.einordnung.length > 0 && <Einordnung teile={profil.einordnung} />}

        {/* Die Collage. Jede Kachel lässt sich fassen und woanders ablegen;
            die Reihenfolge bleibt im Browser dessen, der sie gewählt hat. */}
        <div className={(name ? "mt-5" : "mt-4") + " grid grid-cols-2 gap-3"}>
          {kacheln.map((k) => (
            <KachelFlaeche
              key={k.id}
              kachel={k}
              farbe={eigen}
              wirdGezogen={gezogen === k.id}
              istZiel={ueber === k.id && gezogen !== k.id}
              onGreifen={() => setGezogen(k.id as string)}
              onLoslassen={() => {
                setGezogen(null)
                setUeber(null)
              }}
              onDarueber={() => setUeber(k.id as string)}
              onAblegen={(vonId) => {
                if (vonId) verschieben(vonId, k.id as string)
                setGezogen(null)
                setUeber(null)
              }}
            />
          ))}
        </div>

        {/* Am Fuß, leise: woher die Angaben stammen und was noch fehlt. Der
            Stand ist eine Zahl für den, der pflegt, keine Note für den, der
            liest. */}
        {(quelle || profil.stand.gefuellt < profil.stand.gesamt) && (
          <div className="mt-7 space-y-1 text-[11px] leading-relaxed text-muted-foreground/80">
            {quelle && (
              <p>
                Diese Angaben stammen aus öffentlicher Recherche ({quelle}). Die
                Einrichtung pflegt sie selbst, sobald sie ihren Eintrag übernimmt.
              </p>
            )}
            {profil.stand.gefuellt < profil.stand.gesamt && (
              <p>
                {profil.stand.gefuellt} von {profil.stand.gesamt} möglichen Angaben
                ausgefüllt. Kacheln lassen sich mit der Maus verschieben.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Bild, Name, Einordnung.
 *
 * Das Band trägt die Hausfarbe als Verlauf, das Bild überlappt es. Fehlt ein
 * Bild, steht dort ein Platzhalter mit dem Kürzel und der Einladung, eines zu
 * ergänzen (Janosch).
 */
function Kopf({
  name,
  bild,
  farbe,
  einordnung,
  onBildAendern,
}: {
  name: string
  bild?: string
  farbe: string
  einordnung: string[]
  onBildAendern?: () => void
}) {
  // Ein Kürzel statt eines leeren Kastens. Zwei Buchstaben sagen, wer gemeint
  // ist, wo ein Bild fehlt.
  const kuerzel = name
    .split(/\s+/)
    .filter((w) => /[A-Za-zÄÖÜäöü]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")

  const sicheresBild = bild ? urlAlsBildSrc(bild) : null
  const InnenTag = onBildAendern ? "button" : "div"

  return (
    <div>
      <div
        className="h-28 w-full @lg:h-36"
        style={{ background: `linear-gradient(135deg, ${farbe} 0%, ${farbe}a0 100%)` }}
      />

      <div className="px-5 @lg:px-7">
        <InnenTag
          {...(onBildAendern
            ? {
                type: "button" as const,
                onClick: onBildAendern,
                "aria-label": sicheresBild ? "Bild austauschen" : "Bild ergänzen",
                title: sicheresBild ? "Bild austauschen" : "Bild ergänzen",
              }
            : {})}
          className={
            "group relative -mt-11 flex h-22 w-22 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-md @lg:-mt-14 @lg:h-28 @lg:w-28 @lg:text-3xl " +
            (onBildAendern ? "cursor-pointer" : "")
          }
          style={{ background: farbe }}
        >
          {sicheresBild ? (
            <img src={sicheresBild} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              {kuerzel || "?"}
              {/* Der Platzhalter lädt ein, statt nur leer zu sein. */}
              {onBildAendern && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100">
                  Bild ergänzen
                </span>
              )}
            </>
          )}
        </InnenTag>

        <h1 className="mt-3 text-xl font-bold leading-tight tracking-tight @lg:text-2xl">
          {name}
        </h1>

        {einordnung.length > 0 && <Einordnung teile={einordnung} />}
      </div>
    </div>
  )
}

/**
 * Die Einordnungszeile: Stiftung · fördernd · Essen.
 *
 * Eine Zeile mit Punkten getrennt. Drei Zeilen Beschriftung und Wert
 * untereinander sagen dasselbe und brauchen dreimal so viel Platz.
 */
function Einordnung({ teile }: { teile: string[] }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      {teile.map((t, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-muted-foreground/40">·</span>}
          {t}
        </span>
      ))}
    </p>
  )
}

/**
 * Eine Kachel der Collage.
 *
 * Sie lässt sich greifen und woanders ablegen. Das Greifen läuft über die
 * HTML5-Schnittstelle, wie bei Antons Kanban-Brett.
 */
function KachelFlaeche({
  kachel,
  farbe,
  wirdGezogen,
  istZiel,
  onGreifen,
  onLoslassen,
  onDarueber,
  onAblegen,
}: {
  kachel: Kachel
  farbe: string
  wirdGezogen: boolean
  istZiel: boolean
  onGreifen: () => void
  onLoslassen: () => void
  onDarueber: () => void
  /** Bekommt die Kennung der gezogenen Kachel, wie der Browser sie mitträgt. */
  onAblegen: (vonId: string) => void
}) {
  return (
    <section
      draggable
      onDragStart={(e: DragEvent<HTMLElement>) => {
        e.dataTransfer.setData("text/plain", kachel.id as string)
        e.dataTransfer.effectAllowed = "move"
        onGreifen()
      }}
      onDragEnd={onLoslassen}
      onDragOver={(e: DragEvent<HTMLElement>) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        onDarueber()
      }}
      onDrop={(e: DragEvent<HTMLElement>) => {
        e.preventDefault()
        // Die Kennung kommt vom Browser, nicht aus dem React-Zustand: Der
        // kann zwischen dragstart und drop noch alt sein.
        onAblegen(e.dataTransfer.getData("text/plain"))
      }}
      className={
        "@container/kachel overflow-hidden rounded-2xl p-4 transition-all " +
        (FLAECHEN[kachel.id] ?? "bg-slate-50/60 dark:bg-slate-900/40") +
        // Eine schmale Kachel steht im engen Kasten trotzdem über die volle
        // Breite: Zwei Spalten bei 200 Pixeln sind keine zwei Spalten.
        (kachel.breite === "breit" ? " col-span-2" : " col-span-2 @md:col-span-1") +
        (wirdGezogen ? " opacity-40" : "") +
        (istZiel ? " ring-2 ring-offset-2 ring-offset-background" : "")
      }
      style={istZiel ? ({ "--tw-ring-color": farbe } as CSSProperties) : undefined}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="h-1 w-5 shrink-0 rounded-full"
          style={{ background: farbe }}
        />
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {kachel.titel}
        </h2>
      </div>

      <Inhalt kachel={kachel} farbe={farbe} />
    </section>
  )
}

/** Was in einer Kachel steht, je nach ihrer Art. */
function Inhalt({ kachel, farbe }: { kachel: Kachel; farbe: string }) {
  if (kachel.id === "hashtags" && kachel.hashtags) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {kachel.hashtags.map((t, i) => (
          <span
            key={i}
            className={"rounded-full bg-white/70 px-2.5 py-0.5 text-[13px] dark:bg-white/10 " + HAUSFARBE}
            style={hausfarbe(farbe)}
          >
            #{t}
          </span>
        ))}
      </div>
    )
  }

  if (kachel.id === "geschichte") {
    return <Geschichte kachel={kachel} farbe={farbe} />
  }

  if (kachel.id === "karte" && kachel.ort) {
    return <Karte ort={kachel.ort} farbe={farbe} />
  }

  if (kachel.id === "notiz" && kachel.text) {
    return <p className="text-sm leading-relaxed">{kachel.text}</p>
  }

  if (kachel.felder.length === 0) return null

  return (
    <dl className="space-y-3">
      {kachel.felder.map((f) => (
        <Feld key={f.id} feld={f} farbe={farbe} />
      ))}
    </dl>
  )
}

/**
 * Gründung und Meilensteine als Zeitstrahl.
 *
 * Eine senkrechte Linie mit Punkten daran: Das Jahr links, der Satz rechts.
 * Eine Liste täte es auch und sagte nicht, dass Zeit vergeht.
 */
function Geschichte({ kachel, farbe }: { kachel: Kachel; farbe: string }) {
  const gegruendet = kachel.felder.find((f) => f.id === "gegruendet")
  const schritte: Meilenstein[] = kachel.meilensteine ?? []

  return (
    <div>
      {gegruendet && (
        <p className="mb-3 text-sm">
          <span className="text-muted-foreground">Gegründet </span>
          <span className={"font-semibold tabular-nums " + HAUSFARBE} style={hausfarbe(farbe)}>
            {String(gegruendet.wert)}
          </span>
        </p>
      )}

      {schritte.length > 0 && (
        <ol className="relative space-y-3 pl-5">
          {/* Die Linie liegt hinter den Punkten, nicht als Trenner zwischen
              Zeilen: Ein Zeitstrahl ist eine Linie, kein Tabellengitter. */}
          <span
            aria-hidden
            className="absolute bottom-1 left-[3px] top-1 w-px"
            style={{ background: farbe, opacity: 0.3 }}
          />
          {schritte.map((m, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden
                className="absolute -left-5 top-1.5 h-[7px] w-[7px] rounded-full"
                style={{ background: farbe }}
              />
              <span
                className={"mr-2 text-xs font-bold tabular-nums " + HAUSFARBE}
                style={hausfarbe(farbe)}
              >
                {m.wann}
              </span>
              <span className="text-sm leading-relaxed">{m.was}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/**
 * Wo die Einrichtung sitzt.
 *
 * Ein Mosaik aus Kartenkacheln, denselben, die Antons Leaflet-Adapter lädt.
 * Kein fremder Rahmen: Die App läuft mit COEP, und das blockiert jedes
 * iframe ohne passende Kopfzeilen (gemessen am 21.09.2026). Keine
 * Kartenbibliothek: Die wiegt ein Megabyte, sechs Bilder tun dasselbe.
 *
 * Welche Kacheln und wo die Nadel steht, rechnet `kartenAusschnitt` in
 * `td-core`, geprüft ohne Browser. Hier werden nur Bilder abgelegt.
 */
const KACHELQUELLE = "https://tile.openstreetmap.org"
const KARTENHOEHE = 190

function Karte({ ort, farbe }: { ort: Ort; farbe: string }) {
  const kasten = useRef<HTMLDivElement>(null)
  // Die Breite kommt vom Kasten, nicht vom Fenster: Dieselbe Kachel steht in
  // einem 480er-Panel und auf einer breiten Seite.
  const [breite, setBreite] = useState(440)
  useEffect(() => {
    const el = kasten.current
    if (!el || typeof ResizeObserver === "undefined") return
    const beobachter = new ResizeObserver((eintraege) => {
      const b = Math.round(eintraege[0]?.contentRect.width ?? 0)
      if (b > 0) setBreite(b)
    })
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [])

  const ausschnitt = useMemo(
    () => kartenAusschnitt(ort, breite, KARTENHOEHE, 14),
    [ort, breite],
  )
  const hin = `https://www.openstreetmap.org/?mlat=${ort.breite}&mlon=${ort.laenge}#map=15/${ort.breite}/${ort.laenge}`

  return (
    <div>
      <div
        ref={kasten}
        className="relative w-full overflow-hidden rounded-xl bg-muted/40"
        style={{ height: KARTENHOEHE }}
        role="img"
        aria-label={ort.anschrift ? `Karte: ${ort.anschrift}` : "Karte"}
      >
        {ausschnitt.kacheln.map((k) => (
          <img
            key={`${k.z}/${k.x}/${k.y}`}
            src={`${KACHELQUELLE}/${k.z}/${k.x}/${k.y}.png`}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute h-64 w-64 max-w-none select-none"
            style={{ left: k.links, top: k.oben }}
          />
        ))}
        {/* Die Nadel: ein Punkt in der Hausfarbe mit hellem Rand, damit er
            auf jeder Karte zu sehen ist. */}
        <span
          aria-hidden
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-white shadow-md"
          style={{ left: ausschnitt.nadel.links, top: ausschnitt.nadel.oben, background: farbe }}
        />
        <span className="absolute bottom-1 right-1.5 rounded bg-white/80 px-1 text-[9px] leading-tight text-black/70">
          © OpenStreetMap-Mitwirkende
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {ort.anschrift && <p className="text-sm">{ort.anschrift}</p>}
        <a
          href={hin}
          target="_blank"
          rel="noreferrer"
          className={"text-xs underline underline-offset-2 " + HAUSFARBE}
          style={hausfarbe(farbe)}
        >
          Größer ansehen
        </a>
      </div>
    </div>
  )
}

/**
 * Ein Feld, in der Form, die zu ihm passt.
 *
 * Die Beschriftung steht klein und leise, der Wert darunter. In einer Kachel
 * ist der Platz knapp, darum untereinander statt nebeneinander.
 */
function Feld({ feld, farbe }: { feld: ProfilFeld; farbe: string }) {
  const { label, form, wert } = feld

  if (form === "tags") {
    const werte = Array.isArray(wert) ? wert : [wert]
    return (
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 flex flex-wrap gap-1.5">
          {werte.map((t, i) => (
            <span
              key={i}
              className={"rounded-full bg-white/70 px-2.5 py-0.5 text-[13px] dark:bg-white/10 " + HAUSFARBE}
              style={hausfarbe(farbe)}
            >
              {String(t)}
            </span>
          ))}
        </dd>
      </div>
    )
  }

  if (form === "list") {
    const werte = Array.isArray(wert) ? wert : [wert]
    return (
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1">
          <ul className="space-y-1">
            {werte.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span
                  aria-hidden
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50"
                />
                <span>{String(t)}</span>
              </li>
            ))}
          </ul>
        </dd>
      </div>
    )
  }

  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm leading-relaxed">{anzeige(form, wert, farbe)}</dd>
    </div>
  )
}

/**
 * Nur das, was ein Browser gefahrlos öffnet.
 *
 * Die Angaben stammen aus Recherche und später aus fremder Pflege. Ein
 * `javascript:`-Ziel in einem Profilfeld führt Code aus, sobald jemand darauf
 * klickt (Prüfkreis, FND-0027). Allein http und https: Ein schemaloses
 * "beispiel.de" zu ergänzen wäre bequem und öffnete eine Tür.
 */
export function urlAlsHref(roh: string): string | null {
  const getrimmt = roh.trim()
  if (/^https?:\/\//i.test(getrimmt)) return getrimmt
  return null
}

/** Dasselbe für ein Bild, wo zusätzlich `data:image/` erlaubt ist. */
export function urlAlsBildSrc(roh: string): string | null {
  const getrimmt = roh.trim()
  if (/^(javascript|vbscript):/i.test(getrimmt)) return null
  if (
    /^https?:\/\//i.test(getrimmt) ||
    getrimmt.startsWith("/") ||
    /^data:image\//i.test(getrimmt)
  ) {
    return getrimmt
  }
  return null
}

function anzeige(form: string, wert: unknown, farbe: string) {
  if (form === "bool") {
    return <span>{wert === true ? "ja" : "nein"}</span>
  }
  if (form === "money" && typeof wert === "number") {
    return <span className="tabular-nums">{wert.toLocaleString("de-DE")} €</span>
  }
  if (form === "url" && typeof wert === "string") {
    const href = urlAlsHref(wert)
    if (!href) return <span>{wert}</span>
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={hausfarbe(farbe)}
        className={"break-all underline underline-offset-2 " + HAUSFARBE}
      >
        {wert.replace(/^https?:\/\//, "")}
      </a>
    )
  }
  if (form === "email" && typeof wert === "string") {
    return (
      <a
        href={`mailto:${wert}`}
        style={hausfarbe(farbe)}
        className={"break-all underline underline-offset-2 " + HAUSFARBE}
      >
        {wert}
      </a>
    )
  }
  if (form === "tel" && typeof wert === "string") {
    // Eine Telefonnummer wird zum Anruf, sobald jemand sie auf dem Telefon
    // liest. Leerzeichen und Klammern gehören ins Ziel nicht hinein.
    return (
      <a
        href={`tel:${wert.replace(/[^\d+]/g, "")}`}
        style={hausfarbe(farbe)}
        className={"underline underline-offset-2 " + HAUSFARBE}
      >
        {wert}
      </a>
    )
  }
  if (typeof wert === "number") {
    return <span className="tabular-nums">{wert.toLocaleString("de-DE")}</span>
  }
  return <span>{String(wert ?? "")}</span>
}
