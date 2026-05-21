import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, User, Home, Check, X, Clock, PhoneCall } from 'lucide-react';
import { bookingService } from '../../services/apiService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_CONFIG = {
  pending:   { variant: 'warning', label: 'Pending' },
  approved:  { variant: 'success', label: 'Approved' },
  rejected:  { variant: 'error',   label: 'Rejected' },
  cancelled: { variant: 'default', label: 'Cancelled' },
};

/**
 * FR25 — Inquiry Tracking: broker view of all booking requests (inquiries)
 */
const Messages = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await bookingService.getBrokerBookings();
        setBookings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await bookingService.updateStatus(id, status);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status } : b))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const timeAgo = (date) => {
    const d = Math.floor((Date.now() - new Date(date)) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d} days ago`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-700">Messages & Inquiries</h1>
          <p className="text-sm text-gray-500 mt-1">{bookings.length} inquiry request{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          description="When students inquire about your listings, messages will appear here."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
            return (
              <motion.div
                key={b._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Student avatar placeholder */}
                  <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center font-bold text-secondary-600 flex-shrink-0 text-lg">
                    {b.student?.name?.charAt(0) || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-secondary-700">{b.student?.name || 'Student'}</p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <Clock size={12} /> {timeAgo(b.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Home size={12} className="text-primary-400" />
                      <span className="truncate">{b.listing?.title || 'Listing'}</span>
                    </div>

                    {b.message && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 italic">
                        "{b.message}"
                      </p>
                    )}

                    <div className="flex gap-2 mt-3 flex-wrap">
                      {b.student?.phone && (
                        <a href={`tel:${b.student.phone}`}>
                          <Button size="sm" variant="outline" icon={PhoneCall}>Call</Button>
                        </a>
                      )}
                      {b.status === 'pending' && (
                        <>
                          <Button
                            size="sm" variant="primary" icon={Check}
                            onClick={() => handleStatus(b._id, 'approved')}
                            disabled={updating === b._id}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm" variant="ghost" icon={X}
                            onClick={() => handleStatus(b._id, 'rejected')}
                            disabled={updating === b._id}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Messages;
