# -*- coding: utf-8 -*-
"""Faehrt alle Tore und zeigt eine Ampel.

Ein Befehl statt sechs, und nichts wird vergessen. Jedes Tor kommt aus
docs/ARCHITEKTUR.md Teil 7.

    python td-tools/pruefen.py            # alles
    python td-tools/pruefen.py --schnell  # ohne Bau und Tests (Sekunden)

Rueckgabe 0, wenn alles gruen ist. Sonst 1: so laesst es sich in eine CI
haengen, ohne dass jemand den Text lesen muss.
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCHNELL = "--schnell" in sys.argv

# Was in unseren Paketen nie stehen darf: Protokoll-Aufrufe binden uns an eine
# Version des Web of Trust, und Antons naechster Fortschritt waere unser
# Problem (ARCHITEKTUR Teil 6).
VERBOTEN = re.compile(r"did:key|Y\.Doc|applyUpdate|@web_of_trust")
UNSERE_PFADE = ["packages/td-core", "packages/td-ui", "apps/trustdonation"]

# Budget aus ARCHITEKTUR Teil 7 und dem Skill td-performance.
#
# Gemessen wird die **unkomprimierte** Groesse im dist-Ordner. Ueber die
# Leitung geht rund ein Drittel davon. Die ehrlichere Zahl ist die Startlast,
# und die misst `td-tools/startlast.py` im Browser; dieses Tor hier ist der
# grobe Waechter, der ohne Browser auskommt.
GROESSTES_STUECK_KB = 2000

ergebnisse = []


def tor(name, ok, text, hinweis="", blockiert=True):
    """Ein Tor. `blockiert=False` warnt nur.

    Ein Werkzeug, das immer rot leuchtet, wird nach zwei Tagen ignoriert.
    Darum halten nur die Tore die Auslieferung auf, deren Bruch etwas kaputt
    macht: Typen, Regeln, unbenannte Naehte, die Grenze zum Protokoll. Das
    Budget warnt, denn es beschreibt ein Ziel, keinen Schaden.
    """
    ergebnisse.append({"name": name, "ok": ok, "text": text,
                       "hinweis": hinweis, "blockiert": blockiert})


def lauf(*args, cwd=None):
    """Ruft ein Programm auf und faengt seine Ausgabe.

    `pnpm` ist auf Windows eine `.cmd` und laesst sich ohne Shell nicht
    starten: `subprocess` findet dann keine Datei. `shutil.which` loest den
    richtigen Namen auf, auf jedem System. Im Schnelllauf fiel das nicht auf,
    weil dort kein pnpm gerufen wird.
    """
    befehl = list(args)
    pfad = shutil.which(befehl[0])
    if pfad:
        befehl[0] = pfad
    return subprocess.run(befehl, cwd=str(cwd or REPO), capture_output=True, text=True,
                          encoding="utf-8", errors="replace")


# --- Tor 1: Typen ------------------------------------------------------------
if SCHNELL:
    tor("Typen", None, "uebersprungen (--schnell)")
else:
    r = lauf("pnpm", "build")
    if r.returncode == 0:
        tor("Typen", True, "pnpm build laeuft durch")
    else:
        zeilen = [z for z in (r.stdout + r.stderr).splitlines() if "error" in z.lower()][:3]
        tor("Typen", False, "pnpm build bricht ab", "\n".join(zeilen))

# --- Tor 2: Regeln -----------------------------------------------------------
if SCHNELL:
    tor("Regeln", None, "uebersprungen (--schnell)")
else:
    r = lauf("pnpm", "-r", "test")
    text = r.stdout + r.stderr
    dateien = re.findall(r"Test Files.*?(\d+) passed", text)
    summe = sum(int(d) for d in dateien)
    if r.returncode == 0:
        tor("Regeln", True, str(summe) + " Testdateien gruen")
    else:
        fehl = [z.strip() for z in text.splitlines() if "FAIL" in z][:3]
        tor("Regeln", False, "Tests schlagen fehl", "\n".join(fehl))

# --- Tor 3: Naehte -----------------------------------------------------------
r = lauf(sys.executable, "td-tools/anton-stand.py", "--ohne-fetch")
aus = r.stdout
def zahl(feld):
    m = re.search(feld + r"\s+(\d+)", aus)
    return int(m.group(1)) if m else None

naehte, unbenannt, kollision = zahl("Unsere Naehte"), zahl("Unbenannt"), zahl("Kollisionen")
if unbenannt is None:
    tor("Naehte", False, "Bericht liess sich nicht lesen", (r.stderr or "").strip()[:200])
elif unbenannt > 0:
    tor("Naehte", False, str(unbenannt) + " unbenannte Naehte",
        "In docs/NAEHTE.md eintragen. Skill td-naht.")
else:
    tor("Naehte", True, str(naehte) + " Naehte, alle im Register, " + str(kollision or 0) + " Kollisionen")

# --- Tor 4: Grenze zum Protokoll ---------------------------------------------
treffer = []
vorhanden = [p for p in UNSERE_PFADE if (REPO / p).exists()]
for p in vorhanden:
    for datei in (REPO / p).rglob("*"):
        if not datei.is_file() or datei.suffix not in (".ts", ".tsx", ".js", ".mjs"):
            continue
        if "node_modules" in str(datei) or "/dist/" in datei.as_posix():
            continue
        for nr, zeile in enumerate(datei.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            if VERBOTEN.search(zeile):
                treffer.append(datei.relative_to(REPO).as_posix() + ":" + str(nr))
if not vorhanden:
    tor("Grenze", None, "eigene Pakete gibt es noch nicht (Etappe 0.5)")
elif treffer:
    tor("Grenze", False, str(len(treffer)) + " Protokoll-Aufrufe in unseren Paketen", "\n".join(treffer[:5]))
else:
    tor("Grenze", True, "keine Protokoll-Aufrufe in " + ", ".join(vorhanden))

# --- Tor 5: Budget -----------------------------------------------------------
dist = REPO / "apps" / "reference" / "dist" / "assets"
stuecke = sorted(dist.glob("*.js"), key=lambda p: p.stat().st_size, reverse=True) if dist.exists() else []
if not stuecke:
    tor("Budget", None, "kein Bau vorhanden, erst pnpm build")
else:
    kb = stuecke[0].stat().st_size / 1024
    if kb <= GROESSTES_STUECK_KB:
        tor("Budget", True, "groesstes Stueck " + str(round(kb)) + " KB")
    else:
        tor("Budget", False, "groesstes Stueck " + str(round(kb)) + " KB, Budget " + str(GROESSTES_STUECK_KB) + " KB",
            stuecke[0].name + ". Skill td-performance.", blockiert=False)
    gesamt = sum(p.stat().st_size for p in dist.parent.rglob("*") if p.is_file()) / 1024 / 1024
    ergebnisse[-1]["text"] += ", dist gesamt " + str(round(gesamt, 1)) + " MB"

# --- Tor 6: Gedaechtnis ------------------------------------------------------
# Das Gedaechtnis liegt im Arbeitsbereich, nicht im Repo. Auf einem fremden
# Rechner oder in der CI gibt es das nicht, und das ist kein Fehler: Dort
# bleibt das Tor offen, statt einen Bau abzubrechen, der sonst gruen waere.
stand = Path("D:/Workspace/memory/stand_trustdonation.md")
if not stand.parent.exists():
    tor("Gedaechtnis", None, "Arbeitsbereich nicht vorhanden (fremder Rechner oder CI)")
elif not stand.exists():
    tor("Gedaechtnis", False, "stand_trustdonation.md fehlt")
else:
    kopf = stand.read_text(encoding="utf-8")[:600]
    m = re.search(r"Gepflegt:\s*(\d{4}-\d{2}-\d{2})", kopf)
    tor("Gedaechtnis", True, "Stand gepflegt " + (m.group(1) if m else "ohne Datum"))

# --- Ausgabe -----------------------------------------------------------------
print()
breite = max(len(e["name"]) for e in ergebnisse)
schlecht, gewarnt = 0, 0
for e in ergebnisse:
    if e["ok"] is False and e["blockiert"]:
        zeichen, _ = "ROT   ", None
        schlecht += 1
    elif e["ok"] is False:
        zeichen = "gelb  "
        gewarnt += 1
    elif e["ok"]:
        zeichen = "gruen "
    else:
        zeichen = "offen "
    print(zeichen + e["name"].ljust(breite + 2) + e["text"])
    if e["hinweis"]:
        for z in e["hinweis"].splitlines():
            print("       " + " " * (breite + 2) + z)
print()
if schlecht:
    print(str(schlecht) + " Tor(e) rot. Nicht ausliefern, bis sie gruen sind.")
elif gewarnt:
    print(str(gewarnt) + " Warnung(en). Ausliefern geht, das Ziel ist noch nicht erreicht.")
else:
    print("Alles gruen. Ausliefern mit Skill td-ausliefern.")
sys.exit(1 if schlecht else 0)
