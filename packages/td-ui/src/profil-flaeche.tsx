// Das Profil einer Einrichtung, als Fläche.
//
// Timo am 20.09.2026, nach zwei Fehlversuchen: *"Guck dir mal richtig gute
// Profile an ... es geht ja nicht darum, eine Stiftung darzustellen und dann
// ein spezielles Profil daraus zu bauen, sondern wie allgemein Profile sind,
// wie sie sich erklären."*
//
// **Nachgesehen bei Instagram, LinkedIn, GitHub und Facebook.** Die Anatomie
// ist überall dieselbe:
//
//     Cover       ein Band in der Hausfarbe
//     Identität   Bild, Name, Einordnungszeile
//     Bio         kurz, in eigener Stimme
//     Aktionen    Website · Antrag · Schreiben
//     Zahlen      drei Signale, teils gezählt
//     Themen      runde Kacheln (Instagram nennt sie Highlights)
//     Reiter      wenige, klar benannt
//     Das Werk    ein Raster von Karten
//
// **Das Werk ist das Herz.** Ein GitHub-Profil ohne Repositories wäre
// sinnlos. Die ersten zwei Fassungen zeigten ein Formular und versteckten das
// Werk als Stichwort-Chips.
//
// **Was hier steht und was nicht:** Was ein Profil trägt, rechnet
// `@trustdonation/core` aus, ohne Browser und geprüft. Diese Datei zeigt
// allein an (ARCHITEKTUR Teil 3).
//
// **Die Design-Doktrin gilt** (memory/feedback_design_doktrin.md, 12.05.2026):
// Farbflächen statt weißer Karten mit Rahmen, Atemraum statt Trennstriche,
// `rounded-2xl`, keine schwarzen Umrandungen.
import { useState, type CSSProperties } from "react"
import type { Profil, ProfilFeld, Zahl, Aktion } from "@trustdonation/core"

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
   * Der Name. Er steht über allem.
   *
   * Leer gelassen, erscheinen Cover und Name nicht. So steht die Fläche im
   * Item-Detail unter dem Titel, den jene Ansicht schon trägt.
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

  // Nichts zu zeigen heißt: nichts zeigen (`traegtProfil` hält es vorher
  // zurück). Eine Fläche, die "hier steht nichts" sagt, wirkt kaputt.
  const leer =
    profil.einordnung.length === 0 &&
    profil.zahlen.length === 0 &&
    profil.reiter.length === 0 &&
    profil.themen.length === 0 &&
    !profil.bio &&
    !profil.hervorhebung
  if (leer) return null

  const aktiv = profil.reiter.find((r) => r.id === offen) ?? profil.reiter[0]

  return (
    <div className="@container mx-auto w-full max-w-3xl">
      {name && <Kopf name={name} bild={bild} farbe={eigen} profil={profil} />}

      <div className={name ? "px-5 pb-6 @lg:px-7" : "pb-2"}>
        {/* Ohne Kopf steht die Einordnungszeile hier: "Stiftung · fördernd ·
            Essen" ist auch dann eine Angabe, wenn den Namen eine andere
            Ansicht trägt. */}
        {!name && profil.einordnung.length > 0 && (
          <Einordnung teile={profil.einordnung} />
        )}

        {/* Die Bio: die Stimme, nicht ein Feld mit Etikett. */}
        {profil.bio && (
          <p className={(name ? "mt-4" : "mt-3") + " text-[15px] leading-relaxed text-foreground/90"}>
            {profil.bio}
          </p>
        )}

        {!name && profil.aktionen.length > 0 && (
          <div className="mt-4">
            <Aktionen aktionen={profil.aktionen} farbe={eigen} />
          </div>
        )}

        {profil.zahlen.length > 0 && <Zahlen zahlen={profil.zahlen} farbe={eigen} />}

        {profil.themen.length > 0 && <Themen themen={profil.themen} farbe={eigen} />}

        {/* Der wertvollste Satz bekommt seine eigene Fläche, mit einem Balken
            in der Hausfarbe links. Kein Rahmen, kein Trennstrich. */}
        {profil.hervorhebung && (
          <div className="relative mt-6 overflow-hidden rounded-2xl bg-amber-50/70 px-5 py-4 dark:bg-amber-950/40">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: eigen }}
            />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {profil.hervorhebung.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{profil.hervorhebung.text}</p>
          </div>
        )}

        {/* Eine Reiterleiste mit einem Reiter ist Zierrat. */}
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
          <div className={profil.reiter.length > 1 ? "mt-5" : "mt-7"}>
            {/* Das Werk zuerst: Was diese Einrichtung getan hat, ist das,
                wofür ein Profil da ist. */}
            {aktiv.karten && <Werk stuecke={aktiv.karten} farbe={eigen} />}

            {aktiv.felder.length > 0 && (
              <dl className={(aktiv.karten ? "mt-6" : "") + " space-y-4"}>
                {aktiv.felder.map((f) => (
                  <Feld key={f.id} feld={f} farbe={eigen} />
                ))}
              </dl>
            )}
          </div>
        )}

        {/* Am Fuß, leise: woher die Angaben stammen und was noch fehlt. Der
            Stand ist eine Zahl für den, der pflegt, keine Note für den, der
            liest. Darum steht er hier und nicht oben. */}
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
 * Cover, Bild, Name, Einordnung, Aktionen.
 *
 * Das Cover trägt die Hausfarbe als Verlauf und bleibt flach: Ein Muster darin
 * zöge Aufmerksamkeit von dem ab, was darunter steht. Das Bild überlappt es,
 * wie es jedes Profil tut, das man kennt.
 */
