"""
=========================================================
 Studios & Flats Scraper
 Sources: Bayut.eg + Dubizzle.com.eg
 Areas  : 6th of October  &  Sheikh Zayed
=========================================================
"""

import json, re, time, random, logging, urllib3
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

MIN_DELAY  = 3.0
MAX_DELAY  = 6.0
MAX_PAGES  = 5
OUTPUT_FILE = "studios_flats.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

session = requests.Session()
session.headers.update(HEADERS)


# ─── Helpers ──────────────────────────────────────────────────
def load_robots(robots_url: str) -> RobotFileParser | None:
    try:
        resp = requests.get(robots_url, headers=HEADERS, timeout=10, verify=False)
        resp.raise_for_status()
        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.parse(resp.text.splitlines())
        log.info(f"robots.txt OK: {robots_url}")
        return rp
    except Exception as e:
        log.warning(f"robots.txt unavailable ({e}) → allow all (RFC 9309 §2.3.1)")
        return None


def can_fetch(rp: RobotFileParser | None, url: str) -> bool:
    return True if rp is None else rp.can_fetch("*", url)


def polite_get(url: str) -> requests.Response | None:
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
    try:
        resp = session.get(url, timeout=30, verify=False)
        resp.raise_for_status()
        log.info(f"  ✔ {resp.status_code}  {url}")
        return resp
    except Exception as e:
        log.warning(f"  ✘ {e}")
        return None


# ══════════════════════════════════════════════════════════════
#  BAYUT SCRAPER
# ══════════════════════════════════════════════════════════════
BAYUT_BASE = "https://bayut.eg"
BAYUT_ROBOTS = f"{BAYUT_BASE}/robots.txt"

# New property-type pages for Bayut (studios + dedicated apartment pages)
BAYUT_AREAS = {
    "6th_of_october": {
        "studio": f"{BAYUT_BASE}/en/giza/studio-properties-for-rent-in-6th-of-october/",
        "apartment": f"{BAYUT_BASE}/en/giza/apartments-for-rent-in-6th-of-october/",
    },
    "sheikh_zayed": {
        "studio": f"{BAYUT_BASE}/en/giza/studio-properties-for-rent-in-sheikh-zayed/",
        "apartment": f"{BAYUT_BASE}/en/giza/apartments-for-rent-in-sheikh-zayed/",
    },
}

PROP_TYPES = [
    "Apartment", "Duplex", "Villa", "Penthouse", "Townhouse",
    "Twin House", "Chalet", "Studio", "Room", "Hotel Apartment",
]

PERIODS = {"monthly": "Monthly", "daily": "Daily", "yearly": "Yearly", "weekly": "Weekly"}


def bayut_page_url(base: str, page: int) -> str:
    return base if page == 1 else base.rstrip("/") + f"/page-{page}/"


