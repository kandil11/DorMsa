import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import ListingCard from '../../components/listing/ListingCard';
import Skeleton from '../../components/ui/Skeleton';
import { listingService } from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useNotification();

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const { data } = await listingService.getMyListings();
      setListings(data);
    } catch (err) {
      toast.error('Failed to fetch your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleEdit = (id) => {
    navigate(`/broker/edit-listing/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await listingService.delete(id);
        toast.success('Listing deleted successfully');
        setListings(listings.filter(l => l._id !== id));
      } catch (err) {
        toast.error('Failed to delete listing');
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-secondary-700">My Listings</h1>
        <Link to="/broker/add-listing"><Button icon={Plus}>Add Listing</Button></Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-[400px] rounded-2xl" />)}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState 
          icon={Home} 
          title="No listings yet" 
          description="Create your first listing and start connecting with students." 
          action={<Link to="/broker/add-listing"><Button icon={Plus}>Create Listing</Button></Link>} 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <ListingCard 
              key={listing._id} 
              listing={listing} 
              isBrokerView={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyListings;
