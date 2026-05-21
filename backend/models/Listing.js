import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    propertyType: {
      type: String,
      enum: ['studio', 'apartment', 'shared-room', 'single-room', 'villa', 'dorm'],
      required: true,
    },
    images: [
      {
        data: Buffer,           // Raw binary image bytes
        contentType: String,    // e.g. 'image/jpeg'
      },
    ],
    price: {
      amount: {
        type: Number,
        required: [true, 'Price is required'],
      },
      period: {
        type: String,
        enum: ['monthly', 'semester', 'yearly'],
        default: 'monthly',
      },
      currency: {
        type: String,
        default: 'EGP',
      },
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      area: String,
      city: {
        type: String,
        default: '6th of October',
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      distanceFromCampus: {
        type: Number, // in km
        default: 0,
      },
    },
    amenities: [
      {
        type: String,
        enum: [
          'wifi',
          'ac',
          'parking',
          'laundry',
          'kitchen',
          'furnished',
          'security',
          'elevator',
          'balcony',
          'gym',
          'pool',
          'study-room',
        ],
      },
    ],
    roomType: {
      type: String,
      enum: ['single', 'double', 'triple', 'shared'],
      default: 'single',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'mixed'],
      required: true,
    },
    maxOccupants: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['available', 'rented', 'pending', 'not-available'],
      default: 'available',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    inquiries: {
      type: Number,
      default: 0,
    },
    contactWhatsapp: String,
    contactPhone: String,
    // FR40 — Safety indicator (1–5, null = not rated)
    safetyScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // FR41 — Nearby amenity tags (supermarket, pharmacy, etc.)
    nearbyAmenities: [
      {
        type: String,
        enum: ['supermarket', 'pharmacy', 'hospital', 'mosque', 'school', 'restaurant', 'cafe', 'gym', 'bank', 'atm'],
      },
    ],
    // FR47 — Activity tracking for 60-day auto-expiry cron
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    // FR33 — Duplicate fraud detection flag
    isFlaggedDuplicate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
listingSchema.index({ title: 'text', description: 'text', 'location.address': 'text' });
listingSchema.index({ 'price.amount': 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ gender: 1 });
listingSchema.index({ broker: 1 });

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
