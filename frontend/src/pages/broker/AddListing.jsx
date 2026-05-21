import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Save, Image as ImageIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useNotification } from '../../context/NotificationContext';
import { listingService } from '../../services/apiService';

const AddListing = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    propertyType: 'apartment', 
    gender: 'mixed', 
    roomType: 'single', 
    price: '', 
    period: 'monthly', 
    address: '', 
    area: '', 
    distanceFromCampus: '', 
    contactPhone: '',
    status: 'available'
  });
  const [images, setImages] = useState([]);
  const toast = useNotification();
  const navigate = useNavigate();

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.address) return toast.warning('Please fill required fields');
    setLoading(true);
    try {
      const payloadData = {
        title: form.title, 
        description: form.description, 
        propertyType: form.propertyType, 
        gender: form.gender, 
        roomType: form.roomType,
        price: { amount: Number(form.price), period: form.period },
        location: { address: form.address, area: form.area, distanceFromCampus: Number(form.distanceFromCampus) || 0 },
        contactPhone: form.contactPhone,
        status: form.status,
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payloadData));
      
      images.forEach((img) => {
        formData.append('images', img);
      });

      await listingService.create(formData);
      
      toast.success('Listing created!');
      navigate('/broker/my-listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const SelectField = ({ label, value, onChange, options }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-secondary-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-extrabold text-secondary-700 mb-6">Add New Listing</h1>
      <Card hover={false} className="max-w-3xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
          <Input label="Title *" placeholder="e.g., Furnished Studio near MSA" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary-700">Description</label>
            <textarea rows={4} placeholder="Describe the property..." value={form.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary-700">Property Photos</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ImageIcon size={18} className="text-gray-400" />
              </div>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            {images.length > 0 && <p className="text-xs text-primary-600 mt-1">{images.length} file(s) selected</p>}
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <SelectField label="Property Type" value={form.propertyType} onChange={(v) => handleChange('propertyType', v)} options={[{ value: 'studio', label: 'Studio' }, { value: 'apartment', label: 'Apartment' }, { value: 'shared-room', label: 'Shared Room' }, { value: 'single-room', label: 'Single Room' }, { value: 'villa', label: 'Villa' }, { value: 'dorm', label: 'Dorm' }]} />
            <SelectField label="Gender" value={form.gender} onChange={(v) => handleChange('gender', v)} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'mixed', label: 'Mixed' }]} />
            <SelectField label="Room Type" value={form.roomType} onChange={(v) => handleChange('roomType', v)} options={[{ value: 'single', label: 'Single' }, { value: 'double', label: 'Double' }, { value: 'triple', label: 'Triple' }, { value: 'shared', label: 'Shared' }]} />
            <SelectField label="Status" value={form.status} onChange={(v) => handleChange('status', v)} options={[{ value: 'available', label: 'Available' }, { value: 'pending', label: 'Pending' }, { value: 'not-available', label: 'Not Available' }]} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Price (EGP) *" type="number" placeholder="5000" value={form.price} onChange={(e) => handleChange('price', e.target.value)} />
            <SelectField label="Period" value={form.period} onChange={(v) => handleChange('period', v)} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'semester', label: 'Per Semester' }, { value: 'yearly', label: 'Yearly' }]} />
          </div>
          <Input label="Address *" placeholder="Full address" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Area" placeholder="e.g., 6th of October" value={form.area} onChange={(e) => handleChange('area', e.target.value)} />
            <Input label="Distance from Campus (km)" type="number" placeholder="2" value={form.distanceFromCampus} onChange={(e) => handleChange('distanceFromCampus', e.target.value)} />
          </div>
          <Input label="Contact Phone" type="tel" placeholder="01xxxxxxxxx" value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} icon={Save}>Create Listing</Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};

export default AddListing;
