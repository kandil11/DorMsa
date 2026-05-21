import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ links, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 gradient-secondary text-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg">DorMsa</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded-lg cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold overflow-hidden">
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
            <div>
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-primary-500 text-white shadow-primary' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.icon && <link.icon size={18} />}
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/10">
          <NavLink to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
            <ChevronLeft size={18} /> Back to Home
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
