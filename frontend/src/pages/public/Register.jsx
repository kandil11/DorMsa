import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Lock, Eye, EyeOff, Mail, GraduationCap, Briefcase, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const roles = [
  { value: 'student', label: 'Student', icon: GraduationCap, desc: 'Find housing near campus' },
  { value: 'parent', label: 'Parent', icon: Users, desc: 'Find housing for your child' },
  { value: 'broker', label: 'Broker', icon: Briefcase, desc: 'List and manage properties' },
];

const Register = () => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'student' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useNotification();
  const navigate = useNavigate();

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) return toast.warning('Please fill in all required fields');
    if (form.password.length < 6) return toast.warning('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      if (form.role === 'broker') navigate('/broker');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-secondary-700">Create Account</h1>
          <p className="text-gray-500 mt-2">Join DorMsa and find your perfect housing</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-card border border-gray-100">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary-700 mb-3">I am a...</label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleChange('role', r.value)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 text-center cursor-pointer ${
                    form.role === r.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <r.icon size={22} className={`mx-auto mb-1.5 ${form.role === r.value ? 'text-primary-500' : 'text-gray-400'}`} />
                  <p className="text-xs font-semibold">{r.label}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name *" icon={User} placeholder="Ahmed Mohamed" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
            <Input label="Phone Number *" icon={Phone} type="tel" placeholder="01xxxxxxxxx" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            <Input label="Email (Optional)" icon={Mail} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            <div className="relative">
              <Input label="Password *" icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={(e) => handleChange('password', e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 cursor-pointer">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full">Create Account</Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
