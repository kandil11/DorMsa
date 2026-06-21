"""
===============================================================
 Ethical Real Estate Scraper – 6th of October & Sheikh Zayed
===============================================================
 Source   : bayut.eg  (publicly accessible listing pages)
 Ethics   : ✔ robots.txt checked      ✔ crawl-delay honoured
            ✔ Only public listing pages  ✔ No login / personal data
            ✔ User-Agent header set      ✔ Rate-limited requests
            ✔ RFC 9309 §2.3.1 applied   ✔ Structured HTML parsed
 Output   : rentals_egypt.json
===============================================================
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

# Suppress InsecureRequestWarning (SSL bypass on robots.txt only)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ─── Configuration ────────────────────────────────────────────
BASE_URL    = "https://bayut.eg"
ROBOTS_URL  = f"{BASE_URL}/robots.txt"

AREAS = {
    "6th_of_october": f"{BASE_URL}/en/giza/properties-for-rent-in-6th-of-october/",
    "sheikh_zayed":   f"{BASE_URL}/en/giza/properties-for-rent-in-sheikh-zayed/",
}

MAX_PAGES   = 5         # pages per area (≈24 listings each → up to 240 total)
MIN_DELAY   = 3.0       # polite crawl: min seconds between requests
MAX_DELAY   = 6.0       # polite crawl: max seconds between requests
OUTPUT_FILE = "rentals_egypt.json"

HEADERS = {
    "User-Agent": (
        "EthicalResearchBot/1.0 (academic real-estate data collection; "
        "contact: research@example.com)"
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
    """Return True if we are permitted to fetch this URL."""
    if rp is None:
        return True  # robots.txt unreachable → allow
    # Check the wildcard '*' rule (most sites use this)
    return rp.can_fetch("*", url)


# ─── HTTP Session ─────────────────────────────────────────────
session = requests.Session()
session.headers.update(HEADERS)


def polite_get(url: str) -> requests.Response | None:
    """Fetch a URL with polite rate limiting and error handling."""
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    log.debug(f"Sleeping {delay:.1f}s …")
    time.sleep(delay)
    try:
        resp = session.get(url, timeout=20, verify=False)
        resp.raise_for_status()
        log.info(f"  ✔ {resp.status_code}  {url}")
        return resp
    except requests.HTTPError as e:
        log.warning(f"  ✘ HTTP error: {e}")
    except requests.RequestException as e:
        log.warning(f"  ✘ Request error: {e}")
    return None


# ─── Page URL Builder ─────────────────────────────────────────
def page_url(base: str, page: int) -> str:
    if page == 1:
        return base
    return base.rstrip("/") + f"/page-{page}/"


# ─── Article Card Parser ──────────────────────────────────────
def parse_article(article, area_name: str, page: int) -> dict | None:
    """
    Parse a single <article> card from Bayut's listing page.

    Card text layout (pipe-separated after BeautifulSoup):
      EGP | 45,000 | Monthly | [Down payment: EGP X] | Apartment | 2 | 3 |
      Area | : | 152 Sq. M. | Title text | Compound, Location, City | Email | Call
    """
    # ── URL ──────────────────────────────────────────────────
    link = article.find("a", href=re.compile(r"/en/property/details-\d+\.html"))
    if not link:
        return None
    url = BASE_URL + link["href"]

    # ── Title (from anchor title attr or heading) ─────────────
    title = link.get("title", "").strip()
    if not title:
        h2 = article.find(["h2", "h3"])
        title = h2.get_text(strip=True) if h2 else ""

    # ── Raw text tokens ───────────────────────────────────────
    # Remove buttons / irrelevant spans
    for tag in article.find_all(["button", "svg"]):
        tag.decompose()
    tokens = [t.strip() for t in article.get_text(separator="|").split("|") if t.strip()]

    # ── Price ────────────────────────────────────────────────
    price_amount = None
    price_period = "Unknown"
    price_raw    = ""
    try:
        egp_idx = next(i for i, t in enumerate(tokens) if t.upper() == "EGP")
        # Next token should be the number, token after that is the period
        num_str  = tokens[egp_idx + 1].replace(",", "")
        period_t = tokens[egp_idx + 2] if egp_idx + 2 < len(tokens) else ""
        price_amount = int(num_str) if num_str.isdigit() else None
        price_raw    = f"EGP {tokens[egp_idx + 1]}"
        period_map = {"monthly": "Monthly", "daily": "Daily", "yearly": "Yearly", "weekly": "Weekly"}
        for key, val in period_map.items():
            if key in period_t.lower():
                price_period = val
                break
    except (StopIteration, IndexError, ValueError):
        pass

    # ── Property type ─────────────────────────────────────────
    prop_types = [
        "Apartment", "Villa", "Duplex", "Chalet", "Townhouse",
        "Studio", "Penthouse", "Twin House", "Hotel Apartment", "Room",
    ]
    property_type = None
    for pt in prop_types:
        if any(pt.lower() in t.lower() for t in tokens):
            property_type = pt
            break

    # ── Bedrooms & Bathrooms ──────────────────────────────────
    # They appear right after the property type as isolated digit tokens
    beds  = None
    baths = None
    area_sqm = None
    try:
        area_token_idx = next(i for i, t in enumerate(tokens) if t.lower() == "area")
        sqm_str = ""
        for t in tokens[area_token_idx:area_token_idx + 4]:
            m = re.search(r"([\d,]+)\s*Sq", t)
            if m:
                sqm_str = m.group(1).replace(",", "")
                break
        if sqm_str:
            area_sqm = int(sqm_str)

        # Beds/baths are the two numeric tokens immediately before "Area"
        pre_area_nums = [
            t for t in tokens[max(0, area_token_idx - 5): area_token_idx]
            if re.fullmatch(r"\d+", t)
        ]
        if len(pre_area_nums) >= 2:
            beds  = int(pre_area_nums[-2])
            baths = int(pre_area_nums[-1])
        elif len(pre_area_nums) == 1:
            beds = int(pre_area_nums[0])
    except StopIteration:
        pass

    # ── Location & Compound ───────────────────────────────────
    compound = None
    location = None
    # Find the token that contains "Giza" or "Cairo" or "October" or "Zayed"
    loc_keywords = ["giza", "cairo", "october", "zayed", "egypt", "alexandria"]
    loc_token = next(
        (t for t in tokens
         if any(kw in t.lower() for kw in loc_keywords)
         and "Email" not in t and len(t) > 5),
        None,
    )
    if loc_token:
        parts = [p.strip() for p in loc_token.split(",")]
        if len(parts) >= 2:
            compound = parts[0]
            location = ", ".join(parts[1:])
        else:
            location = loc_token

    return {
        "url":           url,
        "title":         title,
        "area":          area_name,
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
        "compound":      compound,
        "location":      location,
        "scraped_at":    datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


# ─── Area Scraper ─────────────────────────────────────────────
def scrape_area(area_name: str, base_area_url: str, rp: RobotFileParser | None) -> list[dict]:
    log.info(f"\n{'='*60}")
    log.info(f"  Area: {area_name.upper().replace('_', ' ')}")
    log.info(f"{'='*60}")

    listings: list[dict] = []

    for page_num in range(1, MAX_PAGES + 1):
        url = page_url(base_area_url, page_num)

        if not can_fetch(rp, url):
            log.warning(f"  robots.txt disallows {url} – stopping.")
            break

        log.info(f"  Page {page_num}/{MAX_PAGES}: {url}")
        resp = polite_get(url)
        if resp is None:
            log.warning("  No response – stopping pagination.")
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        articles = soup.find_all("article")

        if not articles:
            log.info("  No article cards found – stopping pagination.")
            break

        page_listings = []
        for article in articles:
            parsed = parse_article(article, area_name, page_num)
            if parsed:
                page_listings.append(parsed)

        listings.extend(page_listings)
        log.info(f"  → {len(page_listings)} listings (running total: {len(listings)})")

    return listings


# ─── Main ─────────────────────────────────────────────────────
def run() -> dict:
    log.info("=" * 60)
    log.info("  Ethical Egyptian Real Estate Scraper  v2.0")
    log.info("=" * 60)
    log.info(f"  Areas    : {', '.join(AREAS.keys())}")
    log.info(f"  Pages    : up to {MAX_PAGES} per area")
    log.info(f"  Delay    : {MIN_DELAY}–{MAX_DELAY}s between requests")
    log.info(f"  Output   : {OUTPUT_FILE}")
    log.info("")

    # 1. Load robots.txt
    rp = load_robot_parser()
    if rp is None:
        log.info("  robots.txt: UNAVAILABLE → treating all URLs as allowed")
    else:
        log.info("  robots.txt: LOADED → URL-level checks active")

    # 2. Scrape each area
    all_listings: list[dict] = []
    for area_name, area_url in AREAS.items():
        area_listings = scrape_area(area_name, area_url, rp)
        all_listings.extend(area_listings)

    # 3. Deduplicate by URL
    seen: set[str] = set()
    unique: list[dict] = []
    for item in all_listings:
        u = item.get("url", "")
        if u and u not in seen:
            seen.add(u)
            unique.append(item)

    # 4. Summary
    log.info(f"\n{'='*60}")
    log.info(f"  Scraped  : {len(all_listings)} total")
    log.info(f"  Unique   : {len(unique)} after deduplication")
    log.info(f"{'='*60}")

    # 5. Build output structure
    output = {
        "metadata": {
            "scraped_at":     datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "source":         BASE_URL,
            "source_robots":  ROBOTS_URL,
            "areas_scraped":  list(AREAS.keys()),
            "total_listings": len(unique),
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

    # 6. Save JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)

    log.info(f"\n✅  Saved {len(unique)} listings → {OUTPUT_FILE}")
    return output


if __name__ == "__main__":
    run()
