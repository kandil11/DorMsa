# 🏠 Egypt Real Estate Rental Scraper

Ethical, polite web scraper for rental listings in **6th of October** and **Sheikh Zayed**, Egypt.  
Data is sourced from three major platforms and merged into a single clean JSON dataset.

---

## 📁 Project Structure

```
egypt_real_estate/
│
├── README.md                        ← You are here
│
├── scrapers/
│   ├── refresh_and_merge.py         ← ⭐ MAIN script — run this to refresh all data
│   ├── bayut_scraper.py             ← Bayut.eg scraper (original)
│   ├── dubizzle_scraper.py          ← Dubizzle.com.eg scraper (original)
│   ├── studios_flats_scraper.py     ← Focused studios & flats scraper
│   └── multi_source_scraper.py      ← Multi-source scraper (studios + small apts)
│
└── data/
    ├── merged/
    │   └── rentals_egypt_merged.json  ← ⭐ FINAL dataset (use this for analysis)
    ├── raw/
    │   ├── bayut_raw.json             ← Raw Bayut listings
    │   ├── dubizzle_raw.json          ← Raw Dubizzle listings
    │   ├── studios_flats_raw.json     ← Studios & flats scrape
    │   └── propertyfinder_raw.json    ← Raw PropertyFinder listings
    └── archive/
        └── (older intermediate files)
```

---

## 🚀 Quick Start

### Requirements
```bash
pip install requests beautifulsoup4
```

### Refresh the dataset
```bash
cd scrapers/
python3 refresh_and_merge.py
```

This will:
1. Re-scrape Bayut.eg, Dubizzle.com.eg, and PropertyFinder.eg
2. Deduplicate across all sources
3. Overwrite `data/merged/rentals_egypt_merged.json` with fresh data

---

## 📊 Dataset Overview (last update: May 2026)

| Source | Listings |
|---|---|
| Bayut.eg | ~623 |
| Dubizzle.com.eg | ~1,350 |
| PropertyFinder.eg | ~48 |
| **Total unique** | **~2,021** |

| Area | Listings |
|---|---|
| 6th of October | ~988 |
| Sheikh Zayed | ~1,033 |

| Property Type | Listings |
|---|---|
| Apartments | ~1,844 |
| Villas / Town Houses | ~113 |
| Studios | ~64 |

---

## 📋 JSON Schema

### `rentals_egypt_merged.json`

```json
{
  "metadata": {
    "merged_at": "2026-05-05T17:54:43",
    "sources": ["bayut.eg", "dubizzle.com.eg", "propertyfinder.eg"],
    "areas_scraped": ["6th_of_october", "sheikh_zayed"],
    "total_listings": 2021,
    "by_source": { "bayut.eg": 623, "dubizzle.com.eg": 1350, "propertyfinder.eg": 48 },
    "by_area": { "6th_of_october": 988, "sheikh_zayed": 1033 },
    "by_prop_category": { "apartment": 1844, "villa": 113, "studio": 64 },
    "ethical_compliance": { ... }
  },
  "listings": [
    {
      "source":        "dubizzle.com.eg",       // bayut.eg | dubizzle.com.eg | propertyfinder.eg
      "ad_id":         "503309783",             // Dubizzle ad ID (unique key)
      "url":           "https://...",
      "title":         "شقة للايجار ...",
      "area":          "6th_of_october",        // 6th_of_october | sheikh_zayed
      "prop_category": "apartment",             // apartment | studio | villa
      "page":          1,
      "price": {
        "amount_egp":  22000,
        "period":      "Monthly",               // Monthly | Daily | Yearly
        "raw":         "EGP 22,000"
      },
      "property_type": "Apartment",            // Apartment | Studio | Villa | Duplex | ...
      "bedrooms":      2,
      "bathrooms":     1,
      "area_sqm":      100,
      "furnished":     true,                   // true | false | null
      "compound":      "Janna",
      "location":      "6th of October",
      "posted_ago":    "2 days ago",           // Dubizzle only
      "listed_date":   "2026-05-05T...",       // PropertyFinder only
      "is_verified":   false,                  // PropertyFinder only
      "scraped_at":    "2026-05-05T09:08:35"
    }
  ]
}
```

---

## ⚖️ Ethical Compliance

| Policy | Status |
|---|---|
| `robots.txt` respected | ✅ RFC 9309 compliant |
| Crawl delay | ✅ 3–6 seconds per request (random) |
| Public pages only | ✅ No login required |
| Personal data | ✅ None collected (no agent phones/emails) |
| Intended use | 🔬 Research & personal analysis only |

---

## 📈 Scraper Configuration (`refresh_and_merge.py`)

Adjust the `PAGES` dictionary to control how many pages are scraped per source:

```python
PAGES = {
    "bayut_studio":     6,   # ~24 listings/page  → ~144 studios
    "bayut_apartment":  8,   # ~24 listings/page  → ~192 apartments
    "bayut_villa":      5,   # ~24 listings/page  → ~120 villas
    "dubizzle_apt":    10,   # ~45 listings/page  → ~450 apartments
    "dubizzle_villa":   5,   # ~45 listings/page  → ~225 villas
    "pf_apartment":    20,   # ~30 listings/page  → sparse (Egypt-wide)
}
```
