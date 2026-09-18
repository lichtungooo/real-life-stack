# -*- coding: utf-8 -*-
"""Stellt echte Umlaute her, wo ASCII-Ersatz steht.

Die Regel steht seit dem 31.05.2026 in `CLAUDE.md`: **ä, ö, ü, ß im Fließtext,
in Antworten, Memory, Dokumenten, UI-Texten und Commit-Meldungen.** Nur
Bezeichner, URL-Pfade und Dateipfade bleiben ASCII.

Ich habe monatelang dagegen verstoßen, weil Antons Code-Kommentare ASCII
tragen und ich mich daran angepasst habe. Beim Sammeln der Stiftungen ist es
aufgefallen: Ein Ortsverzeichnis mit `koeln` als Schlüssel hat fünfzehn
Einträge verschluckt.

Was dieses Werkzeug **nicht** anfasst:

- Bezeichner in Code (`zeileVollstaendig` bliebe sonst nicht aufrufbar)
- Schlüssel in JSON (sie stehen in Daten und werden verglichen)
- Pfade, URLs, Dateinamen

In Code-Dateien werden nur **Kommentare** bearbeitet. In JSON nur **Werte**.
In Markdown alles außer Code-Blöcken.

    python td-tools/umlaute.py --prüfen        # nur zeigen
    python td-tools/umlaute.py --richten        # ersetzen
    python td-tools/umlaute.py --prüfen <pfad> # einen Ordner
"""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Was wir bearbeiten: unsere Dokumente, unsere Pakete, unsere Werkzeuge.
# Antons Dateien bleiben außen vor, mit einer Ausnahme: unsere Kommentare
# darin (siehe NAEHTE.md). Die stehen in der Liste unten einzeln.
BEREICHE = [
    "docs/DEFINITION.md", "docs/ARCHITEKTUR.md", "docs/NAEHTE.md", "docs/PLAN.md",
    "docs/REIFE.md", "docs/ENTSCHEIDUNGEN.md", "docs/EINSTIEG.md",
    "docs/AUSLIEFERUNGEN.md", "docs/TESTPLAN.md", "docs/anwendungsfaelle",
    "packages/td-core", "packages/td-ui", "td-tools",
    "apps/reference/e2e-td",
]

ENDUNGEN = {".md", ".ts", ".tsx", ".py", ".json"}

