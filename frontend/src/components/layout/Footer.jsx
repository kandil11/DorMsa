import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary-700 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-white font-bold text-xl">DorMsa</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">Find the perfect student housing near MSA University. Trusted by students and parents since 2026.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home:/', 'Listings:/listings', 'About:/about', 'Contact:/contact'].map((item) => {
                const [name, path] = item.split(':');
                return <li key={path}><Link to={path} className="text-sm hover:text-primary-400 transition-colors">{name}</Link></li>;
              })}
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Users</h4>
            <ul className="space-y-2">
              {['Login:/login', 'Register:/register', 'Student Dashboard:/student', 'Broker Dashboard:/broker'].map((item) => {
                const [name, path] = item.split(':');
                return <li key={path}><Link to={path} className="text-sm hover:text-primary-400 transition-colors">{name}</Link></li>;
              })}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-primary-400 shrink-0" /> MSA University, 6th of October City</li>
              <li className="flex items-center gap-2 text-sm"><Phone size={16} className="text-primary-400 shrink-0" /> +20 100 000 0000</li>
              <li className="flex items-center gap-2 text-sm"><Mail size={16} className="text-primary-400 shrink-0" /> support@dormsa.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} DorMsa. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
