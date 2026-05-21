import express from 'express';
import {
  getListings, getListingById, getListingImage,
  createListing, updateListing, deleteListing,
  getMyListings, getListingStats, getExternalListings,
  trackContact, bulkUpdateListings, getBrokerStats,
} from '../controllers/listingController.js';
import { protect } from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.get('/stats', getListingStats);
router.get('/external', getExternalListings);
router.get('/my-listings', protect, roleCheck('broker'), getMyListings);    // FR21
router.get('/broker-stats', protect, roleCheck('broker'), getBrokerStats);  // FR24, FR25
router.put('/bulk', protect, roleCheck('broker'), bulkUpdateListings);      // FR26

router.get('/', getListings);                                               // FR07-FR10, FR41
router.get('/:id/image/:index', getListingImage);
router.get('/:id', getListingById);                                         // FR11
router.post('/:id/track-contact', trackContact);                            // FR25

router.post('/', protect, roleCheck('broker'), upload.array('images', 10), createListing);      // FR21
router.put('/:id', protect, roleCheck('broker', 'admin'), upload.array('images', 10), updateListing); // FR22, FR23
router.delete('/:id', protect, roleCheck('broker', 'admin'), deleteListing);

export default router;
