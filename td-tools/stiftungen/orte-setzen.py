"""Setzt die Orte der Stiftungen einheitlich (Timo, 01.10.2026: "räum die Daten
auf, damit wir einheitlich die Orte setzen können").

Wiederholbar und versioniert, statt im Scratchpad zu verschwinden wie die
Skripte vom 17.09.

Eingaben (alle in diesem Ordner, ausser den Musterdaten):
  anschriften.json   Recherche je Stiftung: Strasse, PLZ, Ort, Website,
                     Quell-URL, Status. Erzeugt aus den Rechercherunden.
  geocode.json       Zwischenspeicher der Koordinaten (Nominatim), damit ein
                     zweiter Lauf nichts neu fragt.
Ausgabe:
  packages/td-core/daten/items.json   die Stiftungen mit einheitlichen Feldern
  bericht.md                          was gesetzt wurde und was fehlt

Felder je Stiftung danach:
  address          "Strasse Nr, PLZ Ort" bei bekannter Anschrift, sonst "Ort"
  ortGenauigkeit   "anschrift" | "ort" | "bundesweit"
  position         Point aus der Anschrift; bei "ort" die Ortsmitte mit
                   kleinem, festem Versatz je Stiftung (sonst laegen alle
                   einer Stadt auf einem Punkt und liessen sich nie trennen)
  sitz             der Ort
  website          wenn belegt
  anschriftQuelle  die Seite, auf der die Anschrift steht

Aufruf (aus dem Repo):  python td-tools/stiftungen/orte-setzen.py [--ohne-netz]
"""
import hashlib
import io
import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
REPO = HIER.parent.parent
ITEMS = REPO / "packages" / "td-core" / "daten" / "items.json"
ANSCHRIFTEN = HIER / "anschriften.json"
CACHE = HIER / "geocode.json"
BERICHT = HIER / "bericht.md"
OHNE_NETZ = "--ohne-netz" in sys.argv

# Nominatim verlangt eine Kennung und hoechstens eine Anfrage je Sekunde.
KENNUNG = "trustdonation-stiftungen/1.0 (+https://trustdonation.org)"
# Rund 150 m Versatz um die Ortsmitte, fest je Stiftung (aus ihrer Id).
VERSATZ_GRAD = 0.0014


def lade(pfad, leer):
    return json.load(io.open(pfad, encoding="utf-8")) if pfad.exists() else leer


cache = lade(CACHE, {})


