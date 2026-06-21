/**
 * server.js – Egypt Real Estate Dashboard API
 * Supports two modes:
 *  1. MongoDB Atlas  (when MONGO_URI is reachable)
 *  2. Local JSON fallback (reads rentals_egypt_merged.json directly)
 */

require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const Listing  = require('./models/Listing');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── JSON Fallback cache ──────────────────────────────────────────────────────
const JSON_PATH = path.join(__dirname, '..', 'data', 'merged', 'rentals_egypt_merged.json');
let   jsonListings = null;   // null = not yet loaded / MongoDB is used
let   usingFallback = false;

function loadJsonFallback() {
  if (jsonListings) return;
  console.log('📂 Loading local JSON fallback …');
  const raw  = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  jsonListings = raw.listings || [];
  console.log(`   ${jsonListings.length} listings loaded from JSON.`);
}

// ── DB connect (non-fatal – falls back to JSON) ───────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.warn('⚠  MongoDB unreachable:', err.message);
    console.warn('   → Falling back to local JSON file.');
    usingFallback = true;
    loadJsonFallback();
  });


// ── GET /api/stats  ──────────────────────────────────────────────────────
app.get('/api/stats', async (_req, res) => {
  try {
    if (usingFallback) {
      const ls  = jsonListings;
      const cnt = (key) => ls.reduce((acc, l) => { const v = String(l[key]||'unknown'); acc[v]=(acc[v]||0)+1; return acc; }, {});
      const monthly = ls.filter(l => l.price?.amount_egp > 0 && l.price?.period === 'Monthly');
      const amounts = monthly.map(l => l.price.amount_egp);
      return res.json({
        total:      ls.length,
        bySource:   cnt('source'),
        byArea:     cnt('area'),
        byCategory: cnt('prop_category'),
        byType:     cnt('property_type'),
        priceStats: amounts.length ? {
          avgPrice: amounts.reduce((a,b)=>a+b,0)/amounts.length,
          minPrice: Math.min(...amounts),
          maxPrice: Math.max(...amounts),
        } : {},
        mode: 'json-fallback',
      });
    }

    const [total, bySource, byArea, byCategory, byType, priceStats] = await Promise.all([
      Listing.countDocuments(),
      Listing.aggregate([{ $group: { _id: '$source',        count: { $sum: 1 } } }]),
      Listing.aggregate([{ $group: { _id: '$area',          count: { $sum: 1 } } }]),
      Listing.aggregate([{ $group: { _id: '$prop_category', count: { $sum: 1 } } }]),
      Listing.aggregate([{ $group: { _id: '$property_type', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Listing.aggregate([
        { $match: { 'price.amount_egp': { $gt: 0 }, 'price.period': 'Monthly' } },
        { $group: {
            _id: null,
            avgPrice: { $avg: '$price.amount_egp' },
            minPrice: { $min: '$price.amount_egp' },
            maxPrice: { $max: '$price.amount_egp' },
          }
        }
      ]),
    ]);

    res.json({
      total,
      bySource:   Object.fromEntries(bySource.map(d  => [d._id || 'unknown', d.count])),
      byArea:     Object.fromEntries(byArea.map(d    => [d._id || 'unknown', d.count])),
      byCategory: Object.fromEntries(byCategory.map(d => [d._id || 'unknown', d.count])),
      byType:     Object.fromEntries(byType.map(d    => [d._id || 'unknown', d.count])),
      priceStats: priceStats[0] || {},
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ── GET /api/listings  ──────────────────────────────────────────────────────
app.get('/api/listings', async (req, res) => {
  try {
    const {
      page       = 1,
      limit      = 24,
      area,
      category,
      source,
      minPrice,
      maxPrice,
      beds,
      search,
      sort       = 'scraped_at',
      order      = 'desc',
    } = req.query;

    if (usingFallback) {
      let ls = jsonListings;

      if (area     && area     !== 'all') ls = ls.filter(l => l.area          === area);
      if (category && category !== 'all') ls = ls.filter(l => l.prop_category === category);
      if (source   && source   !== 'all') ls = ls.filter(l => l.source        === source);
      if (beds     && beds     !== 'all') ls = ls.filter(l => l.bedrooms      === Number(beds));
      if (minPrice) ls = ls.filter(l => (l.price?.amount_egp||0) >= Number(minPrice));
      if (maxPrice) ls = ls.filter(l => (l.price?.amount_egp||0) <= Number(maxPrice));
      if (search) {
        const re = new RegExp(search, 'i');
        ls = ls.filter(l => re.test(l.title||'') || re.test(l.location||'') || re.test(l.compound||''));
      }

      // Sort
      const sortKey = sort.replace(/^-/, '');
      const dir     = sort.startsWith('-') ? -1 : (order === 'asc' ? 1 : -1);
      ls = [...ls].sort((a, b) => {
        const av = sortKey.includes('.') ? sortKey.split('.').reduce((o,k)=>o?.[k],a) : a[sortKey];
        const bv = sortKey.includes('.') ? sortKey.split('.').reduce((o,k)=>o?.[k],b) : b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
      });

      const total    = ls.length;
      const pageNum  = Number(page);
      const limitNum = Number(limit);
      const listings = ls.slice((pageNum - 1) * limitNum, pageNum * limitNum)
        .map((l, i) => ({ ...l, _id: l.ad_id || l.prop_id || `json-${i}` }));

      return res.json({ listings, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    }

    const filter = {};
    if (area     && area     !== 'all') filter.area          = area;
    if (category && category !== 'all') filter.prop_category = category;
    if (source   && source   !== 'all') filter.source        = source;
    if (beds     && beds     !== 'all') filter.bedrooms       = Number(beds);

    if (minPrice || maxPrice) {
      filter['price.amount_egp'] = {};
      if (minPrice) filter['price.amount_egp'].$gte = Number(minPrice);
      if (maxPrice) filter['price.amount_egp'].$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { title:    { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { compound: { $regex: search, $options: 'i' } },
      ];
    }

    const skip     = (Number(page) - 1) * Number(limit);
    const sortObj  = { [sort]: order === 'asc' ? 1 : -1 };

    const [listings, total] = await Promise.all([
      Listing.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      Listing.countDocuments(filter),
    ]);

    res.json({ listings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ── GET /api/listings/:id ─────────────────────────────────────────────────────
app.get('/api/listings/:id', async (req, res) => {
  try {
    if (usingFallback) {
      const id = req.params.id;
      const l  = jsonListings.find(x => (x.ad_id||x.prop_id||x.url) === id ||
                                       String(x.ad_id||x.prop_id||x.url).startsWith(id));
      if (!l) return res.status(404).json({ error: 'Not found' });
      return res.json({ ...l, _id: l.ad_id || l.prop_id || l.url });
    }

    const listing = await Listing.findById(req.params.id).lean();
    if (!listing) return res.status(404).json({ error: 'Not found' });
    res.json(listing);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ── Catch-all → index.html ────────────────────────────────────────────────────
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () =>
  console.log(`🚀 Dashboard running at http://localhost:${PORT}`)
);
