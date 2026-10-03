"""Den Auftritt der Stiftungen erfassen: Logo, Farben, Texte (DEFINITION Teil 8,
„Stiftungsprofil im Auftritt der Stiftung“, freigegeben von Timo am 02.10.2026).

    python td-tools/stiftungen/auftritt.py holen   [--ids a,b] [--alle] [--neu]
    python td-tools/stiftungen/auftritt.py blatt   [--ids a,b]
    python td-tools/stiftungen/auftritt.py anwenden

nachholen holt je Stiftung bis zu fünf weitere Seiten (Geschichte, Schwerpunkte,
          Projekte) und hängt sie an texte.md an.
holen     liest je Stiftung die Website (Startseite und bis zu vier Seiten zu
          Stiftung, Förderung, Antrag) und legt Logo-Kandidaten, Farben und
          Texte im Zwischenspeicher ab (%TEMP%/td-auftritt/<id>/). Fremde
          Texte und Bilder kommen nicht ins Repo. Ein Abruf je Sekunde und
          Host, robots.txt wird beachtet.
blatt     baut einen Kontaktbogen (HTML) mit Kandidaten, Farben und
          Beschreibung zum Ansehen und Auswählen.
anwenden  übernimmt die ausgewählten Felder aus den Teilen
          (td-tools/stiftungen/auftritt-teile/*.json) in
          packages/td-core/daten/items.json und legt die Logos nach
          apps/reference/public/stiftungen/ (verkleinert, bei uns gespeichert,
          damit kein Besucher eine fremde Adresse lädt).

Jeder Teil je Stiftung: { "logo": "<datei im Zwischenspeicher>", "hausfarbe",
"akzent", "kurz", "zweck", "zielgruppen", "hinweis", "foerderbereiche",
"auftrittQuelle" }. Was fehlt, bleibt fort. Nichts erfinden.
"""

import argparse
import colorsys
import html
import io
import json
import os
import re
import shutil
import sys
import tempfile
import threading
import time
import urllib.parse
import urllib.error
import urllib.request
import urllib.robotparser
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

WURZEL = Path(__file__).resolve().parents[2]
ITEMS = WURZEL / "packages/td-core/daten/items.json"
TEILE = Path(__file__).with_name("auftritt-teile")
LOGOS = WURZEL / "apps/reference/public/stiftungen"
SPEICHER = Path(tempfile.gettempdir()) / "td-auftritt"
AGENT = "Mozilla/5.0 (compatible; trustdonation-recherche; +mailto:mail@reallife.network)"
STICHWORTE = re.compile(r"(über|ueber|about|wir|stiftung|förder|foerder|antrag|projekt|zweck|satzung|leitbild|mission)", re.I)

_letzter: dict[str, float] = {}
_sperre = threading.Lock()
# None: keine robots.txt (erlaubt); False: nicht abrufbar (lieber nicht holen).
_robots: dict[str, urllib.robotparser.RobotFileParser | None | bool] = {}


def _takt(host: str) -> None:
    """Höchstens ein Abruf je Sekunde und Host."""
    while True:
        with _sperre:
            jetzt = time.time()
            frei = _letzter.get(host, 0) + 1.0
            if jetzt >= frei:
                _letzter[host] = jetzt
                return
        time.sleep(frei - jetzt)


def _darf(url: str) -> bool:
    teile = urllib.parse.urlsplit(url)
    basis = f"{teile.scheme}://{teile.netloc}"
    if basis not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            _takt(teile.netloc)
            req = urllib.request.Request(basis + "/robots.txt", headers={"User-Agent": AGENT})
            try:
                with urllib.request.urlopen(req, timeout=15, context=KONTEXT) as r:
                    inhalt = r.read().decode("utf-8", "replace")
            except urllib.error.URLError as e:
                if "CERTIFICATE_VERIFY_FAILED" not in str(e):
                    raise
                _, roh, typ = _curl(basis + "/robots.txt", 500_000)
                inhalt = roh.decode("utf-8", "replace") if "text/plain" in typ else ""
            rp.parse(inhalt.splitlines())
            _robots[basis] = rp
        except urllib.error.HTTPError as e:
            # Nur „gibt es nicht“ heißt erlaubt; jeder andere Fehler: lieber
            # nicht abrufen (Kimi, 03.10.2026).
            _robots[basis] = None if e.code in (404, 410) else False
        except Exception:
            _robots[basis] = False
    rp = _robots[basis]
    if rp is False:
        return False
    return True if rp is None else rp.can_fetch(AGENT, url)


