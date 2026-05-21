import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Clock, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { authService } from '../../services/apiService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const STATUS_INFO = {
  none:     { variant: 'default', icon: Shield,       label: 'Not submitted',   desc: 'Upload your ID to get verified.' },
  pending:  { variant: 'warning', icon: Clock,        label: 'Under review',    desc: 'Our team is reviewing your document. This usually takes 1–2 business days.' },
  approved: { variant: 'success', icon: CheckCircle,  label: 'Verified ✓',      desc: 'Your identity has been verified. Your verification badge is now active.' },
  rejected: { variant: 'error',   icon: XCircle,      label: 'Rejected',        desc: 'Your document was not accepted. Please re-upload a clearer, valid copy.' },
};

/**
 * FR27 — Broker Identity Submission
 * FR49 — Student ID Verification upload
 */
const IdentityVerification = () => {
  const { user, setUser } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const status = user?.idDocumentStatus || 'none';
  const cfg = STATUS_INFO[status];
  const StatusIcon = cfg.icon;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return setError('File too large. Max 5 MB.');
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      return setError('Only images (JPG, PNG) and PDFs are accepted.');
    }
    setFile(f);
    setError('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('idDocument', file);
      const { data } = await authService.uploadIdDocument(formData);
      setSuccess(data.message);
      setFile(null);
      setPreview(null);
      // Update user context
      if (setUser) setUser((u) => ({ ...u, idDocumentStatus: 'pending' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-extrabold text-secondary-700 mb-2">
        {user?.role === 'broker' ? 'Broker Identity Verification' : 'Student ID Verification'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {user?.role === 'broker'
          ? 'Submit a government-issued ID or business license to become a verified broker.'
          : 'Upload your MSA student ID card to verify your enrollment.'}
      </p>

      {/* Status Banner */}
      <div className={`rounded-2xl p-5 mb-6 flex items-start gap-4 border ${
        status === 'approved' ? 'bg-green-50 border-green-100' :
        status === 'pending'  ? 'bg-amber-50 border-amber-100' :
        status === 'rejected' ? 'bg-red-50 border-red-100' :
        'bg-gray-50 border-gray-100'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          status === 'approved' ? 'bg-green-100 text-green-600' :
          status === 'pending'  ? 'bg-amber-100 text-amber-600' :
          status === 'rejected' ? 'bg-red-100 text-red-600' :
          'bg-gray-100 text-gray-500'
        }`}>
          <StatusIcon size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-secondary-700">Status</p>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <p className="text-sm text-gray-600">{cfg.desc}</p>
        </div>
      </div>

      {/* Upload form — shown when not pending/approved */}
      {status !== 'approved' && status !== 'pending' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-secondary-700 mb-4">Upload Document</h2>

          <div className="mb-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
            <AlertTriangle size={16} className="inline mr-2" />
            <strong>Acceptable documents:</strong>{' '}
            {user?.role === 'broker'
              ? 'National ID, passport, or real estate broker license (image or PDF, max 5 MB)'
              : 'MSA student ID card or enrollment certificate (image or PDF, max 5 MB)'}
          </div>

          {/* Drop zone */}
          <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
            file ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-gray-50 hover:border-primary-200 hover:bg-primary-50/50'
          }`}>
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
            {preview ? (
              <img src={preview} alt="Preview" className="h-36 object-contain rounded-xl" />
            ) : file ? (
              <div className="flex flex-col items-center text-primary-600">
                <FileText size={40} />
                <p className="text-sm font-semibold mt-2">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Upload size={36} className="mb-2" />
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs mt-1">JPG, PNG, or PDF · Max 5 MB</p>
              </div>
            )}
          </label>

          {error && (
            <p className="text-red-500 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {success && (
            <p className="text-green-600 text-sm mt-3 bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle size={14} /> {success}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <Button onClick={handleUpload} icon={Upload} disabled={!file || uploading}>
              {uploading ? 'Uploading…' : 'Submit Document'}
            </Button>
            {file && (
              <Button variant="ghost" onClick={() => { setFile(null); setPreview(null); }}>
                Remove
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Already pending / approved */}
      {status === 'pending' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
          <Clock size={40} className="mx-auto text-amber-400 mb-3" />
          <p className="font-semibold text-secondary-700">Document received!</p>
          <p className="text-sm text-gray-500 mt-1">Our admin team will review your submission and notify you within 1–2 business days.</p>
        </div>
      )}
      {status === 'approved' && (
        <div className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm text-center">
          <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
          <p className="font-semibold text-secondary-700">You're verified! 🎉</p>
          <p className="text-sm text-gray-500 mt-1">Your verification badge is active on your profile.</p>
        </div>
      )}
    </motion.div>
  );
};

export default IdentityVerification;
