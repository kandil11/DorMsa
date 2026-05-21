import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Phone, FileText, Check, X, Clock, Eye } from 'lucide-react';
import { adminService } from '../../services/apiService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * FR28 — Broker Verification Panel: Admin view to approve/reject broker IDs
 * FR48 — Verification Badge: toggled on approval
 */
const BrokerVerification = () => {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await adminService.getPendingBrokers();
        setBrokers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleVerify = async (id) => {
    setActing(id);
    try {
      await adminService.verifyBroker(id);
      setBrokers((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id) => {
    setActing(id + '_reject');
    try {
      await adminService.rejectBroker(id);
      setBrokers((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActing(null);
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
          <h1 className="text-2xl font-extrabold text-secondary-700">Broker Verification</h1>
          <p className="text-sm text-gray-500 mt-1">{brokers.length} pending application{brokers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ID Document Preview Modal */}
      <AnimatePresence>
        {previewId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewId(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-4 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-secondary-700">ID Document</h3>
                <button onClick={() => setPreviewId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
              </div>
              <div className="bg-gray-100 rounded-xl overflow-hidden h-64 flex items-center justify-center">
                <img
                  src={`${API_URL}/auth/id-document/${previewId}`}
                  alt="ID Document"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden flex-col items-center text-gray-400">
                  <FileText size={40} />
                  <p className="text-sm mt-2">Document preview not available</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : brokers.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending verifications"
          description="All brokers have been reviewed. New applications will appear here."
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {brokers.map((b) => (
              <motion.div
                key={b._id} layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-700 text-lg flex-shrink-0">
                    {b.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-secondary-700">{b.name}</p>
                      <Badge variant="warning">Pending</Badge>
                      <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <Clock size={12} /> Applied {timeAgo(b.createdAt)}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" />{b.phone}</span>
                      {b.companyName && <span className="flex items-center gap-1"><User size={13} className="text-gray-400" />{b.companyName}</span>}
                      {b.licenseNumber && <span className="text-xs text-gray-400">License: {b.licenseNumber}</span>}
                      {b.email && <span className="text-xs text-gray-400">{b.email}</span>}
                    </div>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      {b.idDocumentStatus === 'pending' && (
                        <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewId(b._id)}>
                          View ID
                        </Button>
                      )}
                      <Button
                        size="sm" variant="primary" icon={Check}
                        onClick={() => handleVerify(b._id)}
                        disabled={!!acting}
                      >
                        {acting === b._id ? 'Approving…' : 'Approve & Verify'}
                      </Button>
                      <Button
                        size="sm" variant="ghost" icon={X}
                        onClick={() => handleReject(b._id)}
                        disabled={!!acting}
                      >
                        {acting === b._id + '_reject' ? 'Rejecting…' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default BrokerVerification;