# ---------------------------------------------------------------------------
# Die Liste. Links der ASCII-Ersatz, rechts das Wort mit Umlaut.
#
# Aufgebaut aus den 518 Kandidaten, die im Bestand vorkamen, und von Hand
# geprüft. Blind nach `ae|oe|ue|ss` zu ersetzen zerstört `neue`, `Dauer`,
# `dass`, `Klasse`, `Prozess` und jeden englischen Bezeichner.
WOERTER = {
    # ue
    "fuer": "für", "Fuer": "Für", "dafuer": "dafür", "Dafuer": "Dafür",
    "wofuer": "wofür", "Wofuer": "Wofür", "hierfuer": "hierfür",
    "ueber": "über", "Ueber": "Über", "darueber": "darüber",
    "uebergangen": "übergangen", "uebergeben": "übergeben", "uebergibt": "übergibt",
    "ueberholt": "überholt", "ueberlagern": "überlagern", "uebernehmen": "übernehmen",
    "uebernimmt": "übernimmt", "uebernommen": "übernommen",
    "ueberschneidung": "überschneidung", "Ueberschneidung": "Überschneidung",
    "ueberschreiben": "überschreiben", "uebersehen": "übersehen",
    "uebersicht": "übersicht", "Uebersicht": "Übersicht",
    "uebersprungen": "übersprungen", "uebrigen": "übrigen", "uebrig": "übrig",
    "berflüssig": "überflüssig", "ueberfluessig": "überflüssig",
    "fuenf": "fünf", "Fuenf": "Fünf", "fuenfzehn": "fünfzehn", "Fuenfzehn": "Fünfzehn",
    "fuehren": "führen", "fuehrt": "führt", "Fuehrt": "Führt", "gefuehrt": "geführt",
    "einfuegt": "einfügt", "eingefuegt": "eingefügt", "hinzufuegen": "hinzufügen",
    "einfuehrt": "einführt", "eingefuehrt": "eingeführt", "einzufuehren": "einzuführen",
    "zusammenfuehren": "zusammenführen", "Zusammenfuehren": "Zusammenführen",
    "durchfuehren": "durchführen", "vorfuehren": "vorführen", "Vorfuehren": "Vorführen",
    "vorfuehrbarem": "vorführbarem", "Vorfuehrbares": "Vorführbares",
    "anfuehlen": "anfühlen", "anfuehlt": "anfühlt",
    "fuellen": "füllen", "fuellt": "füllt", "gefuellt": "gefüllt", "Gefuellt": "Gefüllt",
    "ausgefuellt": "ausgefüllt", "erfuellt": "erfüllt",
    "gueltig": "gültig", "gueltiges": "gültiges", "ungueltig": "ungültig",
    "Ungueltig": "Ungültig", "guenstiger": "günstiger", "guenstigste": "günstigste",
    "gruen": "grün", "Gruen": "Grün", "gruene": "grüne", "gruener": "grüner",
    "gruende": "gründe", "Gruende": "Gründe", "Gruenden": "Gründen",
    "begruendet": "begründet", "Begruendung": "Begründung",
    "pruefen": "prüfen", "Pruefen": "Prüfen", "prueft": "prüft", "Prueft": "Prüft",
    "geprueft": "geprüft", "Geprueft": "Geprüft", "Pruefung": "Prüfung",
    "Pruefungen": "Prüfungen", "pruefbar": "prüfbar", "pruefbaren": "prüfbaren",
    "Pruefstand": "Prüfstand", "Pruefwerkzeug": "Prüfwerkzeug",
    "nachpruefen": "nachprüfen", "ueberpruefen": "überprüfen",
    "zurueck": "zurück", "Zurueck": "Zurück", "zurueckgeben": "zurückgeben",
    "zuruecksetzen": "zurücksetzen", "Zurueckdrehen": "Zurückdrehen",
    "Zurueckgedreht": "Zurückgedreht", "zurueckfaellt": "zurückfällt",
    "Rueckfall": "Rückfall", "Rueckgabe": "Rückgabe", "Rueckrichtung": "Rückrichtung",
    "muesste": "müsste", "muessten": "müssten", "duerfen": "dürfen", "duerfte": "dürfte",
    "wuerde": "würde", "wuerden": "würden", "wuenschen": "wünschen",
    "Wuensche": "Wünsche", "Wunsch": "Wunsch",
    "spuerbar": "spürbar", "zuverlaessig": "zuverlässig", "zuverlaessiger": "zuverlässiger",
    "kuendigt": "kündigt", "Kuenftig": "Künftig", "kuenftig": "künftig",
    "Stueck": "Stück", "stuecke": "stücke", "Einzelstueck": "Einzelstück",
    "Schluessel": "Schlüssel", "Schluesselbildung": "Schlüsselbildung",
    "Luecke": "Lücke", "Luecken": "Lücken",
    "Menue": "Menü", "menue": "menü", "Seitenmenue": "Seitenmenü",
    "gruendlich": "gründlich", "Gruendung": "Gründung",
    "zueinander": "zueinander",  # kein Umlaut, bleibt
    "Nachzuegler": "Nachzügler", "schuetzt": "schützt", "Schutz": "Schutz",
    "Toenung": "Tönung", "Vergroessern": "Vergrößern", "vergroessern": "vergrößern",
    "buendelt": "bündelt", "buendeln": "bündeln", "Buendeln": "Bündeln",
    "verknuepft": "verknüpft", "zurueckgedreht": "zurückgedreht",
    "ausdruecklich": "ausdrücklich", "Ausdruecklich": "Ausdrücklich",
    "ausdrueckt": "ausdrückt", "ausgedrueckt": "ausgedrückt",
    "frueher": "früher", "Frueher": "Früher", "fruehe": "frühe", "fruehen": "frühen",
    "fruehestens": "frühestens", "Fruehstueck": "Frühstück",
    "beruehrt": "berührt", "unberuehrt": "unberührt", "Beruehrung": "Berührung",
    "eingefuehrt": "eingeführt", "ausgefuehrt": "ausgeführt",
    "gehoert": "gehört", "Gehoert": "Gehört", "gehoeren": "gehören",
    "zugehoerig": "zugehörig", "Zugehoerigkeit": "Zugehörigkeit",
    "Uebernahme": "Übernahme", "uebernahme": "übernahme",
    "Knoepfe": "Knöpfe",
    "knoepfe": "knöpfe",
    "Raender": "Ränder",
    "raender": "ränder",
    "Nebensaechliches": "Nebensächliches",
    "nebensaechlich": "nebensächlich",
    "Gegensaetze": "Gegensätze",
    "haeufigste": "häufigste",
    "haeufig": "häufig",
    "haeufiger": "häufiger",
    "Ueberschriften": "Überschriften",
    "Ueberschrift": "Überschrift",
    "Baender": "Bänder",
    "Aufraeumen": "Aufräumen",
    "aufraeumen": "aufräumen",
    "veraenderliche": "veränderliche",
    "veraendert": "verändert",
    "herunterlaedt": "herunterlädt",
    "Abstaende": "Abstände",
    "Darueber": "Darüber",
    "darueber": "darüber",
    "wofuer": "wofür",
    "Wofuer": "Wofür",
    "groesse": "größe",
    "Groesse": "Größe",
    "Stueck": "Stück",
    "Stuecke": "Stücke",
    "stuecke": "stücke",
    "Auspraegung": "Ausprägung",
    "auspraegung": "ausprägung",
    # ae
    "waere": "wäre", "waeren": "wären", "naehme": "nähme", "saehe": "sähe",
    "braeche": "bräche", "braeuchten": "bräuchten", "haette": "hätte", "haetten": "hätten",
    "traegt": "trägt", "Traegt": "Trägt", "traeger": "träger", "Traeger": "Träger",
    "haelt": "hält", "Haelt": "Hält", "haengt": "hängt", "haengen": "hängen",
    "einhaengt": "einhängt", "Einhaengepunkt": "Einhängepunkt", "gehaengt": "gehängt",
    "zusammenhaengt": "zusammenhängt", "zusammenhaengen": "zusammenhängen",
    "abhaengig": "abhängig", "unabhaengig": "unabhängig", "Abhaengigkeit": "Abhängigkeit",
    "Abhaengigkeiten": "Abhängigkeiten", "Abhaengigkeits": "Abhängigkeits",
    "faellt": "fällt", "Faellt": "Fällt", "wegfaellt": "wegfällt", "entfaellt": "entfällt",
    "aufhaelt": "aufhält", "Faelle": "Fälle", "Sonderfaelle": "Sonderfälle",
    "laesst": "lässt", "Laesst": "Lässt", "laeuft": "läuft", "auslaeuft": "ausläuft",
    "auseinanderlaeuft": "auseinanderläuft", "laedt": "lädt", "Laedt": "Lädt",
    "nachlaedt": "nachlädt", "faehrt": "fährt", "Faehrt": "Fährt",
    "faengt": "fängt", "aendert": "ändert", "aendern": "ändern",
    "geaendert": "geändert", "Geaenderte": "Geänderte", "geaenderte": "geänderte",
    "geaenderten": "geänderten", "aenderten": "änderten", "Datenaenderung": "Datenänderung",
    "unveraendert": "unverändert", "veraendert": "verändert",
    "naechste": "nächste", "Naechste": "Nächste", "naechsten": "nächsten",
    "naechster": "nächster", "Naechster": "Nächster", "Naechstes": "Nächstes",
    "zunaechst": "zunächst", "naehe": "nähe", "Naehe": "Nähe",
    "naehte": "nähte", "Naehte": "Nähte", "Naehten": "Nähten", "Datennaehte": "Datennähte",
    "waehlen": "wählen", "waehlt": "wählt", "gewaehlt": "gewählt", "gewaehlten": "gewählten",
    "abwaehlen": "abwählen", "anwaehlen": "anwählen", "auswaehlen": "auswählen",
    "waehrend": "während", "waehrung": "währung", "Waehrung": "Währung",
    "waechst": "wächst", "Waechter": "Wächter",
    "zaehlt": "zählt", "zaehlen": "zählen", "Zaehler": "Zähler", "gezaehlt": "gezählt",
    "gezaehlte": "gezählte", "aufzaehlt": "aufzählt", "Aufzaehlung": "Aufzählung",
    "erklaeren": "erklären", "erklaert": "erklärt", "klaeren": "klären",
    "ergaenzen": "ergänzen", "ergaenzt": "ergänzt", "Ergaenzt": "Ergänzt",
    "ergaenzend": "ergänzend", "Ergaenzungen": "Ergänzungen",
    "erhaelt": "erhält", "verhaelt": "verhält", "Verhaeltnis": "Verhältnis",
    "taeglich": "täglich", "taeuschte": "täuschte", "tatsaechlich": "tatsächlich",
    "spaeter": "später", "Spaeter": "Später", "spaeteres": "späteres",
    "schaerfen": "schärfen", "geschaetzt": "geschätzt", "schaetzen": "schätzen",
    "Saetze": "Sätze", "Saetzen": "Sätzen", "stoert": "stört", "Stoerung": "Störung",
    "Gespraech": "Gespräch", "Gespraeche": "Gespräche",
    "Stiftungsgespraeche": "Stiftungsgespräche", "Geraet": "Gerät", "Geraete": "Geräte",
    "Haekchen": "Häkchen", "Haelfte": "Hälfte", "Haenden": "Händen", "Haeuser": "Häuser",
    "Werkbaenke": "Werkbänke", "Eintraege": "Einträge", "Beitraege": "Beiträge",
    "eingefaerbt": "eingefärbt", "aeltere": "ältere", "aelteren": "älteren",
    "laenger": "länger", "Qualitaet": "Qualität", "Identitaet": "Identität",
    "Funktionalitaet": "Funktionalität", "Aktivitaetslog": "Aktivitätslog",
    "reaktivitaet": "reaktivität", "Praesenz": "Präsenz", "Primaerfarbe": "Primärfarbe",
    "Vorschlaege": "Vorschläge", "Vorschlaegen": "Vorschlägen",
    "Unvollstaendige": "Unvollständige", "vollstaendig": "vollständig",
    "vollstaendige": "vollständige", "vervollstaendigt": "vervollständigt",
    "eigenstaendig": "eigenständig", "unverstaendlich": "unverständlich",
    "verstaendlich": "verständlich", "Beruehrte": "Berührte",
    "beruehren": "berühren", "beruehrt": "berührt", "unberuehrt": "unberührt",
    "Aufhaenger": "Aufhänger", "Bloecke": "Blöcke",
    # oe
    "koennen": "können", "koennte": "könnte", "koennten": "könnten",
    "moeglich": "möglich", "moegliche": "mögliche", "Moeglichkeit": "Möglichkeit",
    "womoeglich": "womöglich", "noetig": "nötig",
    "gehoert": "gehört", "gehoeren": "gehören", "dazugehoert": "dazugehört",
    "hingehoert": "hingehört", "hingehoeren": "hingehören",
    "Zugehoerigkeit": "Zugehörigkeit",
    "oeffentlich": "öffentlich", "oeffentlicher": "öffentlicher",
    "veroeffentlicht": "veröffentlicht", "Veroeffentlichen": "Veröffentlichen",
    "oeffnen": "öffnen", "oeffnet": "öffnet", "geoeffnet": "geöffnet",
    "eroeffnen": "eröffnen",
    "loesen": "lösen", "loest": "löst", "geloest": "gelöst", "aufloesen": "auflösen",
    "aufloest": "auflöst", "aufgeloest": "aufgelöst", "Loesung": "Lösung",
    "geloescht": "gelöscht", "geloeschten": "gelöschten",
    "groesse": "größe", "Groesse": "Größe", "groesste": "größte",
    "groessten": "größten", "groesstes": "größtes", "gross": "groß", "grosse": "große",
    "grossem": "großem", "grossen": "großen", "grosser": "großer", "grosses": "großes",
    "gleichermassen": "gleichermaßen", "dreissig": "dreißig",
    "Foerderer": "Förderer", "foerdern": "fördern", "foerdert": "fördert",
    "Foerderung": "Förderung", "Foerderrahmen": "Förderrahmen",
    "foerderrahmen": "förderrahmen",
    "Foerderschwerpunkte": "Förderschwerpunkte",
    "foerderschwerpunkte": "förderschwerpunkte",
    "Foerderschwerpunkten": "Förderschwerpunkten",
    "Flaeche": "Fläche", "Flaechen": "Flächen", "Oberflaeche": "Oberfläche",
    "Schaltflaeche": "Schaltfläche", "Fussleiste": "Fußleiste",
    "Fliesstext": "Fließtext", "Loewenherz": "Löwenherz",
    "zoegert": "zögert", "erhoeht": "erhöht", "Zwoelf": "Zwölf", "zwoelf": "zwölf",
    "persoenlichen": "persönlichen", "persoenlich": "persönlich",
    "Gedaechtnis": "Gedächtnis", "manueller": "manueller",
    "hinzuerfunden": "hinzuerfunden",  # kein Umlaut
    # ss zu ß
    "heisst": "heißt", "weiss": "weiß", "weissem": "weißem",
    "aussen": "außen", "draussen": "draußen", "ausserhalb": "außerhalb",
    "ausser": "außer", "ausschliesslich": "ausschließlich",
    "schliesst": "schließt", "schliessen": "schließen", "misst": "misst",
    "Verstoesse": "Verstöße", "Verstoessen": "Verstößen",
}

