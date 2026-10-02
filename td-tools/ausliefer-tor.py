# -*- coding: utf-8 -*-
"""Das letzte Tor vor dem Server-Bau: Darf dieser Commit live?

Der Server baut `fork/trustdonation`. Dieses Tor gibt genau diesen Commit
nur frei, wenn

  1. der GitHub-Lauf „trustdonation Tore“ für ihn grün ist, und
  2. Kimi denselben Code geprüft hat, ohne kritischen Befund: Runde 2, oder
     Runde 1 mit null Befunden. Danach dürfen sich nur Doku und Berichte
     geändert haben.

    python td-tools/ausliefer-tor.py
    python td-tools/ausliefer-tor.py --ohne-kimi "nur Musterdaten"

`--ohne-kimi` lässt die Kimi-Bedingung fallen, nie die CI, und schreibt den
Grund in td-tools/berichte/PRUEFKREIS.md. Die Auslieferungszeile in
docs/AUSLIEFERUNGEN.md nennt ihn dann ebenfalls.

Warum es das gibt: proto-64 ging ohne Kimi live, und die CI war am
01.10.2026 seit mindestens 40 Läufen rot, ohne dass es jemand sah. Ein
Pflichtschritt, den niemand prüft, ist ein Wunsch.

Rückgabe 0 = frei, 1 = gesperrt, 2 = CI läuft noch.
"""
import datetime
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

for strom in (sys.stdout, sys.stderr):
    try:
        strom.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

REPO = Path(__file__).resolve().parent.parent
BERICHTE = REPO / "td-tools" / "berichte"
FREIGABE = BERICHTE / ".kimi-freigabe"  # .kimi-* ist ignoriert
FORK = "lichtungooo/real-life-stack"
ABLAUF = "trustdonation Tore"


