// Das Profil einer Einrichtung, als Fläche.
//
// Timo am 18.09.2026: *"Ich will so eine Karte haben, wo alles draufsteht, was
// eine Stiftung macht. Wo ein Projekt sich komplett vorstellen kann."*
//
// **Was hier steht und was nicht:** Die Regel, welche Abschnitte ein Profil
// hat und welche Felder darin stehen, liegt in `@trustdonation/core`. Sie ist
// dort geprüft, ohne Browser. Diese Datei zeigt allein an, was sie ausrechnet
// (ARCHITEKTUR Teil 3: zwei Schichten entlang der Paketgrenze).
//
// **Die sechs Abschnitte antworten auf sechs Fragen.** Ein Abschnitt ohne
// Frage ist eine Überschrift; mit Frage ist er eine Antwort, und das ist der
// Unterschied. Die Fragen stehen leise über den Titeln.
import type { ProfilAbschnitt, ProfilFeld } from "@trustdonation/core"

export interface ProfilFlaecheProps {
  /** Der Name der Einrichtung. Er steht über allem. */
  name: string
  /** Die Art, wie sie im Netzwerk heißt: "Stiftung", "Projekt". */
  art?: string
  /** Das Bild, falls es eines gibt. */
  bild?: string
  /** Die Hausfarbe. Sonst die Farbe ihrer Art. */
  farbe?: string
  /** Die Abschnitte, ausgerechnet von `profilAbschnitte`. */
  abschnitte: ProfilAbschnitt[]
  /** Wie viele Felder gefüllt sind, für den, der pflegt. */
  stand?: { gefuellt: number; gesamt: number }
  /** Woher die Angaben stammen, solange niemand den Eintrag übernommen hat. */
  quelle?: string
}

export function ProfilFlaeche({
  name,
  art,
  bild,
  farbe,
  abschnitte,
  stand,
  quelle,
}: ProfilFlaecheProps) {
  const eigen = farbe || "#194294"

  if (abschnitte.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Kopf name={name} art={art} bild={bild} farbe={eigen} />
        <p className="mt-6 rounded-xl border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Dieses Profil trägt noch keine Angaben.
          <br />
          Wer den Space verwaltet, füllt sie im Bereich <strong>Netzwerk</strong> aus.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Kopf name={name} art={art} bild={bild} farbe={eigen} />

      {stand && stand.gefuellt < stand.gesamt && (
        <p className="mt-4 text-xs text-muted-foreground">
          {stand.gefuellt} von {stand.gesamt} Angaben gefüllt
        </p>
      )}

      <div className="mt-7 space-y-7">
        {abschnitte.map((a) => (
          <section key={a.id}>
            <div className="mb-3 border-b pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {a.titel}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground/70">{a.frage}</p>
            </div>
            <dl className="space-y-3">
              {a.felder.map((f) => (
                <Feld key={f.id} feld={f} farbe={eigen} />
              ))}
            </dl>
          </section>
        ))}
      </div>

      {quelle && (
        <p className="mt-8 border-t pt-4 text-xs text-muted-foreground">
          Diese Angaben stammen aus öffentlichen Quellen: {quelle}. Die Einrichtung kann den
          Eintrag übernehmen und selbst pflegen.
        </p>
      )}
    </div>
  )
}

function Kopf({
  name,
  art,
  bild,
  farbe,
}: {
  name: string
  art?: string
  bild?: string
  farbe: string
}) {
  // Zwei Buchstaben statt eines Platzhalterbildes: Ein graues Symbol sagt
  // "hier fehlt etwas", zwei Buchstaben sagen, wer gemeint ist.
  const kuerzel = name
    .split(/\s+/)
    .filter((w) => /[A-Za-zÄÖÜäöü]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")

  const sicheresBild = bild ? urlAlsBildSrc(bild) : null

  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white"
        style={{ background: farbe }}
      >
        {sicheresBild ? (
          <img src={sicheresBild} alt="" className="h-full w-full object-cover" />
        ) : (
          kuerzel || "?"
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-tight tracking-tight">{name}</h1>
        {art && (
          <p className="mt-0.5 text-sm font-semibold" style={{ color: farbe }}>
            {art}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Ein Feld, in der Form, die zu ihm passt.
 *
 * Ein langer Text braucht die volle Breite, eine Zahl nicht. Tags stehen als
 * Etiketten, ein Ja-Nein-Feld als Wort: "ja" und "nein" liest sich schneller
 * als ein Haken und ein Kreuz, die man erst deuten muss.
 */
function Feld({ feld, farbe }: { feld: ProfilFeld; farbe: string }) {
  const { label, form, wert } = feld

  if (form === "longtext") {
    return (
      <div>
        <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd className="mt-1 max-w-[46em] leading-relaxed">{String(wert)}</dd>
      </div>
    )
  }

  if (form === "tags") {
    const liste = Array.isArray(wert) ? wert : [wert]
    return (
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <dt className="w-44 shrink-0 text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd className="flex flex-1 flex-wrap gap-1.5">
          {liste.map((t, i) => (
            <span
              key={i}
              className="rounded-full border px-2.5 py-0.5 text-sm"
              style={{ borderColor: farbe + "33" }}
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
      <div className="flex flex-wrap items-baseline gap-x-3">
        <dt className="w-44 shrink-0 text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd className="flex-1">
          <ul className="space-y-0.5">
            {liste.map((t, i) => (
              <li key={i}>{typeof t === "object" ? JSON.stringify(t) : String(t)}</li>
            ))}
          </ul>
        </dd>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3">
      <dt className="w-44 shrink-0 text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="flex-1">{anzeige(form, wert, farbe)}</dd>
    </div>
  )
}

/**
 * Ein Wert wird erst dann ein Link, wenn er eine http(s)-URL trägt.
 *
 * Der Wert kommt aus `Group.data` und damit von einem Menschen (Regel 4).
 * `javascript:` und `data:` werden von React im href nicht zuverlässig
 * abgefangen — die Entwicklungswarnung ist kein Riegel, und das Attribut wird
 * trotzdem gesetzt. Wer kein http(s) trägt, fällt auf Text zurück (Muster 5):
 * sichtbar, aber ohne Ausführung.
 */
export function urlAlsHref(wert: string): string | null {
  const getrimmt = wert.trim()
  return /^https?:\/\//i.test(getrimmt) ? getrimmt : null
}

/**
 * Ein Bild-Pfad wird erst dann verwendet, wenn er ein sicheres Schema trägt.
 *
 * FND-0027: `javascript:` oder `vbscript:` im `src` eines `img`-Tags können
 * in manchen Browsern ausgeführt werden. Erlaubt sind http(s)-URLs, relative
 * Pfade und sichere `data:image/...` URIs.
 */
export function urlAlsBildSrc(wert: string): string | null {
  const getrimmt = wert.trim()
  if (/^(javascript|vbscript):/i.test(getrimmt)) {
    return null
  }
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
    if (!href) {
      return <span>{wert}</span>
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" style={{ color: farbe }}
         className="underline underline-offset-2">
        {wert.replace(/^https?:\/\//, "")}
      </a>
    )
  }
  if (form === "email" && typeof wert === "string") {
    return (
      <a href={`mailto:${wert}`} style={{ color: farbe }} className="underline underline-offset-2">
        {wert}
      </a>
    )
  }
  if (typeof wert === "number") {
    return <span className="tabular-nums">{wert.toLocaleString("de-DE")}</span>
  }
  return <span>{String(wert)}</span>
}
