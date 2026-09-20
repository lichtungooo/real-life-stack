// Was aus einem eingegebenen Text ein Link wird — und was nicht.
//
// FND-0027: Der Wert kommt aus `Group.data`, und ein href führt fremde
// Eingaben in fremde Browser. `javascript:` und `data:` gehören nicht in
// ein href, egal wer sie eingetippt hat; sie bleiben als Text sichtbar
// (Muster 5: sichtbarer Rückfall statt Ausführung).
import { describe, it, expect } from "vitest"
import { urlAlsHref, urlAlsBildSrc } from "../src/profil-flaeche.js"

describe("urlAlsHref", () => {
  it("lässt http- und https-URLs durch", () => {
    expect(urlAlsHref("https://example.org")).toBe("https://example.org")
    expect(urlAlsHref("http://example.org/antrag?frist=1")).toBe("http://example.org/antrag?frist=1")
    expect(urlAlsHref("  https://example.org  ")).toBe("https://example.org")
  })

  it("akzeptiert auch Großschreibung des Schemas", () => {
    expect(urlAlsHref("HTTPS://Example.ORG")).toBe("HTTPS://Example.ORG")
  })

  it("fällt bei Skript- und Daten-Schemas auf Text zurück", () => {
    expect(urlAlsHref("javascript:alert(document.domain)")).toBeNull()
    expect(urlAlsHref("JaVaScRiPt:alert(1)")).toBeNull()
    expect(urlAlsHref("data:text/html,<script>alert(1)</script>")).toBeNull()
    expect(urlAlsHref("vbscript:msgbox(1)")).toBeNull()
  })

  it("fällt bei allem anderen auf Text zurück", () => {
    expect(urlAlsHref("ftp://example.org")).toBeNull()
    expect(urlAlsHref("beispiel.de")).toBeNull()
    expect(urlAlsHref("")).toBeNull()
    expect(urlAlsHref("   ")).toBeNull()
  })
})

describe("urlAlsBildSrc", () => {
  it("lässt http- und https-URLs durch", () => {
    expect(urlAlsBildSrc("https://example.org/logo.png")).toBe("https://example.org/logo.png")
    expect(urlAlsBildSrc("http://example.org/image.jpg")).toBe("http://example.org/image.jpg")
  })

  it("lässt relative Pfade durch", () => {
    expect(urlAlsBildSrc("/logo.png")).toBe("/logo.png")
  })

  it("lässt sichere base64-data-image URIs durch", () => {
    expect(urlAlsBildSrc("data:image/png;base64,iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=")
  })

  it("fällt bei Skript-Schemas auf null zurück", () => {
    expect(urlAlsBildSrc("javascript:alert(1)")).toBeNull()
    expect(urlAlsBildSrc("vbscript:msgbox(1)")).toBeNull()
  })

  it("fällt bei sonstigem Unbekannten auf null zurück", () => {
    expect(urlAlsBildSrc("ftp://example.org/img.png")).toBeNull()
    expect(urlAlsBildSrc("")).toBeNull()
  })
})
