// Die mitgelieferten Prozesse (Spec: docs/spec/modules/kreis.md).
//
// Reine Daten. Ein Space kann eigene Vorlagen derselben Form als Item tragen
// (`data.prozess`); diese sechs sind der Anfang.
//
// Quellen: Eva Stuetzel, "Der Gemeinschaftskompass" (Kapitel 3.2, 3.8, 5.6),
// M. Scott Peck, "The Different Drum", Christina Baldwin und Ann Linnea,
// "The Circle Way", Michael Lukas Moeller, "Die Wahrheit beginnt zu zweit".

import type { Prozess } from "./typen"

/** Die 18 Kommunikationsempfehlungen des Wir-Prozesses in der Form von Schloss Tempelhof. */
export const TEMPELHOF_EMPFEHLUNGEN: readonly string[] = [
  "Sei pünktlich zu jeder Gesprächsrunde.",
  "Sag deinen Namen, bevor du sprichst.",
  "Sprich in der Ich-Form.",
  "Sprich von dir und deiner momentanen Erfahrung. Erforsche dich, doziere nicht, rechtfertige dich nicht.",
  "Verpflichte dich, am Ball zu bleiben. Bleibe bis zum Ende jeder Runde.",
  "Schließe ein. Vermeide es, jemanden auszuschließen.",
  "Drücke dein Missfallen in der Gruppe aus, nicht außerhalb des Kreises.",
  "Sei verantwortlich für deinen persönlichen Erfolg, für das, was du mitnimmst.",
  "Sei beteiligt, mit Worten oder ohne Worte.",
  "Sei emotional anwesend in der Gruppe.",
  "Höre aufmerksam und mit Respekt zu. Formuliere keine Antwort, während jemand spricht.",
  "Respektiere absolute Vertraulichkeit.",
  "Erkenne den Wert von Stille und Schweigen.",
  "Gehe ein Risiko ein!",
  "Höre auf deine innere Stimme. Sprich, wenn du bewegt bist, schweige, wenn nicht.",
  "Fasse dich kurz.",
  "Keine Fragen, keine Ratschläge. Jeder spricht über sich selbst.",
  "Kein Alkohol während des Prozesses.",
]

const WIR_PROZESS: Prozess = {
  id: "wir-prozess",
  name: "Wir-Prozess",
  herkunft: "M. Scott Peck, in der Form von Schloss Tempelhof",
  kurz: "Einander wirklich kennenlernen, ohne Thema, aus dem Impuls heraus.",
  wofuer: "Für Gruppen, die zusammenwachsen wollen oder durch ein Chaos hindurchgehen.",
  empfehlungen: TEMPELHOF_EMPFEHLUNGEN,
  nurStabSpricht: true,
  stilleSekunden: 30,
  schritte: [
    {
      id: "ankommen",
      titel: "Ankommen",
      minuten: 5,
      art: "stille",
      anleitung: "Wir sitzen in Stille. Jeder kommt bei sich an. Die Klangschale öffnet den Kreis.",
    },
    {
      id: "empfehlungen",
      titel: "Die Empfehlungen",
      minuten: 5,
      art: "offen",
      anleitung: "Wir lesen die Empfehlungen gemeinsam. Sie hängen sichtbar im Raum und gelten bis zum Schluss.",
    },
    {
      id: "kreis",
      titel: "Der offene Kreis",
      minuten: 150,
      art: "offen",
      anleitung:
        "Der Redestab liegt in der Mitte. Wer den Impuls spürt, nimmt ihn, erzählt von sich und legt ihn zurück. Wird es schwer, klingt die Schale, und der Raum bleibt still, bis alles gesackt ist.",
      fragen: ["Bei mir kommt das so an …", "Das fühle ich gerade …"],
    },
    {
      id: "abschluss",
      titel: "Abschluss",
      minuten: 15,
      art: "reihum",
      anleitung: "Der Stab wandert einmal im Kreis. Jeder sagt, wie es ihm jetzt geht und wofür er dankt.",
    },
  ],
}