def geocode(anfrage: dict) -> list | None:
    """[lng, lat] oder None. Ergebnisse (auch leere) bleiben im Zwischenspeicher."""
    schluessel = json.dumps(anfrage, sort_keys=True, ensure_ascii=False)
    if schluessel in cache:
        return cache[schluessel]
    if OHNE_NETZ:
        return None
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({**anfrage, "format": "json", "limit": 1})
    req = urllib.request.Request(url, headers={"User-Agent": KENNUNG, "Accept-Language": "de"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            daten = json.load(r)
    except Exception as e:  # Netz weg: nicht speichern, beim naechsten Lauf erneut
        print("  Nominatim:", e)
        return None
    finally:
        time.sleep(1.1)
    ergebnis = [round(float(daten[0]["lon"]), 6), round(float(daten[0]["lat"]), 6)] if daten else []
    cache[schluessel] = ergebnis
    return ergebnis


def versatz(stiftung_id: str, punkt: list, weite_grad: float = VERSATZ_GRAD) -> list:
    h = int(hashlib.sha1(stiftung_id.encode()).hexdigest()[:8], 16)
    winkel = (h % 3600) / 3600 * 2 * math.pi
    weite = 0.4 + (h // 3600 % 600) / 1000  # 0.4 .. 1.0
    lng, lat = punkt
    return [round(lng + math.cos(winkel) * weite_grad * weite / math.cos(math.radians(lat)), 6),
            round(lat + math.sin(winkel) * weite_grad * weite, 6)]


def main():
    items = json.load(io.open(ITEMS, encoding="utf-8"))
    anschriften = {a["id"]: a for a in lade(ANSCHRIFTEN, [])}
    belegt: set = set()
    zeilen = {"anschrift": [], "ort": [], "bundesweit": [], "aufgeloest": [], "ohne_koordinate": [], "ohne_recherche": []}

    for item in items:
        if not str(item["id"]).startswith("stiftung-"):
            continue
        d = item["data"]
        a = anschriften.get(item["id"])
        if not a:
            zeilen["ohne_recherche"].append(d["title"])
            continue
        ort = (a.get("ort") or d.get("sitz") or "").strip()
        status = a.get("status", "")
        if status == "aufgeloest":
            zeilen["aufgeloest"].append(f"{d['title']}: {a.get('notiz', '')}")
        if a.get("website") and not d.get("website"):
            d["website"] = a["website"]
        if a.get("quelle"):
            d["anschriftQuelle"] = a["quelle"]

        punkt = None
        if a.get("plz"):
            # Ein Laendervorsatz wie "CH-" steckt schon im Feld `land`.
            a["plz"] = re.sub(r"^[A-Z]{1,2}-\s*", "", str(a["plz"]).strip())
        if status == "anschrift" and a.get("strasse") and a.get("plz"):
            strasse = a["strasse"].strip()
            d["address"] = f"{strasse}, {a['plz'].strip()} {ort}".strip()
            d["ortGenauigkeit"] = "anschrift"
            punkt = geocode({"street": strasse, "postalcode": a["plz"].strip(), "city": ort, "countrycodes": (a.get("land") or "de").lower()})
            if not punkt:  # Strasse unbekannt: wenigstens die PLZ
                punkt = geocode({"postalcode": a["plz"].strip(), "city": ort, "countrycodes": (a.get("land") or "de").lower()})
                if punkt:
                    punkt = versatz(item["id"], punkt)
        elif status == "bundesweit" or (not ort):
            d["address"] = d.get("address") or "bundesweit"
            d["ortGenauigkeit"] = "bundesweit"
        else:
            d["address"] = ort
            d["ortGenauigkeit"] = "ort"
            mitte = geocode({"city": ort, "countrycodes": (a.get("land") or "de").lower()})
            punkt = versatz(item["id"], mitte) if mitte else None

        if ort:
            d["sitz"] = ort
        # Zwei Stiftungen in einem Haus: um wenige Meter auseinander, sonst
        # lassen sie sich auf der Karte nie trennen.
        versuch = 0
        while punkt and tuple(punkt) in belegt:
            versuch += 1
            punkt = versatz(f"{item['id']}#{versuch}", punkt, weite_grad=0.00015)
        if punkt:
            belegt.add(tuple(punkt))
            d["position"] = {"type": "Point", "coordinates": punkt}
        else:
            zeilen["ohne_koordinate"].append(d["title"])
        zeilen[d["ortGenauigkeit"]].append(d["title"])
        json.dump(cache, io.open(CACHE, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)

    roh = io.open(ITEMS, encoding="utf-8").read()
    io.open(ITEMS, "w", encoding="utf-8").write(json.dumps(items, ensure_ascii=False, indent=2) + ("\n" if roh.endswith("\n") else ""))

    b = ["# Orte der Stiftungen", "", "Erzeugt von `orte-setzen.py`. Nicht von Hand ändern.", ""]
    for k, titel in [("anschrift", "Mit Anschrift"), ("ort", "Nur der Ort (Ortsmitte mit festem Versatz)"), ("bundesweit", "Bundesweit, ohne Sitz"),
                     ("aufgeloest", "Aufgelöst oder verschmolzen, bitte entscheiden"), ("ohne_koordinate", "Ohne Koordinate (alte Position bleibt)"),
                     ("ohne_recherche", "Ohne Recherche-Eintrag")]:
        b.append(f"## {titel}: {len(zeilen[k])}")
        if k not in ("anschrift", "ort"):
            b += [f"- {z}" for z in zeilen[k]]
        b.append("")
    io.open(BERICHT, "w", encoding="utf-8").write("\n".join(b))
    print({k: len(v) for k, v in zeilen.items()})


if __name__ == "__main__":
    main()
