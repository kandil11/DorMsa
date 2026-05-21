import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Plus, Send, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supportService } from '../../services/apiService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORIES = ['technical', 'billing', 'listing', 'account', 'fraud', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUS_CONFIG = {
  open:        { variant: 'warning', icon: AlertCircle,   label: 'Open' },
  'in-progress': { variant: 'info',  icon: Clock,         label: 'In Progress' },
  resolved:    { variant: 'success', icon: CheckCircle,   label: 'Resolved' },
  closed:      { variant: 'default', icon: CheckCircle,   label: 'Closed' },
};

/**
 * FR45 — TroubleShoot: Submit and track support tickets
 */
const SupportTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ subject: '', description: '', category: 'technical', priority: 'medium' });

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await supportService.getMyTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await supportService.createTicket(form);
      setTickets((prev) => [data.ticket, ...prev]);
      setShowForm(false);
      setForm({ subject: '', description: '', category: 'technical', priority: 'medium' });
      setSuccessMsg(data.message);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-700">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Get help from our team</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm((v) => !v)}>New Ticket</Button>
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm text-green-700 flex items-center gap-2"
        >
          <CheckCircle size={16} /> {successMsg}
        </motion.div>
      )}

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary-100 p-5 shadow-sm">
              <h2 className="font-bold text-secondary-700 mb-4">Submit a Support Request</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                  <input
                    type="text" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief summary of your issue"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400 capitalize"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400 capitalize"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                  <textarea
                    value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400 resize-none"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="submit" icon={Send} disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Ticket'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-20" />)}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No support tickets"
          description="Having trouble? Submit a ticket and we'll help you out."
          action={<Button icon={Plus} onClick={() => setShowForm(true)}>Create Ticket</Button>}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
            const StatusIcon = cfg.icon;
            const isOpen = expanded === t._id;
            return (
              <motion.div key={t._id} layout className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : t._id)}
                  className="w-full px-5 py-4 flex items-center gap-3 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <StatusIcon size={18} className={cfg.variant === 'success' ? 'text-green-500' : cfg.variant === 'warning' ? 'text-amber-500' : cfg.variant === 'info' ? 'text-blue-500' : 'text-gray-400'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-secondary-700 truncate">{t.subject}</p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">{t.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.createdAt)}</p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="px-5 py-4">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{t.description}</p>
                        <p className="text-xs text-gray-400 mt-3">Ticket ID: {t._id}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default SupportTicket;
