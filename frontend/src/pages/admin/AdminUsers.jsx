import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Trash2, Ban, CheckCircle, User as UserIcon } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { adminService } from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/helpers';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const toast = useNotification();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminService.getUsers({ role, search });
      setUsers(data.users);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [role, search]);

  const handleSuspend = async (id) => {
    try {
      const { data } = await adminService.suspendUser(id);
      toast.success(data.message);
      setUsers(users.map(u => u._id === id ? { ...u, isActive: data.isActive } : u));
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will also delete all their listings if they are a broker.')) {
      try {
        await adminService.deleteUser(id);
        toast.success('User deleted');
        setUsers(users.filter(u => u._id !== id));
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-extrabold text-secondary-700 mb-6">Users Management</h1>
      
      <Card hover={false} className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" 
            />
          </div>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="broker">Broker</option>
          </select>
        </div>
      </Card>

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan="5" className="px-6 py-4"><Skeleton className="h-10 w-full rounded-lg" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 overflow-hidden">
                          {u.hasAvatar ? (
                            <img src={`${API_URL}/auth/avatar/${u._id}`} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-secondary-700">{u.name}</p>
                          <p className="text-xs text-gray-500">Joined {formatDate(u.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-secondary-600">{u.phone}</p>
                      <p className="text-xs text-gray-400">{u.email || 'No email'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info" className="capitalize">{u.role}</Badge>
                      {u.role === 'broker' && u.isBrokerVerified && <p className="text-[10px] text-green-600 font-bold mt-1 uppercase">Verified</p>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleSuspend(u._id)}
                          title={u.isActive ? 'Suspend' : 'Reactivate'}
                          className={`p-2 rounded-lg transition-colors ${u.isActive ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                        >
                          {u.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(u._id)}
                          title="Delete User"
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};

export default AdminUsers;
