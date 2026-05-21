import BookingRequest from '../models/BookingRequest.js';
import Listing from '../models/Listing.js';
import Notification from '../models/Notification.js';

export const createBooking = async (req, res) => {
  try {
    const listing = await Listing.findById(req.body.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const booking = await BookingRequest.create({
      student: req.user._id, listing: listing._id, broker: listing.broker,
      message: req.body.message, moveInDate: req.body.moveInDate, duration: req.body.duration,
    });
    listing.inquiries += 1;
    await listing.save();
    await Notification.create({ user: listing.broker, type: 'booking', title: 'New Booking Request', message: `New booking request for "${listing.title}"` });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await BookingRequest.find({ student: req.user._id }).populate('listing', 'title images price').sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBrokerBookings = async (req, res) => {
  try {
    const bookings = await BookingRequest.find({ broker: req.user._id }).populate('student', 'name phone').populate('listing', 'title').sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await BookingRequest.findById(req.params.id).populate('listing', 'title');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.broker.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    booking.status = req.body.status;
    await booking.save();
    await Notification.create({ user: booking.student, type: 'booking', title: `Booking ${req.body.status}`, message: `Your booking for "${booking.listing.title}" has been ${req.body.status}.` });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
