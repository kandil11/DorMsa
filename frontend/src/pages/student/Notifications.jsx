import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, AlertCircle, Home, ShieldCheck, Settings } from 'lucide-react';
import { userService } from '../../services/apiService';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const TYPE_CONFIG = {
  booking:      { icon: Home,        color: 'bg-blue-50 text-blue-600',   dot: 'bg-blue-500' },
  listing:      { icon: Home,        color: 'bg-primary-50 text-primary-600', dot: 'bg-primary-500' },
  verification: { icon: ShieldCheck, color: 'bg-green-50 text-green-600', dot: 'bg-green-500' },
  system:       { icon: Settings,    color: 'bg-gray-50 text-gray-600',   dot: 'bg-gray-400' },
  message:      { icon: Bell,        color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
};

/**
 * FR46 — Push Notifications: Render in-app notification list with read/unread states
 */
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await userService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await userService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await userService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-700">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-primary-600 font-medium mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" icon={CheckCheck} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif._id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`relative bg-white rounded-xl border transition-colors p-4 flex gap-3 ${
                    notif.isRead ? 'border-gray-100' : 'border-primary-100 bg-primary-50/30'
                  }`}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${config.dot}`} />
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${notif.isRead ? 'text-gray-700' : 'text-secondary-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif._id)}
                      className="ml-2 flex-shrink-0 w-8 h-8 rounded-lg hover:bg-primary-100 flex items-center justify-center transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check size={14} className="text-primary-500" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default Notifications;
