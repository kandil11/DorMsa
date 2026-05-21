/**
 * FR34 — Booking Confirmation Email
 * FR35 — New Listing Alert Email
 * FR36 — Listing Expiry Reminder Email
 *
 * Mock SendGrid Email Gateway
 * ─────────────────────────────────────────────────────────────────────
 * In production, replace the `_mockSend` body with real @sendgrid/mail calls:
 *
 *   import sgMail from '@sendgrid/mail';
 *   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 *   const [response] = await sgMail.send({ to, from, subject, html });
 *   return { success: true, messageId: response.headers['x-message-id'] };
 *
 * The function signatures and return shapes below are the stable interface.
 * ─────────────────────────────────────────────────────────────────────
 */

const IS_PROD = process.env.NODE_ENV === 'production';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@dormsa.com';
const FROM_NAME = 'DorMsa Housing Platform';

/**
 * Core mock send
 */
const _mockSend = async ({ to, subject, html, text }) => {
  const mockId = `MOCK_MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  if (!IS_PROD) {
    console.log(`\n📧 [EMAIL MOCK] ────────────────────────`);
    console.log(`   From    : ${FROM_NAME} <${FROM_EMAIL}>`);
    console.log(`   To      : ${to}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   Body    : ${text || html?.replace(/<[^>]+>/g, ' ').slice(0, 200)}...`);
    console.log(`   ID      : ${mockId}`);
    console.log(`────────────────────────────────────────\n`);
  }

  // In production: call real SendGrid here
  return { success: true, messageId: mockId };
};

/**
 * FR34 — Booking Confirmation email to student
 * @param {{ email: string, name: string }} student
 * @param {{ title: string, price: object, location: object }} listing
 * @param {{ _id: string, moveInDate: Date, duration: string }} booking
 */
export const sendBookingConfirmation = async (student, listing, booking) => {
  if (!student.email) return { success: false, reason: 'No email on file' };

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#e85d04">🏠 DorMsa — Booking Confirmation</h2>
      <p>Hi <strong>${student.name}</strong>,</p>
      <p>Your deposit for <strong>${listing.title}</strong> has been received. Here are your booking details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #eee"><strong>Property</strong></td><td style="padding:8px;border:1px solid #eee">${listing.title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee"><strong>Location</strong></td><td style="padding:8px;border:1px solid #eee">${listing.location?.address || ''}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee"><strong>Move-in Date</strong></td><td style="padding:8px;border:1px solid #eee">${booking.moveInDate ? new Date(booking.moveInDate).toDateString() : 'TBD'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee"><strong>Duration</strong></td><td style="padding:8px;border:1px solid #eee">${booking.duration || 'TBD'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee"><strong>Booking ID</strong></td><td style="padding:8px;border:1px solid #eee">${booking._id}</td></tr>
      </table>
      <p>Log in to your DorMsa account to download your lease contract.</p>
      <p style="color:#999;font-size:12px">DorMsa Housing Platform — October City, Egypt</p>
    </div>
  `;

  return _mockSend({
    to: student.email,
    subject: `✅ Booking Confirmed — ${listing.title}`,
    html,
    text: `Booking confirmed for ${listing.title}. Move-in: ${booking.moveInDate}. Booking ID: ${booking._id}`,
  });
};

/**
 * FR35 — New Listing Alert to a saved-search subscriber
 * @param {{ email: string, name: string }} user
 * @param {{ title: string, price: object, location: object, _id: string }} listing
 * @param {string} savedSearchName - Name of the matching saved search
 */
export const sendNewListingAlert = async (user, listing, savedSearchName) => {
  if (!user.email) return { success: false, reason: 'No email on file' };

  const listingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/listings/${listing._id}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#e85d04">🔔 New Listing Match — DorMsa</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>A new listing matching your saved search <strong>"${savedSearchName}"</strong> just dropped:</p>
      <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0">
        <h3 style="margin:0 0 8px">${listing.title}</h3>
        <p style="margin:0;color:#e85d04;font-weight:bold">${listing.price?.amount?.toLocaleString()} EGP/${listing.price?.period || 'month'}</p>
        <p style="margin:8px 0 0;color:#666">${listing.location?.address || ''}</p>
      </div>
      <a href="${listingUrl}" style="background:#e85d04;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">View Listing →</a>
      <p style="color:#999;font-size:12px;margin-top:24px">You're receiving this because you have a saved search on DorMsa. <a href="#">Unsubscribe</a></p>
    </div>
  `;

  return _mockSend({
    to: user.email,
    subject: `🏠 New listing match: ${listing.title}`,
    html,
    text: `New listing matching "${savedSearchName}": ${listing.title} — ${listing.price?.amount} EGP. View at ${listingUrl}`,
  });
};

/**
 * FR36 — Expiry Warning email to broker
 * @param {{ email: string, name: string }} broker
 * @param {{ title: string, _id: string }} listing
 * @param {number} daysInactive - How many days since last activity
 */
export const sendExpiryWarning = async (broker, listing, daysInactive) => {
  if (!broker.email) return { success: false, reason: 'No email on file' };

  const daysRemaining = 60 - daysInactive;
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/broker`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#dc2626">⚠️ Listing Expiry Warning — DorMsa</h2>
      <p>Hi <strong>${broker.name}</strong>,</p>
      <p>Your listing <strong>"${listing.title}"</strong> has been inactive for <strong>${daysInactive} days</strong>.</p>
      <p>It will be automatically hidden in <strong>${daysRemaining} more days</strong> unless you update it.</p>
      <a href="${dashboardUrl}" style="background:#e85d04;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Go to Dashboard →</a>
      <p style="color:#999;font-size:12px;margin-top:24px">DorMsa Housing Platform</p>
    </div>
  `;

  return _mockSend({
    to: broker.email,
    subject: `⚠️ Your listing "${listing.title}" will expire in ${daysRemaining} days`,
    html,
    text: `Warning: Your listing "${listing.title}" will be hidden in ${daysRemaining} days. Visit your dashboard to keep it active.`,
  });
};
