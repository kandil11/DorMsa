import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const NotificationContext = createContext(null);

let toastId = 0;

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info };
  const colors = {
    success: 'bg-primary-500 border-primary-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-amber-500 border-amber-600',
    info: 'bg-secondary-500 border-secondary-600',
  };

  return (
    <NotificationContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                className={`${colors[toast.type]} text-white px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 cursor-pointer`}
                onClick={() => removeToast(toast.id)}
              >
                <Icon size={20} className="shrink-0" />
                <p className="text-sm font-medium flex-1">{toast.message}</p>
                <X size={16} className="shrink-0 opacity-70 hover:opacity-100" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
