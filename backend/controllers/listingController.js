import Listing from '../models/Listing.js';
import mongoose from 'mongoose';
import { getListingsConnection } from '../config/db.js';
import { notifyMatchingSavedSearches } from '../services/notificationService.js';
import { geocodeAddress, distanceFromCampus } from '../services/mapsService.js';

/**
 * @desc    Get all listings with filtering, sorting, pagination
 * @route   GET /api/listings
 * @access  Public
 * FR07 — Price Filtering
 * FR08 — Room Type Filter
 * FR09 — Gender-Specific Search
 * FR10 — Proximity Search
 * FR41 — Amenities Filter
 */
export const getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      minPrice,
      maxPrice,
      gender,
      roomType,
      propertyType,
      status = 'available',
      search,
      area,
      maxDistance,
      amenities, // FR41: comma-separated list e.g. "wifi,parking"
      nearbyAmenities, // FR41: nearby area amenities
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (gender) query.gender = gender;
    if (roomType) query.roomType = roomType;
    if (propertyType) query.propertyType = propertyType;
    if (area) query['location.area'] = { $regex: area, $options: 'i' };

    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = Number(minPrice);
      if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
    }

    // FR10 — Proximity Search
    if (maxDistance) {
      query['location.distanceFromCampus'] = { $lte: Number(maxDistance) };
    }

    // FR41 — Amenities Filter (listing amenities)
    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (amenityList.length > 0) query.amenities = { $all: amenityList };
    }

    // FR41 — Nearby area amenities filter
    if (nearbyAmenities) {
      const nearbyList = nearbyAmenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (nearbyList.length > 0) query.nearbyAmenities = { $all: nearbyList };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Only return manually added DorMsa verified listings
    query.source = { $exists: false };

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .select('-images.data')
        .populate('broker', 'name phone avatar isBrokerVerified verificationBadge')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Listing.countDocuments(query),
    ]);

    res.json({
      listings,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get single listing by ID
 * @route   GET /api/listings/:id
 * @access  Public
 * FR11 — Property Details View
 */
export const getListingById = async (req, res) => {
  try {
    const listingId = req.params.id;

    let listing = await Listing.findById(listingId).populate(
      'broker',
      'name phone avatar bio companyName isBrokerVerified verificationBadge'
    ).lean();

    if (!listing) {
      const conn = getListingsConnection();
      if (conn) {
        const ExternalListing = conn.model(
          'Listing',
          new mongoose.Schema({}, { strict: false }),
          'listings'
        );
        listing = await ExternalListing.findById(listingId).lean();
      }
    }

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (!listing.gender || listing.source) {
      const mappedListing = {
        _id: listing._id,
        title: listing.title,
        description: listing.description || listing.compound || 'No description available.',
        price: {
          amount: listing.price?.amount || listing.price?.amount_egp || 0,
          period: (listing.price?.period || 'monthly').toLowerCase(),
        },
        location: {
          address: listing.location?.address || listing.location || '',
          area: listing.location?.area || listing.area || '',
        },
        propertyType: listing.propertyType || listing.property_type || listing.prop_category || 'apartment',
        roomType: listing.roomType || (listing.bedrooms ? `${listing.bedrooms} bed` : 'studio'),
        amenities: listing.amenities || [],
        images: listing.images || [],
        status: listing.status || 'available',
        source: listing.source || 'external',
        url: listing.url || '',
        broker: listing.broker || {
          name: 'External Broker',
          phone: '',
          companyName: listing.source || 'External',
        },
      };
      return res.json(mappedListing);
    }

    // Increment view count
    await Listing.updateOne({ _id: listingId }, { $inc: { views: 1 }, lastActivityAt: new Date() });
    listing.views = (listing.views || 0) + 1;

    return res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a new listing
 * @route   POST /api/listings
 * @access  Private (Broker)
 * FR21 — Create Listing
 * FR33 — Fraud Detection (duplicate check)
 * FR35 — Notify matching saved searches
 */
export const createListing = async (req, res) => {
  try {
    let bodyData = req.body;
    if (req.body.data) {
      try { bodyData = JSON.parse(req.body.data); } catch (_) {}
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
      }));
    }

    // FR10/FR16 — Auto-geocode address if coordinates not provided
    let location = bodyData.location || {};
    if (location.address && (!location.coordinates?.lat || !location.coordinates?.lng)) {
      try {
        const coords = await geocodeAddress(location.address);
        location.coordinates = { lat: coords.lat, lng: coords.lng };
        const dist = distanceFromCampus(coords.lat, coords.lng);
        location.distanceFromCampus = dist.distanceKm;
      } catch (_) {}
    }

    const listing = await Listing.create({
      ...bodyData,
      location,
      images,
      broker: req.user._id,
      contactPhone: bodyData.contactPhone || req.user.phone,
      lastActivityAt: new Date(),
    });

    // FR33 — Duplicate listing detection
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const similarCount = await Listing.countDocuments({
      broker: req.user._id,
      'location.area': listing.location?.area,
      title: { $regex: listing.title.slice(0, 20), $options: 'i' },
      createdAt: { $gte: sevenDaysAgo },
      _id: { $ne: listing._id },
    });

    if (similarCount > 0) {
      await Listing.findByIdAndUpdate(listing._id, { isFlaggedDuplicate: true });
      console.warn(`🚨 [FR33] Potential duplicate listing flagged: ${listing._id} by broker ${req.user._id}`);
    }

    // FR35 — Notify users with matching saved searches (fire-and-forget)
    notifyMatchingSavedSearches(listing).catch(() => {});

    const listingObj = listing.toObject();
    listingObj.images = listing.images.map((_, idx) => ({ index: idx }));
    res.status(201).json(listingObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Serve a listing image by index
 * @route   GET /api/listings/:id/image/:index
 * @access  Public
 */
export const getListingImage = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).select('images');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const idx = Number(req.params.index);
    const image = listing.images[idx];
    if (!image || !image.data) return res.status(404).json({ message: 'Image not found' });

    res.set('Content-Type', image.contentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(image.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update a listing
 * @route   PUT /api/listings/:id
 * @access  Private (Broker - owner only)
 * FR22 — Edit Listing
 * FR23 — Availability Toggle (via status field)
 */
export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.broker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    let bodyData = req.body;
    if (req.body.data) {
      try { bodyData = JSON.parse(req.body.data); } catch (_) {}
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
      }));
      bodyData.images = [...(listing.images || []), ...newImages];
    }

    if (bodyData.removeImages) {
      const toRemove = JSON.parse(bodyData.removeImages);
      bodyData.images = (bodyData.images || listing.images).filter((_, i) => !toRemove.includes(i));
      delete bodyData.removeImages;
    }

    // Always update lastActivityAt on any edit
    bodyData.lastActivityAt = new Date();

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: bodyData },
      { new: true, runValidators: true }
    ).select('-images.data');

    res.json(updatedListing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a listing
 * @route   DELETE /api/listings/:id
 * @access  Private (Broker - owner, or Admin)
 */
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.broker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get broker's own listings
 * @route   GET /api/listings/my-listings
 * @access  Private (Broker)
 * FR24 — Broker Dashboard listings
 */
export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ broker: req.user._id }).sort('-createdAt').select('-images.data');
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get listing stats
 * @route   GET /api/listings/stats
 * @access  Public
 */
