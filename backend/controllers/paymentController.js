import Payment from '../models/Payment.js';
import Listing from '../models/Listing.js';
import BookingRequest from '../models/BookingRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getGatewayToken, registerOrder, processPayment } from '../services/paymentService.js';
import { sendBookingConfirmation } from '../services/emailService.js';
import crypto from 'crypto';

/**
 * @desc    Initiate a deposit payment
 * @route   POST /api/payments/initiate
 * @access  Private (Student)
 * FR17 — Deposit Payment (mock PCI-DSS gateway)
 * FR34 — Booking Confirmation notification
 */
export const initiatePayment = async (req, res) => {
  try {
    const { listingId, bookingId, amount, paymentMethod = 'card', cardDetails = {} } = req.body;

    if (!listingId || !amount) {
      return res.status(400).json({ message: 'listingId and amount are required' });
    }

    const listing = await Listing.findById(listingId).populate('broker', 'name phone email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const merchantRef = `DORMSA_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // ── Mock Gateway 3-Step Handshake ──────────────────────────────────
    // Step 1: Authenticate with gateway
    const { token: gatewayToken } = await getGatewayToken();

    // Step 2: Register order
    const { orderId } = await registerOrder({
      gatewayToken,
      amount: amount * 100,  // Convert to piasters/cents
      currency: 'EGP',
      merchantRef,
    });

    // Step 3: Process payment
    const paymentResult = await processPayment({
      orderId,
      gatewayToken,
      cardDetails,
    });
    // ───────────────────────────────────────────────────────────────────

    // Create payment record regardless of success/failure
    const payment = await Payment.create({
      student: req.user._id,
      listing: listingId,
      broker: listing.broker._id,
      booking: bookingId || null,
      amount,
      currency: 'EGP',
      paymentMethod,
      status: paymentResult.status,
      transactionRef: paymentResult.transactionId,
      gatewayToken,
      gatewayResponse: paymentResult.gatewayResponse,
      description: `Deposit for: ${listing.title}`,
      failureReason: paymentResult.failureReason,
    });

    if (paymentResult.success) {
      // FR34 — Send booking confirmation notification
      await Notification.create({
        user: req.user._id,
        type: 'booking',
        title: '✅ Payment Successful',
        message: `Your deposit of ${amount.toLocaleString()} EGP for "${listing.title}" has been received.`,
        link: `/listings/${listingId}`,
      });

      // Notify broker
      await Notification.create({
        user: listing.broker._id,
        type: 'booking',
        title: '💰 Deposit Received',
        message: `A deposit of ${amount.toLocaleString()} EGP was received for "${listing.title}".`,
      });

      // FR34 — Send confirmation email (mock SendGrid)
      const student = await User.findById(req.user._id).select('name email');
      if (student) {
        const bookingDoc = bookingId ? await BookingRequest.findById(bookingId) : null;
        await sendBookingConfirmation(student, listing, bookingDoc || { _id: payment._id });
      }
    }

    res.status(paymentResult.success ? 200 : 402).json({
      success: paymentResult.success,
      payment: {
        _id: payment._id,
        transactionRef: payment.transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      message: paymentResult.success
        ? 'Payment processed successfully'
        : `Payment failed: ${paymentResult.failureReason}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get payment history for the logged-in user
 * @route   GET /api/payments/history
 * @access  Private
 * FR44 — Payment History
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { student: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('listing', 'title location.address images')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .select('-gatewayToken -gatewayResponse'),
      Payment.countDocuments(query),
    ]);

    res.json({
      payments,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
