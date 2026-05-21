import User from '../models/User.js';
import Listing from '../models/Listing.js';
import BookingRequest from '../models/BookingRequest.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Helper: create an audit log entry
 * FR37 — Silently document admin database modifications
 */
const audit = async (req, action, targetModel, targetId, details = {}) => {
  try {
    await AuditLog.create({
      admin: req.user._id,
      action,
      targetModel,
      targetId,
      details,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    });
  } catch (err) {
    console.error('[FR37] Audit log creation failed:', err.message);
  }
};

/**
 * @route GET /api/admin/users
 * FR05 — Role-Based Access
 */
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-avatarData -idDocument.data').sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        if (u.role === 'broker') {
          const count = await Listing.countDocuments({ broker: u._id });
          return { ...u, listingsCount: count };
        }
        return u;
      })
    );

    res.json({ users: usersWithCounts, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route DELETE /api/admin/users/:id
 * FR29 — Content Moderation (delete user)
 * FR37 — Audit Log
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete an admin' });

    if (user.role === 'broker') {
      await Listing.deleteMany({ broker: user._id });
    }

    await audit(req, 'DELETE_USER', 'User', user._id, { name: user.name, role: user.role });
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route PUT /api/admin/verify-broker/:id
 * FR28 — Broker Verification Panel
 * FR48 — Verification Badge toggle
 * FR37 — Audit Log
 */
export const verifyBroker = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'broker') return res.status(404).json({ message: 'Broker not found' });

    user.isBrokerVerified = true;
    user.verificationBadge = true;          // FR48
    user.idDocumentStatus = 'approved';     // FR27/FR49
    await user.save();

    await Notification.create({
      user: user._id,
      type: 'verification',
      title: '✅ Broker Verified',
      message: 'Your broker account has been verified. Your listings are now visible with a verification badge.',
    });

    await audit(req, 'VERIFY_BROKER', 'User', user._id, { brokerName: user.name });
    res.json({ message: 'Broker verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route PUT /api/admin/reject-broker/:id
 * FR28 — Broker Verification Panel (reject)
 * FR37 — Audit Log
 */
export const rejectBroker = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'broker') return res.status(404).json({ message: 'Broker not found' });

    user.idDocumentStatus = 'rejected';
    await user.save();

    await Notification.create({
      user: user._id,
      type: 'verification',
      title: '❌ Verification Rejected',
      message: req.body.reason || 'Your ID verification was not approved. Please re-upload a clear, valid document.',
    });

    await audit(req, 'REJECT_BROKER', 'User', user._id, { brokerName: user.name, reason: req.body.reason });
    res.json({ message: 'Broker verification rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route PUT /api/admin/suspend/:id
 * FR30 — User Suspension
 * FR37 — Audit Log
 */
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot suspend an admin' });

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? 'REACTIVATE_USER' : 'SUSPEND_USER';
    await audit(req, action, 'User', user._id, { name: user.name, isActive: user.isActive });

    res.json({ message: user.isActive ? 'User reactivated' : 'User suspended', isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route PUT /api/admin/listings/:id/moderate
 * FR29 — Content Moderation (approve/reject/flag listings)
 * FR37 — Audit Log
 */
export const moderateListing = async (req, res) => {
  try {
    const { action, status } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (action) {
      listing.isApproved = action === 'approve';
      if (action === 'reject') listing.status = 'pending';
    }

    if (status) listing.status = status;
    await listing.save();

    if (action) {
      await Notification.create({
        user: listing.broker,
        type: 'listing',
        title: action === 'approve' ? '✅ Listing Approved' : '❌ Listing Rejected',
        message: `Your listing "${listing.title}" has been ${action}d.`,
      });
      await audit(req, `${action.toUpperCase()}_LISTING`, 'Listing', listing._id, { title: listing.title, action });
    }

    res.json({ message: 'Listing updated successfully', listing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route GET /api/admin/listings
 * FR29 — Content Moderation view
 */
export const getAdminListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, flagged } = req.query;
    const query = { source: { $exists: false } };

    if (status) query.status = status;
    if (flagged === 'true') query.isFlaggedDuplicate = true; // FR33
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [listings, total] = await Promise.all([
      Listing.find(query).select('-images.data').populate('broker', 'name phone').sort('-createdAt').skip(skip).limit(Number(limit)),
      Listing.countDocuments(query),
    ]);
    res.json({ listings, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route DELETE /api/admin/listings/:id
 * FR29 — Content Moderation (delete)
 * FR37 — Audit Log
 */
export const deleteListingAdmin = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    await audit(req, 'DELETE_LISTING', 'Listing', listing._id, { title: listing.title });
    await listing.deleteOne();
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route GET /api/admin/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalListings, totalBookings, usersByRole, pendingBrokers, listingsByStatus] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      BookingRequest.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'broker', isBrokerVerified: false, idDocumentStatus: 'pending' }),
      Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    res.json({ totalUsers, totalListings, totalBookings, pendingBrokers, usersByRole, listingsByStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route GET /api/admin/pending-brokers
 * FR28 — Broker Verification Panel
 */
export const getPendingBrokers = async (req, res) => {
  try {
    const brokers = await User.find({
      role: 'broker',
      isBrokerVerified: false,
      isActive: true,
    }).select('-avatarData').sort('-createdAt');
    res.json(brokers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route GET /api/admin/audit-logs
 * FR37 — Audit Logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, targetModel } = req.query;
    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    if (targetModel) query.targetModel = targetModel;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('admin', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.json({ logs, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route GET /api/admin/fraud-flags
 * FR33 — Fraud Detection: flagged duplicate listings
 */
export const getFraudFlags = async (req, res) => {
  try {
    const flagged = await Listing.find({ isFlaggedDuplicate: true })
      .select('-images.data')
      .populate('broker', 'name phone email')
      .sort('-createdAt');
    res.json({ flagged, total: flagged.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route PUT /api/admin/users/:id/approve-id
 * FR49 — Approve student ID verification
 * FR28 — Broker ID document approval
 * FR37 — Audit Log
 */
export const approveIdDocument = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { approve } = req.body; // true or false
    user.idDocumentStatus = approve ? 'approved' : 'rejected';
    if (approve && user.role === 'broker') {
      user.isBrokerVerified = true;
      user.verificationBadge = true;
    }
    await user.save();

    await Notification.create({
      user: user._id,
      type: 'verification',
      title: approve ? '✅ ID Verified' : '❌ ID Rejected',
      message: approve
        ? 'Your ID document has been verified successfully.'
        : (req.body.reason || 'Your ID document was not accepted. Please re-upload a clearer copy.'),
    });

    await audit(req, approve ? 'APPROVE_ID' : 'REJECT_ID', 'User', user._id, { name: user.name });
    res.json({ message: approve ? 'ID approved' : 'ID rejected', idDocumentStatus: user.idDocumentStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
