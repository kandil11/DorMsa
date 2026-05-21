import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

const SearchFilter = ({ filters, onChange, onSearch }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  const handleChange = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
  };

  const handleApply = () => {
    onChange(localFilters);
    onSearch && onSearch();
    setShowFilters(false);
  };

  const handleReset = () => {
    setLocalFilters({});
    onChange({});
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by location, title..."
            value={localFilters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 shadow-soft"
          />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} icon={SlidersHorizontal}>Filters</Button>
        <Button onClick={handleApply} icon={Search}>Search</Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-700">Filters</h3>
                <button onClick={handleReset} className="text-sm text-primary-500 hover:underline cursor-pointer flex items-center gap-1"><X size={14} /> Reset</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Min Price (EGP)</label>
                  <input type="number" placeholder="0" value={localFilters.minPrice || ''} onChange={(e) => handleChange('minPrice', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Max Price (EGP)</label>
                  <input type="number" placeholder="50000" value={localFilters.maxPrice || ''} onChange={(e) => handleChange('maxPrice', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
                  <select value={localFilters.gender || ''} onChange={(e) => handleChange('gender', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white">
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Room Type</label>
                  <select value={localFilters.roomType || ''} onChange={(e) => handleChange('roomType', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white">
                    <option value="">All</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Max Distance (km from MSA)</label>
                  <input type="number" placeholder="Any" min="0" value={localFilters.maxDistance || ''} onChange={(e) => handleChange('maxDistance', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Amenities (comma separated)</label>
                  <input type="text" placeholder="e.g. wifi, parking" value={localFilters.amenities || ''} onChange={(e) => handleChange('amenities', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Listing Source</label>
                  <select value={localFilters.dataSource || ''} onChange={(e) => handleChange('dataSource', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 bg-white">
                    <option value="">All Sources</option>
                    <option value="internal">DorMsa Verified</option>
                    <option value="external">External Web Brokers</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleApply} size="sm">Apply Filters</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilter;
