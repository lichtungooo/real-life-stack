// Eigene Bildmotive für das Stiftungsprofil (DEFINITION Teil 8, „das große
// Ganze“, Timo am 02.10.2026: eigene Motive statt Fotos fremder Websites).
//
// Ein Motiv je Förderbereich, flach gezeichnet und in den Farben der
// Stiftung eingefärbt: `--td-haus` und `--td-akzent` vom Profil, Tönungen
// über die Deckkraft. So fühlt sich jedes Profil anders an und alles bleibt
// aus einem Guss. Die Liste der Namen steht in td-core (`STIFTUNGS_MOTIVE`).

import type { CSSProperties, ReactNode } from "react"
import type { StiftungsMotiv } from "@trustdonation/core"

const H: CSSProperties = { fill: "var(--td-haus)" }
const A: CSSProperties = { fill: "var(--td-akzent)" }
const W: CSSProperties = { fill: "#ffffff" }
const zart = (deck: number): CSSProperties => ({ fill: "var(--td-haus)", opacity: deck })
const zartA = (deck: number): CSSProperties => ({ fill: "var(--td-akzent)", opacity: deck })
const linie = (farbe = "var(--td-haus)", breite = 6): CSSProperties => ({ fill: "none", stroke: farbe, strokeWidth: breite, strokeLinecap: "round", strokeLinejoin: "round" })

/** Hügel, Sonne, Funken: der gemeinsame Grund jedes Motivs. */
function Grund() {
  return (
    <>
      <circle cx="262" cy="42" r="22" style={zartA(0.35)} />
      <path d="M0 150 Q80 118 160 140 T320 132 V180 H0Z" style={zart(0.14)} />
      <path d="M0 166 Q100 146 200 160 T320 154 V180 H0Z" style={zart(0.22)} />
      <circle cx="40" cy="40" r="4" style={zartA(0.5)} />
      <circle cx="58" cy="62" r="2.5" style={zart(0.4)} />
      <circle cx="292" cy="96" r="3" style={zart(0.35)} />
    </>
  )
}

