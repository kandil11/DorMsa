/**
 * FR02 — OTP Verification (SMS Interface)
 * FR06 — Password Recovery (SMS Interface)
 *
 * Mock Twilio SMS Gateway
 * ─────────────────────────────────────────────────────────────────────
 * In production, replace the `_mockSend` body with real Twilio SDK calls:
 *
 *   import twilio from 'twilio';
 *   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *   await client.messages.create({
 *     body: message,
 *     from: process.env.TWILIO_FROM_NUMBER,
 *     to: toPhone,
 *   });
 *
 * The function signatures and return shapes below are the stable interface.
 * ─────────────────────────────────────────────────────────────────────
 */

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Core mock send — logs to console in dev, would call Twilio in production.
 * @param {string} toPhone - E.164-formatted phone number e.g. '+201012345678'
 * @param {string} message - SMS body text
 * @returns {{ success: boolean, sid: string, to: string }}
 */
const _mockSend = async (toPhone, message) => {
  const mockSid = `MOCK_SM_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  if (!IS_PROD) {
    console.log(`\n📱 [SMS MOCK] ─────────────────────────`);
    console.log(`   To      : ${toPhone}`);
    console.log(`   Message : ${message}`);
    console.log(`   SID     : ${mockSid}`);
    console.log(`────────────────────────────────────────\n`);
  }

  // In production: call real Twilio API here
  // For now, always simulate success
  return { success: true, sid: mockSid, to: toPhone };
};

/**
 * FR02 — Send registration OTP
 * @param {string} phone - User's phone number
 * @param {string} otp   - 6-digit OTP code
 */
export const sendOTP = async (phone, otp) => {
  const e164 = phone.startsWith('+') ? phone : `+2${phone}`;
  const message = `Your DorMsa verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return _mockSend(e164, message);
};

/**
 * FR06 — Send password reset OTP
 * @param {string} phone - User's phone number
 * @param {string} otp   - 6-digit reset OTP
 */
export const sendPasswordResetOTP = async (phone, otp) => {
  const e164 = phone.startsWith('+') ? phone : `+2${phone}`;
  const message = `Your DorMsa password reset code is: ${otp}. Valid for 10 minutes. Ignore if you did not request this.`;
  return _mockSend(e164, message);
};

/**
 * FR36 — Send expiry warning SMS to broker
 * @param {string} phone       - Broker's phone number
 * @param {string} listingTitle - Title of the expiring listing
 */
export const sendExpiryWarningSMS = async (phone, listingTitle) => {
  const e164 = phone.startsWith('+') ? phone : `+2${phone}`;
  const message = `DorMsa: Your listing "${listingTitle}" has been inactive for 30 days and will be auto-hidden in 30 more days. Log in to keep it active.`;
  return _mockSend(e164, message);
};