def lauf(*args):
    befehl = list(args)
    befehl[0] = shutil.which(befehl[0]) or befehl[0]
    r = subprocess.run(befehl, cwd=str(REPO), capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if r.returncode != 0:
        sys.exit(" ".join(args[:3]) + " scheitert: " + (r.stderr or r.stdout).strip()[:300])
    return r.stdout


def nur_doku(pfad):
    return pfad.startswith(("docs/", "td-tools/berichte/")) or pfad.endswith(".md")


def ci(sha):
    daten = json.loads(lauf("gh", "api", f"repos/{FORK}/actions/runs?head_sha={sha}&per_page=50"))
    laeufe = [r for r in daten.get("workflow_runs", []) if r["name"] == ABLAUF]
    if not laeufe:
        return None, "kein Lauf für diesen Commit gefunden (gepusht?)"
    neu = max(laeufe, key=lambda r: r["created_at"])
    if neu["status"] != "completed":
        return "laeuft", f"läuft noch: {neu['html_url']}"
    return neu["conclusion"] == "success", f"{neu['conclusion']}: {neu['html_url']}"


def letzte_auslieferung():
    """Der oberste Commit in docs/AUSLIEFERUNGEN.md, der schon einen Hash trägt (wie kimi-pruefen.py)."""
    text = (REPO / "docs" / "AUSLIEFERUNGEN.md").read_text(encoding="utf-8")
    for zeile in text.splitlines():
        m = re.match(r"\|\s*\*\*(proto-\d+)\*\*\s*\|\s*`([0-9a-f]{7,40})`", zeile)
        if m:
            return lauf("git", "rev-parse", m.group(2) + "^{commit}").strip(), m.group(1)
    sys.exit("Keine Auslieferung mit Commit in docs/AUSLIEFERUNGEN.md gefunden.")


def ergebnis(text):
    """Die letzte ERGEBNIS-Zeile zählt; widersprechen sich mehrere, gilt keine (wie kimi-pruefen.py)."""
    treffer = re.findall(r"ERGEBNIS:\s*(\d+)\s*Befunde?,\s*davon\s*(\d+)\s*kritisch", text)
    if not treffer or len(set(treffer)) > 1:
        return None
    return int(treffer[-1][0]), int(treffer[-1][1])


def kimi(sha):
    """Der jüngste gültige Bericht über denselben Code, oder der Grund, warum keiner gilt.

    Gültig ist nur ein Bericht, der ab der letzten Auslieferung prüfte. Sonst
    reichte ein Bericht über den letzten Commit allein (--basis HEAD~1), und
    der Rest ginge ungesehen live (Kimi, 02.10.2026, Befund 1).
    """
    basis, basis_name = letzte_auslieferung()
    gruende = []
    for bericht in sorted(BERICHTE.glob("kimi-*-runde*.md"), reverse=True):
        text = bericht.read_text(encoding="utf-8")
        stand = re.search(r"^- Stand: `([0-9a-f]{40})`", text, re.M)
        if not stand:
            continue  # Bericht von vor dem Tor
        geprueft_ab = re.search(r"^- Basis-Commit: `([0-9a-f]{40})`", text, re.M)
        if not geprueft_ab or geprueft_ab.group(1) != basis:
            gruende.append(f"{bericht.name}: prüfte nicht ab der letzten Auslieferung {basis_name}")
            continue
        if not re.search(r"^- Sauber: ja", text, re.M):
            gruende.append(f"{bericht.name}: mit nicht eingechecktem Code geprüft")
            continue
        r = subprocess.run(["git", "merge-base", "--is-ancestor", stand.group(1), sha],
                           cwd=str(REPO), capture_output=True)
        if r.returncode != 0:
            gruende.append(f"{bericht.name}: prüfte einen Stand, der nicht im Commit steckt")
            continue
        # --no-renames: eine Verschiebung von Code nach docs/ zeigt so beide Pfade (Befund 7).
        danach = [p for p in lauf("git", "diff", "--name-only", "--no-renames", stand.group(1), sha).splitlines()
                  if not nur_doku(p)]
        if danach:
            gruende.append(f"{bericht.name}: danach änderte sich Code ({', '.join(danach[:4])})")
            continue
        zahlen = ergebnis(text)
        if zahlen is None:
            gruende.append(f"{bericht.name}: ohne eindeutige ERGEBNIS-Zeile")
            continue
        befunde, kritisch = zahlen
        runde = 2 if "runde2" in bericht.name else 1
        if kritisch:
            return False, f"{bericht.name}: {kritisch} kritisch"
        if runde == 1 and befunde:
            return False, f"{bericht.name}: Runde 1 mit {befunde} Befunden, Runde 2 fehlt"
        return True, f"{bericht.name}: Runde {runde}, {befunde} Befunde, 0 kritisch"
    return False, "kein gültiger Kimi-Bericht. " + ("; ".join(gruende[:3]) if gruende else
                                                  "python td-tools/kimi-pruefen.py auf dem eingecheckten Stand")


def main():
    ohne_kimi = None
    if "--ohne-kimi" in sys.argv:
        i = sys.argv.index("--ohne-kimi")
        ohne_kimi = " ".join(sys.argv[i + 1:]).strip()
        if not ohne_kimi:
            sys.exit('--ohne-kimi braucht einen Grund, etwa --ohne-kimi "nur Musterdaten"')

    # Jede Freigabe gilt nur für den Lauf, der sie schreibt. Eine alte Datei
    # bewiese sonst eine Freigabe, die es nicht mehr gibt (Kimi, Runde 2, Befund 3).
    FREIGABE.unlink(missing_ok=True)
    lauf("git", "fetch", "-q", "fork", "trustdonation")
    sha = lauf("git", "rev-parse", "fork/trustdonation").strip()
    kopf = lauf("git", "rev-parse", "HEAD").strip()
    print(f"Der Server baut fork/trustdonation = {sha[:10]}")
    if kopf != sha:
        print(f"  Hinweis: lokal steht HEAD auf {kopf[:10]}. Gebaut wird, was im Fork liegt.")

    ok_ci, text_ci = ci(sha)
    print(("gruen " if ok_ci is True else "offen " if ok_ci == "laeuft" else "ROT   ") + "CI     " + text_ci)

    if ohne_kimi:
        ok_kimi, text_kimi = True, f"ausgelassen: {ohne_kimi}"
    else:
        ok_kimi, text_kimi = kimi(sha)
    print(("gruen " if ok_kimi else "ROT   ") + "Kimi   " + text_kimi)

    if ok_ci == "laeuft" and ok_kimi:
        print("\nDie CI läuft noch. Warten, dann noch einmal.")
        return 2
    if ok_ci is not True or not ok_kimi:
        FREIGABE.unlink(missing_ok=True)
        print("\nGesperrt. Nicht bauen.")
        return 1
    # Der Server baut genau diesen Commit, nicht das, was bis dahin im Fork
    # liegt (Kimi, 02.10.2026, Befund 6). Skill td-ausliefern, Schritt 4.
    FREIGABE.write_text(sha + "\n", encoding="utf-8")
    print(f"Freigegebener Commit steht in {FREIGABE.relative_to(REPO).as_posix()}: {sha}")
    if ohne_kimi:
        stempel = datetime.datetime.now().strftime("%Y-%m-%d-%H%M%S")
        with (BERICHTE / "PRUEFKREIS.md").open("a", encoding="utf-8") as f:
            f.write(f"| {stempel} | – | {sha[:8]} | – | – | – | – | ohne Kimi ausgeliefert | {ohne_kimi} |\n")
        print("\nFrei, ohne Kimi. Grund steht in PRUEFKREIS.md; in AUSLIEFERUNGEN.md nennen.")
    else:
        print("\nFrei. Server-Bau mit genau diesem Commit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
