import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      default: 'My Search',
    },
    filters: {
      minPrice: Number,
      maxPrice: Number,
      gender: String,
      roomType: String,
      propertyType: String,
      area: String,
      maxDistance: Number,
      amenities: [String],
    },
    notifyOnNew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

savedSearchSchema.index({ user: 1 });

const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);
export default SavedSearch;
