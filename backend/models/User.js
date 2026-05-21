import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['student', 'parent', 'broker', 'admin'],
      default: 'student',
    },
    avatar: {
      type: String,
      default: '',
    },
    // MongoDB-native avatar storage
    avatarData: {
      type: Buffer,
    },
    avatarContentType: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBrokerVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // OTP verification fields (registration / phone verify)
    otp: {
      code: String,
      expiresAt: Date,
    },
    // FR06 — Password reset OTP (separate from registration OTP)
    resetOtp: {
      code: String,
      expiresAt: Date,
    },
    // FR48 — Admin-toggled verification badge (shown on profile/listings)
    verificationBadge: {
      type: Boolean,
      default: false,
    },
    // Broker-specific fields
    companyName: String,
    licenseNumber: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    // FR49 — Student ID verification
    studentId: {
      type: String,
      trim: true,
      sparse: true,
    },
    // FR27 / FR49 — Uploaded ID document (binary, stored in MongoDB)
    idDocument: {
      data: Buffer,
      contentType: String,
      uploadedAt: Date,
    },
    idDocumentStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
