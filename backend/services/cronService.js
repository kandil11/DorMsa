/**
 * FR36 — Expiry Reminders: warn brokers 30 days before auto-hide
 * FR47 — Listing Expiry Auto-Hide: hide listings untouched for 60 days
 *
 * Cron jobs using node-cron (runs in-process — no external queue needed).
 * ─────────────────────────────────────────────────────────────────────
 * Requires: npm install node-cron (in backend/)
 * ─────────────────────────────────────────────────────────────────────
 */

import cron from 'node-cron';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendExpiryWarning } from './emailService.js';
import { sendExpiryWarningSMS } from './smsService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * FR47 — Auto-hide listings that have had no activity for 60+ days.
 * Sets status to 'not-available' and records expiresAt.
 */
const autoHideExpiredListings = async () => {
  try {
    const cutoff = new Date(Date.now() - 60 * DAY_MS);

    const result = await Listing.updateMany(
      {
        status: { $in: ['available', 'pending'] },
        lastActivityAt: { $lt: cutoff },
        $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }],
      },
      {
        $set: { status: 'not-available', expiresAt: new Date() },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⏰ [FR47 CRON] Auto-hid ${result.modifiedCount} expired listing(s)`);

      // Notify affected brokers in-app
      const expiredListings = await Listing.find({
        expiresAt: { $gte: new Date(Date.now() - DAY_MS) }, // just expired today
        status: 'not-available',
      }).populate('broker', 'name email phone');

      for (const listing of expiredListings) {
        await Notification.create({
          user: listing.broker._id,
          type: 'listing',
          title: '⚠️ Listing auto-hidden',
          message: `Your listing "${listing.title}" was hidden due to 60 days of inactivity. Reactivate it from your dashboard.`,
          link: `/broker`,
        });
      }
    }
  } catch (err) {
    console.error('[FR47 CRON] autoHideExpiredListings error:', err.message);
  }
};

/**
 * FR36 — Warn brokers when a listing has been inactive for 30 days.
 * Sends in-app notification + mock email + mock SMS.
 * Only sends once (checks if already warned this period using a simple date window).
 */
const warnExpiringListings = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * DAY_MS);

    // Find listings inactive for exactly ~30 days (between 30–31 days)
    const warnListings = await Listing.find({
      status: { $in: ['available', 'pending'] },
      lastActivityAt: { $lt: thirtyDaysAgo, $gte: thirtyOneDaysAgo },
    }).populate('broker', 'name email phone');

    if (warnListings.length > 0) {
      console.log(`📧 [FR36 CRON] Sending expiry warnings for ${warnListings.length} listing(s)`);
    }

    for (const listing of warnListings) {
      const broker = listing.broker;
      if (!broker) continue;

      // In-app notification
      await Notification.create({
        user: broker._id,
        type: 'listing',
        title: '⚠️ Listing expiry warning',
        message: `"${listing.title}" has been inactive for 30 days. It will be hidden in 30 more days.`,
        link: `/broker`,
      });

      // Mock email + SMS
      await sendExpiryWarning(broker, listing, 30);
      await sendExpiryWarningSMS(broker.phone, listing.title);
    }
  } catch (err) {
    console.error('[FR36 CRON] warnExpiringListings error:', err.message);
  }
};

/**
 * Start all cron jobs.
 * Call this once after the database connection is established (in server.js).
 */
export const startCronJobs = () => {
  // Run every day at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [CRON] Running daily listing maintenance...');
    await warnExpiringListings();    // FR36
    await autoHideExpiredListings(); // FR47
  });

  console.log('✅ Cron jobs scheduled (FR36 expiry warnings, FR47 auto-hide)');
};

// Export runners for manual/test invocation
export { warnExpiringListings, autoHideExpiredListings };