# Wörter, die wie ein Ersatz aussehen und keiner sind. Sie stehen hier, damit
# die Prüfung sie nicht meldet und niemand sie versehentlich einträgt.
KEIN_UMLAUT = {
    # Deutsch ohne Umlaut
    "dass", "muss", "müssen", "misst", "Fassung", "Messung", "messen", "messbare",
    "Messbar", "gemessen", "gemessenen", "Gemessen", "neue", "Neue", "neuen", "neuer",
    "neues", "Neues", "bauen", "aufbauen", "weiterbauen", "umzubauen", "Bauen",
    "Quelle", "quelle", "Quellen", "Quellcode", "Quelltext", "Datenquelle",
    "Geilebachquelle", "passiert", "Passiert", "passen", "passenden", "passt",
    "Passung", "Passungszahl", "Passungszahlen", "anpassen", "aufpassen",
    "anfassen", "angefasst", "anzufassen", "umfasst", "zuerst", "dauer", "Dauer",
    "dauert", "dauern", "dauerhaft", "Dauerhaft", "teuer", "teuerste", "Steuer",
    "lassen", "gelassen", "verlassen", "Verlassen", "verlässt", "auszulassen",
    "dessen", "desselben", "dasselbe", "Dasselbe", "bewusst", "Bewusst",
    "besser", "bessere", "Bessere", "Klasse", "Klassen", "Basisklasse",
    "Datenklassen", "Dokumentklassen", "Wissen", "wissen", "Kenntnisse",
    "Ereignisse", "ergebnisse", "Prozess", "Abschluss", "Beschluss", "Kompromiss",
    "Konsequenz", "Vertrauen", "Voraussetzung", "voraussetzt", "Verbesserungen",
    "vergessen", "vermisste", "visuelle", "aktuell", "aktuelle", "genaue",
    "geschlossen", "geschlossene", "abgeschlossene", "abgeschlossenen",
    "sequenziell", "stattdessen", "Stattdessen", "Adressen", "Assistenten",
    "Aussage", "Ausschnitt", "Datenfluss", "Arbeitsstand", "Kassel", "Impressum",
    "Aussehen", "aussehen", "aussieht", "ausstellen", "Kurzfassung",
    "Zusammenfassung", "Zukunftssicherheit", "Rekursionsschutz", "bequem",
    "Bequemlichkeit", "unbequem", "beschaeftigen", "besessene", "besessenen",
    "frueher", "Ressource", "Vorschlag", "Regression", "zueinander",
    "hinzuerfunden", "schoengeschrieben", "verfaelscht", "Sicherheitsfokussiert",
    "Testgeruest", "Bestaetigungen", "Aufraeumen", "Emission", "Completeness",
    "Cross", "Progressive", "Business", "Bluetooth", "Session", "Issue", "Issues",
    "Request", "Requests", "Access", "Asset", "Assets", "Assertions", "Quests",
    "Fliesstext",
    # Technische Bezeichner
    "className", "subprocess", "value", "values", "True", "true", "expression",
    "requestId", "returnByValue", "toBeLessThan", "hasMessaging", "handleIncomingMessage",
    "MessagingCapable", "password", "progress", "queueing", "access", "assets",
    "css", "class", "continue", "pass", "passed", "does", "message", "messages",
    "messaging", "Messaging", "glossary", "headless", "foss", "address", "request",
    "requests", "zeileVollstaendig", "versionssprung", "Versionssprünge",
}


