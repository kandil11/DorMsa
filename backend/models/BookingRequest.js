import mongoose from 'mongoose';

const bookingRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    broker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    moveInDate: Date,
    duration: {
      type: String,
      enum: ['1-month', '3-months', '6-months', '1-year'],
    },
  },
  {
    timestamps: true,
  }
);

bookingRequestSchema.index({ student: 1, listing: 1 });
bookingRequestSchema.index({ broker: 1, status: 1 });

const BookingRequest = mongoose.model('BookingRequest', bookingRequestSchema);
export default BookingRequest;
