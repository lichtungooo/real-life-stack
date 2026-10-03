// Welcher Connector beim Start gilt: Demo oder Login.
//
// Timo am 03.10.2026: *"Wenn ich eingeloggt bin mit meinem Web of Trust und
// drücke auf Aktualisieren, lande ich immer wieder im Demo-Bereich … Es ist
// wichtig, dass wir zwei getrennte Bereiche haben. Demo, Login."*
//
// Vorher stach die Vorgabe der Instanz (`local` auf trustdonation.org) die
// eigene Wahl: Ein Neuladen ohne `?connector=` warf jeden in die Demo.
// Jetzt: die Adresse (Spec 11: `?connector=` sticht die Vorgabe), dann die
// letzte eigene Wahl in diesem Browser, dann die Vorgabe der Instanz.

export function connectorWahl(q: { url: string | null; gespeichert: string | null; vorgabe: string | undefined; bekannt: readonly string[] }): string {
  const gilt = (id: string | null | undefined): id is string => !!id && q.bekannt.includes(id)
  if (gilt(q.url)) return q.url
  if (gilt(q.gespeichert)) return q.gespeichert
  if (gilt(q.vorgabe)) return q.vorgabe
  return "wot"
}
