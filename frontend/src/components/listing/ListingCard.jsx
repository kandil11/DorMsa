import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Heart, Bed, Users } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatPrice } from '../../utils/helpers';

const ListingCard = ({ listing, onFavorite, isFavorited = false, isBrokerView = false, onEdit, onDelete }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const placeholderImg = `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop`;
  
  let imageUrl = placeholderImg;
  if (listing.images && listing.images.length > 0) {
    if (listing.images[0].index !== undefined) {
      imageUrl = `${API_URL}/listings/${listing._id}/image/${listing.images[0].index}`;
    } else if (listing.images[0].url) {
      imageUrl = listing.images[0].url;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={listing.status === 'available' ? 'success' : 'warning'}>{listing.status || 'Available'}</Badge>
          {listing.gender && <Badge variant="info">{listing.gender}</Badge>}
        </div>
        {onFavorite && (
          <button onClick={(e) => { e.preventDefault(); onFavorite(listing._id); }} className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors cursor-pointer">
            <Heart size={18} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
          </button>
        )}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <p className="absolute bottom-3 left-3 text-white font-bold text-lg">{formatPrice(listing.price?.amount)}<span className="text-xs font-normal opacity-80">/{listing.price?.period || 'mo'}</span></p>
      </div>

      {/* Content */}
      <Link to={`/listings/${listing._id}`} className="block p-4">
        <h3 className="font-bold text-secondary-700 text-base mb-1 line-clamp-1 group-hover:text-primary-500 transition-colors">{listing.title}</h3>
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
          <MapPin size={14} className="text-primary-500" />
          <span className="line-clamp-1">{listing.location?.address || listing.location?.area || '6th of October'}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {listing.roomType && <span className="flex items-center gap-1"><Bed size={13} /> {listing.roomType}</span>}
          {listing.propertyType && <span className="flex items-center gap-1"><Users size={13} /> {listing.propertyType}</span>}
          {listing.location?.distanceFromCampus > 0 && <span className="flex items-center gap-1"><MapPin size={13} /> {listing.location.distanceFromCampus}km</span>}
        </div>
      </Link>
      
      {isBrokerView && onEdit && onDelete && (
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={() => onEdit(listing._id)} className="flex-1 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">Edit</button>
          <button onClick={() => onDelete(listing._id)} className="flex-1 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
        </div>
      )}
    </motion.div>
  );
};

export default ListingCard;
