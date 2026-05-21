import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ links, allowedRoles }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar links={links} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <Menu size={22} className="text-secondary-700" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden border border-primary-600/20">
              {user?.hasAvatar ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/avatar/${user._id}?t=${Date.now()}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
