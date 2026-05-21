import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/apiService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { ListingCardSkeleton } from '../../components/ui/Skeleton';
import { formatPrice } from '../../utils/helpers';

/**
 * FR13 — Shortlist / Favourites: render and manage user's saved listings
 */
const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data } = await userService.getFavorites();
        setFavorites(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (listingId) => {
    setRemoving(listingId);
    try {
      await userService.removeFavorite(listingId);
      setFavorites((prev) => prev.filter((f) => f.listing?._id !== listingId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-700">My Favorites</h1>
          <p className="text-sm text-gray-500 mt-1">{favorites.length} saved listing{favorites.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/listings">
          <Button variant="outline" size="sm">Browse More</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Start browsing listings and save your favorites here."
          action={<Link to="/listings"><Button>Browse Listings</Button></Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {favorites.map(({ listing }) => {
              if (!listing) return null;
              const imgSrc = listing.images?.length > 0
                ? `${API_URL}/listings/${listing._id}/image/0`
                : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop';

              return (
                <motion.div
                  key={listing._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-44">
                    <img src={imgSrc} alt={listing.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge variant={listing.status === 'available' ? 'success' : 'warning'}>
                        {listing.status}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleRemove(listing._id)}
                      disabled={removing === listing._id}
                      className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      {removing === listing._id
                        ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={16} className="text-red-400" />
                      }
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-secondary-700 truncate mb-1">{listing.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <MapPin size={12} className="text-primary-400 flex-shrink-0" />
                      <span className="truncate">{listing.location?.address || '6th of October City'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-primary-600 font-extrabold text-lg">
                        {formatPrice(listing.price?.amount)}
                        <span className="text-xs font-normal text-gray-400">/{listing.price?.period || 'mo'}</span>
                      </p>
                      <Link to={`/listings/${listing._id}`}>
                        <Button size="sm" icon={ExternalLink} variant="outline">View</Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default Favorites;
