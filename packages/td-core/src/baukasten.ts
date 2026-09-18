// Der Baukasten, als Daten für die Fläche.
//
// Gepflegt wird er im Instanz-Repo `lichtungooo/trustdonation`, unter
// `baukasten/`. Dort gehört er hin: Er ist fachlich, und jemand ohne
// Bauwerkzeug soll ihn ändern können.
//
// `td-tools/baukasten-holen.py` führt die acht Schichten zu einer Datei
// zusammen, die sich importieren lässt. Was eine Fläche nicht braucht (die
// Namen der CSS-Variablen, die Belegstellen), bleibt draußen: 21 KB statt
// des ganzen Bestands.
import daten from "../daten/baukasten.json" with { type: "json" }

/** Ein einzelner Baustein, so wie ihn die Fläche zeigt. */
export interface BaukastenStueck {
  id: string
  name: string
  zweck: string
  /** Bei Rohstoffen der Wert selbst: eine Farbe zeigt sich als Farbe. */
  wert?: string
  /** Die Regel oder Absicht, die den Baustein zusammenhält. */
  regel?: string
  herkunft?: string
}

/** Eine benannte Lücke: Was hier fehlt und warum es zählt. */
export interface BaukastenLuecke {
  id: string
  name: string
  warum: string
}

/** Eine der acht Schichten. */
export interface BaukastenSchicht {
  id: string
  titel: string
  zweck: string
  stuecke: BaukastenStueck[]
  fehlt: BaukastenLuecke[]
}

export interface Baukasten {
  anzahl: number
  schichten: BaukastenSchicht[]
}

export const baukasten = daten as unknown as Baukasten
