// Eine Datei unter allen im Raum teilen, ohne Server (Spec video, "Folien").
//
// Der Stack traegt keine Dateianhaenge (Wunsch an Anton: BlobCapable). Bis
// dahin reist eine PDF in Stuecken ueber den Kanal des Raums: erst ein Kopf
// (Name, Zahl der Stuecke), dann die Stuecke. Jeder, der sie ganz hat, kann
// sie einem Nachzuegler erneut schicken. Die Datei lebt nur in der Sitzung.

/** Groesste Datei, die wir so teilen. Darueber waere der Raum minutenlang belegt. */
export const DATEI_HOECHSTENS = 15 * 1024 * 1024

/** Zeichen je Stueck (Base64). Klein genug fuer eine Nachricht im Raum. */
export const STUECK_ZEICHEN = 12_000

export function nachBase64(bytes: Uint8Array): string {
  let binaer = ""
  const schritt = 0x8000
  for (let i = 0; i < bytes.length; i += schritt) binaer += String.fromCharCode(...bytes.subarray(i, i + schritt))
  return btoa(binaer)
}

export function ausBase64(text: string): Uint8Array {
  const binaer = atob(text)
  const bytes = new Uint8Array(binaer.length)
  for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i)
  return bytes
}

/** In Stuecke teilen. */
export function inStuecke(text: string, groesse = STUECK_ZEICHEN): string[] {
  const stuecke: string[] = []
  for (let i = 0; i < text.length; i += groesse) stuecke.push(text.slice(i, i + groesse))
  return stuecke.length > 0 ? stuecke : [""]
}

/** Eine ankommende Datei: welche Stuecke fehlen noch. */
export interface Eingang {
  name: string
  teile: number
  stuecke: (string | undefined)[]
}

export function eingangNeu(name: string, teile: number): Eingang {
  return { name, teile, stuecke: new Array(teile).fill(undefined) }
}

/**
 * Ein Stueck ablegen. Ist die Datei danach ganz, kommt sie zurueck. Kommt
 * aus dem Raum Unlesbares (verstuemmelt oder manipuliert), bleibt es bei
 * `null`, statt zu werfen (Pruefkreis Kimi, 02.10.2026, Befund 3).
 */
export function stueckDazu(e: Eingang, nr: number, stueck: string): Uint8Array | null {
  if (!Number.isInteger(nr) || nr < 0 || nr >= e.teile || typeof stueck !== "string") return null
  e.stuecke[nr] = stueck
  if (e.stuecke.some((x) => x === undefined)) return null
  try {
    return ausBase64(e.stuecke.join(""))
  } catch {
    return null
  }
}

/** Eine kurze, zufaellige Id fuer eine Datei im Raum. */
export function dateiId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
