# -*- coding: utf-8 -*-
"""Sagt, was sich bei Anton getan hat und was das fuer uns heisst.

Holt seinen Stand, vergleicht ihn mit unserem, und beantwortet vier Fragen:

1. Was hat er geaendert, und was davon trifft unsere Naehte?
2. Hat er neue Erweiterungspunkte gebaut, die eine Naht aufloesen koennten?
3. Was hat er veroeffentlicht (Tags, Versionen, Abhaengigkeiten)?
4. Sollen wir jetzt aktualisieren, und was kostet es?

Schreibt einen Bericht nach td-tools/berichte/ und eine Kurzfassung auf die
Konsole. Aendert nichts am Arbeitsstand: es wird nur gelesen.

Aufruf:
    python td-tools/anton-stand.py                  # holen und berichten
    python td-tools/anton-stand.py --ohne-fetch
    python td-tools/anton-stand.py --basis <sha>    # gegen einen anderen Stand
"""
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BERICHTE = REPO / "td-tools" / "berichte"
UNSER_BRANCH = "trustdonation"
SEIN_BRANCH = "origin/master"

# Commits, die an diesen Stellen arbeiten, koennen Naehte aufloesen: Anton baut
# dort seine Register. Findet sich eines davon in einem neuen Commit, lohnt der
# genaue Blick, bevor wir weiter an einer Naht festhalten.
HAKEN_DATEIEN = [
    "packages/toolkit/src/lib/module-register.ts",
    "packages/data-interface/src/type-manifest.ts",
    "packages/toolkit/src/components/preview/type-presentation.tsx",
    "packages/toolkit/src/lib/runtime-config.ts",
    "packages/toolkit/src/lib/icons.ts",
]
HAKEN_WORTE = re.compile(
    r"compose[A-Z]\w+|set[A-Z]\w*Registry|[A-Z]\w*Layer\b|[A-Z]\w*Fragment\b|registerIcon",
)


# Dateien, die Antons Release-Werkzeug selbst pflegt. Eine Aenderung darin ist
# nie eine Naht: sie entsteht beim Veroeffentlichen, nicht durch uns. Ohne
# diesen Filter meldet der Bericht zwei Dutzend Stellen, die niemanden
# beschaeftigen, und die echten gehen darin unter.
RAUSCHEN = re.compile(
    r"(^|/)(CHANGELOG\.md|package\.json|pnpm-lock\.yaml|version\.properties)$"
    r"|^\.release-please-manifest\.json$"
    r"|^\.github/workflows/"
)


def git(*args, leise=False):
    r = subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0 and not leise:
        print("git " + " ".join(args) + " scheiterte:\n" + (r.stderr or "").strip(), file=sys.stderr)
    return (r.stdout or "").strip()


def zeilen(text):
    return [z for z in text.splitlines() if z.strip()]


# --------------------------------------------------------------- Einsammeln

def basis():
    """Der Commit, auf dem unser Branch aufsetzt.

    `--basis <sha>` sticht ihn: so laesst sich ein Bericht auch gegen einen
    aelteren Stand ziehen, etwa um einen vergangenen Sprung nachzulesen.
    """
    if "--basis" in sys.argv:
        i = sys.argv.index("--basis")
        if i + 1 < len(sys.argv):
            return git("rev-parse", sys.argv[i + 1])
    return git("merge-base", "HEAD", SEIN_BRANCH)


def seine_commits(von):
    roh = git("log", "--format=%H\t%ad\t%an\t%s", "--date=short", von + ".." + SEIN_BRANCH)
    out = []
    for z in zeilen(roh):
        teile = z.split("\t", 3)
        if len(teile) == 4:
            out.append({"sha": teile[0], "datum": teile[1], "wer": teile[2], "titel": teile[3]})
    return out


def seine_dateien(von):
    return set(zeilen(git("diff", "--name-only", von + ".." + SEIN_BRANCH)))


def unsere_naehte(von):
    """Dateien, die schon bei ihm existierten und die wir geaendert haben."""
    geaendert = set(zeilen(git("diff", "--name-only", von + "..HEAD")))
    naehte = {}
    for d in sorted(geaendert):
        if RAUSCHEN.search(d):
            continue
        # Existiert die Datei in seinem Stand? Dann ist unsere Aenderung eine Naht.
        if git("cat-file", "-e", von + ":" + d, leise=True) == "" and subprocess.run(
            ["git", "-C", str(REPO), "cat-file", "-e", von + ":" + d],
            capture_output=True).returncode == 0:
            zahlen = git("diff", "--numstat", von + "..HEAD", "--", d)
            plus, minus = 0, 0
            if zahlen:
                t = zahlen.split("\t")
                plus = int(t[0]) if t[0].isdigit() else 0
                minus = int(t[1]) if t[1].isdigit() else 0
            naehte[d] = (plus, minus)
    return naehte


