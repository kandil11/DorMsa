import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, MessageCircle, Heart, ArrowLeft, Bed, Users, Wifi, Car, Shield, ChevronLeft, ChevronRight, ShieldCheck, Map, Activity, CreditCard } from 'lucide-react';
import { listingService, userService } from '../../services/apiService';
import AuthContext from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import PaymentModal from '../../components/ui/PaymentModal';
import { formatPrice } from '../../utils/helpers';

const PropertyDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await listingService.getById(id);
        setListing(data);

        if (user) {
          const { data: favs } = await userService.getFavorites();
          setIsFavorite(favs.some((f) => f.listing?._id === id));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id, user]);

  const handleFavorite = async () => {
    if (!user) return alert('Please log in to save favorites');
    setSavingFav(true);
    try {
      if (isFavorite) {
        await userService.removeFavorite(id);
        setIsFavorite(false);
      } else {
        await userService.addFavorite(id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFav(false);
    }
  };

  const handleContactTrack = async (type) => {
    if (listing.source) return; // don't track external
    try {
      await listingService.trackContact(id, type); // FR25
    } catch (err) {
      console.error('Contact tracking failed', err);
    }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="w-full h-96 rounded-2xl" />
      <Skeleton className="w-1/2 h-8" />
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-3/4 h-4" />
    </div>
  );

  if (!listing) return <div className="text-center py-20 text-gray-500">Listing not found</div>;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const placeholderImg = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop';
  
  const images = listing.images?.length > 0 
    ? listing.images.map((img) => img.index !== undefined ? `${API_URL}/listings/${id}/image/${img.index}` : img.url) 
    : [placeholderImg];

  // Map URL FR16 (fallback map generation)
  const lat = listing.location?.coordinates?.lat || 29.9602;
  const lng = listing.location?.coordinates?.lng || 30.9459;
  const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Listings
      </Link>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Image Gallery */}
        <div className="relative rounded-2xl overflow-hidden mb-8 h-[400px] bg-gray-100">
          <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover" />
          {images.length > 1 && (
            <>
              <button onClick={() => setActiveImg((p) => (p === 0 ? images.length - 1 : p - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white cursor-pointer"><ChevronLeft size={20} /></button>
              <button onClick={() => setActiveImg((p) => (p === images.length - 1 ? 0 : p + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white cursor-pointer"><ChevronRight size={20} /></button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => <button key={i} onClick={() => setActiveImg(i)} className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${i === activeImg ? 'bg-primary-500' : 'bg-white/60'}`} />)}
              </div>
            </>
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={listing.status === 'available' ? 'success' : 'warning'}>{listing.status}</Badge>
            {listing.gender && <Badge variant="info">{listing.gender}</Badge>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-secondary-700 mb-2">{listing.title}</h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin size={16} className="text-primary-500" />
                {listing.location?.address || listing.location?.area || '6th of October City'}
                {listing.location?.distanceFromCampus > 0 && <span className="text-primary-500 font-medium">• {listing.location.distanceFromCampus}km from campus</span>}
              </div>
            </div>

            <div className="bg-primary-50 p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold text-primary-600">{formatPrice(listing.price?.amount)}<span className="text-base font-normal text-gray-500">/{listing.price?.period || 'month'}</span></p>
              </div>
              {/* FR40 Safety Score indicator */}
              {listing.safetyScore && (
                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 font-semibold text-sm">
                  <ShieldCheck size={18} /> {listing.safetyScore}/5 Safety Rating
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-secondary-700 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{listing.description}</p>
            </div>

            {/* FR41 Amenities + Nearby */}
            {(listing.amenities?.length > 0 || listing.nearbyAmenities?.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-6">
                {listing.amenities?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-secondary-700 mb-3">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 capitalize">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {listing.nearbyAmenities?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-secondary-700 mb-3">Nearby Places</h2>
                    <div className="flex flex-wrap gap-2">
                      {listing.nearbyAmenities.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 capitalize">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FR16 Location Map */}
            <div>
              <h2 className="text-lg font-bold text-secondary-700 mb-3 flex items-center gap-2">
                <Map size={20} className="text-primary-500" /> Location Map
              </h2>
              <div className="h-[300px] w-full bg-gray-200 rounded-xl overflow-hidden shadow-sm">
                <iframe src={staticMapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" title="Location Map"></iframe>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-secondary-700 mb-4">Contact Broker</h3>
              {listing.broker && (
                <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-lg">{listing.broker.name?.charAt(0)}</div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-secondary-700">{listing.broker.name}</p>
                      {/* FR48 Verification Badge */}
                      {listing.broker.verificationBadge && <ShieldCheck size={16} className="text-primary-500" title="Verified Broker" />}
                    </div>
                    <p className="text-xs text-gray-500">{listing.broker.companyName || (listing.broker.verificationBadge ? 'Verified Broker' : 'Unverified Broker')}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {listing.url ? (
                  <a href={listing.url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="primary" className="w-full">View Original Listing</Button>
                  </a>
                ) : (
                  <>
                    <a href={`https://wa.me/2${listing.contactPhone || listing.contactWhatsapp || listing.broker?.phone}`} target="_blank" rel="noopener noreferrer" className="block" onClick={() => handleContactTrack('whatsapp')}>
                      <Button variant="primary" className="w-full bg-[#25D366] hover:bg-[#20bd5a]" icon={MessageCircle}>WhatsApp</Button>
                    </a>
                    <a href={`tel:${listing.contactPhone || listing.broker?.phone}`} className="block" onClick={() => handleContactTrack('call')}>
                      <Button variant="outline" className="w-full" icon={Phone}>Call</Button>
                    </a>
                  </>
                )}
                {/* FR17 Payment / Booking */}
                {!listing.source && user?.role === 'student' && listing.status === 'available' && (
                  <Button 
                    variant="primary" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" 
                    icon={CreditCard}
                    onClick={() => setShowPayment(true)}
                  >
                    Pay Deposit & Book
                  </Button>
                )}
                {/* FR13 Favorites */}
                {!listing.source && (
                  <Button
                    variant={isFavorite ? 'primary' : 'ghost'}
                    className={`w-full ${isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-transparent' : ''}`}
                    icon={Heart}
                    onClick={handleFavorite}
                    disabled={savingFav}
                  >
                    {isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        listing={listing} 
        onSuccess={() => {
          // Optional: redirect to payment history or show toast
        }} 
      />
    </div>
  );
};

export default PropertyDetails;
