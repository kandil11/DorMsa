import express from 'express';
import {
  getUsers, deleteUser, verifyBroker, rejectBroker, suspendUser,
  moderateListing, getAdminListings, deleteListingAdmin,
  getAnalytics, getPendingBrokers,
  getAuditLogs, getFraudFlags, approveIdDocument,
} from '../controllers/adminController.js';
import { protect } from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, roleCheck('admin'));

// User management
router.get('/users', getUsers);                           // FR05
router.delete('/users/:id', deleteUser);                  // FR29, FR37
router.put('/suspend/:id', suspendUser);                  // FR30, FR37
router.put('/users/:id/approve-id', approveIdDocument);   // FR28, FR49, FR37

// Broker verification
router.get('/analytics', getAnalytics);
router.get('/pending-brokers', getPendingBrokers);        // FR28
router.put('/verify-broker/:id', verifyBroker);           // FR28, FR48, FR37
router.put('/reject-broker/:id', rejectBroker);           // FR28, FR37

// Listing moderation
router.get('/listings', getAdminListings);                // FR29
router.put('/listings/:id/moderate', moderateListing);    // FR29, FR37
router.delete('/listings/:id', deleteListingAdmin);       // FR29, FR37

// FR33 — Fraud detection flags
router.get('/fraud-flags', getFraudFlags);

// FR37 — Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