def eingetragene_naehte():
    """Welche Dateien stehen in docs/NAEHTE.md?

    Das Register ist die Wahrheit darueber, was wir bewusst beruehren. Was
    gemessen wird und dort fehlt, ist eine unbenannte Naht: laut Architektur
    Teil 4 ein Fehler, und genau den soll dieser Bericht sichtbar machen.
    """
    datei = REPO / "docs" / "NAEHTE.md"
    if not datei.exists():
        return None
    text = datei.read_text(encoding="utf-8")
    # Pfade stehen dort in Codezeichen: `packages/toolkit/src/...`, `AGENTS.md`,
    # `deploy/app/.env.example`. Statt Endungen zu raten wird jeder Fund gegen
    # den Arbeitsbaum geprueft: was es wirklich gibt, zaehlt als eingetragen.
    # Eine Endungsliste hat genau hier zwei Eintraege uebersehen.
    roh = re.findall(r"`([A-Za-z0-9_][A-Za-z0-9_./-]*\.[A-Za-z0-9_.-]+)`", text)
    return {r for r in roh if (REPO / r).exists()}


def neue_tags(von):
    """Tags, die auf Commits seit unserem Abzweig zeigen."""
    alle = zeilen(git("tag", "--sort=-creatordate"))
    drin = set(zeilen(git("log", "--format=%H", von + ".." + SEIN_BRANCH)))
    out = []
    for t in alle:
        sha = git("rev-list", "-n", "1", t, leise=True)
        if sha in drin:
            out.append((t, git("log", "-1", "--format=%ad", "--date=short", t, leise=True)))
    return out


def paket_versionen(rev):
    """name -> version aus allen package.json eines Standes."""
    out = {}
    for pfad in zeilen(git("ls-tree", "-r", "--name-only", rev)):
        if not pfad.endswith("package.json") or "node_modules" in pfad:
            continue
        roh = git("show", rev + ":" + pfad, leise=True)
        try:
            p = json.loads(roh)
        except Exception:
            continue
        if p.get("name"):
            out[p["name"]] = {"version": p.get("version"), "pfad": pfad,
                              "deps": {**p.get("dependencies", {}), **p.get("devDependencies", {})}}
    return out


def haken_hinweise(von, commits, seine):
    """Commits, die an Antons Erweiterungspunkten arbeiten."""
    treffer = []
    beruehrt = [d for d in HAKEN_DATEIEN if d in seine]
    for c in commits:
        dateien = set(zeilen(git("show", "--name-only", "--format=", c["sha"], leise=True)))
        an_haken = sorted(dateien & set(HAKEN_DATEIEN))
        wort = HAKEN_WORTE.search(c["titel"])
        if an_haken or wort:
            treffer.append({"commit": c, "dateien": an_haken,
                            "wort": wort.group(0) if wort else None})
    return treffer, beruehrt


# ----------------------------------------------------------------- Bericht

