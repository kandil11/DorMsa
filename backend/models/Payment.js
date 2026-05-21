import mongoose from 'mongoose';

/**
 * FR17 — Deposit Payment model
 * FR44 — Payment History queries against this collection
 */
const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingRequest',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'EGP',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank-transfer', 'mobile-wallet', 'mock'],
      default: 'mock',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    // FR17 — Mock gateway fields (mirrors PCI-DSS token handshake response)
    transactionRef: {
      type: String,
      unique: true,
      sparse: true,
    },
    gatewayToken: String,       // Mock tokenized card reference
    gatewayResponse: {          // Full mock gateway JSON response
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    description: String,
    failureReason: String,
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ broker: 1 });
paymentSchema.index({ listing: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
