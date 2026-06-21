"""
=======================================================================
 Multi-Source Studios & Small Apartments Scraper  v3.0
 Sources : Bayut.eg | Dubizzle.com.eg | PropertyFinder.eg
 Areas   : 6th of October  &  Sheikh Zayed
 Focus   : Studios + Small apartments (1–2 bedrooms)
=======================================================================
"""

import json, re, time, random, logging, urllib3
from datetime import datetime
from urllib.robotparser import RobotFileParser
import requests
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ─── Global config ────────────────────────────────────────────
MIN_DELAY   = 3.0
MAX_DELAY   = 6.0
MAX_PAGES   = 8
OUTPUT_FILE = "studios_small_apts_v3.json"

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


def load_robots(robots_url: str) -> RobotFileParser | None:
    try:
        r = requests.get(robots_url, headers=HEADERS, timeout=10, verify=False)
        r.raise_for_status()
        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.parse(r.text.splitlines())
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
        r = session.get(url, timeout=30, verify=False, allow_redirects=True)
        r.raise_for_status()
        log.info(f"  ✔ {r.status_code}  {url}")
        return r
    except Exception as e:
        log.warning(f"  ✘ {url} → {e}")
        return None


def is_small(beds: int | None, prop_type: str | None) -> bool:
    """True if a studio or 1-2 bedroom apartment/flat."""
    if (prop_type or "").lower() in ("studio", "room"):
        return True
    if beds is None:
        return True  # unknown bedrooms — include
    return beds <= 2


# ══════════════════════════════════════════════════════════════
#  1. BAYUT.EG
# ══════════════════════════════════════════════════════════════
BAYUT_BASE = "https://bayut.eg"

