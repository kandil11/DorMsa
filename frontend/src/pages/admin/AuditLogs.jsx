import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, User, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { adminService } from '../../services/apiService';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const ACTION_COLORS = {
  VERIFY_BROKER:   'success',
  REJECT_BROKER:   'error',
  APPROVE_ID:      'success',
  REJECT_ID:       'error',
  SUSPEND_USER:    'error',
  REACTIVATE_USER: 'success',
  DELETE_USER:     'error',
  DELETE_LISTING:  'error',
  APPROVE_LISTING: 'success',
  REJECT_LISTING:  'warning',
  MODERATE_LISTING:'info',
};

/**
 * FR37 — Audit Logs: paginated admin action history
 */
const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  useEffect(() => { fetchLogs(); }, [page, search, modelFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (search) params.action = search;
      if (modelFilter) params.targetModel = modelFilter;
      const { data } = await adminService.getAuditLogs(params);
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-700">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} recorded action{total !== 1 ? 's' : ''} · auto-expire after 90 days</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-5">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by action (e.g. VERIFY_BROKER)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer">
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={modelFilter}
            onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
          >
            <option value="">All Models</option>
            {['User', 'Listing', 'BookingRequest', 'Payment', 'SupportTicket'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-14 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No audit logs"
          description="Admin actions will be recorded here automatically."
        />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Timestamp</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Admin</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">Target</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Details</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold text-xs flex-shrink-0">
                            {log.admin?.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs text-gray-600 truncate max-w-[100px]">
                            {log.admin?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ACTION_COLORS[log.action] || 'info'}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-mono">{log.targetModel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 truncate max-w-[180px] block">
                          {log.details && Object.keys(log.details).length > 0
                            ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                        {log.ip || '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                        page === p ? 'bg-primary-500 text-white' : 'border border-gray-200 text-gray-600 hover:border-primary-300'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AuditLogs;
