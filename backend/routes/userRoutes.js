import express from 'express';
import { getFavorites, addFavorite, removeFavorite, getNotifications, markNotificationRead, markAllNotificationsRead, getSavedSearches, createSavedSearch, deleteSavedSearch } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/favorites', protect, getFavorites);
router.post('/favorites/:listingId', protect, addFavorite);
router.delete('/favorites/:listingId', protect, removeFavorite);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.get('/saved-searches', protect, getSavedSearches);
router.post('/saved-searches', protect, createSavedSearch);
router.delete('/saved-searches/:id', protect, deleteSavedSearch);

export default router;