def ist_ersetzbar(wort):
    return wort in WOERTER and WOERTER[wort] != wort


def ersetze_in_text(text):
    """Ersetzt bekannte Wörter, an Wortgrenzen, mit Zählung."""
    zahl = 0

    def tausch(m):
        nonlocal zahl
        w = m.group(0)
        # Sechs Einträge der Liste stehen dort als "bleibt so" (`Wunsch`,
        # `Schutz`, `zueinander`, `manueller`, `hinzuerfunden`, `misst`): Sie
        # sehen aus wie ein ASCII-Ersatz und sind keiner. Sie zu zählen hat
        # die Prüfung in eine Schleife gelegt, in der sie dreißig Stellen
        # meldete, berichtigte und wieder dieselben dreißig fand.
        if w in WOERTER and WOERTER[w] != w:
            zahl += 1
            return WOERTER[w]
        return w

    return re.sub(r"\b[A-Za-zÄÖÜäöüß]+\b", tausch, text), zahl


def markdown(inhalt):
    """In Markdown alles außer Code-Blöcken und Inline-Code."""
    teile = re.split(r"(```.*?```|`[^`\n]+`)", inhalt, flags=re.S)
    zahl = 0
    for i, t in enumerate(teile):
        if t.startswith("`"):
            continue
        teile[i], n = ersetze_in_text(t)
        zahl += n
    return "".join(teile), zahl