def _kontext():
    import ssl
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


KONTEXT = _kontext()


def _iri(url: str) -> str:
    """Umlaute in Adressen kodieren (www.eb.de/über-uns), Domain als IDNA."""
    t = urllib.parse.urlsplit(url)
    host = t.hostname.encode("idna").decode("ascii") if t.hostname else ""
    netloc = host + (f":{t.port}" if t.port else "")
    return urllib.parse.urlunsplit((t.scheme, netloc, urllib.parse.quote(t.path, safe="/%:@"),
                                    urllib.parse.quote(t.query, safe="=&%+"), ""))


def _curl(url: str, grenze: int) -> tuple[str, bytes, str]:
    """Ausweg bei Zertifikatsketten ohne Zwischenzertifikat: curl unter Windows
    prüft genauso, holt fehlende Zwischenzertifikate aber nach."""
    import subprocess
    kopf = tempfile.NamedTemporaryFile(delete=False)
    kopf.close()
    try:
        r = subprocess.run(["curl", "-sSL", "--max-time", "25", "--max-filesize", str(grenze), "-A", AGENT,
                            "-H", "Accept-Language: de", "-D", kopf.name, "-w", "\n%{url_effective}", url],
                           capture_output=True, timeout=40)
        if r.returncode != 0:
            raise OSError(f"curl {r.returncode}: {r.stderr.decode('utf-8', 'replace').strip()[:120]}")
        koerper, _, end = r.stdout.rpartition(b"\n")
        typ, status = "", 0
        # Nach Weiterleitungen stehen mehrere Köpfe hintereinander; es gilt der letzte.
        for z in Path(kopf.name).read_text("latin-1").splitlines():
            if z.startswith("HTTP/"):
                teile = z.split()
                status = int(teile[1]) if len(teile) > 1 and teile[1].isdigit() else 0
                typ = ""
            elif z.lower().startswith("content-type:"):
                typ = z.split(":", 1)[1].strip()
        # Wie urlopen: ein Fehlerstatus ist ein Fehler, keine Seite (Kimi, 03.10.2026).
        # So greift auch für robots.txt dieselbe Regel wie auf dem direkten Weg.
        if status >= 400:
            raise urllib.error.HTTPError(url, status, "curl", None, None)
        return end.decode("utf-8", "replace"), koerper[:grenze], typ
    finally:
        os.unlink(kopf.name)


