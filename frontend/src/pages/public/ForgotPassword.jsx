import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, KeyRound, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/apiService';
import Button from '../../components/ui/Button';

const STEPS = ['phone', 'otp', 'newPassword', 'success'];

/**
 * FR06 — Password Recovery: phone → OTP → new password
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null); // shown in dev mode from API
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return setError('Please enter your phone number');
    setLoading(true);
    setError('');
    try {
      const { data } = await authService.forgotPassword(phone.trim());
      if (data.otp) setDevOtp(data.otp); // dev mode only
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('Enter the 6-digit OTP');
    setStep('newPassword');
    setError('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword({ phone, otp, newPassword });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
      >
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-8">
          {['Request OTP', 'Verify OTP', 'New Password'].map((label, i) => {
            const stepIndex = STEPS.indexOf(step);
            const isActive = i <= stepIndex - (step === 'success' ? 0 : 0);
            return (
              <div key={i} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${i < STEPS.indexOf(step) ? 'bg-primary-500' : i === STEPS.indexOf(step) && step !== 'success' ? 'bg-primary-300' : 'bg-gray-100'}`} />
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">{label}</p>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Enter Phone */}
          {step === 'phone' && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone size={28} className="text-primary-500" />
                </div>
                <h1 className="text-2xl font-extrabold text-secondary-700">Forgot Password?</h1>
                <p className="text-gray-500 text-sm mt-1">Enter your registered phone number and we'll send a verification code.</p>
              </div>
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={28} className="text-primary-500" />
                </div>
                <h1 className="text-2xl font-extrabold text-secondary-700">Enter OTP</h1>
                <p className="text-gray-500 text-sm mt-1">We sent a 6-digit code to <strong>{phone}</strong>. Valid for 10 minutes.</p>
              </div>

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-center">
                  <p className="text-xs text-amber-600 font-medium">Dev Mode — Your OTP is:</p>
                  <p className="text-2xl font-extrabold text-amber-700 tracking-widest mt-1">{devOtp}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">6-Digit Code</label>
                  <input
                    type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" className="w-full" disabled={otp.length !== 6}>Continue</Button>
                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); }}
                  className="w-full text-sm text-gray-500 hover:text-primary-500 transition-colors cursor-pointer">
                  Wrong number? Go back
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <motion.div key="newPassword" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-primary-500" />
                </div>
                <h1 className="text-2xl font-extrabold text-secondary-700">New Password</h1>
                <p className="text-gray-500 text-sm mt-1">Choose a strong password (at least 6 characters).</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-secondary-700 mb-2">Password Reset!</h1>
              <p className="text-gray-500 text-sm mb-8">Your password has been updated successfully. You can now log in.</p>
              <Button className="w-full" onClick={() => navigate('/login')}>Go to Login</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
