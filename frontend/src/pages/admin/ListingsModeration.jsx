import { motion } from 'framer-motion';
import { FileCheck } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

const ListingsModeration = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-extrabold text-secondary-700 mb-6">Listings Moderation</h1>
      <EmptyState icon={FileCheck} title="No pending listings" description="All listings have been reviewed. New submissions will appear here." />
    </motion.div>
  );
};

export default ListingsModeration;
