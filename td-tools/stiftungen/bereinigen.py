"""Bereinigt die Stiftungen nach Timos Entscheidungen (01.10.2026).

Liest bereinigen.json und setzt drei Dinge um, wiederholbar:
  zusammenlegen  Dubletten (dieselbe Stiftung unter leicht anderem Namen):
                 Es bleibt der Eintrag mit den meisten Angaben, unter dem
                 Titel aus der Liste; er uebernimmt, was die anderen mehr
                 wissen (Listen vereinigt, fehlende Felder ergaenzt).
  nachfolger     Aufgeloeste Stiftungen werden zu ihrer Nachfolgerin.
  entfernen      Was keine belegbare Stiftung ist, kommt heraus.

Geaendert werden packages/td-core/daten/items.json und group-items.json
(keine verwaiste Id) sowie anschriften.json (die Nachfolgerin bekommt ihre
Anschrift). Danach orte-setzen.py laufen lassen.

Aufruf (aus dem Repo):  python td-tools/stiftungen/bereinigen.py
"""
import io
import json
from pathlib import Path

HIER = Path(__file__).resolve().parent
DATEN = HIER.parent.parent / "packages" / "td-core" / "daten"
ITEMS = DATEN / "items.json"
GRUPPEN = DATEN / "group-items.json"
ANSCHRIFTEN = HIER / "anschriften.json"


def lade(p):
    return json.load(io.open(p, encoding="utf-8"))


def schreibe(p, daten):
    roh = io.open(p, encoding="utf-8").read()
    io.open(p, "w", encoding="utf-8").write(json.dumps(daten, ensure_ascii=False, indent=2 if p != ANSCHRIFTEN else 1) + ("\n" if roh.endswith("\n") else ""))


def vereinigen(ziel: dict, quelle: dict):
    """Was `quelle` mehr weiss, kommt zu `ziel`. Listen vereinigt, Felder ergaenzt."""
    for k, v in quelle.items():
        if k not in ziel or ziel[k] in (None, "", []):
            ziel[k] = v
        elif isinstance(ziel[k], list) and isinstance(v, list):
            ziel[k] = ziel[k] + [x for x in v if x not in ziel[k]]


def main():
    plan = lade(HIER / "bereinigen.json")
    items = lade(ITEMS)
    gruppen = lade(GRUPPEN)
    anschriften = lade(ANSCHRIFTEN)
    je_id = {i["id"]: i for i in items}
    raus = set()
    bericht = {"zusammengelegt": 0, "entfernt": 0, "nachfolger": 0}

    def zusammen(ids, titel):
        da = [je_id[i] for i in ids if i in je_id and i not in raus]
        if not da:
            return None
        bleibt = max(da, key=lambda i: (len(i["data"]), -ids.index(i["id"])))
        for andere in da:
            if andere is bleibt:
                continue
            vereinigen(bleibt["data"], andere["data"])
            bleibt["tags"] = (bleibt.get("tags") or []) + [t for t in (andere.get("tags") or []) if t not in (bleibt.get("tags") or [])]
            raus.add(andere["id"])
            bericht["zusammengelegt"] += 1
        bleibt["data"]["title"] = titel
        return bleibt

    for g in plan["zusammenlegen"]:
        zusammen(g["ids"], g["titel"])

    for n in plan["nachfolger"]:
        bleibt = zusammen(n["ids"], n["titel"])
        if not bleibt:
            continue
        bericht["nachfolger"] += 1
        bleibt["data"]["website"] = n["website"]
        bleibt["data"]["nachfolgeVon"] = n["grund"]
        for a in anschriften:
            if a["id"] == bleibt["id"]:
                a.update({"name": n["titel"], "strasse": n["strasse"], "plz": n["plz"], "ort": n["ort"], "land": "DE",
                          "website": n["website"], "quelle": n["quelle"], "status": "anschrift"})

    for e in plan["entfernen"]:
        if e["id"] in je_id and e["id"] not in raus:
            raus.add(e["id"])
            bericht["entfernt"] += 1

    items = [i for i in items if i["id"] not in raus]
    gruppen = {g: [i for i in ids if i not in raus] for g, ids in gruppen.items()}
    schreibe(ITEMS, items)
    schreibe(GRUPPEN, gruppen)
    schreibe(ANSCHRIFTEN, anschriften)
    print(bericht, "Stiftungen jetzt:", sum(1 for i in items if i["id"].startswith("stiftung-")))


if __name__ == "__main__":
    main()
