# -*- coding: utf-8 -*-
"""Kimi prüft, was seit der letzten Auslieferung geändert wurde.

Claude baut, Kimi prüft. Zwei Modellfamilien übersehen verschiedene Dinge:
Am 01.10.2026 fand Kimi zwei Fehler in Korrekturen, die alle Tore passiert
hatten. Darum läuft dieses Werkzeug vor jeder Auslieferung, in zwei Runden.

    python td-tools/kimi-pruefen.py              # Runde 1 gegen die letzte Auslieferung
    python td-tools/kimi-pruefen.py --runde2     # Runde 2: prüft die Korrekturen, gleiche Sitzung
    python td-tools/kimi-pruefen.py --basis <ref>
    python td-tools/kimi-pruefen.py --zeigen     # nur, was geprüft würde, ohne Kimi

Rückgabe 1, wenn Kimi einen kritischen Befund meldet oder Dateien verändert
hat. Der Bericht liegt in td-tools/berichte/kimi-*.md, die Liste aller
Läufe in td-tools/berichte/PRUEFKREIS.md.

Timos Abo ist Moderato (Limit je 5 Stunden und je Woche). Darum prüft Kimi
nur den Unterschied, nicht das ganze Repo, und Runde 2 setzt die Sitzung
von Runde 1 fort, statt neu zu lesen.
"""
import argparse
import datetime
import hashlib
import json
import re
import subprocess
import sys
import time
from pathlib import Path

for strom in (sys.stdout, sys.stderr):
    try:
        strom.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

REPO = Path(__file__).resolve().parent.parent
BERICHTE = REPO / "td-tools" / "berichte"
LISTE = BERICHTE / "PRUEFKREIS.md"
MERKER = BERICHTE / ".kimi-letzte-sitzung.json"
KIMI = Path.home() / ".kimi-code" / "bin" / "kimi.exe"
MODELL = "kimi-code/k3"

# Was Kimi nicht lesen muss: erzeugt, gesperrt oder Bild.
AUSSEN_VOR = [
    ":(exclude)pnpm-lock.yaml", ":(exclude)**/dist/**", ":(exclude)**/*.png",
    ":(exclude)**/*.jpg", ":(exclude)**/*.webp", ":(exclude)**/*.woff2",
    ":(exclude)**/*.svg", ":(exclude)docs/**", ":(exclude)td-tools/berichte/**",
    ":(exclude)**/*.md",
]
GROESSTER_UNTERSCHIED = 400_000  # Zeichen; darüber wird es teuer und unscharf

AUFTRAG_1 = """Du bist der Prüfer im Prüfkreis. Claude hat gebaut, du prüfst.
Repo: Fork des Real Life Stack (TypeScript, React, pnpm). Eigene Pakete:
packages/td-core, td-ui, kreis-core, kreis-ui, kreis-livekit, dazu
apps/reference. Alles andere gehört Anton und wird nur über Haken berührt.

Der Unterschied seit der letzten Auslieferung ({basis}) liegt in:
  {patch}
Lies ihn. Öffne die betroffenen Dateien im Repo, wo du Zusammenhang brauchst.

VERÄNDERE NICHTS. Keine Datei schreiben, nichts formatieren, nichts
installieren, keinen git-Befehl, der etwas ändert. Nur lesen.

Suche echte Fehler: falsches Verhalten, Abstürze, verlorene Daten, Lecks
(Mikrofon, Kamera, Verbindungen, Zeitgeber), Wettläufe, React-Hooks in
falscher Reihenfolge, fehlende Aufräumarbeit, Sicherheit (Zugang, Token,
fremde Eingaben). Keine Stilfragen, keine Geschmacksfragen.

Antworte auf Deutsch, genau in dieser Form:

## Befund 1: <kurzer Titel>
- Schwere: kritisch | mittel | klein
- Ort: <datei>:<zeile>
- Was passiert: <konkreter Ablauf, der den Fehler auslöst>
- Vorschlag: <wie es zu beheben ist>

(weitere Befunde gleich)

Zum Schluss eine Zeile genau so:
ERGEBNIS: <n> Befunde, davon <k> kritisch

Findest du nichts Echtes, schreibe nur: ERGEBNIS: 0 Befunde, davon 0 kritisch
"""

AUFTRAG_2 = """Zweite Runde. Claude hat auf deine Befunde reagiert.
Der Unterschied seit {basis} liegt jetzt neu in:
  {patch}

VERÄNDERE NICHTS, nur lesen.

1. Geh jeden deiner Befunde aus Runde 1 durch und sag je Befund:
   behoben | offen | zurückgewiesen (und ob die Zurückweisung trägt).
   Glaube keiner Behauptung, prüfe den Code.
2. Suche Fehler, die die Korrekturen neu hineingebracht haben. Das ist der
   wichtigste Teil: Korrekturen sind die häufigste Quelle neuer Fehler.

Neue Befunde in derselben Form wie in Runde 1. Zum Schluss:
ERGEBNIS: <n> Befunde, davon <k> kritisch
(gezählt werden offene und neue Befunde)
"""


