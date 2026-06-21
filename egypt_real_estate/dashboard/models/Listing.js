const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  amount_egp: Number,
  period:     String,
  raw:        String,
}, { _id: false });

const listingSchema = new mongoose.Schema({
  source:        String,
  ad_id:         String,
  prop_id:       String,
  url:           String,
  title:         String,
  area:          String,
  prop_category: String,
  page:          Number,
  price:         priceSchema,
  property_type: String,
  bedrooms:      Number,
  bathrooms:     Number,
  area_sqm:      Number,
  furnished:     mongoose.Schema.Types.Mixed,
  compound:      String,
  location:      String,
  posted_ago:    String,
  listed_date:   String,
  is_verified:   Boolean,
  scraped_at:    String,
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
