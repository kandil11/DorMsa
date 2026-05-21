import User from '../models/User.js';
import Favorite from '../models/Favorite.js';
import Notification from '../models/Notification.js';
import SavedSearch from '../models/SavedSearch.js';

/**
 * @desc    Get user favorites
 * @route   GET /api/users/favorites
 * @access  Private
 */
export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate({
        path: 'listing',
        populate: { path: 'broker', select: 'name phone' },
      })
      .sort('-createdAt');

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Add listing to favorites
 * @route   POST /api/users/favorites/:listingId
 * @access  Private
 */
export const addFavorite = async (req, res) => {
  try {
    const existing = await Favorite.findOne({
      user: req.user._id,
      listing: req.params.listingId,
    });

    if (existing) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      listing: req.params.listingId,
    });

    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Remove listing from favorites
 * @route   DELETE /api/users/favorites/:listingId
 * @access  Private
 */
export const removeFavorite = async (req, res) => {
  try {
    await Favorite.findOneAndDelete({
      user: req.user._id,
      listing: req.params.listingId,
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user notifications
 * @route   GET /api/users/notifications
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/users/notifications/:id/read
 * @access  Private
 */
export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/users/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get saved searches
 * @route   GET /api/users/saved-searches
 * @access  Private
 */
export const getSavedSearches = async (req, res) => {
  try {
    const searches = await SavedSearch.find({ user: req.user._id }).sort('-createdAt');
    res.json(searches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create saved search
 * @route   POST /api/users/saved-searches
 * @access  Private
 */
export const createSavedSearch = async (req, res) => {
  try {
    const search = await SavedSearch.create({
      user: req.user._id,
      ...req.body,
    });

    res.status(201).json(search);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete saved search
 * @route   DELETE /api/users/saved-searches/:id
 * @access  Private
 */
export const deleteSavedSearch = async (req, res) => {
  try {
    await SavedSearch.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    res.json({ message: 'Saved search deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
