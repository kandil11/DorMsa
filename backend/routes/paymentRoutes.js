import express from 'express';
import { initiatePayment, getPaymentHistory } from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/initiate', protect, initiatePayment);   // FR17 — Deposit payment
router.get('/history', protect, getPaymentHistory);   // FR44 — Payment history

export default router;
