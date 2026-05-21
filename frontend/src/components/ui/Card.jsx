import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = true, onClick, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' } : {}}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
