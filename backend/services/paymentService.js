/**
 * FR17 — Deposit Payment Gateway Interface
 *
 * Mock PCI-DSS Payment Gateway (PayMob / Stripe interface pattern)
 * ─────────────────────────────────────────────────────────────────────
 * In production, replace this with the real PayMob or Stripe integration:
 *
 *   PayMob flow:
 *     1. POST /auth/tokens         → get API token
 *     2. POST /ecommerce/orders    → register order, get order_id
 *     3. POST /acceptance/payment_keys → get payment_key
 *     4. Redirect to hosted iframe with payment_key
 *
 *   Stripe flow:
 *     1. stripe.paymentIntents.create({ amount, currency })
 *     2. Return clientSecret to frontend
 *     3. Frontend calls stripe.confirmCardPayment(clientSecret, { payment_method: { card } })
 *
 * This mock mirrors the 3-step token handshake and returns a stable response shape
 * so the rest of the codebase is production-ready without code changes.
 * ─────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Step 1 — Authenticate and get a gateway session token
 * Mirrors PayMob /auth/tokens or Stripe key initialization
 * @returns {{ token: string, expiresIn: number }}
 */
export const getGatewayToken = async () => {
  const mockToken = `MOCK_GW_TKN_${crypto.randomBytes(16).toString('hex').toUpperCase()}`;

  if (!IS_PROD) {
    console.log(`\n💳 [PAYMENT MOCK] Step 1 — Gateway Token`);
    console.log(`   Token   : ${mockToken}`);
  }

  // Production: call PayMob /auth/tokens with API key from env
  return {
    token: mockToken,
    expiresIn: 3600, // seconds
  };
};

/**
 * Step 2 — Register the order with the gateway
 * Mirrors PayMob /ecommerce/orders or Stripe PaymentIntent creation
 * @param {object} params
 * @param {string} params.gatewayToken  - Token from step 1
 * @param {number} params.amount        - Amount in EGP piasters (amount * 100)
 * @param {string} params.currency      - e.g. 'EGP'
 * @param {string} params.merchantRef   - Unique order reference from our system
 * @returns {{ orderId: string, status: string }}
 */
export const registerOrder = async ({ gatewayToken, amount, currency = 'EGP', merchantRef }) => {
  const mockOrderId = `MOCK_ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  if (!IS_PROD) {
    console.log(`\n💳 [PAYMENT MOCK] Step 2 — Register Order`);
    console.log(`   Amount  : ${amount / 100} ${currency}`);
    console.log(`   Ref     : ${merchantRef}`);
    console.log(`   OrderID : ${mockOrderId}`);
  }

  return {
    orderId: mockOrderId,
    status: 'CREATED',
    amount,
    currency,
    merchantRef,
  };
};

/**
 * Step 3 — Process the payment and get final transaction result
 * Mirrors PayMob /acceptance/payment_keys + transaction callback
 * or Stripe stripe.paymentIntents.confirm()
 * @param {object} params
 * @param {string} params.orderId       - Order ID from step 2
 * @param {string} params.gatewayToken  - Token from step 1
 * @param {object} params.cardDetails   - { number (masked), expiry, holder } — NEVER store full PAN
 * @returns {{ success: boolean, transactionId: string, status: string, gatewayResponse: object }}
 */
export const processPayment = async ({ orderId, gatewayToken, cardDetails = {} }) => {
  const txId = `MOCK_TXN_${crypto.randomBytes(10).toString('hex').toUpperCase()}`;

  // Mock 95% success rate for realistic testing
  const isSuccess = Math.random() > 0.05;

  const gatewayResponse = {
    id: txId,
    order: { id: orderId },
    pending: false,
    amount_cents: null,          // filled by caller
    success: isSuccess,
    is_auth: false,
    is_capture: true,
    is_standalone_payment: true,
    is_voided: false,
    is_refunded: false,
    is_3d_secure: true,          // always simulate 3DS for PCI-DSS compliance posture
    source_data: {
      pan: cardDetails.number ? `XXXX-XXXX-XXXX-${cardDetails.number.slice(-4)}` : 'XXXX-XXXX-XXXX-MOCK',
      type: 'card',
      sub_type: 'MasterCard',
    },
    error_occured: !isSuccess,
    error_message: isSuccess ? null : 'Insufficient funds (mock failure)',
    created_at: new Date().toISOString(),
  };

  if (!IS_PROD) {
    console.log(`\n💳 [PAYMENT MOCK] Step 3 — Process Payment`);
    console.log(`   TxID    : ${txId}`);
    console.log(`   Success : ${isSuccess}`);
    if (!isSuccess) console.log(`   Reason  : ${gatewayResponse.error_message}`);
    console.log(`────────────────────────────────────────\n`);
  }

  return {
    success: isSuccess,
    transactionId: txId,
    status: isSuccess ? 'completed' : 'failed',
    gatewayResponse,
    failureReason: isSuccess ? null : gatewayResponse.error_message,
  };
};

/**
 * Refund — reverse a completed transaction
 * @param {string} transactionId - Original transaction ID
 * @param {number} amount        - Amount to refund in piasters
 * @returns {{ success: boolean, refundId: string }}
 */
export const refundTransaction = async (transactionId, amount) => {
  const refundId = `MOCK_REF_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  if (!IS_PROD) {
    console.log(`\n💳 [PAYMENT MOCK] Refund — TxID: ${transactionId}, Amount: ${amount / 100} EGP`);
  }

  return { success: true, refundId, originalTransaction: transactionId };
};