def bericht(von, commits, seine, naehte, tags, vor, nach, haken, haken_dateien):
    kollision = sorted(seine & set(naehte))
    ruhig = sorted(set(naehte) - seine)

    neue_pakete = sorted(set(nach) - set(vor))
    versionssprung = [(n, vor[n]["version"], nach[n]["version"])
                      for n in sorted(set(vor) & set(nach))
                      if vor[n]["version"] != nach[n]["version"]]
    neue_deps = []
    for n in sorted(set(vor) & set(nach)):
        dazu = sorted(set(nach[n]["deps"]) - set(vor[n]["deps"]))
        if dazu:
            neue_deps.append((n, dazu))

    z = []
    A = z.append
    A("# Antons Stand")
    A("")
    A("**Erstellt:** " + date.today().isoformat() + "  ")
    A("**Unser Branch:** `" + UNSER_BRANCH + "`  ")
    A("**Gemeinsame Basis:** `" + von[:8] + "`  ")
    A("**Sein Stand:** `" + (git("rev-parse", SEIN_BRANCH)[:8] or "?") + "`")
    A("")

    if not commits:
        A("## Nichts Neues")
        A("")
        A("Antons `master` hat seit unserem Abzweig keine neuen Commits. Es gibt nichts einzuspielen.")
        A("")
        A("Unsere Naehte stehen bei **" + str(len(naehte)) + " Dateien**. Solange er nichts aendert, kosten sie nichts.")
        A("")
        # Gerade in der Ruhe lohnt der Abgleich: Aufraeumen kostet hier nichts
        # und spart beim naechsten Sprung die Ueberraschung.
        eingetragen = eingetragene_naehte()
        if eingetragen is not None:
            unbenannt = sorted(set(naehte) - eingetragen)
            A("## Abgleich mit dem Register")
            A("")
            if unbenannt:
                A("**" + str(len(unbenannt)) + " Dateien aendern wir, ohne dass sie in `docs/NAEHTE.md` stehen.**")
                A("")
                A("Laut Architektur Teil 4 ist eine unbenannte Naht ein Fehler. Jetzt ist der guenstigste Moment:")
                A("")
                for d in unbenannt:
                    p_, m_ = naehte[d]
                    A("- `" + d + "` (+" + str(p_) + " / -" + str(m_) + ")")
            else:
                A("Alle " + str(len(naehte)) + " gemessenen Naehte stehen im Register. Sauber.")
        return "\n".join(z), 0

    # --- Urteil zuerst
    A("## Urteil")
    A("")
    if kollision:
        A("**" + str(len(commits)) + " neue Commits, davon treffen welche " + str(len(kollision)) + " unserer Naehte.**")
        A("")
        A("Das Einspielen gibt Konflikte an diesen Stellen. Sie sind erwartbar und in `docs/NAEHTE.md` beschrieben.")
    else:
        A("**" + str(len(commits)) + " neue Commits, keiner trifft eine unserer Naehte.**")
        A("")
        A("Das Einspielen sollte ohne Konflikt durchlaufen. Die drei Tore gelten trotzdem.")
    if haken:
        A("")
        A("**" + str(len(haken)) + " Commits arbeiten an Erweiterungspunkten.** Vor dem Einspielen pruefen, ob eine Naht dadurch wegfallen kann.")
    A("")

    # --- Was er getan hat
    A("## Was er getan hat")
    A("")
    A("| Datum | Commit | Titel |")
    A("|---|---|---|")
    for c in commits[:40]:
        A("| " + c["datum"] + " | `" + c["sha"][:8] + "` | " + c["titel"].replace("|", "\\|") + " |")
    if len(commits) > 40:
        A("")
        A("*(" + str(len(commits) - 40) + " weitere)*")
    A("")

    # --- Kollisionen
    A("## Was unsere Naehte trifft")
    A("")
    if kollision:
        A("| Datei | unser Umfang | seine Commits |")
        A("|---|---|---|")
        for d in kollision:
            p, m = naehte[d]
            anzahl = len(zeilen(git("log", "--format=%H", von + ".." + SEIN_BRANCH, "--", d)))
            A("| `" + d + "` | +" + str(p) + " / -" + str(m) + " | " + str(anzahl) + " |")
        A("")
        A("Fuer jede dieser Dateien vor dem Zusammenfuehren fragen: **Gibt es dafuer inzwischen einen Haken?**")
    else:
        A("Keine. Unsere " + str(len(naehte)) + " Naehte liegen alle in Dateien, die er nicht angefasst hat.")
    A("")
    eingetragen = eingetragene_naehte()
    if eingetragen is not None:
        unbenannt = sorted(set(naehte) - eingetragen)
        A("### Abgleich mit dem Register")
        A("")
        if unbenannt:
            A("**" + str(len(unbenannt)) + " Dateien aendern wir, ohne dass sie in `docs/NAEHTE.md` stehen.**")
            A("")
            A("Laut Architektur Teil 4 ist eine unbenannte Naht ein Fehler. Eintragen, bevor das Update laeuft:")
            A("")
            for d in unbenannt:
                p_, m_ = naehte[d]
                A("- `" + d + "` (+" + str(p_) + " / -" + str(m_) + ")")
        else:
            A("Alle " + str(len(naehte)) + " gemessenen Naehte stehen im Register. Sauber.")
        A("")

    if ruhig:
        A("*Ruhige Naehte (" + str(len(ruhig)) + "): " + ", ".join("`" + d + "`" for d in ruhig[:12]) +
          (" und weitere" if len(ruhig) > 12 else "") + "*")
        A("")

    # --- Haken
    A("## Neue Erweiterungspunkte")
    A("")
    if haken:
        A("Commits, die an Antons Registern arbeiten oder deren Titel nach einem Haken klingt:")
        A("")
        A("| Commit | Titel | Stelle |")
        A("|---|---|---|")
        for h in haken:
            stelle = ", ".join("`" + d + "`" for d in h["dateien"]) or ("Wort: `" + str(h["wort"]) + "`")
            A("| `" + h["commit"]["sha"][:8] + "` | " + h["commit"]["titel"].replace("|", "\\|") + " | " + stelle + " |")
        A("")
        A("**Was das heisst:** Baut er dort eine Schicht, kann eine unserer Naehte zu einer Erweiterung werden. Das ist der billigste Moment, sie loszuwerden.")
    else:
        A("Keine. An den bekannten Erweiterungspunkten hat er nichts geaendert.")
    A("")
    if haken_dateien:
        A("*Beruehrte Haken-Dateien: " + ", ".join("`" + d + "`" for d in haken_dateien) + "*")
        A("")

    # --- Spec
    spec = sorted(d for d in seine if d.startswith("docs/spec/"))
    A("## Was sich an der Spec geaendert hat")
    A("")
    if spec:
        A("**Die Spec gewinnt.** Diese Dateien vor dem Einspielen lesen und `docs/DEFINITION.md` danach pruefen:")
        A("")
        for d in spec:
            A("- `" + d + "`")
    else:
        A("Nichts.")
    A("")

    # --- Releases
    A("## Was er veroeffentlicht hat")
    A("")
    if tags:
        A("| Tag | Datum |")
        A("|---|---|")
        for t, d in tags:
            A("| `" + t + "` | " + (d or "") + " |")
    else:
        A("Keine neuen Tags.")
    A("")
    if versionssprung:
        A("**Versionssprünge:**")
        A("")
        A("| Paket | vorher | nachher |")
        A("|---|---|---|")
        for n, a, b in versionssprung:
            A("| `" + n + "` | " + str(a) + " | " + str(b) + " |")
        A("")
    if neue_pakete:
        A("**Neue Pakete:** " + ", ".join("`" + n + "`" for n in neue_pakete))
        A("")
    if neue_deps:
        A("**Neue Abhaengigkeiten** (`pnpm install` noetig):")
        A("")
        for n, dazu in neue_deps:
            A("- `" + n + "`: " + ", ".join("`" + d + "`" for d in dazu))
        A("")

    # --- Naechster Schritt
    A("## Naechster Schritt")
    A("")
    A("Skill `td-update`. Die Reihenfolge dort ist bindend, besonders die drei Tore.")
    A("")
    if neue_deps:
        A("- `pnpm install` vor dem ersten Bau, er hat Abhaengigkeiten geaendert.")
    if kollision:
        A("- Konflikte erwartet in: " + ", ".join("`" + d + "`" for d in kollision) + ".")
    if haken:
        A("- Vorher pruefen, ob ein neuer Haken eine Naht aufloest.")
    if spec:
        A("- Danach `docs/DEFINITION.md` gegen die geaenderte Spec lesen.")
    A("- Nach dem Einspielen `docs/NAEHTE.md` neu messen und `memory/stand_trustdonation.md` nachziehen.")

    return "\n".join(z), len(commits)


