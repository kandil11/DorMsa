import express from 'express';
import {
  register, login, getProfile, updateProfile, getAvatar,
  requestOTP, verifyOTP, forgotPassword, resetPassword, uploadIdDocument,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Public
router.post('/register', register);                               // FR01
router.post('/login', login);                                     // FR03
router.post('/request-otp', requestOTP);                         // FR02
router.post('/verify-otp', verifyOTP);                           // FR02
router.post('/forgot-password', forgotPassword);                  // FR06
router.post('/reset-password', resetPassword);                    // FR06
router.get('/avatar/:id', getAvatar);

// Protected
router.get('/profile', protect, getProfile);                      // FR04, FR48
router.put('/profile', protect, upload.single('avatar'), updateProfile); // FR04
router.post('/upload-id', protect, upload.single('idDocument'), uploadIdDocument); // FR27, FR49

export default router;
