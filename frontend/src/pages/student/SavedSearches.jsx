import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Bell, BellOff, Filter, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/apiService';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const GENDER_OPTS = ['male', 'female', 'mixed'];
const ROOM_TYPE_OPTS = ['single', 'double', 'triple', 'shared'];
const PROPERTY_OPTS = ['studio', 'apartment', 'shared-room', 'single-room', 'villa', 'dorm'];

/**
 * FR20 — Saved Searches: create, list, delete search presets with alert toggle
 */
const SavedSearches = () => {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    name: '',
    filters: { minPrice: '', maxPrice: '', gender: '', roomType: '', propertyType: '', maxDistance: '', area: '' },
    notifyOnNew: true,
  });

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      const { data } = await userService.getSavedSearches();
      setSearches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(form.filters).filter(([, v]) => v !== '' && v !== null)
      );
      const { data } = await userService.createSavedSearch({
        name: form.name || 'My Search',
        filters: cleanFilters,
        notifyOnNew: form.notifyOnNew,
      });
      setSearches((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ name: '', filters: { minPrice: '', maxPrice: '', gender: '', roomType: '', propertyType: '', maxDistance: '', area: '' }, notifyOnNew: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await userService.deleteSavedSearch(id);
      setSearches((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const buildFilterSummary = (filters) => {
    const parts = [];
    if (filters.minPrice || filters.maxPrice) {
      parts.push(`${filters.minPrice ? `${Number(filters.minPrice).toLocaleString()}` : '0'} – ${filters.maxPrice ? Number(filters.maxPrice).toLocaleString() : '∞'} EGP`);
    }
    if (filters.gender) parts.push(filters.gender);
    if (filters.roomType) parts.push(filters.roomType);
    if (filters.propertyType) parts.push(filters.propertyType);
    if (filters.maxDistance) parts.push(`≤${filters.maxDistance}km from campus`);
    if (filters.area) parts.push(filters.area);
    return parts.length ? parts.join(' · ') : 'No filters set';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-700">Saved Searches</h1>
          <p className="text-sm text-gray-500 mt-1">Get notified when new matching listings drop</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm((v) => !v)}>
          New Search
        </Button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-primary-100 p-5 shadow-sm">
              <h2 className="font-bold text-secondary-700 mb-4 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-primary-500" /> New Saved Search
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Search Name</label>
                  <input
                    type="text" placeholder="e.g. Budget Studio Near MSA"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min Price (EGP)</label>
                  <input type="number" placeholder="0" value={form.filters.minPrice}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, minPrice: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max Price (EGP)</label>
                  <input type="number" placeholder="Any" value={form.filters.maxPrice}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, maxPrice: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                  <select value={form.filters.gender}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, gender: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                  >
                    <option value="">Any</option>
                    {GENDER_OPTS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Room Type</label>
                  <select value={form.filters.roomType}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, roomType: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                  >
                    <option value="">Any</option>
                    {ROOM_TYPE_OPTS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max Distance (km from MSA)</label>
                  <input type="number" placeholder="Any" min="0" max="30" value={form.filters.maxDistance}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, maxDistance: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Area</label>
                  <input type="text" placeholder="e.g. October City" value={form.filters.area}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, area: e.target.value } }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, notifyOnNew: !f.notifyOnNew }))}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.notifyOnNew ? 'bg-primary-500' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.notifyOnNew ? 'left-6' : 'left-1'}`} />
                  </button>
                  <span className="text-sm text-gray-600">Notify me when matching listings are added</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="submit">Save Search</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Search Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No saved searches"
          description="Save your search filters to get notified about new listings."
          action={<Button icon={Plus} onClick={() => setShowForm(true)}>Create First Search</Button>}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {searches.map((s) => (
              <motion.div
                key={s._id} layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Filter size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-secondary-700 truncate">{s.name}</p>
                    {s.notifyOnNew
                      ? <Bell size={13} className="text-primary-500 flex-shrink-0" title="Notifications on" />
                      : <BellOff size={13} className="text-gray-400 flex-shrink-0" title="Notifications off" />
                    }
                  </div>
                  <p className="text-xs text-gray-400 truncate">{buildFilterSummary(s.filters)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link to={`/listings?${new URLSearchParams(Object.fromEntries(Object.entries(s.filters || {}).filter(([,v]) => v))).toString()}`}>
                    <Button size="sm" variant="outline" icon={Search}>Apply</Button>
                  </Link>
                  <button
                    onClick={() => handleDelete(s._id)}
                    disabled={deleting === s._id}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {deleting === s._id
                      ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 size={14} className="text-red-400" />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default SavedSearches;
