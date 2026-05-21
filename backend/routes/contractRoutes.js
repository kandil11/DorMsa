import express from 'express';
import { generateContract } from '../controllers/contractController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// FR43 — Generate pre-filled downloadable lease contract
router.get('/:bookingId', protect, generateContract);

export default router;
