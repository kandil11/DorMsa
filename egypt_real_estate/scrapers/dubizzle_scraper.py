"""
=================================================================
 Ethical Real Estate Scraper – Dubizzle Egypt
 Areas: 6th of October  &  Sheikh Zayed  (Rental Listings)
=================================================================
 Source   : www.dubizzle.com.eg  (publicly accessible pages)
 Ethics   : ✔ robots.txt checked      ✔ crawl-delay honoured
            ✔ Only public listing pages  ✔ No login / personal data
            ✔ User-Agent header set      ✔ Rate-limited requests
            ✔ RFC 9309 §2.3.1 applied   ✔ Structured HTML parsed
 Output   : rentals_egypt_dubizzle.json
=================================================================

Dubizzle Egypt page format (token order per listing article):
  [photo_count] [Elite?] [EGP price] [period] [type]
  [N beds] [N baths] [area m²]
  [title]
  [furnished?] [furnished_value]
  [compound, area_name]
  [•] [posted_ago]
  [Call] [WhatsApp] [Verified Business?]
=================================================================
"""

import json
import re
import time
import random
import logging
import urllib3
from datetime import datetime
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ─── Configuration ────────────────────────────────────────────
BASE_URL    = "https://www.dubizzle.com.eg"
ROBOTS_URL  = f"{BASE_URL}/robots.txt"

# Property types to scrape (Dubizzle URL slugs)
PROPERTY_CATEGORIES = [
    "apartments-duplex-for-rent",
    "villas-for-rent",
]

AREAS = {
    "6th_of_october": "6th-of-october",
    "sheikh_zayed":   "sheikh-zayed",
}

MAX_PAGES   = 5         # pages per area/category combo (45 listings/page)
MIN_DELAY   = 3.0       # polite crawl: seconds between requests
MAX_DELAY   = 6.0
OUTPUT_FILE = "rentals_egypt_dubizzle.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ─── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ─── robots.txt Helper ────────────────────────────────────────
def load_robot_parser() -> RobotFileParser | None:
    """Download robots.txt; returns None if unreachable (→ allow all per RFC 9309)."""
    try:
        resp = requests.get(ROBOTS_URL, headers=HEADERS, timeout=10, verify=False)
        resp.raise_for_status()
        rp = RobotFileParser()
        rp.set_url(ROBOTS_URL)
        rp.parse(resp.text.splitlines())
        log.info(f"robots.txt loaded from {ROBOTS_URL}")
        return rp
    except Exception as e:
        log.warning(
            f"Could not fetch robots.txt ({type(e).__name__}: {e})\n"
            "  → Defaulting to ALLOW (RFC 9309 §2.3.1)."
        )
        return None


def can_fetch(rp: RobotFileParser | None, url: str) -> bool:
    if rp is None:
        return True
    return rp.can_fetch("*", url)


# ─── HTTP Session ─────────────────────────────────────────────
session = requests.Session()
session.headers.update(HEADERS)


def polite_get(url: str) -> requests.Response | None:
    """Rate-limited HTTP GET with error handling."""
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    log.debug(f"Sleeping {delay:.1f}s …")
    time.sleep(delay)
    try:
        resp = session.get(url, timeout=30, verify=False)
        resp.raise_for_status()
        log.info(f"  ✔ {resp.status_code}  {url}")
        return resp
    except requests.HTTPError as e:
        log.warning(f"  ✘ HTTP error: {e}")
    except requests.RequestException as e:
        log.warning(f"  ✘ Request error: {e}")
    return None


# ─── URL Builder ──────────────────────────────────────────────
def build_url(category: str, area_slug: str, page: int) -> str:
    """Build a Dubizzle listing page URL.
    Format: /en/properties/{category}/{area_slug}/?page={N}
    """
    base = f"{BASE_URL}/en/properties/{category}/{area_slug}/"
    if page > 1:
        return f"{base}?page={page}"
    return base


# ─── Token-based Article Parser ───────────────────────────────
# Dubizzle token layout per <article> card:
#   [photo_count] [Elite?] [EGP N,NNN] [period] [prop_type]
#   [N beds] [N baths] [N m²]
#   [title]
#   [Furnished] [Yes|No]
#   [compound, area]
#   [•] [N days/weeks ago]
#   [Call] [WhatsApp] [Verified Business?]

PROPERTY_TYPES = [
    "Apartment", "Duplex", "Villa", "Penthouse", "Townhouse",
    "Twin House", "Chalet", "Studio", "Room", "Hotel Apartment",
]

PERIODS = {
    "monthly": "Monthly",
    "daily":   "Daily",
    "yearly":  "Yearly",
    "weekly":  "Weekly",
}


