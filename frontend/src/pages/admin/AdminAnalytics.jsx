import { motion } from 'framer-motion';
import { Users, Home, TrendingUp, ShieldCheck, BarChart3, UserPlus } from 'lucide-react';
import Card from '../../components/ui/Card';

const AdminAnalytics = () => {
  const stats = [
    { icon: Users, label: 'Total Users', value: '0', color: 'bg-primary-50 text-primary-600' },
    { icon: Home, label: 'Total Listings', value: '0', color: 'bg-blue-50 text-blue-600' },
    { icon: ShieldCheck, label: 'Pending Brokers', value: '0', color: 'bg-amber-50 text-amber-600' },
    { icon: TrendingUp, label: 'Bookings', value: '0', color: 'bg-green-50 text-green-600' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-extrabold text-secondary-700 mb-6">Analytics Overview</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card hover={false} className="p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-secondary-700">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card hover={false} className="p-6">
          <h2 className="font-bold text-secondary-700 mb-4 flex items-center gap-2"><BarChart3 size={18} /> Users by Role</h2>
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chart placeholder — data will appear with users</div>
        </Card>
        <Card hover={false} className="p-6">
          <h2 className="font-bold text-secondary-700 mb-4 flex items-center gap-2"><UserPlus size={18} /> Recent Users</h2>
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Recent registrations will appear here</div>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
