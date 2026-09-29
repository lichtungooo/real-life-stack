// Die Klangschale, aus der Web-Audio-Schnittstelle gebaut. Ohne Tondatei.
//
// Eine Klangschale klingt nicht harmonisch wie eine Saite: Ihre Teiltoene
// liegen etwa beim 1-, 2,76-, 5,4- und 8,9-fachen des Grundtons, und jeder
// klingt verschieden lang nach. Je zwei leicht verstimmte Oszillatoren pro
// Teilton erzeugen das langsame Schweben, an dem man eine Schale erkennt.
// Ein kurzer Anschlag aus gefiltertem Rauschen setzt den Schlag davor.

let kontext: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Klasse = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Klasse) return null
  kontext ??= new Klasse()
  // Browser halten den Kontext bis zur ersten Beruehrung an. Wer den Raum
  // betreten hat, hat geklickt; danach darf er klingen.
  if (kontext.state === "suspended") void kontext.resume()
  return kontext
}

const TEILTOENE = [
  { faktor: 1, lautstaerke: 0.5, nachklang: 9 },
  { faktor: 2.76, lautstaerke: 0.28, nachklang: 6.5 },
  { faktor: 5.4, lautstaerke: 0.12, nachklang: 4 },
  { faktor: 8.93, lautstaerke: 0.05, nachklang: 2.5 },
]

/** Die Schale einmal anschlagen. `grundton` in Hertz, Standard 196 (ein tiefes G). */
export function schaleAnschlagen(grundton = 196, lautstaerke = 0.35): void {
  const ctx = audio()
  if (!ctx) return
  const t = ctx.currentTime
  const summe = ctx.createGain()
  summe.gain.value = lautstaerke
  summe.connect(ctx.destination)

  for (const teil of TEILTOENE) {
    for (const verstimmung of [-0.6, 0.6]) {
      const osz = ctx.createOscillator()
      osz.type = "sine"
      osz.frequency.value = grundton * teil.faktor + verstimmung
      const huelle = ctx.createGain()
      huelle.gain.setValueAtTime(0.0001, t)
      huelle.gain.exponentialRampToValueAtTime(teil.lautstaerke, t + 0.012)
      huelle.gain.exponentialRampToValueAtTime(0.0001, t + teil.nachklang)
      osz.connect(huelle).connect(summe)
      osz.start(t)
      osz.stop(t + teil.nachklang + 0.1)
    }
  }

  // Der Anschlag: ein Zehntel Rauschen durch einen Bandpass.
  const laenge = Math.floor(ctx.sampleRate * 0.08)
  const puffer = ctx.createBuffer(1, laenge, ctx.sampleRate)
  const daten = puffer.getChannelData(0)
  for (let i = 0; i < laenge; i++) daten[i] = (Math.random() * 2 - 1) * (1 - i / laenge)
  const rauschen = ctx.createBufferSource()
  rauschen.buffer = puffer
  const filter = ctx.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.value = grundton * 6
  filter.Q.value = 2
  const anschlag = ctx.createGain()
  anschlag.gain.value = 0.25
  rauschen.connect(filter).connect(anschlag).connect(summe)
  rauschen.start(t)
}
