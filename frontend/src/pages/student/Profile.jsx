import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, Calendar, Camera, Briefcase, Hash, Info, Lock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { authService } from '../../services/apiService';
import { formatDate } from '../../utils/helpers';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    companyName: user?.companyName || '',
    licenseNumber: user?.licenseNumber || '',
    password: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      
      data.append('data', JSON.stringify(payload));
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const res = await authService.updateProfile(data);
      updateUser(res.data);
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const avatarUrl = avatarPreview || (user?.hasAvatar ? `${API_URL}/auth/avatar/${user._id}?t=${Date.now()}` : null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-secondary-700">My Profile</h1>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      <Card hover={false} className="max-w-2xl p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
            <div 
              className={`relative w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden ${isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
                  <Camera size={20} className="mb-1" />
                  Upload
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleFileChange} 
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-700">{user?.name}</h2>
              <p className="text-sm text-gray-500 capitalize">{user?.role} {user?.role === 'broker' && (user?.isBrokerVerified ? '(Verified)' : '(Pending Verification)')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none" />
                  </div>
                </div>
                {user?.role === 'broker' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <div className="relative">
                        <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <div className="relative">
                        <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <div className="relative">
                        <Info size={18} className="absolute left-3 top-3 text-gray-400" />
                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none resize-none"></textarea>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 outline-none" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {[
                  { icon: User, label: 'Name', value: user?.name },
                  { icon: Phone, label: 'Phone', value: user?.phone },
                  { icon: Mail, label: 'Email', value: user?.email || 'Not set' },
                  ...(user?.role === 'broker' ? [
                    { icon: Briefcase, label: 'Company Name', value: user?.companyName || 'Not set' },
                    { icon: Hash, label: 'License Number', value: user?.licenseNumber || 'Not set' },
                    { icon: Info, label: 'Bio', value: user?.bio || 'Not set' }
                  ] : []),
                  { icon: Calendar, label: 'Member since', value: formatDate(user?.createdAt) || 'N/A' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface-low rounded-xl">
                    <item.icon size={18} className="text-primary-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-sm font-medium text-secondary-700">{item.value}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {isEditing && (
            <div className="mt-8 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setAvatarPreview(null); setAvatarFile(null); }}>
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Card>
    </motion.div>
  );
};

export default Profile;