const MOTIVE: Record<StiftungsMotiv, () => ReactNode> = {
  bildung: () => (
    <>
      <rect x="104" y="112" width="112" height="16" rx="3" style={H} />
      <rect x="112" y="96" width="98" height="16" rx="3" style={A} />
      <rect x="98" y="80" width="118" height="16" rx="3" style={zart(0.55)} />
      <path d="M160 34 L214 52 L160 70 L106 52Z" style={H} />
      <path d="M128 60 V74 Q160 88 192 74 V60" style={zart(0.8)} />
      <path d="M214 52 V72" style={linie("var(--td-akzent)", 4)} />
      <circle cx="214" cy="76" r="5" style={A} />
    </>
  ),
  umwelt: () => (
    <>
      <rect x="152" y="96" width="14" height="46" rx="4" style={zart(0.7)} />
      <circle cx="159" cy="72" r="34" style={H} />
      <circle cx="132" cy="88" r="22" style={zart(0.75)} />
      <circle cx="186" cy="86" r="24" style={A} />
      <path d="M86 140 Q92 112 112 104 Q106 128 86 140Z" style={A} />
      <path d="M232 140 Q226 116 208 108 Q214 130 232 140Z" style={H} />
    </>
  ),
  kinder: () => (
    <>
      <circle cx="122" cy="62" r="14" style={H} />
      <path d="M104 132 L110 86 Q122 78 134 86 L140 132Z" style={H} />
      <circle cx="196" cy="70" r="12" style={A} />
      <path d="M180 132 L186 92 Q196 85 206 92 L212 132Z" style={A} />
      <path d="M136 98 Q160 110 184 100" style={linie("var(--td-haus)", 5)} />
      <path d="M226 40 Q236 70 216 92" style={linie("var(--td-akzent)", 2)} />
      <ellipse cx="228" cy="30" rx="14" ry="17" style={zartA(0.85)} />
    </>
  ),
  kultur: () => (
    <>
      <path d="M100 48 H164 V92 Q164 124 132 124 Q100 124 100 92Z" style={H} />
      <path d="M156 64 H220 V106 Q220 138 188 138 Q156 138 156 106Z" style={A} />
      <circle cx="120" cy="78" r="5" style={W} />
      <circle cx="144" cy="78" r="5" style={W} />
      <path d="M118 98 Q132 110 146 98" style={linie("#ffffff", 4)} />
      <circle cx="176" cy="94" r="5" style={W} />
      <circle cx="200" cy="94" r="5" style={W} />
      <path d="M174 120 Q188 108 202 120" style={linie("#ffffff", 4)} />
    </>
  ),
  musik: () => (
    <>
      <path d="M126 52 L206 36 V110" style={linie("var(--td-haus)", 8)} />
      <path d="M126 52 V124" style={linie("var(--td-haus)", 8)} />
      <ellipse cx="114" cy="126" rx="18" ry="13" style={H} />
      <ellipse cx="194" cy="112" rx="18" ry="13" style={A} />
      <path d="M232 74 V112" style={linie("var(--td-akzent)", 5)} />
      <ellipse cx="226" cy="114" rx="10" ry="7" style={zartA(0.8)} />
    </>
  ),
  gesundheit: () => (
    <>
      <path d="M160 140 Q96 104 96 70 Q96 44 122 44 Q144 44 160 66 Q176 44 198 44 Q224 44 224 70 Q224 104 160 140Z" style={H} />
      <path d="M104 92 H134 L144 72 L158 112 L170 84 L178 92 H216" style={linie("#ffffff", 6)} />
      <rect x="228" y="56" width="12" height="36" rx="3" style={A} />
      <rect x="216" y="68" width="36" height="12" rx="3" style={A} />
    </>
  ),
  soziales: () => (
    <>
      <path d="M90 128 Q106 104 136 104 L176 104 Q186 104 186 114 Q186 124 176 124 L150 124" style={linie("var(--td-akzent)", 12)} />
      <path d="M230 128 Q214 96 186 96" style={linie("var(--td-akzent)", 12)} />
      <path d="M160 96 Q124 74 124 54 Q124 38 140 38 Q152 38 160 50 Q168 38 180 38 Q196 38 196 54 Q196 74 160 96Z" style={H} />
    </>
  ),
  wissenschaft: () => (
    <>
      <path d="M140 40 H180 M146 40 V78 L112 132 Q108 140 118 140 H202 Q212 140 208 132 L174 78 V40" style={linie("var(--td-haus)", 6)} />
      <path d="M126 112 H194 L206 134 Q208 138 202 138 H118 Q112 138 114 134Z" style={A} />
      <circle cx="146" cy="122" r="5" style={W} />
      <circle cx="170" cy="128" r="4" style={W} />
      <ellipse cx="236" cy="70" rx="26" ry="10" style={linie("var(--td-haus)", 3)} transform="rotate(30 236 70)" />
      <ellipse cx="236" cy="70" rx="26" ry="10" style={linie("var(--td-akzent)", 3)} transform="rotate(-30 236 70)" />
      <circle cx="236" cy="70" r="6" style={H} />
    </>
  ),
  international: () => (
    <>
      <circle cx="160" cy="88" r="50" style={H} />
      <path d="M126 58 Q142 52 150 64 Q144 80 128 76 Q118 70 126 58Z M164 96 Q184 90 192 104 Q186 124 170 126 Q160 112 164 96Z M180 48 Q194 50 198 62 Q188 66 180 58Z" style={A} />
      <ellipse cx="160" cy="88" rx="50" ry="18" style={linie("#ffffff", 2)} />
      <path d="M160 38 V138" style={linie("#ffffff", 2)} />
      <path d="M96 124 Q160 168 224 124" style={linie("var(--td-akzent)", 4)} />
    </>
  ),
  demokratie: () => (
    <>
      <rect x="92" y="44" width="92" height="56" rx="16" style={H} />
      <path d="M116 100 L108 120 L134 100Z" style={H} />
      <rect x="148" y="74" width="84" height="52" rx="16" style={A} />
      <path d="M208 126 L218 144 L192 126Z" style={A} />
      <circle cx="120" cy="72" r="5" style={W} />
      <circle cx="138" cy="72" r="5" style={W} />
      <circle cx="156" cy="72" r="5" style={W} />
      <path d="M172 100 H210" style={linie("#ffffff", 5)} />
    </>
  ),
  sport: () => (
    <>
      <circle cx="150" cy="92" r="40" style={H} />
      <path d="M150 52 Q170 92 150 132 M110 92 Q150 74 190 92" style={linie("#ffffff", 4)} />
      <path d="M200 60 H250 M210 76 H262 M196 92 H240" style={linie("var(--td-akzent)", 6)} />
    </>
  ),
  inklusion: () => (
    <>
      <circle cx="160" cy="90" r="52" style={linie("var(--td-haus)", 5)} />
      <circle cx="160" cy="38" r="12" style={H} />
      <circle cx="205" cy="116" r="12" style={A} />
      <circle cx="115" cy="116" r="12" style={zart(0.7)} />
      <circle cx="160" cy="90" r="16" style={zartA(0.6)} />
    </>
  ),
  kirche: () => (
    <>
      <path d="M150 36 V22 M142 28 H158" style={linie("var(--td-akzent)", 5)} />
      <path d="M134 70 L150 40 L166 70Z" style={A} />
      <rect x="136" y="70" width="28" height="70" style={H} />
      <path d="M164 92 L200 72 L236 92Z" style={zart(0.85)} />
      <rect x="168" y="92" width="64" height="48" style={zart(0.6)} />
      <path d="M144 140 V122 Q150 112 156 122 V140Z" style={W} />
      <rect x="190" y="104" width="12" height="16" rx="6" style={W} />
    </>
  ),
  handwerk: () => (
    <>
      <path d="M118 140 L176 70" style={linie("var(--td-haus)", 12)} />
      <rect x="160" y="40" width="54" height="28" rx="6" transform="rotate(40 187 54)" style={A} />
      <path d="M206 140 L150 80" style={linie("var(--td-akzent)", 10)} />
      <circle cx="144" cy="72" r="16" style={H} />
      <circle cx="144" cy="72" r="7" style={W} />
    </>
  ),
  denkmal: () => (
    <>
      <path d="M100 66 L160 36 L220 66Z" style={H} />
      <rect x="100" y="66" width="120" height="10" style={A} />
      <rect x="110" y="80" width="14" height="52" style={zart(0.75)} />
      <rect x="138" y="80" width="14" height="52" style={zart(0.75)} />
      <rect x="168" y="80" width="14" height="52" style={zart(0.75)} />
      <rect x="196" y="80" width="14" height="52" style={zart(0.75)} />
      <rect x="94" y="132" width="132" height="10" style={H} />
    </>
  ),
  klima: () => (
    <>
      <circle cx="122" cy="70" r="24" style={A} />
      <path d="M122 30 V38 M122 102 V110 M82 70 H90 M154 70 H162 M94 42 L100 48 M144 92 L150 98 M150 42 L144 48 M100 92 L94 98" style={linie("var(--td-akzent)", 4)} />
      <path d="M200 140 L204 72 H210 L214 140Z" style={zart(0.8)} />
      <path d="M207 72 L207 36" style={linie("var(--td-haus)", 6)} />
      <path d="M207 72 L238 88" style={linie("var(--td-haus)", 6)} />
      <path d="M207 72 L176 88" style={linie("var(--td-haus)", 6)} />
      <circle cx="207" cy="72" r="6" style={H} />
    </>
  ),
  allgemein: () => (
    <>
      <path d="M160 140 V96" style={linie("var(--td-haus)", 6)} />
      <path d="M160 104 Q124 100 116 70 Q150 70 160 104Z" style={H} />
      <path d="M160 96 Q196 92 204 60 Q170 62 160 96Z" style={A} />
      <path d="M232 52 L236 62 L246 66 L236 70 L232 80 L228 70 L218 66 L228 62Z" style={zartA(0.8)} />
    </>
  ),
}

/** Ein Bildmotiv in den Farben der Stiftung. Die Farben kommen von außen (`--td-haus`, `--td-akzent`). */
export function Motiv({ name, className = "" }: { name: StiftungsMotiv; className?: string }) {
  const Zeichnung = MOTIVE[name] ?? MOTIVE.allgemein
  return (
    <svg viewBox="0 0 320 180" className={className} role="presentation" aria-hidden preserveAspectRatio="xMidYMid slice">
      <Grund />
      <Zeichnung />
    </svg>
  )
}