BAYUT_TARGETS = {
    "6th_of_october": {
        "studio":    f"{BAYUT_BASE}/en/giza/studio-properties-for-rent-in-6th-of-october/",
        "apartment": f"{BAYUT_BASE}/en/giza/apartments-for-rent-in-6th-of-october/",
    },
    "sheikh_zayed": {
        "studio":    f"{BAYUT_BASE}/en/giza/studio-properties-for-rent-in-sheikh-zayed/",
        "apartment": f"{BAYUT_BASE}/en/giza/apartments-for-rent-in-sheikh-zayed/",
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
        p  = tokens[ei + 2].lower() if ei + 2 < len(tokens) else ""
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

    if not is_small(beds, property_type):
        return None  # skip large properties

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
        "area": area, "prop_category": prop_cat,
        "page": page,
        "price": {"amount_egp": price_amount, "period": price_period, "raw": price_raw},
        "property_type": property_type,
        "bedrooms": beds, "bathrooms": baths, "area_sqm": area_sqm,
        "compound": compound, "location": location,
        "scraped_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


def scrape_bayut(rp) -> list[dict]:
    results = []
    for area, cats in BAYUT_TARGETS.items():
        for prop_cat, base_url in cats.items():
            log.info(f"\n── Bayut | {area} | {prop_cat} ──")
            for page in range(1, MAX_PAGES + 1):
                url = bayut_page_url(base_url, page)
                if not can_fetch(rp, url):
                    break
                resp = polite_get(url)
                if not resp:
                    break
                soup = BeautifulSoup(resp.text, "html.parser")
                arts = soup.find_all("article")
                if not arts:
                    log.info("  No articles – done.")
                    break
                parsed = [parse_bayut_article(a, area, prop_cat, page) for a in arts]
                parsed = [p for p in parsed if p]
                results.extend(parsed)
                log.info(f"  Page {page}: +{len(parsed)} (total {len(results)})")
                if len(arts) < 20:  # last page
                    break
    return results


# ══════════════════════════════════════════════════════════════
#  2. DUBIZZLE.COM.EG
# ══════════════════════════════════════════════════════════════
DUBIZZLE_BASE = "https://www.dubizzle.com.eg"

DUBIZZLE_AREAS = {
    "6th_of_october": "6th-of-october",
    "sheikh_zayed":   "sheikh-zayed",
}
DUBIZZLE_CATEGORY = "apartments-duplex-for-rent"


def dubizzle_page_url(area_slug: str, page: int) -> str:
    base = f"{DUBIZZLE_BASE}/en/properties/{DUBIZZLE_CATEGORY}/{area_slug}/"
    return f"{base}?page={page}" if page > 1 else base


def parse_dubizzle_article(article, area: str, page: int) -> dict | None:
    link = article.find("a", href=re.compile(r"/en/ad/"))
    if not link:
        return None
    url  = DUBIZZLE_BASE + link["href"]
    ad_id_m = re.search(r"-ID(\d+)\.html$", link["href"])
    ad_id = ad_id_m.group(1) if ad_id_m else None

    for tag in article.find_all(["svg", "button", "script", "style"]):
        tag.decompose()
    tokens = [t.strip() for t in article.get_text(separator="|").split("|") if t.strip()]

    price_amount, price_period, price_raw = None, "Unknown", ""
    for i, tok in enumerate(tokens):
        if tok.upper().startswith("EGP"):
            price_raw    = tok
            price_amount = int(re.sub(r"[^\d]", "", tok)) if re.search(r"\d", tok) else None
            p_tok        = tokens[i + 1].lower() if i + 1 < len(tokens) else ""
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

    if not is_small(beds, property_type):
        return None

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
    prop_cat = "studio" if property_type == "Studio" else "apartment"

    return {
        "source": "dubizzle.com.eg",
        "ad_id": ad_id, "url": url,
        "area": area, "prop_category": prop_cat, "page": page,
        "price": {"amount_egp": price_amount, "period": price_period, "raw": price_raw},
        "property_type": property_type,
        "bedrooms": beds, "bathrooms": baths, "area_sqm": area_sqm,
        "furnished": furnished, "compound": compound, "location": location,
        "posted_ago": posted_ago,
        "scraped_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


def scrape_dubizzle(rp) -> list[dict]:
    results = []
    for area, area_slug in DUBIZZLE_AREAS.items():
        log.info(f"\n── Dubizzle | {area} ──")
        for page in range(1, MAX_PAGES + 1):
            url = dubizzle_page_url(area_slug, page)
            if not can_fetch(rp, url):
                break
            resp = polite_get(url)
            if not resp:
                break
            soup = BeautifulSoup(resp.text, "html.parser")
            arts = [a for a in soup.find_all("article") if a.find("a", href=re.compile(r"/en/ad/"))]
            if not arts:
                log.info("  No articles – done.")
                break
            parsed = [parse_dubizzle_article(a, area, page) for a in arts]
            parsed = [p for p in parsed if p]
            results.extend(parsed)
            log.info(f"  Page {page}: +{len(parsed)} studios/small apts (total {len(results)})")
    return results


# ══════════════════════════════════════════════════════════════
#  3. PROPERTYFINDER.EG
# ══════════════════════════════════════════════════════════════
PF_BASE   = "https://www.propertyfinder.eg"

# PropertyFinder area location slugs for searchQuery
PF_AREAS = {
    "6th_of_october": "6-october-city",
    "sheikh_zayed":   "sheikh-zayed-city",
}

# Property type page URL slugs on PropertyFinder
PF_TYPE_PAGES = {
    "studio":    "studios-for-rent",
    "apartment": "apartments-for-rent",
}


def pf_url(prop_type_slug: str, area_slug_qs: str, page: int) -> str:
    """Build a PropertyFinder search URL.
    Uses the SEO listing page format: /en/rent/{type}.html?location={area}&page={n}
    """
    base = f"{PF_BASE}/en/rent/{prop_type_slug}.html"
    params = f"location={area_slug_qs}"
    if page > 1:
        params += f"&page={page}"
    return f"{base}?{params}"


def parse_pf_next_data(html: str, area: str, prop_cat: str, page: int) -> list[dict]:
    """Extract listings from PropertyFinder's __NEXT_DATA__ JSON."""
    nd_m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not nd_m:
        return []
    try:
        data = json.loads(nd_m.group(1))
        listings_raw = data["props"]["pageProps"]["searchResult"]["listings"]
    except (KeyError, json.JSONDecodeError):
        return []

    results = []
    for lst in listings_raw:
        prop = lst.get("property", {})
        if not prop:
            continue

        # Extract location
        loc_full = prop.get("location", {}) or {}
        loc_full_name = loc_full.get("full_name", "")
        loc_tree      = prop.get("location_tree", []) or []

        # Filter to our target areas
        area_keywords = {
            "6th_of_october": ["6 october", "6-october", "6th of october", "october city", "6_october"],
            "sheikh_zayed":   ["sheikh zayed", "sheikh-zayed", "sheikh_zayed"],
        }
        loc_text = (loc_full_name + " " + " ".join(t.get("name", "") for t in loc_tree)).lower()
        if not any(kw in loc_text for kw in area_keywords.get(area, [])):
            continue

        def safe_int(v):
            try:
                return int(v) if v not in (None, "", "studio") else (0 if v == "studio" else None)
            except (ValueError, TypeError):
                return None
        beds  = prop.get("bedrooms_value") or safe_int(prop.get("bedrooms"))
        baths = prop.get("bathrooms_value") or safe_int(prop.get("bathrooms"))
        size  = prop.get("size", {}) or {}
        area_sqm = size.get("value") if isinstance(size, dict) else None

        if not is_small(beds, prop.get("property_type")):
            continue

        price_info = prop.get("price", {}) or {}
        price_amount = price_info.get("value")
        price_period = PERIODS.get((price_info.get("period") or "").lower(), price_info.get("period", "Unknown"))
        price_raw    = f"EGP {price_amount:,}" if price_amount else ""

        details_path = prop.get("details_path") or prop.get("share_url", "")
        url = PF_BASE + details_path if details_path.startswith("/") else details_path

        # Compound / location
        compound = loc_tree[-1]["name"] if loc_tree and loc_tree[-1].get("type") == "COMPOUND" else None
        location = loc_full_name

        results.append({
            "source":        "propertyfinder.eg",
            "prop_id":       prop.get("id") or prop.get("listing_id"),
            "url":           url,
            "title":         prop.get("title"),
            "area":          area,
            "prop_category": prop_cat,
            "page":          page,
            "price": {
                "amount_egp": price_amount,
                "period":     price_period,
                "raw":        price_raw,
            },
            "property_type": prop.get("property_type"),
            "bedrooms":      beds,
            "bathrooms":     baths,
            "area_sqm":      area_sqm,
            "furnished":     prop.get("furnished"),
            "compound":      compound,
            "location":      location,
            "listed_date":   prop.get("listed_date"),
            "is_verified":   prop.get("is_verified"),
            "scraped_at":    datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        })

    return results


def scrape_propertyfinder(rp) -> list[dict]:
    results = []
    for area, area_qs in PF_AREAS.items():
        for prop_cat, type_slug in PF_TYPE_PAGES.items():
            log.info(f"\n── PropertyFinder | {area} | {prop_cat} ──")
            for page in range(1, MAX_PAGES + 1):
                url = pf_url(type_slug, area_qs, page)
                if not can_fetch(rp, url):
                    break
                resp = polite_get(url)
                if not resp:
                    break
                page_listings = parse_pf_next_data(resp.text, area, prop_cat, page)
                results.extend(page_listings)
                log.info(f"  Page {page}: +{len(page_listings)} (total {len(results)})")
                if len(page_listings) == 0:
                    log.info("  No area-matched listings – trying next page or stopping.")
                    if page >= 3:  # give it a few pages before stopping
                        break
    return results


# ══════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════
def run():
    log.info("=" * 70)
    log.info("  Multi-Source Studios & Small Apts Scraper  v3.0")
    log.info("  Sources: Bayut.eg | Dubizzle.com.eg | PropertyFinder.eg")
    log.info("  Areas  : 6th of October  &  Sheikh Zayed")
    log.info("  Filter : Studios + apartments ≤2 bedrooms")
    log.info("=" * 70)

    bayut_rp = load_robots(f"{BAYUT_BASE}/robots.txt")
    dub_rp   = load_robots(f"{DUBIZZLE_BASE}/robots.txt")
    pf_rp    = load_robots(f"{PF_BASE}/robots.txt")

    log.info("\n>>> Scraping Bayut.eg …")
    bayut_listings = scrape_bayut(bayut_rp)

    log.info("\n>>> Scraping Dubizzle.com.eg …")
    dub_listings = scrape_dubizzle(dub_rp)

    log.info("\n>>> Scraping PropertyFinder.eg …")
    pf_listings = scrape_propertyfinder(pf_rp)

    all_listings = bayut_listings + dub_listings + pf_listings

    # Deduplicate
    seen, unique = set(), []
    for item in all_listings:
        key = item.get("ad_id") or item.get("prop_id") or item.get("url", "")
        if key and key not in seen:
            seen.add(key)
            unique.append(item)

    # Stats
    by_source = {}
    by_area   = {}
    by_pcat   = {}
    for item in unique:
        by_source[item["source"]] = by_source.get(item["source"], 0) + 1
        by_area[item["area"]]     = by_area.get(item["area"], 0) + 1
        by_pcat[item.get("prop_category","?")] = by_pcat.get(item.get("prop_category","?"), 0) + 1

    log.info(f"\n{'='*70}")
    log.info(f"  Total unique : {len(unique)}")
    log.info(f"  By source    : {by_source}")
    log.info(f"  By area      : {by_area}")
    log.info(f"  By category  : {by_pcat}")
    log.info(f"{'='*70}")

    output = {
        "metadata": {
            "scraped_at":     datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "sources":        ["bayut.eg", "dubizzle.com.eg", "propertyfinder.eg"],
            "property_focus": "Studios + Small Apartments (≤2 bedrooms)",
            "areas_scraped":  ["6th_of_october", "sheikh_zayed"],
            "total_listings": len(unique),
            "by_source":      by_source,
            "by_area":        by_area,
            "by_prop_category": by_pcat,
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
    log.info(f"\n✅  Saved → {OUTPUT_FILE}")
    return output


if __name__ == "__main__":
    run()