export const getListingStats = async (req, res) => {
  try {
    const [total, available, byGender, byType, avgPrice] = await Promise.all([
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'available' }),
      Listing.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
      Listing.aggregate([{ $group: { _id: '$propertyType', count: { $sum: 1 } } }]),
      Listing.aggregate([{ $group: { _id: null, avg: { $avg: '$price.amount' } } }]),
    ]);

    res.json({ total, available, byGender, byType, averagePrice: avgPrice[0]?.avg || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Track contact click (WhatsApp or Call) to increment inquiries
 * @route   POST /api/listings/:id/track-contact
 * @access  Public
 * FR25 — Inquiry Tracking
 */
export const trackContact = async (req, res) => {
  try {
    const { type = 'call' } = req.body; // 'whatsapp' | 'call'
    await Listing.updateOne(
      { _id: req.params.id },
      { $inc: { inquiries: 1 }, lastActivityAt: new Date() }
    );
    res.json({ success: true, type });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Bulk update multiple listings (toggle status or update price)
 * @route   PUT /api/listings/bulk
 * @access  Private (Broker)
 * FR26 — Bulk Management
 */
export const bulkUpdateListings = async (req, res) => {
  try {
    const { ids, update } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No listing IDs provided' });
    }

    if (!update || Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    // Security: only allow broker to update their own listings
    const allowedFields = ['status', 'price.amount', 'price.period'];
    const sanitizedUpdate = {};
    for (const key of allowedFields) {
      if (update[key] !== undefined) sanitizedUpdate[key] = update[key];
    }
    sanitizedUpdate.lastActivityAt = new Date();

    const result = await Listing.updateMany(
      { _id: { $in: ids }, broker: req.user._id },
      { $set: sanitizedUpdate }
    );

    res.json({
      message: `Updated ${result.modifiedCount} listing(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get broker analytics (views, inquiries, conversion stats)
 * @route   GET /api/listings/broker-stats
 * @access  Private (Broker)
 * FR24 — Broker Dashboard metrics
 * FR25 — Inquiry Tracking aggregation
 */
export const getBrokerStats = async (req, res) => {
  try {
    const stats = await Listing.aggregate([
      { $match: { broker: req.user._id } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalInquiries: { $sum: '$inquiries' },
          availableCount: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          rentedCount: { $sum: { $cond: [{ $eq: ['$status', 'rented'] }, 1, 0] } },
        },
      },
    ]);

    const data = stats[0] || {
      totalListings: 0,
      totalViews: 0,
      totalInquiries: 0,
      availableCount: 0,
      rentedCount: 0,
    };

    // Conversion: inquiries / views as a percentage
    data.conversionRate =
      data.totalViews > 0
        ? Math.round((data.totalInquiries / data.totalViews) * 100)
        : 0;

    // Per-listing breakdown
    const listings = await Listing.find({ broker: req.user._id })
      .select('title status views inquiries price.amount createdAt lastActivityAt isFlaggedDuplicate')
      .sort('-views');

    res.json({ summary: data, listings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get listings from existing egypt_real_estate database
 * @route   GET /api/listings/external
 * @access  Public
 */
export const getExternalListings = async (req, res) => {
  try {
    const { page = 1, limit = 12, source, area, minPrice, maxPrice } = req.query;

    const conn = await getListingsConnection();
    if (!conn) {
      return res.status(500).json({ message: 'External database not available' });
    }

    const ExternalListing = conn.model(
      'Listing',
      new mongoose.Schema({}, { strict: false }),
      'listings'
    );

    const query = {};
    if (source) query.source = source;
    if (area) query.area = { $regex: area, $options: 'i' };
    if (minPrice || maxPrice) {
      query['price.amount_egp'] = {};
      if (minPrice) query['price.amount_egp'].$gte = Number(minPrice);
      if (maxPrice) query['price.amount_egp'].$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
      ExternalListing.find(query).skip(skip).limit(Number(limit)).lean(),
      ExternalListing.countDocuments(query),
    ]);

    res.json({
      listings,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
