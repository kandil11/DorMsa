import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Search, User, LogOut, Bell, Heart, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const publicLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Listings', path: '/listings', icon: Search },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'broker') return '/broker';
    return '/student';
  };

  return (
    <nav className="sticky top-0 z-50 glass-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">DorMsa</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {publicLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-white cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="font-semibold text-sm text-secondary-700">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                      <div className="p-1.5">
                        <Link to={getDashboardPath()} onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link to="/student/favorites" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                          <Heart size={16} /> Favorites
                        </Link>
                        <Link to="/student/notifications" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                          <Bell size={16} /> Notifications
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg cursor-pointer">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden border-t border-white/10 overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              {publicLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${location.pathname === link.path ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:bg-white/10'}`}>
                  {link.name}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/10">
                {user ? (
                  <>
                    <Link to={getDashboardPath()} onClick={() => setIsOpen(false)} className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 rounded-lg">Dashboard</Link>
                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 rounded-lg cursor-pointer">Logout</button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm text-white border border-white/20 rounded-xl">Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm text-white bg-primary-500 rounded-xl">Register</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
