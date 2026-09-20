// Das Profil einer Einrichtung, als Fläche.
//
// Timo am 18.09.2026: *"Ich will so eine Karte haben, wo alles draufsteht, was
// eine Stiftung macht."* Und am 20.09.2026, nach der ersten Fassung: *"Das ist
// ja jetzt wirklich dumm Design. Es geht darum, professionelle Profile zu
// bauen ... mit sauberen Reitern, nicht da die Fragen reinzustellen."*
//
// **Die Anatomie** (docs/13-profil.md, zweite Fassung):
//
//     Hero       Farbband, Logo, Name, eine Meta-Zeile, zwei Aktionen
//     Kennzahlen drei Zahlen, groß gesetzt
//     Reiter     Überblick · Antrag · Geben
//     Inhalt     Zweck als Aussage, Hinweis abgesetzt, Rest als Liste
//
// **Keine Frage steht auf dem Bildschirm.** Die Fragen stehen im Bauplan und
// in der Definition; sie sagen, welche Felder hineingehören. Wer sie anzeigt,
// macht aus einem Profil einen Fragebogen.
//
// **Was hier steht und was nicht:** Welche Reiter ein Profil hat und welche
// Felder darin stehen, rechnet `@trustdonation/core` aus, ohne Browser und
// geprüft. Diese Datei zeigt allein an (ARCHITEKTUR Teil 3).
//
// **Die Design-Doktrin gilt** (memory/feedback_design_doktrin.md, 12.05.2026):
// Farbflächen statt weißer Karten mit Rahmen, Atemraum statt Trennstriche,
// `rounded-2xl`, keine schwarzen Umrandungen.
import { useState, type CSSProperties } from "react"
import type { Profil, ProfilFeld, Kennzahl } from "@trustdonation/core"

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

export interface ProfilFlaecheProps {
  /**
   * Der Name der Einrichtung. Er steht über allem.
   *
   * Leer gelassen, erscheint kein Hero. So steht die Fläche im Item-Detail
   * unter dem Titel, den jene Ansicht schon trägt.
   */
  name?: string
  /** Das Bild, falls es eines gibt. */
  bild?: string
  /** Die Hausfarbe. Sonst das Blau der Stiftungsart. */
  farbe?: string
  /** Das fertige Profil, ausgerechnet von `profilAufbauen`. */
  profil: Profil
  /** Woher die Angaben stammen, solange niemand den Eintrag übernommen hat. */
  quelle?: string
}