const KLAERUNGSKREIS: Prozess = {
  id: "klaerungskreis",
  name: "Klärungskreis",
  herkunft: "Eva Stützel, Der Gemeinschaftskompass",
  kurz: "Einen Konflikt, der die ganze Gruppe belastet, gemeinsam verstehen.",
  wofuer: "Wenn mehrere Menschen zugleich verhakt sind und ein Arbeitstreffen es nicht mehr trägt.",
  empfehlungen: [
    "Wir suchen Verstehen, keine Schuldigen und noch keine Lösung.",
    "Sprich von dir, in der Ich-Form.",
    "Höre, ohne deine Antwort vorzubereiten.",
    "Was im Kreis gesprochen wird, bleibt im Kreis.",
    "Entscheidungen haben ihr eigenes Treffen.",
  ],
  nurStabSpricht: true,
  stilleSekunden: 30,
  schritte: [
    {
      id: "ankommen",
      titel: "Ankommen",
      minuten: 15,
      art: "stille",
      anleitung: "Stille. Die Klangschale öffnet den Kreis. Die Empfehlungen werden gelesen.",
    },
    {
      id: "haltung",
      titel: "Die Haltung einladen",
      minuten: 10,
      art: "offen",
      anleitung:
        "Konflikte sind Lernchancen. „Jenseits von richtig und falsch gibt es einen Ort, an dem wir uns treffen können.“ (Rumi)",
    },
    {
      id: "runde",
      titel: "Runde im Wir-Prozess",
      minuten: 45,
      art: "offen",
      anleitung: "Wer den Impuls spürt, holt den Stab, erzählt, wie er heute da ist, und legt ihn zurück.",
    },
    {
      id: "benennen",
      titel: "Den Konflikt benennen",
      minuten: 20,
      art: "offen",
      anleitung:
        "Gemeinsam finden wir einen Satz, in dem sich alle wiederfinden: ohne Schuld und ohne vorweggenommene Lösung.",
    },
    {
      id: "pause",
      titel: "Pause",
      minuten: 15,
      art: "pause",
      anleitung: "Frische Luft. Wasser. Bewegung.",
    },
    {
      id: "kleingruppen",
      titel: "Kleingruppen",
      minuten: 50,
      art: "kleingruppen",
      gruppenGroesse: 4,
      anleitung:
        "Wer eine starke Ladung spürt, bekommt Menschen an die Seite, die ihn schätzen. Sie hören zu und fragen nach, ohne zu bewerten.",
      fragen: [
        "Was liegt hinter dem sichtbaren Thema?",
        "Ressource: Wovon gibt es zu wenig?",
        "Ziel: Wollen wir Verschiedenes erreichen?",
        "Werte: Was ist mir heilig?",
        "Rang: Wo habe ich mich übergangen oder unterlegen gefühlt?",
        "Trigger: Erinnert mich das an eine alte Verletzung?",
        "Wie habe ich reagiert: Kampf, Flucht oder Totstellen?",
      ],
    },
    {
      id: "zurueck",
      titel: "Zurück in den großen Kreis",
      minuten: 45,
      art: "offen",
      anleitung: "Jede Gruppe teilt, was sie erkannt hat. Nach jedem Beitrag klingt die Schale.",
    },
    {
      id: "geschichte",
      titel: "Unsere gemeinsame Geschichte",
      minuten: 20,
      art: "offen",
      anleitung: "Was ist bei uns geschehen, erzählt so, dass sich alle darin wiederfinden?",
    },
    {
      id: "abschluss",
      titel: "Abschluss",
      minuten: 15,
      art: "reihum",
      anleitung: "Ein Wort pro Mensch: Was nehme ich mit. Dank. Die Klangschale schließt den Kreis.",
    },
  ],
}