class _Weiterleitung(urllib.request.HTTPRedirectHandler):
    """Eine Weiterleitung auf einen anderen Host prüft dessen robots.txt und
    hält dessen Takt, bevor sie folgt (Kimi, 03.10.2026)."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        neu = _iri(urllib.parse.urljoin(req.full_url, newurl))
        alt_host = urllib.parse.urlsplit(req.full_url).netloc
        neu_host = urllib.parse.urlsplit(neu).netloc
        if neu_host != alt_host:
            if not _darf(neu):
                raise PermissionError(f"robots.txt verbietet {neu} oder war nicht abrufbar")
            _takt(neu_host)
        return super().redirect_request(req, fp, code, msg, headers, neu)


_OEFFNER = urllib.request.build_opener(urllib.request.HTTPSHandler(context=KONTEXT), _Weiterleitung())


def _curl_geprueft(url: str, grenze: int) -> tuple[str, bytes, str]:
    """curl folgt Weiterleitungen selbst; landet es auf einem anderen Host,
    gilt dessen robots.txt, sonst wird verworfen."""
    end, roh, typ = _curl(url, grenze)
    if urllib.parse.urlsplit(end).netloc != urllib.parse.urlsplit(url).netloc and not _darf(end):
        raise PermissionError(f"robots.txt verbietet {end} oder war nicht abrufbar")
    return end, roh, typ


def holen_roh(url: str, grenze: int = 3_000_000) -> tuple[str, bytes, str]:
    url = _iri(url)
    if not _darf(url):
        raise PermissionError(f"robots.txt verbietet {url} oder war nicht abrufbar")
    _takt(urllib.parse.urlsplit(url).netloc)
    req = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept-Language": "de"})
    try:
        with _OEFFNER.open(req, timeout=25) as r:
            return r.geturl(), r.read(grenze), r.headers.get("Content-Type", "")
    except urllib.error.HTTPError:
        raise
    except urllib.error.URLError as e:
        if "CERTIFICATE_VERIFY_FAILED" in str(e) or "timed out" in str(e):
            return _curl_geprueft(url, grenze)
        raise
    except TimeoutError:
        return _curl_geprueft(url, grenze)


def _text_aus(h: str) -> str:
    h = re.sub(r"(?is)<(script|style|noscript|svg|template)[^>]*>.*?</\1>", " ", h)
    h = re.sub(r"(?is)<(nav|footer)[^>]*>.*?</\1>", " ", h)
    h = re.sub(r"(?i)<(br|/p|/h[1-6]|/li|/div)[^>]*>", "\n", h)
    t = html.unescape(re.sub(r"<[^>]+>", " ", h))
    zeilen = [re.sub(r"[ \t\xa0]+", " ", z).strip() for z in t.splitlines()]
    return "\n".join(z for z in zeilen if len(z) > 2)


def _meta(h: str, name: str) -> list[str]:
    a = re.findall(r'<meta[^>]+(?:name|property)=["\']%s["\'][^>]*content=["\']([^"\']+)' % re.escape(name), h, re.I)
    b = re.findall(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:name|property)=["\']%s["\']' % re.escape(name), h, re.I)
    return [html.unescape(x) for x in a + b]


# ── Farben ──────────────────────────────────────────────────────────────────

def _hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def _bunt(hexwert: str) -> bool:
    """Farben mit Charakter: kein Grau, kein fast Weiß, kein fast Schwarz (Dunkelblau zählt)."""
    r, g, b = (int(hexwert[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return s > 0.25 and 0.12 < l < 0.9


def farben_aus_text(t: str) -> Counter:
    c: Counter = Counter()
    for m in re.findall(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b", t):
        m = m.lower()
        if len(m) == 3:
            m = "".join(x * 2 for x in m)
        c["#" + m] += 1
    for r, g, b in re.findall(r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})", t):
        c[_hex(min(int(r), 255), min(int(g), 255), min(int(b), 255))] += 1
    return Counter({k: v for k, v in c.items() if _bunt(k)})


def farben_aus_bild(daten: bytes) -> list[str]:
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(daten)).convert("RGBA")
        im.thumbnail((200, 200))
        daten_ = im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()
        punkte = [(r, g, b) for r, g, b, a in daten_ if a > 200]
        if not punkte:
            return []
        flach = Image.new("RGB", (len(punkte), 1))
        flach.putdata(punkte)
        q = flach.quantize(colors=8)
        pal = q.getpalette()
        zaehl = sorted(q.getcolors() or [], reverse=True)
        aus = []
        for anzahl, idx in zaehl:
            hx = _hex(*pal[idx * 3: idx * 3 + 3])
            if _bunt(hx) and anzahl > len(punkte) * 0.02:
                aus.append(hx)
        return aus
    except Exception:
        return []


# ── Holen ───────────────────────────────────────────────────────────────────

def _logo_kandidaten(h: str, basis: str) -> list[tuple[str, str]]:
    aus: list[tuple[str, str]] = []
    for tag in re.findall(r"<img\b[^>]*>", h, re.I):
        if re.search(r"logo", tag, re.I):
            src = re.search(r'\b(?:data-src|src)=["\']([^"\']+)', tag, re.I)
            if src and not src.group(1).startswith("data:"):
                aus.append(("img-logo", urllib.parse.urljoin(basis, html.unescape(src.group(1)))))
    # Das erste Bild im Kopf der Seite ist oft das Logo, auch ohne „logo“ im Namen.
    kopf = re.search(r"(?is)<header\b.*?</header>", h)
    if kopf:
        for src in re.findall(r'<img\b[^>]*\bsrc=["\']([^"\']+)', kopf.group(0), re.I)[:2]:
            if not src.startswith("data:"):
                aus.append(("img-kopf", urllib.parse.urljoin(basis, html.unescape(src))))
    for rel, href in re.findall(r'<link[^>]+rel=["\']([^"\']*icon[^"\']*)["\'][^>]*href=["\']([^"\']+)', h, re.I):
        if "apple" in rel.lower() or re.search(r"(180|192|512)", href):
            aus.append(("icon", urllib.parse.urljoin(basis, html.unescape(href))))
    # Symbole fremder Dienste sind keine Logos der Stiftung.
    fremd = re.compile(r"(facebook|instagram|linkedin|twitter|x-logo|youtube|xing|mastodon|tiktok|whatsapp|blog|newsletter|spenden-?siegel|dzi)", re.I)
    gesehen, rein = set(), []
    for art, u in aus:
        if u not in gesehen and not fremd.search(urllib.parse.unquote(u)):
            gesehen.add(u)
            rein.append((art, u))
    return rein[:5]


def _inline_svg_logo(h: str) -> str | None:
    for m in re.finditer(r"(?is)<svg\b[^>]*>.*?</svg>", h):
        vorher = h[max(0, m.start() - 300): m.start()]
        if re.search(r"logo", m.group(0)[:400] + vorher, re.I) and len(m.group(0)) < 60_000:
            return m.group(0)
    return None


def stiftung_holen(item: dict, neu: bool) -> str:
    sid, d = item["id"], item["data"]
    ordner = SPEICHER / sid
    if (ordner / "meta.json").exists() and not neu:
        return f"{sid}: schon da"
    ordner.mkdir(parents=True, exist_ok=True)
    meta: dict = {"id": sid, "title": d.get("title"), "website": d.get("website"), "stand": date.today().isoformat(),
                  "kandidaten": [], "seiten": [], "fehler": []}
    try:
        end, roh, _ = holen_roh(d["website"])
    except Exception as e:
        meta["fehler"].append(f"Startseite: {e}")
        (ordner / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
        return f"{sid}: FEHLER {e}"
    h = roh.decode("utf-8", "replace")
    meta["endUrl"] = end
    meta["beschreibung"] = (_meta(h, "description") + _meta(h, "og:description") + [""])[0]
    meta["seitentitel"] = html.unescape((re.findall(r"(?is)<title[^>]*>(.*?)</title>", h) + [""])[0].strip())
    meta["themeColor"] = (_meta(h, "theme-color") + [None])[0]

    # Ist die Website eine Unterseite, steht das Logo meist auch dort; sonst die Startseite der Domain.
    seiten = [(end, h)]
    texte = [f"# {end}\n\n{_text_aus(h)[:8000]}"]
    links = []
    for href, inhalt in re.findall(r'(?is)<a\b[^>]*href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', h):
        u = urllib.parse.urljoin(end, html.unescape(href))
        if urllib.parse.urlsplit(u).netloc != urllib.parse.urlsplit(end).netloc or u == end:
            continue
        if re.search(r"\.(pdf|jpe?g|png|zip|docx?)$", u, re.I):
            continue
        if STICHWORTE.search(urllib.parse.unquote(u)) or STICHWORTE.search(re.sub(r"<[^>]+>", "", inhalt)):
            if u not in links:
                links.append(u)
    for u in links[:4]:
        try:
            e2, r2, typ = holen_roh(u)
            if "html" not in typ:
                continue
            h2 = r2.decode("utf-8", "replace")
            seiten.append((e2, h2))
            texte.append(f"# {e2}\n\n{_text_aus(h2)[:6000]}")
            meta["seiten"].append(e2)
        except Exception as e:
            meta["fehler"].append(f"{u}: {e}")
    (ordner / "texte.md").write_text("\n\n---\n\n".join(texte), encoding="utf-8")

    # Farben aus Seite und eingebundenem CSS der eigenen Domain.
    farben = farben_aus_text(h)
    for css in re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)', h, re.I)[:4]:
        u = urllib.parse.urljoin(end, html.unescape(css))
        if urllib.parse.urlsplit(u).netloc != urllib.parse.urlsplit(end).netloc:
            continue
        try:
            _, c, _ = holen_roh(u, 2_000_000)
            farben.update(farben_aus_text(c.decode("utf-8", "replace")))
        except Exception as e:
            meta["fehler"].append(f"css {u}: {e}")
    meta["farbenSeite"] = farben.most_common(10)

    # Logo-Kandidaten.
    n = 0
    svg = _inline_svg_logo(h)
    if svg:
        n += 1
        datei = f"kandidat-{n}.svg"
        if 'xmlns=' not in svg[:300]:
            svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
        (ordner / datei).write_text(svg, encoding="utf-8")
        meta["kandidaten"].append({"datei": datei, "art": "svg-inline", "quelle": end,
                                   "farben": [f for f, _ in farben_aus_text(svg).most_common(5)]})
    schon: set[int] = set()
    for art, u in _logo_kandidaten(h, end):
        try:
            _, b, typ = holen_roh(u, 2_000_000)
        except Exception as e:
            meta["fehler"].append(f"logo {u}: {e}")
            continue
        if hash(b) in schon or len(b) < 200:
            continue
        schon.add(hash(b))
        endung = "svg" if ("svg" in typ or u.lower().split("?")[0].endswith(".svg")) else \
            (re.search(r"\.(png|jpe?g|webp|gif)", u.lower()) or re.search(r"(png|jpe?g|webp|gif)", typ) or [None, "png"])[1]
        n += 1
        datei = f"kandidat-{n}.{endung.replace('jpeg', 'jpg')}"
        (ordner / datei).write_bytes(b)
        eintrag = {"datei": datei, "art": art, "quelle": u, "bytes": len(b)}
        if endung == "svg":
            eintrag["farben"] = [f for f, _ in farben_aus_text(b.decode("utf-8", "replace")).most_common(5)]
        else:
            eintrag["farben"] = farben_aus_bild(b)
            try:
                from PIL import Image
                eintrag["groesse"] = Image.open(io.BytesIO(b)).size
            except Exception:
                pass
        meta["kandidaten"].append(eintrag)
    (ordner / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    return f"{sid}: {len(meta['kandidaten'])} Logos, {len(meta['farbenSeite'])} Farben, {len(meta['seiten'])} Seiten"


def stiftungen(ids: list[str] | None) -> list[dict]:
    items = json.loads(ITEMS.read_text(encoding="utf-8"))
    st = [i for i in items if str(i.get("id", "")).startswith("stiftung-") and i.get("data", {}).get("website")
          and not i["data"].get("muster")]
    return [i for i in st if i["id"] in ids] if ids else st


# Für das große Ganze (DEFINITION Teil 8, zweite Runde): Herkunft, Schwerpunkte, Beispiele.
TIEFER = re.compile(r"(geschichte|historie|history|chronik|über-uns|ueber-uns|about|wer-wir-sind|portrait|porträt|stifter|gründ|gruend|schwerpunkt|themen|programm|projekt|förderbeispiel|beispiel|referenz|jahresbericht|zahlen|fakten)", re.I)


def stiftung_nachholen(item: dict, neu: bool) -> str:
    """Bis zu fünf weitere Seiten zu Geschichte, Schwerpunkten und Projekten an texte.md anhängen."""
    sid = item["id"]
    ordner = SPEICHER / sid
    meta_datei = ordner / "meta.json"
    if not meta_datei.exists():
        return f"{sid}: kein Zwischenspeicher"
    meta = json.loads(meta_datei.read_text(encoding="utf-8"))
    if not meta.get("endUrl"):
        return f"{sid}: ohne Startseite"
    if meta.get("nachgeholt") and not neu:
        return f"{sid}: schon nachgeholt"
    try:
        end, roh, _ = holen_roh(meta["endUrl"])
    except Exception as e:
        return f"{sid}: FEHLER {e}"
    h = roh.decode("utf-8", "replace")
    schon = set(meta.get("seiten", [])) | {end}
    links: list[str] = []
    for href, inhalt in re.findall(r'(?is)<a\b[^>]*href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>', h):
        u = urllib.parse.urljoin(end, html.unescape(href))
        if urllib.parse.urlsplit(u).netloc != urllib.parse.urlsplit(end).netloc or u in schon or u in links:
            continue
        if re.search(r"\.(pdf|jpe?g|png|zip|docx?)$", u, re.I):
            continue
        if TIEFER.search(urllib.parse.unquote(u)) or TIEFER.search(re.sub(r"<[^>]+>", "", inhalt)):
            links.append(u)
    texte = []
    neu_seiten = []
    for u in links[:5]:
        try:
            e2, r2, typ = holen_roh(u)
            if "html" not in typ:
                continue
            texte.append(f"# {e2}\n\n{_text_aus(r2.decode('utf-8', 'replace'))[:6000]}")
            neu_seiten.append(e2)
        except Exception as e:
            meta.setdefault("fehler", []).append(f"{u}: {e}")
    if texte:
        with open(ordner / "texte.md", "a", encoding="utf-8") as f:
            f.write("\n\n---\n\n" + "\n\n---\n\n".join(texte))
    meta["seiten"] = meta.get("seiten", []) + neu_seiten
    meta["nachgeholt"] = True
    meta_datei.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    return f"{sid}: {len(neu_seiten)} Seiten nachgeholt"


def befehl_nachholen(a) -> None:
    liste = stiftungen(a.ids.split(",") if a.ids else None)
    with ThreadPoolExecutor(6) as pool:
        for zeile in pool.map(lambda i: stiftung_nachholen(i, a.neu), liste):
            print(zeile, flush=True)


def befehl_holen(a) -> None:
    liste = stiftungen(a.ids.split(",") if a.ids else None)
    if not a.ids and not a.alle:
        sys.exit("--ids a,b oder --alle angeben")
    SPEICHER.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(6) as pool:
        for zeile in pool.map(lambda i: stiftung_holen(i, a.neu), liste):
            print(zeile, flush=True)
    print(f"Zwischenspeicher: {SPEICHER}")


# ── Kontaktbogen ────────────────────────────────────────────────────────────

def auswahl_lesen() -> dict:
    """Die Auswahl aus allen Teilen (td-tools/stiftungen/auftritt-teile/*.json), spätere gehen vor."""
    aus: dict = {}
    for datei in sorted(TEILE.glob("*.json")):
        # Je Stiftung zusammenführen: die zweite Runde ergänzt die erste, ersetzt sie nicht.
        for sid, felder in json.loads(datei.read_text(encoding="utf-8")).items():
            aus.setdefault(sid, {}).update(felder)
    return aus


def befehl_blatt(a) -> None:
    ids = a.ids.split(",") if a.ids else sorted(p.name for p in SPEICHER.iterdir() if (p / "meta.json").exists())
    auswahl = auswahl_lesen()
    zeilen = []
    for sid in ids:
        m = json.loads((SPEICHER / sid / "meta.json").read_text(encoding="utf-8"))
        w = auswahl.get(sid, {})
        kand = "".join(
            f'<figure class="{"gewaehlt" if w.get("logo") == k["datei"] else ""}"><img src="{sid}/{k["datei"]}"><figcaption>{k["datei"]} · {k["art"]}<br>'
            + "".join(f'<i style="background:{f}"></i>' for f in k.get("farben", [])) + "</figcaption></figure>"
            for k in m["kandidaten"])
        seite = "".join(f'<i style="background:{f}" title="{f} ×{n}"></i>' for f, n in m.get("farbenSeite", []))
        wahl = ""
        if w:
            wahl = (f'<p class="wahl"><i style="background:{w.get("hausfarbe", "#fff")}"></i><i style="background:{w.get("akzent", "#fff")}"></i> '
                    f'{html.escape(w.get("kurz", ""))}</p>')
        zeilen.append(f'<section><h2>{html.escape(m.get("title") or sid)} <small>{sid}</small></h2>'
                      f'<p class="b">{html.escape(m.get("beschreibung") or "")}</p><div class="k">{kand or "kein Logo gefunden"}</div>'
                      f'<p>Seite: {seite}</p>{wahl}<p class="f">{html.escape("; ".join(m.get("fehler", []))[:300])}</p></section>')
    seite = ("<!doctype html><meta charset=utf-8><title>Auftritt der Stiftungen</title><style>"
             "body{font:14px system-ui;margin:20px;background:#f4f4f5}section{background:#fff;border-radius:12px;padding:12px 16px;margin:0 0 12px}"
             "h2{font-size:16px;margin:0 0 4px}small{color:#888;font-weight:400}.b{color:#555;margin:0 0 8px}.k{display:flex;gap:12px;flex-wrap:wrap}"
             "figure{margin:0;padding:8px;border:2px solid #eee;border-radius:8px;background:#fff}figure.gewaehlt{border-color:#16a34a}"
             "figure img{height:60px;max-width:260px;object-fit:contain;display:block;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/12px 12px}"
             "figcaption{font-size:11px;color:#666}i{display:inline-block;width:18px;height:18px;border-radius:4px;margin:2px;vertical-align:middle;border:1px solid #0002}"
             ".f{color:#b91c1c;font-size:11px}.wahl{background:#f0fdf4;padding:6px;border-radius:6px}</style>"
             + "".join(zeilen))
    ziel = SPEICHER / "blatt.html"
    ziel.write_text(seite, encoding="utf-8")
    print(ziel)


# ── Anwenden ────────────────────────────────────────────────────────────────

def _hell(farben: list[tuple[int, int, int]]) -> bool:
    """Fast nur helle Farben: Das Logo ist für dunklen Grund gemacht."""
    if not farben:
        return False
    lum = [(0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 for r, g, b in farben]
    return sum(1 for x in lum if x > 0.85) / len(lum) > 0.8


def logo_hell(pfad: Path) -> bool:
    if pfad.suffix == ".svg":
        t = pfad.read_text(encoding="utf-8", errors="replace").lower()
        werte = re.findall(r"""(?:fill|stroke|stop-color|color)\s*[:=]\s*["']?\s*(#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|white\b|rgb\([^)]*\))""", t)
        farben = []
        for w in werte:
            if w == "white":
                farben.append((255, 255, 255))
            elif w.startswith("rgb"):
                farben.append(tuple(int(x) for x in re.findall(r"\d+", w)[:3]))
            else:
                h = w[1:]
                h = "".join(c * 2 for c in h) if len(h) == 3 else h
                if len(h) == 6:
                    farben.append(tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)))
        # Ohne jede Füllfarbe zeichnet ein SVG schwarz.
        return _hell(farben)
    from PIL import Image
    im = Image.open(pfad).convert("RGBA")
    im.thumbnail((120, 120))
    # Bringt das Bild seinen eigenen Grund mit (undurchsichtiger Rand), steht es für sich.
    b, h = im.size
    rand = [im.getpixel((x, y)) for x, y in ((0, 0), (b - 1, 0), (0, h - 1), (b - 1, h - 1), (b // 2, 0), (b // 2, h - 1))]
    if all(a > 200 for *_, a in rand):
        return False
    daten_ = im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()
    return _hell([(r, g, b) for r, g, b, a in daten_ if a > 128])


# Aus HTML eingebettete SVGs tragen Attribute und Tags oft klein geschrieben;
# als eigene Datei (XML) zählt die Schreibweise, sonst fehlt etwa die viewBox.
_SVG_NAMEN = ["viewBox", "preserveAspectRatio", "gradientUnits", "gradientTransform", "patternUnits",
              "clipPathUnits", "maskUnits", "linearGradient", "radialGradient", "clipPath", "textPath",
              "stdDeviation", "foreignObject", "feGaussianBlur", "feOffset", "feBlend", "feColorMatrix"]


def _svg_heil(t: str) -> str | None:
    """Ein SVG, das ein Browser als Bild zeigt: gültiges XML, richtige Schreibweise."""
    import xml.etree.ElementTree as ET
    for name in _SVG_NAMEN:
        t = re.sub(rf"(?<=[\s<]){name.lower()}(?=[\s=>/])", name, t)
        t = re.sub(rf"(?<=</){name.lower()}(?=>)", name, t)
    try:
        ET.fromstring(t)
        return t
    except ET.ParseError:
        pass
    # Doppelte Attribute im Kopf (etwa xmlns zweimal): das erste gilt.
    kopf = re.search(r"<svg\b[^>]*>", t)
    if kopf:
        gesehen, teile = set(), []
        for m in re.finditer(r'([\w:.-]+)\s*=\s*("[^"]*"|\'[^\']*\')', kopf.group(0)):
            if m.group(1) not in gesehen:
                gesehen.add(m.group(1))
                teile.append(m.group(0))
        t = t[:kopf.start()] + "<svg " + " ".join(teile) + ">" + t[kopf.end():]
    try:
        ET.fromstring(t)
        return t
    except ET.ParseError:
        return None


def _logo_ablegen(sid: str, datei: str) -> str | None:
    quelle = SPEICHER / sid / datei
    LOGOS.mkdir(parents=True, exist_ok=True)
    if quelle.suffix == ".svg":
        t = quelle.read_text(encoding="utf-8", errors="replace")
        if len(t) > 200_000:
            print(f"{sid}: SVG zu groß ({len(t)} Zeichen), Logo weggelassen")
            return None
        # Nur Zeichnung: keine Skripte, keine Verweise nach außen.
        t = re.sub(r"(?is)<script\b.*?</script>", "", t)
        t = re.sub(r'\s(on\w+)=["\'][^"\']*["\']', "", t)
        t = re.sub(r"(?i)\s(on\w+)\s*=\s*[^\s>\"']+", "", t)
        t = re.sub(r'(?i)(xlink:)?href=["\'](https?:|//)[^"\']*["\']', "", t)
        # Verweise nur innerhalb der Datei (#…) oder eingebettete Rasterbilder;
        # alles andere fort (Kimi, 03.10.2026).
        erlaubt = r"(?!#|data:image/(?:png|jpe?g|gif|webp)[;,])"
        t = re.sub(rf'(?i)\s(xlink:)?href\s*=\s*("{erlaubt}[^"]*"|\'{erlaubt}[^\']*\')', "", t)
        t = re.sub(r"(?is)<foreignObject\b.*?</foreignObject>", "", t)
        if re.search(r"(?i)javascript:|@import|xml-stylesheet|url\(\s*[\"']?\s*(https?:|//|data:|javascript:)", t):
            print(f"{sid}: SVG trägt aktive Inhalte oder fremde Verweise, Logo weggelassen")
            return None
        t = _svg_heil(t)
        if t is None:
            print(f"{sid}: SVG lässt sich nicht lesen, Logo weggelassen")
            return None
        ziel = LOGOS / f"{sid}.svg"
        ziel.write_text(t, encoding="utf-8")
    else:
        from PIL import Image
        im = Image.open(quelle)
        im = im.convert("RGBA")
        im.thumbnail((480, 240))
        ziel = LOGOS / f"{sid}.png"
        im.save(ziel, optimize=True)
    return f"stiftungen/{ziel.name}"


def befehl_anwenden(a) -> None:
    auswahl = auswahl_lesen()
    items = json.loads(ITEMS.read_text(encoding="utf-8"))
    nach_id = {i["id"]: i for i in items}
    felder = ("hausfarbe", "akzent", "kurz", "zweck", "zielgruppen", "hinweis", "foerderbereiche", "auftrittQuelle",
              "schwerpunkte", "beispiele", "zahlen", "herkunft")
    geaendert = 0
    for sid, w in auswahl.items():
        if sid.startswith("_"):
            continue
        it = nach_id.get(sid)
        if not it:
            print(f"{sid}: unbekannt, übersprungen")
            continue
        if not any(w.get(f) not in (None, "", []) for f in ("logo",) + felder):
            continue  # nichts Belegtes: kein Stand, keine Herkunft
        d = it["data"]
        pfad = _logo_ablegen(sid, w["logo"]) if w.get("logo") else None
        if pfad:
            d["bild"] = pfad
            # Die Auswahl kann entscheiden (hellgraue Logos erkennt die Messung nicht immer).
            if w["bildHell"] if "bildHell" in w else logo_hell(WURZEL / "apps/reference/public" / d["bild"]):
                d["bildHell"] = True
            else:
                d.pop("bildHell", None)
            # Ein schwarz-graues Logo ohne bunte Hausfarbe: neutrales Schiefergrau statt Einheitsblau.
            if not w.get("hausfarbe"):
                d["hausfarbe"] = "#334155"
        for f in felder:
            if w.get(f) not in (None, "", []):
                d[f] = w[f]
        meta_datei = SPEICHER / sid / "meta.json"
        d["auftrittStand"] = w.get("auftrittStand") or (json.loads(meta_datei.read_text(encoding="utf-8"))["stand"] if meta_datei.exists() else date.today().isoformat())
        geaendert += 1
    # Wie die Datei schon steht: ohne Escapes, ohne Zeilenende am Schluss.
    with open(ITEMS, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(items, ensure_ascii=False, indent=2))
    print(f"{geaendert} Stiftungen ergänzt. SEED_VERSION und MUSTERDATEN_VERSION hochzählen.")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="befehl", required=True)
    h = s.add_parser("holen")
    h.add_argument("--ids")
    h.add_argument("--alle", action="store_true")
    h.add_argument("--neu", action="store_true")
    n = s.add_parser("nachholen")
    n.add_argument("--ids")
    n.add_argument("--neu", action="store_true")
    b = s.add_parser("blatt")
    b.add_argument("--ids")
    s.add_parser("anwenden")
    a = p.parse_args()
    {"holen": befehl_holen, "nachholen": befehl_nachholen, "blatt": befehl_blatt, "anwenden": befehl_anwenden}[a.befehl](a)


if __name__ == "__main__":
    main()
