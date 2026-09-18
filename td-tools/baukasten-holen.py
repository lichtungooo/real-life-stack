# -*- coding: utf-8 -*-
"""Holt den Baukasten aus dem Instanz-Repo in `packages/td-core`.

Der Baukasten wird im Instanz-Repo `lichtungooo/trustdonation` gepflegt: Dort
gehört er hin, weil er fachlich ist und weil ihn jemand ohne Bauwerkzeug
ändern können soll.

Die App braucht ihn trotzdem, als eine Datei, die sich importieren lässt.
Dieses Werkzeug führt die acht Schichten zu `packages/td-core/daten/baukasten.json`
zusammen. Es kopiert nicht bloß, es reduziert: Was eine Fläche nicht braucht
(die Namen der CSS-Variablen, die Belegstellen, die $-Abschnitte), bleibt
draußen.

    python td-tools/baukasten-holen.py

Die Zieldatei wird **erzeugt**, nicht gepflegt. Die Quelle liegt drüben.
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
INSTANZ = REPO.parent / "trustdonation"
QUELLE = INSTANZ / "baukasten"
ZIEL = REPO / "packages" / "td-core" / "daten" / "baukasten.json"

for strom in (sys.stdout, sys.stderr):
    try:
        strom.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Welche Schicht aus welchen Dateien kommt. Die Reihenfolge ist die der
# Fläche: Module zuerst, weil sie als einzige heute wirklich etwas ändern.
SCHICHTEN = [
    ("module", "Module", "Die Flächen dieses Space. Ein Klick nimmt eine dazu oder weg.",
     [("module/module.json", "module")]),
    ("arten", "Arten", "Was ein Eintrag sein kann. Eine Art bindet Felder und gibt die Farbe.",
     [("arten/arten.json", "arten")]),
    ("vorlagen", "Vorlagen", "Ganze Auftritte, aus den Schichten darunter zusammengesetzt.",
     [("vorlagen/vorlagen.json", "vorlagen")]),
    ("muster", "Muster", "Zusammengesetzte Bauteile mit einer Absicht.",
     [("muster/muster.json", "muster")]),
    ("bauteile", "Bauteile", "Die einzelnen Stücke. Je Welt eine Ausprägung, ein Aussehen.",
     [("bauteile/bauteile.json", "bauteile")]),
    ("felder", "Felder", "Die kleinste Einheit, die ein Mensch ausfüllt.",
     [("felder/felder.json", "felder")]),
    ("rohstoffe", "Rohstoffe", "Farbe, Schrift, Maß. Was in allen drei Welten gleich ist.",
     [("rohstoffe/farben.json", "farben"),
      ("rohstoffe/schriften.json", "schriften"),
      ("rohstoffe/masse.json", "masse")]),
    ("sprache", "Sprache", "Die Worte. Regeln, Werkzeuge und Textbausteine.",
     [("sprache/sprache.json", "regeln"), ("sprache/sprache.json", "texte")]),
]


def main():
    if not QUELLE.is_dir():
        print(f"Der Baukasten liegt nicht unter {QUELLE}.")
        print("Erwartet wird das Instanz-Repo als Nachbarordner von diesem hier.")
        return 1

    schichten = []
    gesamt = 0
    for kennung, titel, zweck, quellen in SCHICHTEN:
        stuecke = []
        fehlt = []
        gesehen = set()
        for pfad, schluessel in quellen:
            daten = json.loads((QUELLE / pfad).read_text(encoding="utf-8"))
            for e in daten.get(schluessel, []):
                eintrag = {
                    "id": e.get("id", ""),
                    "name": e.get("name") or e.get("id", ""),
                    "zweck": e.get("zweck", ""),
                }
                # Nur mitnehmen, was die Fläche zeigt. Die Namen der
                # CSS-Variablen und die Belegstellen bleiben in der Quelle.
                for feld, ziel in (("wert", "wert"), ("regel", "regel"), ("absicht", "regel")):
                    wert = e.get(feld)
                    if wert and ziel not in eintrag:
                        eintrag[ziel] = wert
                herkunft = (e.get("herkunft") or {}).get("name")
                if herkunft:
                    eintrag["herkunft"] = herkunft
                stuecke.append(eintrag)
            if pfad not in gesehen:
                for f in daten.get("$fehlt", []):
                    fehlt.append({
                        "id": f.get("id", ""),
                        "name": f.get("name") or f.get("id", ""),
                        "warum": f.get("warum", ""),
                    })
                gesehen.add(pfad)

        gesamt += len(stuecke)
        schichten.append({
            "id": kennung, "titel": titel, "zweck": zweck,
            "stuecke": stuecke, "fehlt": fehlt,
        })

    ZIEL.write_text(
        json.dumps({
            "$erzeugt": "td-tools/baukasten-holen.py aus lichtungooo/trustdonation",
            "anzahl": gesamt,
            "schichten": schichten,
        }, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8", newline="\n",
    )
    kb = ZIEL.stat().st_size // 1024
    print(f"{ZIEL.relative_to(REPO).as_posix()}: {gesamt} Bausteine in "
          f"{len(schichten)} Schichten, {kb} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