export function ProfilFlaeche({ name, bild, farbe, profil, quelle }: ProfilFlaecheProps) {
  const eigen = farbe || "#194294"
  const [offen, setOffen] = useState(profil.reiter[0]?.id ?? "")

  // Nichts zu zeigen heißt: nichts zeigen. Eine Fläche, die "hier steht
  // nichts" sagt, wirkt kaputt (`traegtProfil` hält sie vorher zurück).
  const leer =
    profil.kopf.length === 0 &&
    profil.kennzahlen.length === 0 &&
    profil.reiter.length === 0 &&
    !profil.zweck &&
    !profil.hinweis
  if (leer) return null

  const aktiv = profil.reiter.find((r) => r.id === offen) ?? profil.reiter[0]

  return (
    <div className="@container mx-auto w-full max-w-3xl">
      {name && <Hero name={name} bild={bild} farbe={eigen} profil={profil} />}

      <div className={name ? "px-5 pb-6 @md:px-7" : "pb-2"}>
        {/* Ohne Hero steht die Einordnungszeile hier: "Stiftung · fördernd ·
            Essen" ist auch dann eine Angabe, wenn den Namen eine andere
            Ansicht trägt (Item-Detail). */}
        {!name && profil.kopf.length > 0 && <Einordnung felder={profil.kopf} />}

        {profil.kennzahlen.length > 0 && (
          <Kennzahlen zahlen={profil.kennzahlen} farbe={eigen} ohneHero={!name} />
        )}

        {/* Der Zweck spricht in der Stimme der Einrichtung: groß gesetzt,
            ohne Beschriftung. Ein Zweck mit dem Etikett "Zweck" davor ist ein
            Formularfeld; ohne Etikett ist er eine Aussage. */}
        {profil.zweck && (
          <p className="mt-6 text-[15px] leading-relaxed text-foreground/90 @md:text-base">
            {profil.zweck}
          </p>
        )}

        {/* Der wertvollste Satz der ganzen Karte bekommt seinen eigenen Platz:
            eine Farbfläche mit einem Balken in der Hausfarbe links. Kein
            Rahmen, kein Trennstrich (Design-Doktrin). */}
        {profil.hinweis && (
          <div className="relative mt-5 overflow-hidden rounded-2xl bg-amber-50/70 px-5 py-4 dark:bg-amber-950/40">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: eigen }}
            />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {profil.hinweis.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{profil.hinweis.text}</p>
          </div>
        )}

        {/* Eine Reiterleiste mit einem Reiter ist Zierrat: Bei nur einem
            Reiter stehen seine Felder ohne Leiste da. */}
        {profil.reiter.length > 1 && (
          <div className="mt-7 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {profil.reiter.map((r) => {
              const istOffen = r.id === aktiv?.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setOffen(r.id)}
                  aria-current={istOffen ? "true" : undefined}
                  className={
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                    (istOffen
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted/60")
                  }
                >
                  {r.titel}
                </button>
              )
            })}
          </div>
        )}

        {aktiv && (
          <dl className={(profil.reiter.length > 1 ? "mt-5" : "mt-7") + " space-y-4"}>
            {aktiv.felder.map((f) => (
              <Feld key={f.id} feld={f} farbe={eigen} />
            ))}
          </dl>
        )}

        {/* Am Fuß, leise: woher die Angaben stammen und was noch fehlt.
            Der Stand ist eine ehrliche Zahl für den, der pflegt, keine Note
            für den, der liest. Darum steht er hier und nicht oben. */}
        {(quelle || profil.stand.gefuellt < profil.stand.gesamt) && (
          <div className="mt-8 space-y-1 text-[11px] leading-relaxed text-muted-foreground/80">
            {quelle && (
              <p>
                Diese Angaben stammen aus öffentlicher Recherche ({quelle}). Die
                Einrichtung pflegt sie selbst, sobald sie ihren Eintrag übernimmt.
              </p>
            )}
            {profil.stand.gefuellt < profil.stand.gesamt && (
              <p>
                {profil.stand.gefuellt} von {profil.stand.gesamt} möglichen Angaben
                ausgefüllt.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Der Kopf: Farbband, Logo, Name, eine Meta-Zeile, zwei Aktionen.
 *
 * Das Band trägt die Hausfarbe als Verlauf und bleibt flach: Ein Muster darin
 * zöge Aufmerksamkeit von dem ab, was darunter steht. Das Logo überlappt es,
 * wie es jedes Profil tut, das man kennt.
 */
function Hero({
  name,
  bild,
  farbe,
  profil,
}: {
  name: string
  bild?: string
  farbe: string
  profil: Profil
}) {
  // Ein Kürzel statt eines leeren Kastens. Wo ein Bild fehlt, soll nicht
  // "hier fehlt etwas" stehen; zwei Buchstaben sagen, wer gemeint ist.
  const kuerzel = name
    .split(/\s+/)
    .filter((w) => /[A-Za-zÄÖÜäöü]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")

  const sicheresBild = bild ? urlAlsBildSrc(bild) : null
  const netz = profil.website ? urlAlsHref(profil.website) : null

  return (
    <div className="relative">
      <div
        className="h-24 w-full @md:h-28"
        style={{ background: `linear-gradient(135deg, ${farbe} 0%, ${farbe}b0 100%)` }}
      />

      <div className="px-5 @md:px-7">
        <div
          className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-sm @md:-mt-12 @md:h-24 @md:w-24"
          style={{ background: farbe }}
        >
          {sicheresBild ? (
            <img src={sicheresBild} alt="" className="h-full w-full object-cover" />
          ) : (
            kuerzel || "?"
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-full @lg:basis-0">
            <h1 className="text-xl font-bold leading-tight tracking-tight @md:text-2xl">
              {name}
            </h1>

            {profil.kopf.length > 0 && <Einordnung felder={profil.kopf} />}
          </div>

          {/* Was ein Mensch als Nächstes tut, steht dort, wo er hinsieht. */}
          {(netz || profil.mail) && (
            <div className="flex w-full shrink-0 flex-wrap gap-2 @lg:w-auto">
              {netz && (
                <a
                  href={netz}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: farbe }}
                >
                  Website
                </a>
              )}
              {profil.mail && (
                <a
                  href={`mailto:${profil.mail}`}
                  className={"rounded-full bg-muted/70 px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted " + HAUSFARBE}
                  style={hausfarbe(farbe)}
                >
                  Schreiben
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Die Einordnungszeile: Art · fördernd · Sitz · Reichweite.
 *
 * Eine Zeile mit Punkten getrennt. Vier Zeilen Beschriftung und Wert
 * untereinander sagen dasselbe und brauchen viermal so viel Platz.
 */
function Einordnung({ felder }: { felder: ProfilFeld[] }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
      {felder.map((f, i) => (
        <span key={f.id} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-muted-foreground/40">·</span>}
          {alsText(f)}
        </span>
      ))}
    </p>
  )
}

/**
 * Die Kennzahlen: was ein Projekt zuerst wissen will.
 *
 * Drei Zahlen nebeneinander, jede auf ihrer eigenen Farbfläche. Sie
 * beantworten die Frage, ob sich das Weiterlesen lohnt, und stehen darum vor
 * den Reitern.
 */
function Kennzahlen({
  zahlen,
  farbe,
  ohneHero,
}: {
  zahlen: Kennzahl[]
  farbe: string
  ohneHero: boolean
}) {
  return (
    <div className={(ohneHero ? "" : "mt-6 ") + "grid grid-cols-2 gap-2"}>
      {zahlen.map((k, i) => (
        <div
          key={k.id}
          className={
            "overflow-hidden rounded-2xl px-4 py-3 " +
            // Die drei Flächen folgen der Farb-Konvention der Doktrin:
            // Wert (smaragd), Umfang (bernstein), Reichweite (blau).
            ["bg-emerald-50/60 dark:bg-emerald-950/40",
             "bg-amber-50/60 dark:bg-amber-950/40",
             "bg-blue-50/60 dark:bg-blue-950/40"][i % 3] +
            // Eine ungerade letzte Zahl füllt die Zeile, statt halb zu stehen.
            (zahlen.length % 2 === 1 && i === zahlen.length - 1 ? " col-span-2" : "")
          }
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {k.label}
          </p>
          <p
            className={"mt-0.5 text-lg font-bold leading-tight tabular-nums " + HAUSFARBE}
            style={hausfarbe(farbe)}
          >
            {kennzahlText(k)}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Eine Kennzahl als Text: eine Zahl, eine Spanne oder eine Aufzählung. */
function kennzahlText(k: Kennzahl): string {
  const zahl = (w: unknown) =>
    typeof w === "number" ? w.toLocaleString("de-DE") : String(w ?? "")

  if (k.form === "money") {
    if (k.wert !== undefined && k.bis !== undefined) {
      return `${zahl(k.wert)} bis ${zahl(k.bis)} €`
    }
    if (k.bis !== undefined) return `bis ${zahl(k.bis)} €`
    return `ab ${zahl(k.wert)} €`
  }
  if (Array.isArray(k.wert)) return k.wert.join(", ")
  if (k.form === "daterange" && k.wert && k.bis) return `${zahl(k.wert)} bis ${zahl(k.bis)}`
  return zahl(k.wert)
}

/**
 * Ein Feld, in der Form, die zu ihm passt.
 *
 * Die Beschriftung steht klein und leise, der Wert daneben. Eng gemessen
 * (Container-Anfrage, nicht Fensterbreite) rutscht sie darüber: Dieselbe
 * Fläche steht in einem Panel von 480 Pixeln und auf einer Seite von 768.
 */
function Feld({ feld, farbe }: { feld: ProfilFeld; farbe: string }) {
  const { label, form, wert } = feld

  if (form === "longtext") {
    return (
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 max-w-[46em] text-sm leading-relaxed">{String(wert)}</dd>
      </div>
    )
  }

  if (form === "tags") {
    const liste = Array.isArray(wert) ? wert : [wert]
    return (
      <div className="flex flex-col gap-y-1.5 @lg:flex-row @lg:flex-wrap @lg:items-baseline @lg:gap-x-4">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @lg:w-40 @lg:shrink-0 @lg:pt-1">
          {label}
        </dt>
        <dd className="flex flex-1 flex-wrap gap-1.5">
          {liste.map((t, i) => (
            <span
              key={i}
              className={"rounded-full bg-muted/70 px-2.5 py-0.5 text-[13px] " + HAUSFARBE}
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
    const liste = Array.isArray(wert) ? wert : [wert]
    return (
      <div className="flex flex-col gap-y-1 @lg:flex-row @lg:flex-wrap @lg:items-baseline @lg:gap-x-4">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @lg:w-40 @lg:shrink-0">
          {label}
        </dt>
        <dd className="flex-1">
          <ul className="space-y-1">
            {liste.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                <span>{String(t)}</span>
              </li>
            ))}
          </ul>
        </dd>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-1 @lg:flex-row @lg:flex-wrap @lg:items-baseline @lg:gap-x-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @lg:w-40 @lg:shrink-0">
        {label}
      </dt>
      <dd className="flex-1 text-sm leading-relaxed">{anzeige(form, wert, farbe)}</dd>
    </div>
  )
}

/** Ein Feld des Kopfes als schlichter Text. */
function alsText(f: ProfilFeld): string {
  if (Array.isArray(f.wert)) return f.wert.join(", ")
  if (typeof f.wert === "boolean") return f.wert ? f.label : `kein ${f.label}`
  return String(f.wert ?? "")
}

/**
 * Nur das, was ein Browser gefahrlos öffnet.
 *
 * Die Angaben stammen aus Recherche und später aus fremder Pflege. Ein
 * `javascript:`-Ziel in einem Profilfeld führt Code aus, sobald jemand darauf
 * klickt (Prüfkreis, FND-0027).
 */
export function urlAlsHref(roh: string): string | null {
  const getrimmt = roh.trim()
  // Allein http und https. Ein schemaloses "beispiel.de" zu ergänzen wäre
  // bequem und öffnete eine Tür: Was hier durchkommt, landet in einem href.
  if (/^https?:\/\//i.test(getrimmt)) return getrimmt
  return null
}

/** Dasselbe für ein Bild, wo zusätzlich `data:image/` erlaubt ist. */
export function urlAlsBildSrc(roh: string): string | null {
  const getrimmt = roh.trim()
  if (/^(javascript|vbscript):/i.test(getrimmt)) return null
  if (/^https?:\/\//i.test(getrimmt) || getrimmt.startsWith("/") || /^data:image\//i.test(getrimmt)) {
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
        className={"underline underline-offset-2 " + HAUSFARBE}
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
