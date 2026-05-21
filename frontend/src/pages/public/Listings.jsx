import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { listingService } from '../../services/apiService';
import ListingCard from '../../components/listing/ListingCard';
import SearchFilter from '../../components/listing/SearchFilter';
import { ListingCardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Home } from 'lucide-react';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filters };
      const dataSource = params.dataSource;
      delete params.dataSource;
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      
      const fetchLocal = !dataSource || dataSource === 'internal';
      const fetchExternal = !dataSource || dataSource === 'external';

      const promises = [];
      if (fetchLocal) promises.push(listingService.getAll(params));
      else promises.push(Promise.resolve({ data: { listings: [], pages: 0, total: 0 } }));

      if (fetchExternal) promises.push(listingService.getExternal(params));
      else promises.push(Promise.resolve({ data: { listings: [], pages: 0, total: 0 } }));

      const [localRes, externalRes] = await Promise.allSettled(promises);

      const localListings = localRes.status === 'fulfilled' ? localRes.value.data.listings || [] : [];
      const externalListingsRaw = externalRes.status === 'fulfilled' ? externalRes.value.data.listings || [] : [];
      
      const mappedExternal = externalListingsRaw.map(el => ({
        _id: el._id,
        title: el.title,
        price: { amount: el.price?.amount_egp || 0, period: el.price?.period?.toLowerCase() || 'monthly' },
        location: { address: el.location || '', area: el.area || '' },
        propertyType: el.property_type || el.prop_category || 'apartment',
        roomType: el.bedrooms ? `${el.bedrooms} bed` : 'studio',
        status: 'available',
        source: el.source || 'external',
        images: el.images || []
      }));

      const mergedListings = [...localListings, ...mappedExternal];
      setListings(mergedListings);

      const localTotalPages = localRes.status === 'fulfilled' ? localRes.value.data.pages || 1 : 1;
      const extTotalPages = externalRes.status === 'fulfilled' ? externalRes.value.data.pages || 1 : 1;
      setTotalPages(Math.max(localTotalPages, extTotalPages));

      const localTotal = localRes.status === 'fulfilled' ? localRes.value.data.total || 0 : 0;
      const extTotal = externalRes.status === 'fulfilled' ? externalRes.value.data.total || 0 : 0;
      setTotal(localTotal + extTotal);

    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, [page]);

  const handleFilterChange = (newFilters) => { setFilters(newFilters); setPage(1); };
  const handleSearch = () => fetchListings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-secondary-700 mb-2">Student Housing</h1>
        <p className="text-gray-500 mb-6">{total > 0 ? `${total} properties found` : 'Find your perfect home near MSA University'}</p>
      </motion.div>

      <div className="mb-8">
        <SearchFilter filters={filters} onChange={handleFilterChange} onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                  {i + 1}
                </button>
              )).slice(Math.max(0, page - 3), page + 2)}
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Home} title="No listings found" description="Try adjusting your filters or search terms." />
      )}
    </div>
  );
};

export default Listings;
