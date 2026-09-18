# -*- coding: utf-8 -*-
"""Misst, was beim Start der App wirklich über die Leitung geht.

Die Größe der Dateien im `dist`-Ordner sagt wenig: Entscheidend ist, was ein
Browser beim ersten Aufruf tatsächlich holt. Ein Stück, das nur beim Oeffnen
der Karte geladen wird, kostet niemanden, der nie auf die Karte geht.

Startet Chrome ohne Fenster, lädt die Seite und zählt jede Antwort mit.

    python td-tools/startlast.py                       # gegen die Vorschau
    python td-tools/startlast.py https://trustdonation.org/app/
    python td-tools/startlast.py --modul map           # danach die Karte öffnen
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
PORT = 9444

ZIEL = next((a for a in sys.argv[1:] if a.startswith("http")), "http://localhost:4173/?connector=local")
MODUL = None
if "--modul" in sys.argv:
    i = sys.argv.index("--modul")
    if i + 1 < len(sys.argv):
        MODUL = sys.argv[i + 1]

# Ein Budget beschreibt ein Ziel, keinen Schaden. Darum warnt es, statt zu
# blockieren (siehe td-tools/pruefen.py).
BUDGET_KB = 1200


def cdp_ziele():
    for _ in range(40):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2) as r:
                liste = json.load(r)
            for t in liste:
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
        print("Dieses Werkzeug braucht websocket-client:", file=sys.stderr)
        print("    pip install websocket-client", file=sys.stderr)
        return 2

    # Jeder Lauf misst den ERSTEN Aufruf. Ein Profil aus dem vorigen Lauf
    # trägt den gespeicherten Stand des local-Connectors und verfaelscht die
    # Messung: Beim zweiten Mal wird geladen, was beim ersten Mal geschrieben
    # wurde, nicht was die Musterdaten sagen.
    profil = REPO / "td-tools" / ".chrome-messung"
    if profil.exists():
        shutil.rmtree(profil, ignore_errors=True)

    chrome = subprocess.Popen([
        CHROME,
        f"--remote-debugging-port={PORT}",
        "--headless=new",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-gpu",
        # Ohne das weist Chrome die Verbindung mit 403 ab: Es prüft den
        # Ursprung der WebSocket-Anfrage gegen eine leere Erlaubnisliste.
        "--remote-allow-origins=*",
        "--user-data-dir=" + str(REPO / "td-tools" / ".chrome-messung"),
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        ws = create_connection(cdp_ziele(), timeout=30)
        nr = 0

        def senden(method, params=None):
            nonlocal nr
            nr += 1
            ws.send(json.dumps({"id": nr, "method": method, "params": params or {}}))
            return nr

        senden("Network.enable")
        senden("Page.enable")
        senden("Network.setCacheDisabled", {"cacheDisabled": True})
        senden("Page.navigate", {"url": ZIEL})

        antworten = {}
        fertig = False
        ende = time.time() + 45
        while time.time() < ende:
            try:
                nachricht = json.loads(ws.recv())
            except Exception:
                break
            m = nachricht.get("method")
            if m == "Network.responseReceived":
                p = nachricht["params"]
                antworten[p["requestId"]] = {
                    "url": p["response"]["url"],
                    "typ": p.get("type", ""),
                    "bytes": 0,
                }
            elif m == "Network.loadingFinished":
                p = nachricht["params"]
                if p["requestId"] in antworten:
                    antworten[p["requestId"]]["bytes"] = p.get("encodedDataLength", 0)
            elif m == "Page.loadEventFired":
                fertig = True
                ende = min(ende, time.time() + 4)  # Nachzügler einsammeln

        if MODUL and fertig:
            senden("Runtime.evaluate", {"expression": f"location.hash='';location.pathname.replace(/\\/[^/]*$/,'/{MODUL}')"})
            time.sleep(3)

        ws.close()
    finally:
        chrome_beenden(chrome)

    # --- Auswertung
    dateien = [a for a in antworten.values() if a["bytes"] > 0]
    gesamt = sum(a["bytes"] for a in dateien)
    nach_typ = {}
    for a in dateien:
        nach_typ.setdefault(a["typ"] or "sonstiges", 0)
        nach_typ[a["typ"] or "sonstiges"] += a["bytes"]

    print()
    print("Ziel   " + ZIEL)
    print("Dateien " + str(len(dateien)))
    print()
    for typ, b in sorted(nach_typ.items(), key=lambda x: -x[1]):
        print("  " + typ.ljust(12) + str(round(b / 1024)).rjust(6) + " KB")
    print("  " + "gesamt".ljust(12) + str(round(gesamt / 1024)).rjust(6) + " KB")
    print()
    print("Die groessten:")
    for a in sorted(dateien, key=lambda x: -x["bytes"])[:8]:
        name = a["url"].rsplit("/", 1)[-1][:52]
        print("  " + str(round(a["bytes"] / 1024)).rjust(6) + " KB  " + name)

    maplibre = [a for a in dateien if "maplibre" in a["url"]]
    print()
    if maplibre:
        print("Die Kartenbibliothek wird beim Start geladen (" + str(round(sum(a['bytes'] for a in maplibre) / 1024)) + " KB).")
    else:
        print("Die Kartenbibliothek wird beim Start NICHT geladen. Gut.")

    kb = round(gesamt / 1024)
    print()
    if kb <= BUDGET_KB:
        print("Startlast " + str(kb) + " KB, Budget " + str(BUDGET_KB) + " KB. Gruen.")
    else:
        print("Startlast " + str(kb) + " KB, Budget " + str(BUDGET_KB) + " KB. Ueber dem Ziel.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
