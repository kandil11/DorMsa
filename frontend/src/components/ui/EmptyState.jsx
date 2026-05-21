import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

const EmptyState = ({ icon: Icon = SearchX, title = 'Nothing found', description = 'No results to display.', action }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-5">
        <Icon size={36} className="text-primary-500" />
      </div>
      <h3 className="text-xl font-bold text-secondary-700 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  );
};

export default EmptyState;
