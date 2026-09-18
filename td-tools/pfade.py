# -*- coding: utf-8 -*-
"""Findet Pfade, die ein Skript beim Schreiben zerlegt hat.

Ein Windows-Pfad in einem Python-String ohne `r`-Präfix zerbricht still:

    "D:\\Workspace\\20-repos\\trustdonation"

wird zu `D:` plus Seitenvorschub plus `orkspace` plus Steuerzeichen 16 plus
`-repos` plus Tabulator plus `rustdonation`. Der Text steht danach falsch in
der Datei, und niemand sieht es, weil Steuerzeichen unsichtbar sind.

**Fünfmal passiert**, jedes Mal in Dateien, die jede Sitzung liest: CLAUDE.md,
MEMORY.md, stand_trustdonation.md. Die Regel dagegen steht in
`memory/feedback_pfade_in_skripten.md` und half allein nicht.

    python td-tools/pfade.py

Rückgabe 0, wenn alles heil ist. 1, wenn etwas zerbrochen ist.
"""
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

for strom in (sys.stdout, sys.stderr):
    try:
        strom.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Was in Fließtext nichts zu suchen hat. Jedes davon entsteht aus einem
# Backslash plus Buchstabe in einem Python-String.
STEUERZEICHEN = {
    "\x07": "Klingel, aus \\a",
    "\x08": "Rückschritt, aus \\b",
    "\x09": "Tabulator, aus \\t",
    "\x0b": "Vertikaltabulator, aus \\v",
    "\x0c": "Seitenvorschub, aus \\f",
    "\x00": "Null, aus \\0",
    "\x10": "Steuerzeichen 16, aus \\20",
    "\x01": "Steuerzeichen 1",
    "\x02": "Steuerzeichen 2",
    "\x1b": "Escape, aus \\e",
}

# Wo geprüft wird. Markdown und JSON: Beides liest ein Mensch.
BEREICHE = ["docs", "td-tools", "packages/td-core/daten", "AGENTS.md"]
ENDUNGEN = {".md", ".json"}

# Ein Tabulator steht in einer Tabelle manchmal zu Recht. In diesen Dateien
# nie: Markdown-Tabellen trennen mit `|`, JSON kennt Einrückung mit Leerzeichen.
ERLAUBT_TABULATOR = set()


def dateien():
    for ziel in BEREICHE:
        p = REPO / ziel
        if p.is_file():
            yield p
        elif p.is_dir():
            for d in sorted(p.rglob("*")):
                if (d.is_file() and d.suffix in ENDUNGEN
                        and "node_modules" not in d.parts and "dist" not in d.parts):
                    yield d


def main():
    funde = []
    geprueft = 0

    for d in dateien():
        try:
            text = d.read_text(encoding="utf-8")
        except Exception:
            continue
        geprueft += 1
        pfad = d.relative_to(REPO).as_posix()
        for nr, zeile in enumerate(text.split("\n"), 1):
            for zeichen, herkunft in STEUERZEICHEN.items():
                if zeichen == "\x09" and pfad in ERLAUBT_TABULATOR:
                    continue
                if zeichen in zeile:
                    stelle = zeile.index(zeichen)
                    umfeld = zeile[max(0, stelle - 30):stelle + 30].replace(zeichen, "◆")
                    funde.append((pfad, nr, herkunft, umfeld))

    if funde:
        print(f"{len(funde)} zerbrochene Stellen in {geprueft} Dateien:")
        print()
        for pfad, nr, herkunft, umfeld in funde:
            print(f"  {pfad}:{nr}   {herkunft}")
            print(f"     …{umfeld}…")
        print()
        print("Das ◆ markiert das unsichtbare Zeichen.")
        print("Ursache: ein Windows-Pfad in einem Python-String ohne r-Präfix.")
        print("Beim Richten Schrägstriche schreiben, oder das Write-Werkzeug nehmen.")
        return 1

    print(f"{geprueft} Dateien geprüft, alle Pfade heil.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
