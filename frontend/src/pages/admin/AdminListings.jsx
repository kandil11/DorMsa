import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Search, Trash2, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { adminService } from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';
import { formatPrice } from '../../utils/helpers';

const AdminListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const toast = useNotification();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data } = await adminService.getListings({ status, search });
      setListings(data.listings);
    } catch (err) {
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 500);
    return () => clearTimeout(timer);
  }, [status, search]);

  const handleModerate = async (id, action) => {
    try {
      await adminService.moderateListing(id, action);
      toast.success(`Listing ${action}d`);
      setListings(listings.map(l => 
        l._id === id ? { ...l, isApproved: action === 'approve', status: action === 'reject' ? 'pending' : l.status } : l
      ));
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminService.updateListingStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setListings(listings.map(l => l._id === id ? { ...l, status: newStatus } : l));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await adminService.deleteListing(id);
        toast.success('Listing deleted');
        setListings(listings.filter(l => l._id !== id));
      } catch (err) {
        toast.error('Failed to delete listing');
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-extrabold text-secondary-700 mb-6">Property Management</h1>
      
      <Card hover={false} className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search properties by title or location..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" 
            />
          </div>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="not-available">Not Available</option>
          </select>
        </div>
      </Card>

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Broker</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan="5" className="px-6 py-4"><Skeleton className="h-10 w-full rounded-lg" /></td>
                  </tr>
                ))
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">No properties found</td>
                </tr>
              ) : (
                listings.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {l.images && l.images.length > 0 ? (
                            <img 
                              src={l.images[0].index !== undefined ? `${API_URL}/listings/${l._id}/image/${l.images[0].index}` : l.images[0].url} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <Home className="text-gray-400 w-full h-full p-2" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-secondary-700 line-clamp-1">{l.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{l.location?.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-secondary-600 font-medium">{l.broker?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{l.broker?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary-600">{formatPrice(l.price?.amount)}</p>
                      <p className="text-xs text-gray-400 capitalize">{l.price?.period}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <Badge variant={l.status === 'available' ? 'success' : l.status === 'pending' ? 'warning' : 'danger'}>
                          {l.status}
                        </Badge>
                        {!l.isApproved && (
                          <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold uppercase">
                            <AlertCircle size={10} /> Pending Approval
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/listings/${l._id}`} title="View Details" className="p-2 text-primary-500 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                          <Eye size={16} />
                        </Link>
                        {!l.isApproved ? (
                          <button onClick={() => handleModerate(l._id, 'approve')} title="Approve" className="p-2 text-green-500 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                            <CheckCircle size={16} />
                          </button>
                        ) : (
                          <button onClick={() => handleModerate(l._id, 'reject')} title="Reject" className="p-2 text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                            <XCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(l._id)} title="Delete" className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

export default AdminListings;
