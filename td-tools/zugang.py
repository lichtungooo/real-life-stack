# -*- coding: utf-8 -*-
"""Prüft, ob die Seite für alle bedienbar ist.

Lädt die Seite in Chrome ohne Fenster und lässt axe-core darüber laufen.
axe findet nicht alles, was ein Mensch findet, aber es findet zuverlässig,
was Maschinen finden können: fehlende Beschriftungen, zu schwache Kontraste,
Bilder ohne Text, eine kaputte Ueberschriften-Ordnung.

    python td-tools/zugang.py                          # gegen die Vorschau
    python td-tools/zugang.py https://trustdonation.org/

Rückgabe 1, wenn ein schwerer Fund dabei ist.
"""
import json
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js"
PORT = 9445

ZIEL = next((a for a in sys.argv[1:] if a.startswith("http")), "http://localhost:4173/?connector=local")

SCHWERE = {"critical": "schwer", "serious": "ernst", "moderate": "mittel", "minor": "klein"}


def cdp_ziel():
    for _ in range(40):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2) as r:
                for t in json.load(r):
                    if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
                        return t["webSocketDebuggerUrl"]
        except Exception:
            pass
        time.sleep(0.5)
    raise SystemExit("Chrome antwortet nicht auf Port " + str(PORT))



def chrome_beenden(prozess):
    """Beendet Chrome samt seiner Kindprozesse.

    `terminate()` trifft nur den Elternteil. Die Renderer laufen weiter, und
    nach ein paar Messlaeufen liegen zwanzig davon herum: Genug Last, um einen
    zeitabhaengigen Test kippen zu lassen. Das ist einmal passiert.
    """
    try:
        prozess.terminate()
        prozess.wait(timeout=10)
    except Exception:
        try:
            prozess.kill()
        except Exception:
            pass

def main():
    try:
        from websocket import create_connection  # type: ignore
    except ImportError:
        print("Dieses Werkzeug braucht websocket-client:\n    pip install websocket-client", file=sys.stderr)
        return 2

    try:
        with urllib.request.urlopen(AXE, timeout=30) as r:
            axe_quelle = r.read().decode("utf-8")
    except Exception as e:
        print("axe-core liess sich nicht laden: " + str(e), file=sys.stderr)
        return 2

    profil = REPO / "td-tools" / ".chrome-zugang"
    shutil.rmtree(profil, ignore_errors=True)
    chrome = subprocess.Popen([
        CHROME, f"--remote-debugging-port={PORT}", "--headless=new",
        "--no-first-run", "--no-default-browser-check", "--disable-gpu",
        "--remote-allow-origins=*", "--user-data-dir=" + str(profil),
        "--window-size=1280,900", ZIEL,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        ws = create_connection(cdp_ziel(), timeout=30)
        nr = 0

        def ruf(method, params=None):
            nonlocal nr
            nr += 1
            ws.send(json.dumps({"id": nr, "method": method, "params": params or {}}))
            eigene = nr
            while True:
                m = json.loads(ws.recv())
                if m.get("id") == eigene:
                    return m

        # Die App braucht einen Moment, bis sie steht. axe auf eine leere
        # Seite zu werfen misst nichts.
        time.sleep(6)
        ruf("Runtime.evaluate", {"expression": axe_quelle, "returnByValue": False})
        antwort = ruf("Runtime.evaluate", {
            "expression": "axe.run(document, {resultTypes:['violations']}).then(r => JSON.stringify(r.violations))",
            "awaitPromise": True, "returnByValue": True,
        })
        ws.close()
    finally:
        chrome_beenden(chrome)

    roh = antwort.get("result", {}).get("result", {}).get("value")
    if not isinstance(roh, str):
        print("axe lieferte kein Ergebnis: " + json.dumps(antwort)[:400], file=sys.stderr)
        return 2
    funde = json.loads(roh)

    print()
    print("Ziel " + ZIEL)
    print()
    if not funde:
        print("Keine Funde. Das heisst nicht barrierefrei, es heisst: was Maschinen finden koennen, ist sauber.")
        return 0

    nach_schwere = {}
    for f in funde:
        nach_schwere.setdefault(f.get("impact") or "minor", []).append(f)

    schwer = 0
    for stufe in ("critical", "serious", "moderate", "minor"):
        liste = nach_schwere.get(stufe, [])
        if not liste:
            continue
        if stufe in ("critical", "serious"):
            schwer += len(liste)
        print(SCHWERE[stufe].upper() + " (" + str(len(liste)) + ")")
        for f in liste:
            wo = len(f.get("nodes", []))
            print("  " + f["id"] + ": " + f["help"] + "  (" + str(wo) + "x)")
            for knoten in f.get("nodes", [])[:2]:
                ziel = ", ".join(knoten.get("target", []))[:90]
                print("      " + ziel)
                # Der Ausschnitt sagt, um welches Element es geht. Ohne ihn
                # sucht man einen Knopf unter hundert gleichen Klassen.
                schnipsel = " ".join((knoten.get("html") or "").split())
                if schnipsel:
                    print("      " + schnipsel[:160])
        print()

    print(str(len(funde)) + " Regeln verletzt, davon " + str(schwer) + " schwer oder ernst.")
    return 1 if schwer else 0


if __name__ == "__main__":
    sys.exit(main())
