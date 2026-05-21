/**
 * FR35 — Notify users with matching saved searches when a new listing is created
 * FR46 — Push Notification infrastructure placeholder
 */

import Notification from '../models/Notification.js';
import SavedSearch from '../models/SavedSearch.js';
import User from '../models/User.js';
import { sendNewListingAlert } from './emailService.js';

/**
 * FR35 — Find all saved searches that match a new listing and dispatch alerts.
 * Called inside createListing controller after a listing is successfully saved.
 *
 * @param {object} listing - Mongoose Listing document
 */
export const notifyMatchingSavedSearches = async (listing) => {
  try {
    // Find all saved searches with notifications enabled
    const savedSearches = await SavedSearch.find({ notifyOnNew: true }).populate('user', 'name email phone');

    const matchingSearches = savedSearches.filter((ss) => {
      const f = ss.filters || {};

      // Check each filter — a saved search matches if all its set filters align with the listing
      if (f.minPrice && listing.price?.amount < f.minPrice) return false;
      if (f.maxPrice && listing.price?.amount > f.maxPrice) return false;
      if (f.gender && f.gender !== listing.gender) return false;
      if (f.roomType && f.roomType !== listing.roomType) return false;
      if (f.propertyType && f.propertyType !== listing.propertyType) return false;
      if (f.maxDistance && listing.location?.distanceFromCampus > f.maxDistance) return false;
      if (f.area && !listing.location?.area?.toLowerCase().includes(f.area.toLowerCase())) return false;

      return true;
    });

    // Dispatch in-app notifications and emails in parallel (fire-and-forget)
    const promises = matchingSearches.map(async (ss) => {
      const user = ss.user;
      if (!user) return;

      // In-app notification
      await Notification.create({
        user: user._id,
        type: 'listing',
        title: '🏠 New listing match!',
        message: `"${listing.title}" matches your saved search "${ss.name}".`,
        link: `/listings/${listing._id}`,
      });

      // Email alert (mock SendGrid)
      await sendNewListingAlert(user, listing, ss.name);
    });

    await Promise.allSettled(promises);

    console.log(`📣 [FR35] Notified ${matchingSearches.length} saved-search subscriber(s) for listing: ${listing.title}`);
  } catch (err) {
    // Non-fatal — log and continue; don't let this break listing creation
    console.error('[FR35] notifyMatchingSavedSearches error:', err.message);
  }
};

/**
 * FR46 — Web Push Notification placeholder
 * In production: integrate with web-push library and store user subscription objects.
 *
 * Setup (production):
 *   1. npm install web-push
 *   2. web-push generateVAPIDKeys() → store in .env
 *   3. Frontend: navigator.serviceWorker + pushManager.subscribe()
 *   4. Store subscription in User.pushSubscription
 *   5. Replace body below with webpush.sendNotification(subscription, payload)
 *
 * @param {string} userId  - Target user's MongoDB ID
 * @param {object} payload - { title, body, icon, url }
 */
export const sendPushNotification = async (userId, payload) => {
  const IS_PROD = process.env.NODE_ENV === 'production';

  if (!IS_PROD) {
    console.log(`\n🔔 [PUSH MOCK] ──────────────────────────`);
    console.log(`   User    : ${userId}`);
    console.log(`   Title   : ${payload.title}`);
    console.log(`   Body    : ${payload.body}`);
    console.log(`────────────────────────────────────────\n`);
    return { success: true, mock: true };
  }

  // Production: retrieve user subscription and call webpush.sendNotification()
  // const user = await User.findById(userId).select('pushSubscription');
  // if (!user?.pushSubscription) return { success: false, reason: 'No subscription' };
  // await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
  return { success: false, reason: 'Push notifications not yet configured in production' };
};

/**
 * Shared helper — create an in-app Notification document
 * @param {string} userId
 * @param {'booking'|'listing'|'system'|'verification'|'message'} type
 * @param {string} title
 * @param {string} message
 * @param {string} [link]
 */
export const createInAppNotification = async (userId, type, title, message, link) => {
  return Notification.create({ user: userId, type, title, message, link });
};