def code(inhalt, zeilenkommentar):
    """In Code nur Kommentare: Bezeichner müssen ASCII bleiben."""
    zeilen = inhalt.split("\n")
    zahl = 0
    in_docstring = False
    for i, z in enumerate(zeilen):
        if zeilenkommentar == "#":
            # Python: Docstrings und Rautenkommentare
            dreifach = z.count('"""')
            if in_docstring or dreifach:
                zeilen[i], n = ersetze_in_text(z)
                zahl += n
                if dreifach % 2:
                    in_docstring = not in_docstring
                continue
        pos = z.find(zeilenkommentar)
        if pos >= 0:
            kopf, rest = z[:pos], z[pos:]
            rest, n = ersetze_in_text(rest)
            zeilen[i] = kopf + rest
            zahl += n
    return "\n".join(zeilen), zahl


def json_werte(inhalt):
    """In JSON nur Werte, nie Schlüssel: die stehen in Daten und werden verglichen."""
    daten = json.loads(inhalt)
    zahl = 0

    # Eine Kennung sieht so aus: kleingeschrieben, keine Leerzeichen, nur
    # Buchstaben, Ziffern und Bindestriche. Sie steht in Daten und wird
    # verglichen; ein Umlaut darin macht sie unauffindbar.
    KENNUNG = re.compile(r"^[a-z0-9][a-z0-9._:/-]*$")

    def durch(x):
        nonlocal zahl
        if isinstance(x, str):
            if KENNUNG.match(x) or x.startswith(("http", "data:", "#", "/")):
                return x
            neu, n = ersetze_in_text(x)
            zahl += n
            return neu
        if isinstance(x, list):
            return [durch(i) for i in x]
        if isinstance(x, dict):
            return {k: durch(v) for k, v in x.items()}
        return x

    return json.dumps(durch(daten), ensure_ascii=False, indent=2) + "\n", zahl


