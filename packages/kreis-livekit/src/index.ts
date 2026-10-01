// Der Raum-Adapter fuer LiveKit (Spec: docs/spec/modules/kreis.md,
// "Der Raum-Adapter").
//
// Erfuellt denselben Vertrag wie der lokale Raum; der Kreis merkt keinen
// Unterschied, ausser dass Bild und Ton dazukommen. Die Erfahrungen stammen
// aus dem Kreis im RLN (lichtungooo/rln, src/modules/kreis/ERFAHRUNGEN.md).
//
// Das API-Geheimnis kommt hier nie vor. Der Token-Dienst stellt ein
// kurzlebiges Token fuer genau einen Raum aus, in zwei Schritten: erst den
// Zugang zum Raum, dann damit das Token.

import type {
  Room,
  Track,
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from "livekit-client"

// LiveKit wird erst beim Betreten nachgeladen, nicht mit der App: Wer den
// Kreis nie betritt, soll die Bibliothek nicht laden. Derselbe Weg wie die
// Kartenbibliothek der Karte.
type LiveKit = typeof import("livekit-client")
let liveKit: LiveKit | null = null
async function ladeLiveKit(): Promise<LiveKit> {
  liveKit ??= await import("livekit-client")
  return liveKit
}
import type { KreisRaum, KreisTeilnehmer } from "@kreis/core"

export interface LiveKitRaumOptionen {
  /** Der LiveKit-Server, z. B. `wss://kreis.wir.ooo`. */
  serverUrl: string
  /** Der Token-Dienst, z. B. `https://kreis.wir.ooo/token`. */
  tokenUrl: string
  /** Der Mitschrift-Dienst, z. B. `wss://kreis.wir.ooo/mitschrift`. Ohne ihn keine Mitschrift. */
  mitschriftUrl?: string
  /** Mikrofon beim Betreten an. Standard: an. */
  mikroBeimBetreten?: boolean
}

export const KREIS_WIR_OOO: LiveKitRaumOptionen = {
  serverUrl: "wss://kreis.wir.ooo",
  tokenUrl: "https://kreis.wir.ooo/token",
  mitschriftUrl: "wss://kreis.wir.ooo/mitschrift",
}

async function json<T>(adresse: string, was: string): Promise<T> {
  const antwort = await fetch(adresse)
  if (!antwort.ok) {
    const koerper = (await antwort.json().catch(() => ({}))) as { fehler?: string }
    throw new Error(koerper.fehler || `${was} gelang nicht (${antwort.status}).`)
  }
  return (await antwort.json()) as T
}

export function liveKitKreisRaum(optionen: LiveKitRaumOptionen = KREIS_WIR_OOO): KreisRaum {
  let raum: Room | null = null
  // Das Token des Raums. Die Mitschrift weist sich damit aus (kreis-server/mitschrift).
  let zugangsToken: string | null = null
  const aenderungen = new Set<() => void>()
  const nachrichten = new Set<(n: unknown, von: string) => void>()
  const melden = () => aenderungen.forEach((fn) => fn())

  const person = (id: string): Participant | undefined => {
    if (!raum) return undefined
    if (raum.localParticipant.identity === id) return raum.localParticipant
    return [...raum.remoteParticipants.values()].find((p) => p.identity === id)
  }

  /**
   * Haengt einen Track an ein Element, auch wenn er erst spaeter ankommt.
   *
   * Die Kachel kennt `kameraAn` schon, bevor der Track abonniert ist. Ohne das
   * Nachhaken bliebe das Bild schwarz, bis sich zufaellig etwas anderes aendert.
   */
  const anhaengen = (id: string, quelle: "camera" | "microphone" | "screen_share", element: HTMLMediaElement): (() => void) => {
    const lk = liveKit
    if (!lk) return () => {}
    const { RoomEvent } = lk
    let angehaengt: Track | null = null
    const versuche = () => {
      if (angehaengt) return
      const track = person(id)?.getTrackPublication(quelle as Track.Source)?.track
      if (!track) return
      track.attach(element)
      angehaengt = track
    }
    versuche()
    const spaeter = (_t: RemoteTrack, _pub: RemoteTrackPublication, p: RemoteParticipant) => {
      if (p.identity === id) versuche()
    }
    raum?.on(RoomEvent.TrackSubscribed, spaeter)
    raum?.on(RoomEvent.LocalTrackPublished, versuche)
    return () => {
      raum?.off(RoomEvent.TrackSubscribed, spaeter)
      raum?.off(RoomEvent.LocalTrackPublished, versuche)
      angehaengt?.detach(element)
    }
  }

  // Der Audiofilter des eigenen Mikrofons (Rausch-, Echounterdrueckung,
  // automatische Lautstaerke). An, bis jemand ihn ausschaltet.
  let filter = true
  const tonFilter = () => ({ noiseSuppression: filter, echoCancellation: filter, autoGainControl: filter })

  return {
    traegtMedien: true,

    async betreten(raumName, name) {
      if (raum) return
      const zugang = await json<{ moderator: string }>(
        `${optionen.tokenUrl}/raum?raum=${encodeURIComponent(raumName)}`,
        "Den Raum zu öffnen",
      )
      const adresse = new URL(optionen.tokenUrl)
      adresse.searchParams.set("raum", raumName)
      adresse.searchParams.set("name", name)
      adresse.searchParams.set("zugang", zugang.moderator)
      const { token } = await json<{ token: string }>(adresse.toString(), "Das Zutritts-Token zu holen")

      const { Room: RaumKlasse, RoomEvent } = await ladeLiveKit()
      const r = new RaumKlasse({ adaptiveStream: true, dynacast: true })
      for (const ereignis of [
        RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected,
        RoomEvent.TrackSubscribed, RoomEvent.TrackUnsubscribed,
        RoomEvent.TrackMuted, RoomEvent.TrackUnmuted,
        RoomEvent.LocalTrackPublished, RoomEvent.LocalTrackUnpublished,
        RoomEvent.ActiveSpeakersChanged,
      ]) r.on(ereignis, melden)
      r.on(RoomEvent.Disconnected, () => { raum = null; melden() })
      r.on(RoomEvent.DataReceived, (nutzlast: Uint8Array, von?: RemoteParticipant) => {
        try {
          const roh = JSON.parse(new TextDecoder().decode(nutzlast)) as { kreis?: unknown }
          if (!roh || !("kreis" in roh)) return
          nachrichten.forEach((fn) => fn(roh.kreis, von?.identity ?? ""))
        } catch {
          // Eine unlesbare Nachricht wird verworfen, der Raum laeuft weiter.
        }
      })

      await r.connect(optionen.serverUrl, token)
      raum = r
      zugangsToken = token
      if (optionen.mikroBeimBetreten ?? true) {
        await r.localParticipant.setMicrophoneEnabled(true, tonFilter()).catch(() => {
          // Ohne Freigabe fuers Mikrofon bleibt man stumm im Kreis, statt draussen.
        })
      }
      melden()
    },

    async verlassen() {
      const r = raum
      raum = null
      await r?.disconnect()
      melden()
    },

    ich: () => raum?.localParticipant.identity ?? null,

    mitschriftZugang: () => (raum && zugangsToken && optionen.mitschriftUrl ? { url: optionen.mitschriftUrl, token: zugangsToken } : null),

    teilnehmer(): readonly KreisTeilnehmer[] {
      if (!raum) return []
      const alsTeilnehmer = (p: Participant, ichSelbst: boolean): KreisTeilnehmer => ({
        id: p.identity,
        name: p.name || p.identity,
        ichSelbst,
        spricht: p.isSpeaking,
        mikroAn: p.isMicrophoneEnabled,
        kameraAn: p.isCameraEnabled,
        teiltBildschirm: p.isScreenShareEnabled,
      })
      return [
        alsTeilnehmer(raum.localParticipant, true),
        ...[...raum.remoteParticipants.values()].map((p) => alsTeilnehmer(p, false)),
      ]
    },

    beiAenderung(fn) {
      aenderungen.add(fn)
      return () => { aenderungen.delete(fn) }
    },

    senden(inhalt) {
      if (!raum) return
      // Unter einem eigenen Schluessel, damit fremde Daten im selben Raum
      // (etwa das Protokoll des RLN-Kreises) nichts verwechseln.
      const nutzlast = new TextEncoder().encode(JSON.stringify({ kreis: inhalt }))
      void raum.localParticipant.publishData(nutzlast, { reliable: true })
    },

    beiNachricht(fn) {
      nachrichten.add(fn)
      return () => { nachrichten.delete(fn) }
    },

    async mikro(an) {
      await raum?.localParticipant.setMicrophoneEnabled(an, an ? tonFilter() : undefined)
      melden()
    },

    async mikroFilter(an) {
      filter = an
      // Die laufende Spur mit den neuen Einstellungen neu starten; die
      // Verbindung und die Veroeffentlichung bleiben stehen.
      const spur = raum?.localParticipant.getTrackPublications()
        .find((p) => p.source === "microphone")?.track as { restartTrack?: (o: unknown) => Promise<void> } | undefined
      await spur?.restartTrack?.(tonFilter()).catch(() => {})
      melden()
    },

    async kamera(an) {
      await raum?.localParticipant.setCameraEnabled(an)
      melden()
    },

    bildAnhaengen: (id, element) => anhaengen(id, "camera", element),
    tonAnhaengen: (id, element) => anhaengen(id, "microphone", element),
    bildschirmAnhaengen: (id, element) => anhaengen(id, "screen_share", element),

    async bildschirm(an) {
      // Wer den Dialog des Browsers abbricht, teilt eben nicht. Kein Fehler.
      await raum?.localParticipant.setScreenShareEnabled(an).catch(() => {})
      melden()
    },
  }
}
