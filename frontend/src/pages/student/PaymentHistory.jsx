import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, XCircle, Clock, Receipt, TrendingDown } from 'lucide-react';
import { paymentService } from '../../services/apiService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { formatPrice } from '../../utils/helpers';

const STATUS_CONFIG = {
  completed: { variant: 'success', icon: CheckCircle, label: 'Completed' },
  pending:   { variant: 'warning', icon: Clock,       label: 'Pending'   },
  failed:    { variant: 'error',   icon: XCircle,     label: 'Failed'    },
  refunded:  { variant: 'info',    icon: TrendingDown, label: 'Refunded' },
};

/**
 * FR44 — Payment History: paginated list of deposit transactions
 */
const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await paymentService.getHistory({ page });
        setPayments(data.payments || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-700">Payment History</h1>
          <p className="text-sm text-gray-500 mt-1">{total} transaction{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Your deposit payment history will appear here."
        />
      ) : (
        <>
          <div className="space-y-3">
            {payments.map((p) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.status === 'completed' ? 'bg-green-50 text-green-500' :
                    p.status === 'failed' ? 'bg-red-50 text-red-500' :
                    p.status === 'refunded' ? 'bg-blue-50 text-blue-500' :
                    'bg-amber-50 text-amber-500'
                  }`}>
                    <StatusIcon size={22} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-700 truncate">
                      {p.listing?.title || p.description || 'Property Deposit'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                      {p.transactionRef && (
                        <span className="text-xs text-gray-300 font-mono">{p.transactionRef.slice(-12)}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-extrabold text-lg ${p.status === 'completed' ? 'text-green-600' : p.status === 'failed' ? 'text-red-500' : 'text-gray-700'}`}>
                      {formatPrice(p.amount)}
                    </p>
                    <p className="text-xs text-gray-400">{p.currency || 'EGP'}</p>
                    <div className="mt-1">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    page === i + 1 ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default PaymentHistory;
