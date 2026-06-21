/**
 * seed.js
 * -------
 * Reads ../data/merged/rentals_egypt_merged.json and upserts all listings
 * into MongoDB Atlas.  Safe to re-run – uses updateOne with upsert=true.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const Listing  = require('./models/Listing');

const JSON_PATH = path.join(__dirname, '..', 'data', 'merged', 'rentals_egypt_merged.json');

async function seed() {
  console.log('🔌 Connecting to MongoDB …');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected.\n');

  const raw      = fs.readFileSync(JSON_PATH, 'utf8');
  const parsed   = JSON.parse(raw);
  const listings = parsed.listings || [];

  console.log(`📦 Seeding ${listings.length} listings …`);

  let inserted = 0, updated = 0, errors = 0;
  const BATCH = 200;

  for (let i = 0; i < listings.length; i += BATCH) {
    const batch = listings.slice(i, i + BATCH);
    const ops   = batch.map(l => {
      const key = l.ad_id || l.prop_id || l.url;
      return {
        updateOne: {
          filter: { $or: [
            l.ad_id   ? { ad_id:   l.ad_id }   : null,
            l.prop_id ? { prop_id: l.prop_id } : null,
            { url: l.url },
          ].filter(Boolean) },
          update:  { $set: l },
          upsert:  true,
        },
      };
    });

    try {
      const res = await Listing.bulkWrite(ops, { ordered: false });
      inserted += res.upsertedCount;
      updated  += res.modifiedCount;
    } catch (e) {
      console.error('  ⚠ Batch error:', e.message);
      errors++;
    }
    process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, listings.length)}/${listings.length}`);
  }

  console.log(`\n\n✅ Done!`);
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Updated  : ${updated}`);
  console.log(`   Errors   : ${errors}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