function Kopf({
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

  return (
    <div>
      <div
        className="h-28 w-full @lg:h-36"
        style={{ background: `linear-gradient(135deg, ${farbe} 0%, ${farbe}a0 100%)` }}
      />

      <div className="px-5 @lg:px-7">
        <div
          className="-mt-11 flex h-22 w-22 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-md @lg:-mt-14 @lg:h-28 @lg:w-28 @lg:text-3xl"
          style={{ background: farbe }}
        >
          {sicheresBild ? (
            <img src={sicheresBild} alt="" className="h-full w-full object-cover" />
          ) : (
            kuerzel || "?"
          )}
        </div>

        <h1 className="mt-3 text-xl font-bold leading-tight tracking-tight @lg:text-2xl">
          {name}
        </h1>

        {profil.einordnung.length > 0 && <Einordnung teile={profil.einordnung} />}

        {profil.aktionen.length > 0 && (
          <div className="mt-4">
            <Aktionen aktionen={profil.aktionen} farbe={farbe} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Die Einordnungszeile: Stiftung · fördernd · Darmstadt · national.
 *
 * Eine Zeile mit Punkten getrennt. Vier Zeilen Beschriftung und Wert
 * untereinander sagen dasselbe und brauchen viermal so viel Platz.
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
 * Was man als Nächstes tut.
 *
 * Eine hervorgehoben, die anderen daneben. Instagram macht es so, GitHub
 * auch: Ein Profil ohne sichtbare nächste Handlung wirkt tot.
 */
function Aktionen({ aktionen, farbe }: { aktionen: Aktion[]; farbe: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {aktionen.map((a) => {
        const ziel = a.art === "email" ? `mailto:${a.ziel}` : urlAlsHref(a.ziel)
        if (!ziel) return null
        return (
          <a
            key={a.id}
            href={ziel}
            {...(a.art === "url" ? { target: "_blank", rel: "noreferrer" } : {})}
            className={
              a.stark
                ? "rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                : "rounded-full bg-muted/70 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted " +
                  HAUSFARBE
            }
            style={a.stark ? { background: farbe } : hausfarbe(farbe)}
          >
            {a.label}
          </a>
        )
      })}
    </div>
  )
}

/**
 * Die Signale: drei Zahlen nebeneinander.
 *
 * "1.234 Beiträge · 45,6 Tsd. Follower" bei Instagram, "87,1k followers" bei
 * GitHub. Zahl groß, Bezeichnung klein darunter. Keine Kästen: Eine Zahl
 * braucht Luft, keinen Rahmen.
 */
function Zahlen({ zahlen, farbe }: { zahlen: Zahl[]; farbe: string }) {
  return (
    <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
      {zahlen.map((z) => (
        <div key={z.id}>
          <p
            className={"text-xl font-bold leading-none tabular-nums @lg:text-2xl " + HAUSFARBE}
            style={hausfarbe(farbe)}
          >
            {zahlText(z)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{z.label}</p>
        </div>
      ))}
    </div>
  )
}

/** Eine Zahl als Text: gezählt, ein Betrag oder eine Spanne. */
function zahlText(z: Zahl): string {
  const n = (w: unknown) => (typeof w === "number" ? w.toLocaleString("de-DE") : String(w ?? ""))
  if (z.form === "geld") {
    if (typeof z.wert === "number" && z.bis !== undefined) {
      return `${n(z.wert)}–${n(z.bis)} €`
    }
    if (z.bis !== undefined) return `bis ${n(z.bis)} €`
    return `ab ${n(z.wert)} €`
  }
  return n(z.wert)
}

/**
 * Die Themen als runde Kacheln.
 *
 * Instagram nennt sie Story-Highlights und stellt sie direkt unter die Bio:
 * runde Kreise mit einem Wort darunter. Sie sagen in einer Zeile, worum es
 * geht, und sie sehen lebendig aus, wo eine Chip-Reihe nur Text ist.
 */
function Themen({ themen, farbe }: { themen: string[]; farbe: string }) {
  return (
    <div className="mt-7 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {themen.map((t, i) => (
        <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${farbe} 0%, ${farbe}90 100%)`,
            }}
          >
            {ersterBuchstabe(t)}
          </div>
          {/* Zwei Zeilen, dann Schluss. "Alten- und Behindertenhilfe" lief
              sonst unter die Nachbarkacheln. */}
          <span className="line-clamp-2 w-full text-center text-[11px] leading-tight text-muted-foreground">
            {t}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Der erste Buchstabe eines Themas, groß. */
function ersterBuchstabe(wort: string): string {
  const w = wort.trim()
  return w.length > 0 ? w[0].toUpperCase() : "?"
}

/**
 * Das Werk: ein Raster von Karten.
 *
 * Der Hauptteil jedes Profils. GitHub zeigt Repositories, Instagram Bilder,
 * LinkedIn Beiträge. Eine Stiftung zeigt, was sie gefördert hat, und ein
 * Projekt, was sich dadurch ändert.
 */
function Werk({ stuecke, farbe }: { stuecke: { titel: string }[]; farbe: string }) {
  return (
    <div className="grid grid-cols-1 gap-2 @sm:grid-cols-2">
      {stuecke.map((s, i) => (
        <div
          key={i}
          className={
            "overflow-hidden rounded-2xl px-4 py-3.5 " +
            // Die Flächen wechseln durch die Farb-Konvention der Doktrin,
            // damit ein Raster lebendig wirkt statt gleichförmig.
            [
              "bg-emerald-50/60 dark:bg-emerald-950/40",
              "bg-amber-50/60 dark:bg-amber-950/40",
              "bg-blue-50/60 dark:bg-blue-950/40",
              "bg-violet-50/60 dark:bg-violet-950/40",
            ][i % 4]
          }
        >
          <span
            aria-hidden
            className="mb-2 block h-1 w-6 rounded-full"
            style={{ background: farbe }}
          />
          <p className="text-sm font-medium leading-snug">{s.titel}</p>
        </div>
      ))}
    </div>
  )
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
    const werte = Array.isArray(wert) ? wert : [wert]
    return (
      <div className="flex flex-col gap-y-1.5 @lg:flex-row @lg:flex-wrap @lg:items-baseline @lg:gap-x-4">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @lg:w-40 @lg:shrink-0 @lg:pt-1">
          {label}
        </dt>
        <dd className="flex flex-1 flex-wrap gap-1.5">
          {werte.map((t, i) => (
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
    const werte = Array.isArray(wert) ? wert : [wert]
    return (
      <div className="flex flex-col gap-y-1 @lg:flex-row @lg:flex-wrap @lg:items-baseline @lg:gap-x-4">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @lg:w-40 @lg:shrink-0">
          {label}
        </dt>
        <dd className="flex-1">
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
    <div className="flex flex-col gap-y-1 @lg:flex-row @lg:flex-wrap @lg:items-baseline @lg:gap-x-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground @lg:w-40 @lg:shrink-0">
        {label}
      </dt>
      <dd className="flex-1 text-sm leading-relaxed">{anzeige(form, wert, farbe)}</dd>
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
