// Redestab und Klangschale als Bilder statt als Zeichen (Timo, 30.09.2026:
// "Der Redestab schön markant in der Mitte, vielleicht auch noch ein
// bisschen schöner … Die Klangschale kann eine richtige Klangschale sein").
// Reines SVG, ohne Bilddatei: waechst mit, traegt hell und dunkel.

import { useId } from "react"

/** Ein geschnitzter Redestab aus Holz, mit Baendern, Perlen und einer Feder. */
export function Redestab({ className = "", groesse = 72 }: { className?: string; groesse?: number }) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 64" width={groesse} height={groesse} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-holz`} x1="0" x2="1">
          <stop offset="0" stopColor="#7c4a1e" />
          <stop offset="0.45" stopColor="#c98b4a" />
          <stop offset="1" stopColor="#6b3d17" />
        </linearGradient>
      </defs>
      <g transform="rotate(38 32 32)">
        {/* der Stab */}
        <rect x="29" y="6" width="6" height="54" rx="3" fill={`url(#${id}-holz)`} />
        {/* geschnitzter Kopf */}
        <ellipse cx="32" cy="7" rx="4.6" ry="4" fill="#8a5424" />
        <ellipse cx="31" cy="5.8" rx="1.6" ry="1.1" fill="#e2b27a" opacity="0.7" />
        {/* Baender */}
        <rect x="28.6" y="14" width="6.8" height="2.2" rx="1" fill="#1f6f78" />
        <rect x="28.6" y="17.4" width="6.8" height="1.4" rx="0.7" fill="#b91c1c" />
        <rect x="28.6" y="47" width="6.8" height="2.2" rx="1" fill="#1f6f78" />
        {/* Perlen an einer Schnur */}
        <path d="M35 16 q5 4 4 11" fill="none" stroke="#5b3a1a" strokeWidth="0.7" />
        <circle cx="38.6" cy="21" r="1.4" fill="#b91c1c" />
        <circle cx="39.3" cy="24.4" r="1.4" fill="#e7c65b" />
        {/* die Feder */}
        <path d="M39 27 C45 30 46 40 41 47 C38 41 37 33 39 27 Z" fill="#faf7f0" stroke="#a8a29e" strokeWidth="0.6" />
        <path d="M39 27 C41 34 41.5 41 41 47" fill="none" stroke="#78716c" strokeWidth="0.6" />
        <path d="M43.4 36 C44.5 38 44.3 41 43 43.5 L41.4 40.6 Z" fill="#57534e" opacity="0.55" />
      </g>
    </svg>
  )
}

/** Eine Klangschale aus Bronze auf ihrem Kissen, der Kloeppel lehnt daran. */
export function Klangschale({ className = "", groesse = 56, klingt = false }: { className?: string; groesse?: number; klingt?: boolean }) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 52" width={groesse} height={(groesse * 52) / 64} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bronze`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a5a14" />
          <stop offset="0.35" stopColor="#e9bf62" />
          <stop offset="0.6" stopColor="#c8922f" />
          <stop offset="1" stopColor="#7a4e10" />
        </linearGradient>
        <radialGradient id={`${id}-innen`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#5c3a0c" />
          <stop offset="1" stopColor="#a8741f" />
        </radialGradient>
      </defs>
      {/* Wellen, solange die Schale klingt */}
      {klingt && (
        <g fill="none" stroke="#d6a445" strokeWidth="1">
          <ellipse cx="32" cy="18" rx="27" ry="7" opacity="0.5" className="motion-safe:animate-ping" style={{ transformOrigin: "32px 18px" }} />
        </g>
      )}
      {/* das Kissen */}
      <ellipse cx="32" cy="45" rx="22" ry="5.5" fill="#9f1239" />
      <ellipse cx="32" cy="43.6" rx="20" ry="4" fill="#be123c" />
      {/* die Schale */}
      <path d="M9 18 C9 36 20 43 32 43 C44 43 55 36 55 18 Z" fill={`url(#${id}-bronze)`} />
      <ellipse cx="32" cy="18" rx="23" ry="5.4" fill={`url(#${id}-innen)`} stroke="#f1cf7e" strokeWidth="1.2" />
      <path d="M14 26 C18 33 24 36 30 37" fill="none" stroke="#f6dc9b" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
      {/* der Kloeppel */}
      <g transform="rotate(-32 52 14)">
        <rect x="50.5" y="0" width="3" height="26" rx="1.5" fill="#6b3d17" />
        <rect x="49.6" y="0" width="4.8" height="7" rx="2.2" fill="#3f2a14" />
      </g>
    </svg>
  )
}