def main():
    if "--ohne-fetch" not in sys.argv:
        print("Hole Antons Stand ...")
        git("fetch", "origin", "master", "--tags")

    von = basis()
    if not von:
        print("Keine gemeinsame Basis mit " + SEIN_BRANCH + " gefunden.", file=sys.stderr)
        return 2

    commits = seine_commits(von)
    seine = seine_dateien(von)
    naehte = unsere_naehte(von)
    tags = neue_tags(von)
    haken, haken_dateien = haken_hinweise(von, commits, seine)
    vor = paket_versionen(von)
    nach = paket_versionen(SEIN_BRANCH) if commits else vor

    text, anzahl = bericht(von, commits, seine, naehte, tags, vor, nach, haken, haken_dateien)

    BERICHTE.mkdir(parents=True, exist_ok=True)
    ziel = BERICHTE / ("anton-" + date.today().isoformat() + ".md")
    ziel.write_text(text + "\n", encoding="utf-8", newline="\n")

    kollision = sorted(seine & set(naehte))
    print()
    print("Basis        " + von[:8])
    print("Sein Stand   " + git("rev-parse", SEIN_BRANCH)[:8])
    print("Neu bei ihm  " + str(anzahl) + " Commits")
    print("Unsere Naehte " + str(len(naehte)) + " Dateien")
    print("Kollisionen  " + str(len(kollision)) + (": " + ", ".join(kollision) if kollision else ""))
    eingetragen = eingetragene_naehte()
    if eingetragen is not None:
        unbenannt = sorted(set(naehte) - eingetragen)
        print("Unbenannt    " + str(len(unbenannt)) + (" <- eintragen!" if unbenannt else ""))
    print("Neue Haken   " + str(len(haken)))
    print("Neue Tags    " + str(len(tags)))
    print()
    print("Bericht: " + str(ziel.relative_to(REPO)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
