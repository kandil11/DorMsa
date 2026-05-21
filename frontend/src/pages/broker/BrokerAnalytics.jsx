import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Eye, MessageCircle, Home, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { listingService } from '../../services/apiService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { formatPrice } from '../../utils/helpers';

/**
 * FR24 — Broker Dashboard: real view/inquiry metrics
 * FR25 — Inquiry Tracking: aggregated broker stats
 */
const BrokerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await listingService.getBrokerStats();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const summary = data?.summary || {};
  const listings = data?.listings || [];

  const stats = [
    { icon: Home,         label: 'Total Listings',  value: summary.totalListings  ?? '—', color: 'bg-primary-50 text-primary-600' },
    { icon: Eye,          label: 'Total Views',      value: summary.totalViews     ?? '—', color: 'bg-blue-50 text-blue-600' },
    { icon: MessageCircle,label: 'Inquiries',        value: summary.totalInquiries ?? '—', color: 'bg-amber-50 text-amber-600' },
    { icon: TrendingUp,   label: 'Conversion Rate',  value: summary.conversionRate !== undefined ? `${summary.conversionRate}%` : '—', color: 'bg-green-50 text-green-600' },
  ];

  const statusVariant = { available: 'success', rented: 'warning', 'not-available': 'error', pending: 'info' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-extrabold text-secondary-700 mb-6">Analytics</h1>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Card key={i} hover={false} className="p-5">
            {loading ? (
              <div className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-secondary-700">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Per-Listing Performance Table */}
      <Card hover={false} className="p-6">
        <h2 className="font-bold text-secondary-700 mb-4">Listing Performance</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No listings yet. <a href="/broker/add-listing" className="text-primary-500 hover:underline">Add your first listing →</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 font-semibold text-gray-500 w-full">Listing</th>
                  <th className="text-center pb-3 font-semibold text-gray-500 whitespace-nowrap px-3">Status</th>
                  <th className="text-center pb-3 font-semibold text-gray-500 whitespace-nowrap px-3">
                    <Eye size={14} className="inline mr-1" />Views
                  </th>
                  <th className="text-center pb-3 font-semibold text-gray-500 whitespace-nowrap px-3">
                    <MessageCircle size={14} className="inline mr-1" />Inquiries
                  </th>
                  <th className="text-center pb-3 font-semibold text-gray-500 whitespace-nowrap px-3">Flags</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-secondary-700 truncate max-w-xs">{l.title}</p>
                      <p className="text-xs text-gray-400">{formatPrice(l['price.amount'])} EGP</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={statusVariant[l.status] || 'info'}>{l.status}</Badge>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-600">{l.views || 0}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-600">{l.inquiries || 0}</td>
                    <td className="py-3 px-3 text-center">
                      {l.isFlaggedDuplicate
                        ? <AlertTriangle size={16} className="text-red-400 mx-auto" title="Flagged as potential duplicate" />
                        : <CheckCircle size={16} className="text-green-400 mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default BrokerAnalytics;