const REFLEXIONSKREIS: Prozess = {
  id: "reflexionskreis",
  name: "Reflexionskreis",
  herkunft: "Real Life Network",
  kurz: "Im Reflexionskreis bleibt jeder bei sich.",
  wofuer:
    "Wenn ein persönliches Thema in einem Arbeitskreis aufbricht. Der Arbeitskreis dient dem Werk, der Reflexionskreis dem eigenen Sein.",
  empfehlungen: [
    "Wir sprechen aus eigener Wahrnehmung.",
    "Wir hören, ehe wir antworten.",
    "Wir sprechen über Verhalten und Wirkung. Das Wesen eines Menschen bleibt geehrt.",
    "Was im Kreis gesprochen wird, bleibt im Kreis.",
    "Was du in mir siehst, bist du selbst. Und du selbst darfst dich zeigen.",
  ],
  nurStabSpricht: true,
  stilleSekunden: 20,
  schritte: [
    {
      id: "ankommen",
      titel: "Ankommen",
      minuten: 5,
      art: "stille",
      anleitung: "Stille oder eine Kerze. Wir sind angekommen.",
    },
    {
      id: "thema",
      titel: "Das Thema",
      minuten: 30,
      art: "offen",
      anleitung: "Wer ein Thema bringt, nimmt den Stab und geht die fünf Fragen.",
      fragen: [
        "Was ist geschehen?",
        "Was hat es in mir bewegt?",
        "Welche Geschichte erzähle ich mir darüber?",
        "Was davon gehört zu mir?",
        "Was möchte ich in den Kreis geben?",
      ],
    },
    {
      id: "spiegeln",
      titel: "Spiegeln",
      minuten: 20,
      art: "reihum",
      anleitung: "Der Kreis spiegelt aus eigener Wahrnehmung: „Bei mir kam an, dass …“",
    },
    {
      id: "abschluss",
      titel: "Abschluss",
      minuten: 5,
      art: "reihum",
      anleitung: "Ein Wort pro Mensch. Was nehme ich mit.",
    },
  ],
}

const REDESTAB_RUNDE: Prozess = {
  id: "redestab-runde",
  name: "Redestab-Runde",
  herkunft: "Circle Way (Christina Baldwin, Ann Linnea)",
  kurz: "Teilen, was uns gerade bewegt. Der Stab wandert im Kreis.",
  wofuer: "Für jeden Anfang und jedes Ende eines Treffens, und immer dann, wenn alle gehört werden sollen.",
  empfehlungen: [
    "Sprich von Herzen, von dem, was dich wirklich bewegt.",
    "Höre von Herzen, mit dem Wunsch, den Menschen kennenzulernen.",
    "Sprich die Essenz.",
    "Achte die Vertraulichkeit des Kreises.",
    "Bitte um das, was du brauchst, und gib, was du geben kannst.",
  ],
  nurStabSpricht: true,
  stilleSekunden: 15,
  schritte: [
    {
      id: "einstimmung",
      titel: "Einstimmung",
      minuten: 3,
      art: "stille",
      anleitung: "Eine kurze Stille. Die Absicht des Kreises wird genannt.",
    },
    {
      id: "runden",
      titel: "Runden",
      minuten: 40,
      art: "reihum",
      anleitung:
        "Der Stab wandert von einem zum nächsten. Wer nichts sagen möchte, gibt ihn weiter. Der Kreis endet, wenn der Stab einmal ganz ohne Worte herumgegangen ist.",
    },
    {
      id: "abschluss",
      titel: "Abschluss",
      minuten: 3,
      art: "stille",
      anleitung: "Dank für die Beiträge. Eine kurze Stille schließt den Kreis.",
    },
  ],
}

