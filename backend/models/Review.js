import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [500, 'Review cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per listing
reviewSchema.index({ user: 1, listing: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
