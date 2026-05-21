import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendOTP, sendPasswordResetOTP } from '../services/smsService.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * FR01 — User Registration (Name, Phone, Role)
 * FR02 — Triggers OTP send via mock SMS
 */
export const register = async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'User with this phone already exists' });
    }

    const allowedRoles = ['student', 'parent', 'broker'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Generate 6-digit OTP for immediate phone verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      phone,
      email,
      password,
      role: role || 'student',
      otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    // FR02 — Send OTP via mock SMS service
    await sendOTP(phone, otp);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id),
      // Return OTP in non-production so devs can test without a real phone
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 * FR03 — Secure Login
 */
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBrokerVerified: user.isBrokerVerified,
      verificationBadge: user.verificationBadge,
      avatar: user.avatar,
      idDocumentStatus: user.idDocumentStatus,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 * FR04 — Profile data
 * FR48 — Includes verificationBadge
 * FR49 — Includes idDocumentStatus
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-avatarData -idDocument.data');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        hasAvatar: !!user.avatarData,
        isVerified: user.isVerified,
        isBrokerVerified: user.isBrokerVerified,
        verificationBadge: user.verificationBadge,
        bio: user.bio,
        companyName: user.companyName,
        licenseNumber: user.licenseNumber,
        studentId: user.studentId,
        idDocumentStatus: user.idDocumentStatus,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 * FR04 — Profile Editing
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let bodyData = req.body;
    if (req.body.data) {
      try { bodyData = JSON.parse(req.body.data); } catch (_) {}
    }

    if (bodyData.name) user.name = bodyData.name;
    if (bodyData.email !== undefined) user.email = bodyData.email;
    if (bodyData.bio !== undefined) user.bio = bodyData.bio;
    if (bodyData.companyName !== undefined) user.companyName = bodyData.companyName;
    if (bodyData.licenseNumber !== undefined) user.licenseNumber = bodyData.licenseNumber;
    // FR49 — Student can set their student ID string
    if (bodyData.studentId !== undefined) user.studentId = bodyData.studentId;

    if (req.file) {
      user.avatarData = req.file.buffer;
      user.avatarContentType = req.file.mimetype;
    }

    if (bodyData.password && bodyData.password.length >= 6) {
      user.password = bodyData.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      companyName: updatedUser.companyName,
      licenseNumber: updatedUser.licenseNumber,
      studentId: updatedUser.studentId,
      hasAvatar: !!updatedUser.avatarData,
      verificationBadge: updatedUser.verificationBadge,
      idDocumentStatus: updatedUser.idDocumentStatus,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Serve user avatar image
 * @route   GET /api/auth/avatar/:id
 * @access  Public
 */
export const getAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('avatarData avatarContentType name');
    if (!user || !user.avatarData) {
      return res.status(404).json({ message: 'Avatar not found' });
    }
    res.set('Content-Type', user.avatarContentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(user.avatarData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Request OTP for phone verification
 * @route   POST /api/auth/request-otp
 * @access  Public
 * FR02 — OTP Verification
 */
export const requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    // FR02 — Send OTP via mock SMS service
    await sendOTP(phone, otp);

    res.json({
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Verify OTP and mark phone as verified
 * @route   POST /api/auth/verify-otp
 * @access  Public
 * FR02 — OTP Verification
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || !user.otp.code) return res.status(400).json({ message: 'No OTP requested' });
    if (new Date() > user.otp.expiresAt) return res.status(400).json({ message: 'OTP has expired' });
    if (user.otp.code !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({ message: 'Phone verified successfully', token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Request password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 * FR06 — Password Recovery
 */
export const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      // Return success to prevent phone enumeration attacks
      return res.json({ message: 'If this number is registered, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    // FR06 — Send reset OTP via mock SMS
    await sendPasswordResetOTP(phone, otp);

    res.json({
      message: 'If this number is registered, an OTP has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Reset password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 * FR06 — Password Recovery
 */
export const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.resetOtp || !user.resetOtp.code) {
      return res.status(400).json({ message: 'No reset OTP requested. Please request a new one.' });
    }
    if (new Date() > user.resetOtp.expiresAt) {
      return res.status(400).json({ message: 'Reset OTP has expired. Please request a new one.' });
    }
    if (user.resetOtp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.password = newPassword;     // Pre-save hook will hash it
    user.resetOtp = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Upload student ID document
 * @route   POST /api/auth/upload-student-id
 * @access  Private
 * FR27 — Broker Identity Submission
 * FR49 — Student ID Verification upload
 */
export const uploadIdDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.idDocument = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      uploadedAt: new Date(),
    };
    user.idDocumentStatus = 'pending';
    await user.save();

    res.json({
      message: 'ID document uploaded successfully. Awaiting admin review.',
      idDocumentStatus: 'pending',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