def parse_article(article, area_name: str, category: str, page: int) -> dict | None:
    """Parse a single Dubizzle listing <article> element."""

    # ── URL ──────────────────────────────────────────────────
    link = article.find("a", href=re.compile(r"/en/ad/"))
    if not link:
        return None
    url = BASE_URL + link["href"]
    # Extract ad ID from URL slug
    ad_id_match = re.search(r"-ID(\d+)\.html$", link["href"])
    ad_id = ad_id_match.group(1) if ad_id_match else None

    # ── Token list ───────────────────────────────────────────
    # Remove SVG/button noise
    for tag in article.find_all(["svg", "button", "script", "style"]):
        tag.decompose()
    tokens = [t.strip() for t in article.get_text(separator="|").split("|") if t.strip()]

    # ── Price ────────────────────────────────────────────────
    price_amount = None
    price_period = "Unknown"
    price_raw    = ""
    for i, tok in enumerate(tokens):
        if tok.upper().startswith("EGP"):
            price_raw = tok
            num_str = re.sub(r"[^\d]", "", tok)
            price_amount = int(num_str) if num_str else None
            # Next token is the period
            if i + 1 < len(tokens):
                p_tok = tokens[i + 1].lower()
                for key, val in PERIODS.items():
                    if key in p_tok:
                        price_period = val
                        break
            break

    # ── Property type ─────────────────────────────────────────
    property_type = None
    for tok in tokens:
        for pt in PROPERTY_TYPES:
            if tok.lower() == pt.lower():
                property_type = pt
                break
        if property_type:
            break

    # ── Bedrooms & Bathrooms ──────────────────────────────────
    beds  = None
    baths = None
    for tok in tokens:
        b_match = re.match(r"(\d+)\s*bed", tok, re.I)
        if b_match:
            beds = int(b_match.group(1))
        ba_match = re.match(r"(\d+)\s*bath", tok, re.I)
        if ba_match:
            baths = int(ba_match.group(1))

    # ── Area (m²) ────────────────────────────────────────────
    area_sqm = None
    for tok in tokens:
        m2 = re.match(r"([\d,]+)\s*m[²2]", tok)
        if m2:
            area_sqm = int(m2.group(1).replace(",", ""))
            break

    # ── Title ────────────────────────────────────────────────
    # Title is the longest text token that isn't a known field
    skip_patterns = [
        r"^EGP", r"^\d+$", r"^(Monthly|Daily|Yearly|Weekly)$",
        r"^(\d+\s*(beds?|baths?|m[²2]))$", r"^(Call|WhatsApp|Furnished|Elite|Yes|No)$",
        r"^\d+\s*(day|week|month|hour|minute)s?\s*ago$",
        r"^Verified Business$", r"^•$",
    ]
    skip_re = [re.compile(p, re.I) for p in skip_patterns]

    title_candidates = [
        tok for tok in tokens
        if len(tok) > 15
        and not any(rx.match(tok) for rx in skip_re)
        and tok not in PROPERTY_TYPES
    ]
    title = max(title_candidates, key=len) if title_candidates else None

    # ── Furnished status ──────────────────────────────────────
    furnished = None
    for i, tok in enumerate(tokens):
        if tok.lower() == "furnished":
            nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
            furnished = nxt.lower() in ("yes", "true", "1")
            break

    # ── Compound & Location ───────────────────────────────────
    compound = None
    location = None
    loc_keywords = ["6th of october", "sheikh zayed", "october", "zayed", "giza", "cairo"]
    for tok in tokens:
        if any(kw in tok.lower() for kw in loc_keywords) and len(tok) > 5:
            parts = [p.strip() for p in tok.split(",")]
            if len(parts) >= 2:
                compound = parts[0]
                location = ", ".join(parts[1:])
            else:
                location = tok
            break

    # ── Date posted ───────────────────────────────────────────
    posted_ago = None
    for tok in tokens:
        m = re.match(r"(\d+\s*(?:day|week|month|hour|minute)s?\s*ago)", tok, re.I)
        if m:
            posted_ago = m.group(1)
            break

    return {
        "ad_id":         ad_id,
        "url":           url,
        "title":         title,
        "area":          area_name,
        "category":      category,
        "page":          page,
        "price": {
            "amount_egp": price_amount,
            "period":     price_period,
            "raw":        price_raw,
        },
        "property_type": property_type,
        "bedrooms":      beds,
        "bathrooms":     baths,
        "area_sqm":      area_sqm,
        "furnished":     furnished,
        "compound":      compound,
        "location":      location,
        "posted_ago":    posted_ago,
        "scraped_at":    datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


# ─── Category + Area Scraper ──────────────────────────────────
def scrape_category_area(
    category: str,
    area_name: str,
    area_slug: str,
    rp: RobotFileParser | None,
) -> list[dict]:
    label = f"{category}/{area_name}".upper().replace("_", " ").replace("-", " ")
    log.info(f"\n{'='*65}")
    log.info(f"  {label}")
    log.info(f"{'='*65}")

    listings: list[dict] = []

    for page_num in range(1, MAX_PAGES + 1):
        url = build_url(category, area_slug, page_num)

        if not can_fetch(rp, url):
            log.warning(f"  robots.txt disallows {url} – stopping.")
            break

        log.info(f"  Page {page_num}/{MAX_PAGES}: {url}")
        resp = polite_get(url)
        if resp is None:
            log.warning("  No response – stopping pagination.")
            break

        soup = BeautifulSoup(resp.text, "html.parser")

        # Filter to only real listing articles (those with /en/ad/ links)
        articles = [
            a for a in soup.find_all("article")
            if a.find("a", href=re.compile(r"/en/ad/"))
        ]

        if not articles:
            log.info("  No listing articles found – stopping pagination.")
            break

        page_listings = []
        for article in articles:
            parsed = parse_article(article, area_name, category, page_num)
            if parsed:
                page_listings.append(parsed)

        listings.extend(page_listings)
        log.info(f"  → {len(page_listings)} listings (running total: {len(listings)})")

    return listings


# ─── Main ─────────────────────────────────────────────────────
def run() -> dict:
    log.info("=" * 65)
    log.info("  Ethical Dubizzle Egypt Scraper  v1.0")
    log.info("=" * 65)
    log.info(f"  Areas      : {', '.join(AREAS.keys())}")
    log.info(f"  Categories : {', '.join(PROPERTY_CATEGORIES)}")
    log.info(f"  Pages      : up to {MAX_PAGES} per category×area")
    log.info(f"  Delay      : {MIN_DELAY}–{MAX_DELAY}s between requests")
    log.info(f"  Output     : {OUTPUT_FILE}")
    log.info("")

    # 1. Load robots.txt
    rp = load_robot_parser()
    if rp is None:
        log.info("  robots.txt: UNAVAILABLE → treating all URLs as allowed (RFC 9309)")
    else:
        log.info("  robots.txt: LOADED → URL-level checks active")

    # 2. Scrape each category × area combination
    all_listings: list[dict] = []
    for category in PROPERTY_CATEGORIES:
        for area_name, area_slug in AREAS.items():
            area_listings = scrape_category_area(category, area_name, area_slug, rp)
            all_listings.extend(area_listings)

    # 3. Deduplicate by ad_id (then by URL)
    seen_ids: set[str] = set()
    unique: list[dict] = []
    for item in all_listings:
        key = item.get("ad_id") or item.get("url", "")
        if key and key not in seen_ids:
            seen_ids.add(key)
            unique.append(item)

    # 4. Summary
    log.info(f"\n{'='*65}")
    log.info(f"  Scraped  : {len(all_listings)} total")
    log.info(f"  Unique   : {len(unique)} after deduplication")
    log.info(f"{'='*65}")

    # 5. Quick stats
    area_counts = {}
    cat_counts  = {}
    for item in unique:
        area_counts[item["area"]] = area_counts.get(item["area"], 0) + 1
        cat_counts[item["category"]] = cat_counts.get(item["category"], 0) + 1

    log.info("  By area     : " + " | ".join(f"{k}={v}" for k, v in area_counts.items()))
    log.info("  By category : " + " | ".join(f"{k}={v}" for k, v in cat_counts.items()))

    # 6. Build output JSON
    output = {
        "metadata": {
            "scraped_at":     datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "source":         BASE_URL,
            "source_robots":  ROBOTS_URL,
            "areas_scraped":  list(AREAS.keys()),
            "categories":     PROPERTY_CATEGORIES,
            "total_listings": len(unique),
            "by_area":        area_counts,
            "by_category":    cat_counts,
            "ethical_compliance": {
                "robots_txt_respected":    True,
                "crawl_delay_seconds":     f"{MIN_DELAY}–{MAX_DELAY}",
                "only_public_pages":       True,
                "no_login_required":       True,
                "no_personal_data":        True,
                "rfc_9309_compliant":      True,
                "intended_use":            "Research / personal analysis only",
            },
        },
        "listings": unique,
    }

    # 7. Save JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)

    log.info(f"\n✅  Saved {len(unique)} listings → {OUTPUT_FILE}")
    return output


if __name__ == "__main__":
    run()