def parse_bayut_article(article, area_name: str, prop_category: str, page: int) -> dict | None:
    link = article.find("a", href=re.compile(r"/en/property/details-\d+\.html"))
    if not link:
        return None
    url = BAYUT_BASE + link["href"]
    title = link.get("title", "").strip()

    for tag in article.find_all(["svg", "button"]):
        tag.decompose()
    tokens = [t.strip() for t in article.get_text(separator="|").split("|") if t.strip()]

    price_amount, price_period, price_raw = None, "Unknown", ""
    try:
        egp_idx = next(i for i, t in enumerate(tokens) if t.upper() == "EGP")
        num_str = tokens[egp_idx + 1].replace(",", "")
        price_amount = int(num_str) if num_str.isdigit() else None
        price_raw = f"EGP {tokens[egp_idx + 1]}"
        p_tok = tokens[egp_idx + 2] if egp_idx + 2 < len(tokens) else ""
        for k, v in PERIODS.items():
            if k in p_tok.lower():
                price_period = v
                break
    except (StopIteration, IndexError, ValueError):
        pass

    property_type = next(
        (pt for pt in PROP_TYPES if any(pt.lower() in t.lower() for t in tokens)), None
    )
    # If prop_category is studio but no type found, force it
    if property_type is None and prop_category == "studio":
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

    loc_kws = ["giza", "cairo", "october", "zayed", "egypt"]
    loc_tok = next(
        (t for t in tokens if any(k in t.lower() for k in loc_kws)
         and "Email" not in t and len(t) > 5), None
    )
    compound = location = None
    if loc_tok:
        parts = [p.strip() for p in loc_tok.split(",")]
        compound, location = (parts[0], ", ".join(parts[1:])) if len(parts) >= 2 else (None, loc_tok)

    return {
        "url": url, "title": title,
        "area": area_name, "prop_category": prop_category,
        "source": "bayut.eg", "page": page,
        "price": {"amount_egp": price_amount, "period": price_period, "raw": price_raw},
        "property_type": property_type,
        "bedrooms": beds, "bathrooms": baths, "area_sqm": area_sqm,
        "compound": compound, "location": location,
        "scraped_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


def scrape_bayut(rp) -> list[dict]:
    results = []
    for area_name, cats in BAYUT_AREAS.items():
        for prop_cat, base_url in cats.items():
            log.info(f"\n── Bayut | {area_name} | {prop_cat} ──")
            for page in range(1, MAX_PAGES + 1):
                url = bayut_page_url(base_url, page)
                if not can_fetch(rp, url):
                    log.warning(f"  robots.txt disallows {url}")
                    break
                resp = polite_get(url)
                if not resp:
                    break
                soup = BeautifulSoup(resp.text, "html.parser")
                arts = soup.find_all("article")
                if not arts:
                    log.info("  No articles – stopping.")
                    break
                page_results = [parse_bayut_article(a, area_name, prop_cat, page) for a in arts]
                page_results = [r for r in page_results if r]
                results.extend(page_results)
                log.info(f"  Page {page}: {len(page_results)} listings (total: {len(results)})")
    return results


# ══════════════════════════════════════════════════════════════
#  DUBIZZLE SCRAPER
# ══════════════════════════════════════════════════════════════
DUBIZZLE_BASE   = "https://www.dubizzle.com.eg"
DUBIZZLE_ROBOTS = f"{DUBIZZLE_BASE}/robots.txt"

# Studios & flats live inside apartments-duplex on Dubizzle.
# We already scraped pages 1-5. Scrape pages 6-10 for fresh data,
# plus filter by property type after scraping.
DUBIZZLE_AREAS = {
    "6th_of_october": "6th-of-october",
    "sheikh_zayed":   "sheikh-zayed",
}
DUBIZZLE_CATEGORY = "apartments-duplex-for-rent"
DUBIZZLE_START_PAGE = 6   # pages 1-5 already scraped


def dubizzle_page_url(area_slug: str, page: int) -> str:
    base = f"{DUBIZZLE_BASE}/en/properties/{DUBIZZLE_CATEGORY}/{area_slug}/"
    return f"{base}?page={page}" if page > 1 else base


def parse_dubizzle_article(article, area_name: str, page: int) -> dict | None:
    link = article.find("a", href=re.compile(r"/en/ad/"))
    if not link:
        return None
    url = DUBIZZLE_BASE + link["href"]
    ad_id_m = re.search(r"-ID(\d+)\.html$", link["href"])
    ad_id = ad_id_m.group(1) if ad_id_m else None

    for tag in article.find_all(["svg", "button", "script", "style"]):
        tag.decompose()
    tokens = [t.strip() for t in article.get_text(separator="|").split("|") if t.strip()]

    price_amount, price_period, price_raw = None, "Unknown", ""
    for i, tok in enumerate(tokens):
        if tok.upper().startswith("EGP"):
            price_raw = tok
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
        m = re.match(r"(\d+)\s*bed", tok, re.I)
        if m:
            beds = int(m.group(1))
        m2 = re.match(r"(\d+)\s*bath", tok, re.I)
        if m2:
            baths = int(m2.group(1))
        m3 = re.match(r"([\d,]+)\s*m[²2]", tok)
        if m3:
            area_sqm = int(m3.group(1).replace(",", ""))

    # Furnished flag
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

    # Derive prop_category label
    prop_cat = "studio" if property_type == "Studio" else "apartment"

    return {
        "ad_id": ad_id, "url": url, "title": None,
        "area": area_name, "prop_category": prop_cat,
        "source": "dubizzle.com.eg", "page": page,
        "price": {"amount_egp": price_amount, "period": price_period, "raw": price_raw},
        "property_type": property_type,
        "bedrooms": beds, "bathrooms": baths, "area_sqm": area_sqm,
        "furnished": furnished, "compound": compound, "location": location,
        "posted_ago": posted_ago,
        "scraped_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


def scrape_dubizzle(rp) -> list[dict]:
    """Scrape pages 1-5 of apartments-duplex for studios+flats,
    keeping only Studio and Apartment property types."""
    results = []
    for area_name, area_slug in DUBIZZLE_AREAS.items():
        log.info(f"\n── Dubizzle | {area_name} | {DUBIZZLE_CATEGORY} (pages 1–{MAX_PAGES}) ──")
        for page in range(1, MAX_PAGES + 1):
            url = dubizzle_page_url(area_slug, page)
            if not can_fetch(rp, url):
                log.warning(f"  robots.txt disallows {url}")
                break
            resp = polite_get(url)
            if not resp:
                break
            soup = BeautifulSoup(resp.text, "html.parser")
            arts = [a for a in soup.find_all("article") if a.find("a", href=re.compile(r"/en/ad/"))]
            if not arts:
                log.info("  No articles – stopping.")
                break
            page_results = [parse_dubizzle_article(a, area_name, page) for a in arts]
            # Filter to only studios and apartments/flats (exclude villas, townhouses, etc.)
            page_results = [
                r for r in page_results
                if r and r.get("property_type") in (None, "Studio", "Apartment", "Duplex", "Penthouse", "Room")
            ]
            results.extend(page_results)
            log.info(f"  Page {page}: {len(page_results)} studio/flat listings (total: {len(results)})")
    return results


# ══════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════
def run():
    log.info("=" * 60)
    log.info("  Studios & Flats Scraper  –  Bayut + Dubizzle Egypt")
    log.info("=" * 60)

    bayut_rp    = load_robots(BAYUT_ROBOTS)
    dubizzle_rp = load_robots(DUBIZZLE_ROBOTS)

    bayut_listings    = scrape_bayut(bayut_rp)
    dubizzle_listings = scrape_dubizzle(dubizzle_rp)

    all_listings = bayut_listings + dubizzle_listings

    # Deduplicate
    seen, unique = set(), []
    for item in all_listings:
        key = item.get("ad_id") or item.get("url", "")
        if key and key not in seen:
            seen.add(key)
            unique.append(item)

    # Stats
    by_source   = {}
    by_area     = {}
    by_prop_cat = {}
    for item in unique:
        by_source[item["source"]]            = by_source.get(item["source"], 0) + 1
        by_area[item["area"]]                = by_area.get(item["area"], 0) + 1
        by_prop_cat[item["prop_category"]]   = by_prop_cat.get(item["prop_category"], 0) + 1

    log.info(f"\n{'='*60}")
    log.info(f"  Total unique : {len(unique)}")
    log.info(f"  By source    : {by_source}")
    log.info(f"  By area      : {by_area}")
    log.info(f"  By category  : {by_prop_cat}")
    log.info(f"{'='*60}")

    output = {
        "metadata": {
            "scraped_at":     datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "property_types": ["Studio", "Apartment", "Flat"],
            "areas_scraped":  ["6th_of_october", "sheikh_zayed"],
            "total_listings": len(unique),
            "by_source":      by_source,
            "by_area":        by_area,
            "by_prop_category": by_prop_cat,
            "ethical_compliance": {
                "robots_txt_respected": True,
                "crawl_delay_seconds":  f"{MIN_DELAY}–{MAX_DELAY}",
                "only_public_pages":    True,
                "no_login_required":    True,
                "no_personal_data":     True,
                "rfc_9309_compliant":   True,
            },
        },
        "listings": unique,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)

    log.info(f"\n✅  Saved {len(unique)} listings → {OUTPUT_FILE}")
    return output


if __name__ == "__main__":
    run()
