import mongoose from 'mongoose';

/**
 * FR37 — Audit Log model
 * Silently records all admin database modifications with timestamps and admin IDs.
 * Documents auto-expire after 90 days via TTL index.
 */
const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'VERIFY_BROKER', 'SUSPEND_USER', 'DELETE_LISTING', 'MODERATE_LISTING', 'DELETE_USER'
    },
    targetModel: {
      type: String,
      enum: ['User', 'Listing', 'BookingRequest', 'Payment', 'SupportTicket'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      // Snapshot of the change — flexible shape
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: String,
  },
  {
    // Only store createdAt; no updatedAt needed
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL: auto-delete after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
auditLogSchema.index({ admin: 1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
