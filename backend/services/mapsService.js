/**
 * FR10 — Proximity Search (distance from MSA campus)
 * FR16 — Location Map View
 *
 * Mock Google Maps Platform Interface
 * ─────────────────────────────────────────────────────────────────────
 * In production, replace the mock bodies with real @googlemaps/google-maps-services-js calls:
 *
 *   import { Client } from '@googlemaps/google-maps-services-js';
 *   const client = new Client({});
 *   const response = await client.geocode({
 *     params: { address, key: process.env.GOOGLE_MAPS_API_KEY },
 *   });
 *
 * ─────────────────────────────────────────────────────────────────────
 */

// MSA University, 6th of October City, Egypt
export const MSA_CAMPUS = {
  lat: 29.9602,
  lng: 30.9459,
  address: 'MSA University, 26th of July Corridor, 6th of October City, Giza, Egypt',
};

/**
 * Haversine formula — great-circle distance between two coordinates
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometres (rounded to 2 decimal places)
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

/**
 * FR10 — Calculate distance from MSA campus given coordinates
 * @param {number} lat - Listing latitude
 * @param {number} lng - Listing longitude
 * @returns {{ distanceKm: number, withinWalkingDistance: boolean }}
 */
export const distanceFromCampus = (lat, lng) => {
  const distanceKm = haversineDistance(MSA_CAMPUS.lat, MSA_CAMPUS.lng, lat, lng);
  return {
    distanceKm,
    withinWalkingDistance: distanceKm <= 1.5, // ≤1.5 km = walkable
    withinCyclingDistance: distanceKm <= 5,   // ≤5 km = cyclable
  };
};

/**
 * FR16 — Geocode an address string into {lat, lng}
 * Mock implementation: maps common October City area names to approximate coordinates.
 * In production: call Google Geocoding API with process.env.GOOGLE_MAPS_API_KEY
 *
 * @param {string} address
 * @returns {{ lat: number, lng: number, formattedAddress: string, source: 'mock' | 'google' }}
 */
export const geocodeAddress = async (address) => {
  const IS_PROD = process.env.NODE_ENV === 'production';

  // Mock coordinate map for common October City areas
  const AREA_COORDS = {
    'الحي الاول':        { lat: 29.9651, lng: 30.9311 },
    'الحي الثامن':       { lat: 29.9723, lng: 30.9268 },
    'المحور':             { lat: 29.9554, lng: 30.9415 },
    'الربوة':             { lat: 29.9487, lng: 30.9380 },
    'أكتوبر':             { lat: 29.9597, lng: 30.9377 },
    'october':            { lat: 29.9597, lng: 30.9377 },
    'hadaek':             { lat: 29.9720, lng: 30.9420 },
    'حدائق':              { lat: 29.9720, lng: 30.9420 },
    'wahat':              { lat: 29.9800, lng: 30.9200 },
    'default':            { lat: 29.9600, lng: 30.9400 }, // fallback near MSA
  };

  const lower = address.toLowerCase();
  let coords = AREA_COORDS.default;

  for (const [key, val] of Object.entries(AREA_COORDS)) {
    if (lower.includes(key)) { coords = val; break; }
  }

  // Add slight random offset so nearby listings don't all stack on the same pin
  const jitter = () => (Math.random() - 0.5) * 0.01;
  const result = {
    lat: coords.lat + jitter(),
    lng: coords.lng + jitter(),
    formattedAddress: address,
    source: 'mock',
  };

  if (!IS_PROD) {
    console.log(`🗺️  [MAPS MOCK] Geocode "${address}" → (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`);
  }

  // Production: replace with real Google Maps Geocoding API call
  return result;
};

/**
 * FR16 — Build a Google Static Maps URL for a listing pin
 * (Uses mock/real Google Static Maps API — requires GOOGLE_MAPS_API_KEY in production)
 * @param {number} lat
 * @param {number} lng
 * @returns {string} URL to a static map image
 */
export const getStaticMapUrl = (lat, lng) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey && process.env.NODE_ENV === 'production') {
    // Real Google Static Maps URL
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}&markers=color:blue%7Clabel:MSA%7C${MSA_CAMPUS.lat},${MSA_CAMPUS.lng}&key=${apiKey}`;
  }

  // Mock: OpenStreetMap tile (free, no key required — suitable for dev/testing)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`;
};
