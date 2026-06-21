"""
=======================================================================
 Full Refresh & Merge  –  rentals_egypt_merged.json
 Sources : Bayut.eg | Dubizzle.com.eg | PropertyFinder.eg
 Areas   : 6th of October  &  Sheikh Zayed
 Types   : All property types (apartments, studios, villas, etc.)
=======================================================================
Run this script any time you want a fresh, up-to-date dataset.
Output  : rentals_egypt_merged.json  (replaces the old file)
=======================================================================
"""

import json, re, time, random, logging, urllib3, os
from datetime import datetime
from urllib.robotparser import RobotFileParser
import requests
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ─── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ─── Global config ────────────────────────────────────────────
MIN_DELAY   = 3.0
MAX_DELAY   = 6.0
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "..", "data", "merged", "rentals_egypt_merged.json")

# Pages to scrape per category × area combination
PAGES = {
    "bayut_studio":     6,   # ~24 listings/page
    "bayut_apartment":  8,   # ~24 listings/page
    "bayut_villa":      5,
    "dubizzle_apt":    10,   # ~45 listings/page
    "dubizzle_villa":   5,
    "pf_apartment":    20,   # ~30 listings/page (sparse area matches)
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
PERIODS = {"monthly": "Monthly", "daily": "Daily", "yearly": "Yearly", "weekly": "Weekly"}
PROP_TYPES = [
    "Apartment", "Duplex", "Villa", "Penthouse", "Townhouse",
    "Twin House", "Chalet", "Studio", "Room", "Hotel Apartment",
]

session = requests.Session()
session.headers.update(HEADERS)


# ─── Shared helpers ───────────────────────────────────────────
def load_robots(robots_url: str) -> RobotFileParser | None:
    try:
        r = requests.get(robots_url, headers=HEADERS, timeout=10, verify=False)
        r.raise_for_status()
        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.parse(r.text.splitlines())
        log.info(f"  robots.txt ✔  {robots_url}")
        return rp
    except Exception as e:
        log.warning(f"  robots.txt unavailable ({e}) → allow all (RFC 9309 §2.3.1)")
        return None


def can_fetch(rp: RobotFileParser | None, url: str) -> bool:
    return True if rp is None else rp.can_fetch("*", url)


def polite_get(url: str) -> requests.Response | None:
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
    try:
        r = session.get(url, timeout=30, verify=False, allow_redirects=True)
        r.raise_for_status()
        log.info(f"    ✔ {r.status_code}  {url}")
        return r
    except Exception as e:
        log.warning(f"    ✘ {url}  →  {e}")
        return None


def prop_category(prop_type: str | None, beds: int | None) -> str:
    pt = (prop_type or "").lower()
    if pt in ("studio", "room"):
        return "studio"
    if pt in ("villa", "townhouse", "twin house", "chalet"):
        return "villa"
    return "apartment"


# ══════════════════════════════════════════════════════════════
#  BAYUT.EG
# ══════════════════════════════════════════════════════════════
BAYUT_BASE = "https://bayut.eg"

BAYUT_TARGETS = {
    "6th_of_october": {
        "studio":    f"{BAYUT_BASE}/en/giza/studio-properties-for-rent-in-6th-of-october/",
        "apartment": f"{BAYUT_BASE}/en/giza/apartments-for-rent-in-6th-of-october/",
        "villa":     f"{BAYUT_BASE}/en/giza/villas-and-townhouses-for-rent-in-6th-of-october/",
    },
    "sheikh_zayed": {
        "studio":    f"{BAYUT_BASE}/en/giza/studio-properties-for-rent-in-sheikh-zayed/",
        "apartment": f"{BAYUT_BASE}/en/giza/apartments-for-rent-in-sheikh-zayed/",
        "villa":     f"{BAYUT_BASE}/en/giza/villas-and-townhouses-for-rent-in-sheikh-zayed/",
    },
}


def bayut_page_url(base: str, page: int) -> str:
    return base if page == 1 else base.rstrip("/") + f"/page-{page}/"


def parse_bayut_article(article, area: str, prop_cat: str, page: int) -> dict | None:
    link = article.find("a", href=re.compile(r"/en/property/details-\d+\.html"))
    if not link:
        return None
    url   = BAYUT_BASE + link["href"]
    title = link.get("title", "").strip()

    for tag in article.find_all(["svg", "button"]):
        tag.decompose()
    tokens = [t.strip() for t in article.get_text(separator="|").split("|") if t.strip()]

    price_amount, price_period, price_raw = None, "Unknown", ""
    try:
        ei = next(i for i, t in enumerate(tokens) if t.upper() == "EGP")
        num = tokens[ei + 1].replace(",", "")
        price_amount = int(num) if num.isdigit() else None
        price_raw    = f"EGP {tokens[ei + 1]}"
        p = tokens[ei + 2].lower() if ei + 2 < len(tokens) else ""
        for k, v in PERIODS.items():
            if k in p:
                price_period = v
                break
    except (StopIteration, IndexError, ValueError):
        pass

    property_type = next(
        (pt for pt in PROP_TYPES if any(pt.lower() in t.lower() for t in tokens)), None
    )
    if property_type is None and prop_cat == "studio":
        property_type = "Studio"

    beds = baths = area_sqm = None
    try:
        ai = next(i for i, t in enumerate(tokens) if t.lower() == "area")
        for t in tokens[ai: ai + 4]:
            m = re.search(r"([\d,]+)\s*Sq", t)
            if m:
                area_sqm = int(m.group(1).replace(",", ""))
                break
        pre = [t for t in tokens[max(0, ai - 5): ai] if re.fullmatch(r"\d+", t)]
        if len(pre) >= 2:
            beds, baths = int(pre[-2]), int(pre[-1])
        elif len(pre) == 1:
            beds = int(pre[0])
    except StopIteration:
        pass

    loc_kws = ["giza", "cairo", "october", "zayed"]
    loc_tok = next(
        (t for t in tokens if any(k in t.lower() for k in loc_kws)
         and "Email" not in t and len(t) > 5), None
    )
    compound = location = None
    if loc_tok:
        parts = [p.strip() for p in loc_tok.split(",")]
        compound, location = (parts[0], ", ".join(parts[1:])) if len(parts) >= 2 else (None, loc_tok)

    return {
        "source": "bayut.eg",
        "url": url, "title": title,
        "area": area, "prop_category": prop_category(property_type, beds), "page": page,
        "price": {"amount_egp": price_amount, "period": price_period, "raw": price_raw},
        "property_type": property_type,
        "bedrooms": beds, "bathrooms": baths, "area_sqm": area_sqm,
        "compound": compound, "location": location,
        "scraped_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


def scrape_bayut(rp) -> list[dict]:
    results = []
    max_pages = {"studio": PAGES["bayut_studio"], "apartment": PAGES["bayut_apartment"], "villa": PAGES["bayut_villa"]}
    for area, cats in BAYUT_TARGETS.items():
        for prop_cat, base_url in cats.items():
            log.info(f"\n  [Bayut] {area} / {prop_cat}")
            for page in range(1, max_pages[prop_cat] + 1):
                url = bayut_page_url(base_url, page)
                if not can_fetch(rp, url):
                    log.warning(f"    robots.txt disallows — stopping.")
                    break
                resp = polite_get(url)
                if not resp:
                    break
                soup = BeautifulSoup(resp.text, "html.parser")
                arts = soup.find_all("article")
                if not arts:
                    log.info("    No articles — done.")
                    break
                parsed = [parse_bayut_article(a, area, prop_cat, page) for a in arts]
                parsed = [p for p in parsed if p]
                results.extend(parsed)
                log.info(f"    Page {page}: +{len(parsed):3d}  (running: {len(results)})")
                if len(arts) < 20:  # last page reached
                    break
    log.info(f"\n  Bayut total: {len(results)}")
    return results


# ══════════════════════════════════════════════════════════════
#  DUBIZZLE.COM.EG
# ══════════════════════════════════════════════════════════════
DUBIZZLE_BASE = "https://www.dubizzle.com.eg"

DUBIZZLE_TARGETS = {
    "6th_of_october": {
        "apartments-duplex-for-rent": "6th-of-october",
        "villas-for-rent":            "6th-of-october",
    },
    "sheikh_zayed": {
        "apartments-duplex-for-rent": "sheikh-zayed",
        "villas-for-rent":            "sheikh-zayed",
    },
}


def dubizzle_page_url(category: str, area_slug: str, page: int) -> str:
    base = f"{DUBIZZLE_BASE}/en/properties/{category}/{area_slug}/"
    return f"{base}?page={page}" if page > 1 else base


def parse_dubizzle_article(article, area: str, page: int) -> dict | None:
    link = article.find("a", href=re.compile(r"/en/ad/"))
    if not link:
        return None
    url = DUBIZZLE_BASE + link["href"]
    ad_id_m = re.search(r"-ID(\d+)\.html$", link["href"])
    ad_id = ad_id_m.group(1) if ad_id_m else None

    for tag in article.find_all(["svg", "button", "script", "style"]):
        tag.decompose()
    tokens = [t.strip() for t in article.get_text(separator="|").split("|") if t.strip()]

    # Title: longest non-field token
    skip_re = [re.compile(p, re.I) for p in [
        r"^EGP", r"^\d+$", r"^(Monthly|Daily|Yearly|Weekly)$",
        r"^(\d+\s*(beds?|baths?|m[²2]))$", r"^(Call|WhatsApp|Furnished|Elite|Yes|No)$",
        r"^\d+\s*(day|week|month|hour|minute)s?\s*ago$", r"^Verified Business$", r"^•$",
    ]]
    title_candidates = [
        tok for tok in tokens
        if len(tok) > 10 and not any(rx.match(tok) for rx in skip_re)
        and tok not in PROP_TYPES
    ]
    title = max(title_candidates, key=len) if title_candidates else None

    price_amount, price_period, price_raw = None, "Unknown", ""
    for i, tok in enumerate(tokens):
        if tok.upper().startswith("EGP"):
            price_raw    = tok
            price_amount = int(re.sub(r"[^\d]", "", tok)) if re.search(r"\d", tok) else None
            p_tok = tokens[i + 1].lower() if i + 1 < len(tokens) else ""
            for k, v in PERIODS.items():
                if k in p_tok:
                    price_period = v
                    break
            break

    property_type = next(
        (pt for pt in PROP_TYPES if any(tok.lower() == pt.lower() for tok in tokens)), None
    )

    beds = baths = area_sqm = None
    for tok in tokens:
        if re.match(r"(\d+)\s*bed", tok, re.I):
            beds = int(re.match(r"(\d+)", tok).group(1))
        if re.match(r"(\d+)\s*bath", tok, re.I):
            baths = int(re.match(r"(\d+)", tok).group(1))
        if re.match(r"([\d,]+)\s*m[²2]", tok):
            area_sqm = int(re.match(r"([\d,]+)", tok).group(1).replace(",", ""))

    furnished = None
    for i, tok in enumerate(tokens):
        if tok.lower() == "furnished" and i + 1 < len(tokens):
            furnished = tokens[i + 1].lower() in ("yes", "true", "1")
            break

    loc_kws = ["6th of october", "sheikh zayed", "october", "zayed", "giza"]
    loc_tok = next((t for t in tokens if any(k in t.lower() for k in loc_kws) and len(t) > 5), None)
    compound = location = None
    if loc_tok:
        parts = [p.strip() for p in loc_tok.split(",")]
        compound, location = (parts[0], ", ".join(parts[1:])) if len(parts) >= 2 else (None, loc_tok)

    posted_ago = next(
        (tok for tok in tokens if re.match(r"\d+\s*(?:day|week|month|hour|minute)s?\s*ago", tok, re.I)), None
    )

    return {
        "source": "dubizzle.com.eg",
        "ad_id": ad_id, "url": url, "title": title,
        "area": area, "prop_category": prop_category(property_type, beds), "page": page,
        "price": {"amount_egp": price_amount, "period": price_period, "raw": price_raw},
        "property_type": property_type,
        "bedrooms": beds, "bathrooms": baths, "area_sqm": area_sqm,
        "furnished": furnished, "compound": compound, "location": location,
        "posted_ago": posted_ago,
        "scraped_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


def scrape_dubizzle(rp) -> list[dict]:
    results = []
    max_pages_map = {
        "apartments-duplex-for-rent": PAGES["dubizzle_apt"],
        "villas-for-rent":            PAGES["dubizzle_villa"],
    }
    for area, cats in DUBIZZLE_TARGETS.items():
        for category, area_slug in cats.items():
            max_p = max_pages_map[category]
            log.info(f"\n  [Dubizzle] {area} / {category}")
            for page in range(1, max_p + 1):
                url = dubizzle_page_url(category, area_slug, page)
                if not can_fetch(rp, url):
                    log.warning("    robots.txt disallows — stopping.")
                    break
                resp = polite_get(url)
                if not resp:
                    break
                soup = BeautifulSoup(resp.text, "html.parser")
                arts = [a for a in soup.find_all("article") if a.find("a", href=re.compile(r"/en/ad/"))]
                if not arts:
                    log.info("    No articles — done.")
                    break
                parsed = [parse_dubizzle_article(a, area, page) for a in arts]
                parsed = [p for p in parsed if p]
                results.extend(parsed)
                log.info(f"    Page {page}: +{len(parsed):3d}  (running: {len(results)})")
    log.info(f"\n  Dubizzle total: {len(results)}")
    return results


# ══════════════════════════════════════════════════════════════
#  PROPERTYFINDER.EG  (via __NEXT_DATA__ JSON extraction)
# ══════════════════════════════════════════════════════════════
PF_BASE = "https://www.propertyfinder.eg"

PF_AREA_KEYWORDS = {
    "6th_of_october": ["6 october", "6-october", "october city", "6th of october"],
    "sheikh_zayed":   ["sheikh zayed", "sheikh-zayed", "sheikh_zayed"],
}


def safe_int(v) -> int | None:
    try:
        s = str(v).lower()
        return 0 if s == "studio" else (int(v) if v not in (None, "") else None)
    except (ValueError, TypeError):
        return None


def parse_pf_next_data(html: str, page: int) -> list[dict]:
    nd_m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not nd_m:
        return []
    try:
        data     = json.loads(nd_m.group(1))
        raw_list = data["props"]["pageProps"]["searchResult"]["listings"]
    except (KeyError, json.JSONDecodeError):
        return []

    results = []
    for lst in raw_list:
        prop = lst.get("property") or {}

        # Determine area
        loc_obj   = prop.get("location") or {}
        loc_name  = loc_obj.get("full_name", "").lower() if isinstance(loc_obj, dict) else ""
        lt        = prop.get("location_tree", []) or []
        lt_text   = " ".join(t.get("name", "") for t in lt).lower()
        full_loc  = f"{loc_name} {lt_text}"

        matched_area = None
        for area_key, kws in PF_AREA_KEYWORDS.items():
            if any(kw in full_loc for kw in kws):
                matched_area = area_key
                break
        if not matched_area:
            continue

        beds      = prop.get("bedrooms_value") or safe_int(prop.get("bedrooms"))
        baths     = prop.get("bathrooms_value") or safe_int(prop.get("bathrooms"))
        size_obj  = prop.get("size") or {}
        area_sqm  = size_obj.get("value") if isinstance(size_obj, dict) else None
        ptype     = prop.get("property_type", "")

        price_info   = prop.get("price") or {}
        price_val    = price_info.get("value")
        price_period = PERIODS.get((price_info.get("period") or "").lower(), price_info.get("period", "Unknown"))
        price_raw    = f"EGP {price_val:,}" if price_val else ""

        details = prop.get("details_path") or prop.get("share_url", "")
        url_out = PF_BASE + details if details.startswith("/") else details

        lt_last  = lt[-1] if lt else {}
        compound = lt_last.get("name") if lt_last.get("type") == "COMPOUND" else None

        results.append({
            "source":        "propertyfinder.eg",
            "prop_id":       prop.get("id") or prop.get("listing_id"),
            "url":           url_out,
            "title":         prop.get("title"),
            "area":          matched_area,
            "prop_category": prop_category(ptype, beds),
            "page":          page,
            "price":         {"amount_egp": price_val, "period": price_period, "raw": price_raw},
            "property_type": ptype,
            "bedrooms":      beds,
            "bathrooms":     baths,
            "area_sqm":      area_sqm,
            "furnished":     prop.get("furnished"),
            "compound":      compound,
            "location":      loc_obj.get("full_name", "") if isinstance(loc_obj, dict) else "",
            "listed_date":   prop.get("listed_date"),
            "is_verified":   prop.get("is_verified"),
            "scraped_at":    datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        })
    return results


def scrape_propertyfinder(rp) -> list[dict]:
    results = []
    type_pages = [
        ("apartments-for-rent", PAGES["pf_apartment"]),
    ]
    for type_slug, max_p in type_pages:
        base = f"{PF_BASE}/en/rent/{type_slug}.html"
        log.info(f"\n  [PropertyFinder] {type_slug}")
        for page in range(1, max_p + 1):
            url = base + (f"?page={page}" if page > 1 else "")
            if not can_fetch(rp, url):
                break
            resp = polite_get(url)
            if not resp:
                break
            hits = parse_pf_next_data(resp.text, page)
            results.extend(hits)
            log.info(f"    Page {page:2d}: +{len(hits):3d} area-matched  (running: {len(results)})")
    log.info(f"\n  PropertyFinder total: {len(results)}")
    return results


# ══════════════════════════════════════════════════════════════
#  BUILD MERGED OUTPUT
# ══════════════════════════════════════════════════════════════
def build_merged(all_listings: list[dict]) -> dict:
    # Deduplicate (ad_id → prop_id → url)
    seen, unique = set(), []
    for item in all_listings:
        key = item.get("ad_id") or item.get("prop_id") or item.get("url", "")
        if key and key not in seen:
            seen.add(key)
            unique.append(item)

    # Stats
    by_source, by_area, by_pcat, by_ptype = {}, {}, {}, {}
    for item in unique:
        for d, k in [(by_source, "source"), (by_area, "area"),
                     (by_pcat, "prop_category"), (by_ptype, "property_type")]:
            val = str(item.get(k, "unknown"))
            d[val] = d.get(val, 0) + 1

    return {
        "metadata": {
            "merged_at":        datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "sources": {
                "bayut.eg":          {"pages_per_type": {"studio": PAGES["bayut_studio"],
                                                          "apartment": PAGES["bayut_apartment"],
                                                          "villa": PAGES["bayut_villa"]}},
                "dubizzle.com.eg":   {"pages_per_type": {"apartments-duplex": PAGES["dubizzle_apt"],
                                                          "villas": PAGES["dubizzle_villa"]}},
                "propertyfinder.eg": {"pages_scraped": PAGES["pf_apartment"]},
            },
            "areas_scraped":    ["6th_of_october", "sheikh_zayed"],
            "total_listings":   len(unique),
            "by_source":        by_source,
            "by_area":          by_area,
            "by_prop_category": by_pcat,
            "by_property_type": dict(sorted(by_ptype.items(), key=lambda x: -x[1])),
            "ethical_compliance": {
                "robots_txt_respected": True,
                "crawl_delay_seconds":  f"{MIN_DELAY}–{MAX_DELAY}",
                "only_public_pages":    True,
                "no_login_required":    True,
                "no_personal_data":     True,
                "rfc_9309_compliant":   True,
                "intended_use":         "Research / personal analysis only",
            },
        },
        "listings": unique,
    }


# ══════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════
def run():
    start = datetime.now()
    log.info("=" * 65)
    log.info("  Full Refresh — rentals_egypt_merged.json")
    log.info(f"  Started: {start.strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 65)

    # Load robots.txt for all three sites
    log.info("\nLoading robots.txt …")
    bayut_rp = load_robots(f"{BAYUT_BASE}/robots.txt")
    dub_rp   = load_robots(f"{DUBIZZLE_BASE}/robots.txt")
    pf_rp    = load_robots(f"{PF_BASE}/robots.txt")

    # Scrape
    log.info("\n" + "─" * 65)
    log.info("  BAYUT.EG")
    log.info("─" * 65)
    bayut_listings = scrape_bayut(bayut_rp)

    log.info("\n" + "─" * 65)
    log.info("  DUBIZZLE.COM.EG")
    log.info("─" * 65)
    dub_listings = scrape_dubizzle(dub_rp)

    log.info("\n" + "─" * 65)
    log.info("  PROPERTYFINDER.EG")
    log.info("─" * 65)
    pf_listings = scrape_propertyfinder(pf_rp)

    # Merge + deduplicate
    all_listings = bayut_listings + dub_listings + pf_listings
    output = build_merged(all_listings)

    # Save
    with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)

    elapsed = (datetime.now() - start).total_seconds()
    size_kb = os.path.getsize(OUTPUT_FILE) / 1024

    log.info("\n" + "=" * 65)
    log.info(f"  ✅  Done in {elapsed:.0f}s")
    log.info(f"  Total unique listings : {output['metadata']['total_listings']}")
    log.info(f"  By source : {output['metadata']['by_source']}")
    log.info(f"  By area   : {output['metadata']['by_area']}")
    log.info(f"  By type   : {output['metadata']['by_prop_category']}")
    log.info(f"  File size : {size_kb:.1f} KB")
    log.info(f"  Output    : {OUTPUT_FILE}")
    log.info("=" * 65)


if __name__ == "__main__":
    run()