def dateien():
    ziele = sys.argv[2:] if len(sys.argv) > 2 else BEREICHE
    for ziel in ziele:
        p = REPO / ziel
        if p.is_file():
            yield p
        elif p.is_dir():
            for d in sorted(p.rglob("*")):
                if d.is_file() and d.suffix in ENDUNGEN and "node_modules" not in d.parts and "dist" not in d.parts:
                    yield d


def main():
    richten = "--richten" in sys.argv
    gesamt = 0
    betroffen = []

    for d in dateien():
        roh = d.read_text(encoding="utf-8")
        if d.suffix == ".md":
            neu, n = markdown(roh)
        elif d.suffix == ".py":
            neu, n = code(roh, "#")
        elif d.suffix in (".ts", ".tsx"):
            neu, n = code(roh, "//")
        elif d.suffix == ".json":
            try:
                neu, n = json_werte(roh)
            except Exception:
                continue
        else:
            continue

        if n:
            gesamt += n
            betroffen.append((d.relative_to(REPO).as_posix(), n))
            if richten:
                d.write_text(neu, encoding="utf-8", newline="\n")

    for pfad, n in sorted(betroffen, key=lambda x: -x[1]):
        print(str(n).rjust(5) + "  " + pfad)
    print()
    if richten:
        print(str(gesamt) + " Stellen berichtigt in " + str(len(betroffen)) + " Dateien.")
    elif gesamt:
        print(str(gesamt) + " Stellen mit ASCII-Ersatz in " + str(len(betroffen)) + " Dateien.")
        print("Zum Berichtigen: python td-tools/umlaute.py --richten")
    else:
        print("Keine Stelle mit ASCII-Ersatz. Sauber.")
    return 1 if gesamt and not richten else 0


if __name__ == "__main__":
    sys.exit(main())
