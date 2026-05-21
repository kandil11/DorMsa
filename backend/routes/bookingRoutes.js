import express from 'express';
import { createBooking, getMyBookings, getBrokerBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { protect } from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/broker-bookings', protect, roleCheck('broker'), getBrokerBookings);
router.put('/:id/status', protect, roleCheck('broker'), updateBookingStatus);

export default router;