def git(*args):
    r = subprocess.run(["git", *args], cwd=str(REPO), capture_output=True,
                       text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        sys.exit("git " + " ".join(args) + " scheitert: " + r.stderr.strip())
    return r.stdout


def letzte_auslieferung():
    """Der oberste Commit in docs/AUSLIEFERUNGEN.md, der schon einen Hash trägt."""
    text = (REPO / "docs" / "AUSLIEFERUNGEN.md").read_text(encoding="utf-8")
    for zeile in text.splitlines():
        m = re.match(r"\|\s*\*\*(proto-\d+)\*\*\s*\|\s*`([0-9a-f]{7,40})`", zeile)
        if m:
            return m.group(2), m.group(1)
    sys.exit("Keine Auslieferung mit Commit in docs/AUSLIEFERUNGEN.md gefunden.")


def zustand_der_dateien():
    """Inhalt jeder Datei im Arbeitsbaum, versioniert oder neu.

    Nach Inhalt, nicht nach git-Status: Ein Commit einer anderen Sitzung
    ändert den Status, aber keinen Inhalt, und eine geänderte neue Datei
    ändert den Inhalt, aber keinen Status (Kimi, Befund 1, 01.10.2026).
    """
    abdruck = {}
    # Die flüchtigen .kimi-*-Dateien hält --exclude-standard schon heraus;
    # die Berichte selbst bleiben im Abdruck (Kimi, Runde 2, 01.10.2026).
    for pfad in git("ls-files", "-co", "--exclude-standard").splitlines():
        datei = REPO / pfad
        if datei.is_file():
            abdruck[pfad] = hashlib.sha256(datei.read_bytes()).hexdigest()
    return abdruck


def kimi(auftrag, sitzung=None):
    befehl = [str(KIMI), "-m", MODELL, "--prompt", auftrag, "--output-format", "stream-json"]
    if sitzung:
        befehl[1:1] = ["-S", sitzung]
    beginn = time.time()
    r = subprocess.run(befehl, cwd=str(REPO), capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=3600)
    antworten, neue_sitzung, fehler = [], sitzung, []
    for zeile in r.stdout.splitlines():
        try:
            d = json.loads(zeile)
        except ValueError:
            if zeile.strip():
                fehler.append(zeile.strip())
            continue
        if d.get("role") == "assistant" and isinstance(d.get("content"), str) and d["content"].strip():
            antworten.append(d["content"])
        if d.get("type") == "session.resume_hint":
            neue_sitzung = d.get("session_id") or neue_sitzung
    # Kimi meldet Fehler mit Exit-Code 0. Darum zählt nur, ob eine Antwort kam.
    if not antworten:
        sys.exit("Kimi hat nicht geantwortet.\n" + "\n".join(fehler[:5] + r.stderr.splitlines()[:5]))
    return antworten[-1], neue_sitzung, round(time.time() - beginn)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--basis")
    ap.add_argument("--runde2", action="store_true")
    ap.add_argument("--zeigen", action="store_true")
    a = ap.parse_args()

    if a.basis:
        basis, name = a.basis, a.basis
    else:
        basis, name = letzte_auslieferung()

    # Gegen den Arbeitsbaum, damit auch noch nicht Eingechecktes geprüft wird.
    patch_text = git("diff", basis, "--", ".", *AUSSEN_VOR)
    neu = [p for p in git("ls-files", "--others", "--exclude-standard").splitlines()
           if p.endswith((".ts", ".tsx", ".js", ".mjs", ".py", ".json", ".css"))
           and "berichte/" not in p]
    for pfad in neu:
        inhalt = (REPO / pfad).read_text(encoding="utf-8", errors="replace")
        patch_text += f"\n--- /dev/null\n+++ b/{pfad} (neu, noch nicht eingecheckt)\n" \
                      + "".join("+" + z + "\n" for z in inhalt.splitlines())
    dateien = sorted(set(re.findall(r"^\+\+\+ b/(\S+)", patch_text, re.M)))

    print(f"Basis {name} ({basis}), {len(dateien)} Dateien, {len(patch_text):,} Zeichen")
    for d in dateien:
        print("  " + d)
    if not dateien:
        print("Nichts zu prüfen.")
        return 0
    if a.zeigen:
        return 0
    if len(patch_text) > GROESSTER_UNTERSCHIED:
        sys.exit(f"Unterschied zu groß ({len(patch_text):,} Zeichen). "
                 "Mit --basis näher heranrücken oder in Teilen prüfen.")
    if not KIMI.exists():
        sys.exit(f"Kimi fehlt unter {KIMI}.")

    BERICHTE.mkdir(exist_ok=True)
    stempel = datetime.datetime.now().strftime("%Y-%m-%d-%H%M%S")
    patch = BERICHTE / f".kimi-{stempel}.patch"
    patch.write_text(patch_text, encoding="utf-8")

    sitzung = None
    if a.runde2:
        if not MERKER.exists():
            sys.exit("Keine Runde 1 gemerkt. Erst ohne --runde2 laufen lassen.")
        gemerkt = json.loads(MERKER.read_text(encoding="utf-8"))
        if gemerkt.get("basis") != basis:
            sys.exit(f"Die Basis hat sich bewegt: Runde 1 lief gegen {gemerkt.get('basis')}, "
                     f"jetzt {basis}. Erst eine neue Runde 1.")
        sitzung = gemerkt["sitzung"]
        auftrag = AUFTRAG_2.format(basis=name, patch=patch.relative_to(REPO).as_posix())
    else:
        auftrag = AUFTRAG_1.format(basis=name, patch=patch.relative_to(REPO).as_posix())

    vorher = zustand_der_dateien()
    print(f"\nKimi ({MODELL}) prüft{' Runde 2' if a.runde2 else ''} …")
    antwort, sitzung, sekunden = kimi(auftrag, sitzung)
    nachher = zustand_der_dateien()
    veraendert = sorted(p for p in set(vorher) | set(nachher) if vorher.get(p) != nachher.get(p))
    patch.unlink(missing_ok=True)

    m = re.search(r"ERGEBNIS:\s*(\d+)\s*Befunde?,\s*davon\s*(\d+)\s*kritisch", antwort)
    befunde, kritisch = (int(m.group(1)), int(m.group(2))) if m else (None, None)

    runde = 2 if a.runde2 else 1
    bericht = BERICHTE / f"kimi-{stempel}-runde{runde}.md"
    kopf = (f"# Prüfkreis: Kimi, Runde {runde}\n\n"
            f"- Datum: {stempel}\n- Modell: {MODELL}\n- Basis: {name} (`{basis}`)\n"
            f"- Dateien: {len(dateien)}\n- Dauer: {sekunden} s\n- Sitzung: `{sitzung}`\n")
    if veraendert:
        kopf += ("\n**⚠ Während der Prüfung haben sich Dateien verändert** (Kimi oder eine andere "
                 "Sitzung): " + ", ".join(f"`{p}`" for p in veraendert[:10]) + "\n")
    bericht.write_text(kopf + "\n" + antwort.strip() + "\n", encoding="utf-8")
    MERKER.write_text(json.dumps({"sitzung": sitzung, "basis": basis}), encoding="utf-8")

    if not LISTE.exists():
        LISTE.write_text("# Prüfkreis: alle Läufe\n\n"
                         "Claude baut, Kimi prüft. Je Lauf eine Zeile. Was daraus gelernt wurde,\n"
                         "steht in der Spalte Lehre (von Claude nachgetragen).\n\n"
                         "| Datum | Runde | Basis | Dateien | Befunde | kritisch | Dauer | Bericht | Lehre |\n"
                         "|---|---|---|---|---|---|---|---|---|\n", encoding="utf-8")
    with LISTE.open("a", encoding="utf-8") as f:
        f.write(f"| {stempel} | {runde} | {name} | {len(dateien)} | {befunde if befunde is not None else '?'} "
                f"| {kritisch if kritisch is not None else '?'} | {sekunden} s | [{bericht.name}]({bericht.name}) | |\n")

    print("\n" + antwort.strip() + "\n")
    print(f"Bericht: {bericht.relative_to(REPO).as_posix()}  ({sekunden} s)")
    if veraendert:
        print("⚠ Während der Prüfung haben sich Dateien verändert (Kimi oder eine andere Sitzung):")
        for p in veraendert[:10]:
            print("    " + p)
        print("  Nicht ausliefern, bevor klar ist, wer das war.")
        return 1
    if m is None:
        print("⚠ Keine ERGEBNIS-Zeile. Bericht von Hand lesen.")
        return 1
    if kritisch:
        print(f"{kritisch} kritisch. Beheben, dann --runde2.")
        return 1
    print("Kein kritischer Befund." + ("" if a.runde2 else " Mittlere beheben oder begründen, dann --runde2."))
    return 0


if __name__ == "__main__":
    sys.exit(main())