const KENNENLERNEN: Prozess = {
  id: "kennenlernen",
  name: "Kennenlernkreis",
  herkunft: "Real Life Network",
  kurz: "Menschen, die neu zusammenkommen, sehen einander.",
  wofuer: "Wenn eine Gruppe entsteht oder neue Menschen dazukommen.",
  empfehlungen: [
    "Sprich von dir.",
    "Höre mit Neugier.",
    "Zeig dich so, wie du heute da bist.",
  ],
  nurStabSpricht: true,
  stilleSekunden: 15,
  schritte: [
    {
      id: "ankommen",
      titel: "Ankommen",
      minuten: 3,
      art: "stille",
      anleitung: "Einen Atemzug lang still. Wir sind da.",
    },
    {
      id: "wer-bin-ich",
      titel: "Wer bin ich",
      minuten: 30,
      art: "reihum",
      anleitung: "Der Stab wandert. Jeder erzählt von sich.",
      fragen: ["Was bringt mich hierher?", "Was macht mir Freude?", "Was bewegt mich gerade?"],
    },
    {
      id: "offen",
      titel: "Offene Runde",
      minuten: 20,
      art: "offen",
      anleitung: "Der Stab liegt in der Mitte. Wer mag, erzählt mehr oder antwortet auf das Gehörte.",
    },
    {
      id: "abschluss",
      titel: "Abschluss",
      minuten: 5,
      art: "reihum",
      anleitung: "Ein Wort pro Mensch.",
    },
  ],
}

const ZWIEGESPRAECH: Prozess = {
  id: "zwiegespraech",
  name: "Zwiegespräch",
  herkunft: "Michael Lukas Moeller",
  kurz: "Zwei Menschen hören einander, abwechselnd und in Ruhe.",
  wofuer: "Wenn zwei Menschen ein Thema tragen und einander wirklich hören wollen.",
  empfehlungen: [
    "Einer spricht, der andere hört.",
    "Wer hört, fasst zusammen, was er gehört hat. Nur das.",
    "Jeder spricht von sich.",
  ],
  nurStabSpricht: true,
  stilleSekunden: 15,
  schritte: [
    { id: "ankommen", titel: "Ankommen", minuten: 2, art: "stille", anleitung: "Ein Blick, ein Atemzug." },
    {
      id: "erster",
      titel: "Der Erste spricht",
      minuten: 15,
      art: "offen",
      anleitung: "Wer beginnt, nimmt den Stab und spricht, so lange er braucht. Danach fasst der andere zusammen.",
    },
    {
      id: "zweiter",
      titel: "Der Zweite spricht",
      minuten: 15,
      art: "offen",
      anleitung: "Wechsel. Der Zweite nimmt den Stab. Danach fasst der Erste zusammen.",
    },
    {
      id: "abschluss",
      titel: "Abschluss",
      minuten: 5,
      art: "offen",
      anleitung: "Wenn beide gehört wurden: Was nehmen wir mit?",
    },
  ],
}

/** Die mitgelieferten Prozesse. Reihenfolge = Reihenfolge in der Auswahl. */
export const PROZESSE: readonly Prozess[] = Object.freeze([
  KENNENLERNEN,
  REDESTAB_RUNDE,
  REFLEXIONSKREIS,
  WIR_PROZESS,
  KLAERUNGSKREIS,
  ZWIEGESPRAECH,
])

/** Einen Prozess nach Id finden, erst in den eigenen Vorlagen, dann in den mitgelieferten. */
export function prozessFinden(id: string | null, eigene: readonly Prozess[] = []): Prozess | null {
  if (!id) return null
  return eigene.find((p) => p.id === id) ?? PROZESSE.find((p) => p.id === id) ?? null
}

/**
 * Ist das ein brauchbarer Prozess? Fuer Vorlagen, die ein Space als Item
 * traegt. Eine unbekannte Schritt-Art ist erlaubt (sie wird als `offen`
 * gezeigt); fehlende Pflichtfelder nicht.
 */
export function istProzess(wert: unknown): wert is Prozess {
  if (!wert || typeof wert !== "object") return false
  const p = wert as Record<string, unknown>
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    Array.isArray(p.schritte) &&
    p.schritte.length > 0 &&
    p.schritte.every(
      (s) => !!s && typeof s === "object" && typeof (s as Record<string, unknown>).titel === "string",
    )
  )
}
