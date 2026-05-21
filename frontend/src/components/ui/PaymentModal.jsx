import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentService } from '../../services/apiService';
import Button from './Button';

const PaymentModal = ({ isOpen, onClose, listing, onSuccess }) => {
  const [step, setStep] = useState('form'); // form, processing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });

  // Deposit amount (e.g. 10% of monthly rent, or fixed 1000 EGP if none)
  const depositAmount = listing?.price?.amount ? Math.round(listing.price.amount * 0.1) : 1000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (card.number.replace(/\s/g, '').length < 16) return setErrorMsg('Invalid card number');
    
    setStep('processing');
    setErrorMsg('');

    try {
      // Mock payment payload according to backend controller expectations
      const payload = {
        listingId: listing._id,
        amount: depositAmount,
        paymentMethod: 'card',
        cardDetails: {
          number: card.number.replace(/\s/g, ''),
          expiry: card.expiry,
          cvv: card.cvv,
          name: card.name
        }
      };

      const { data } = await paymentService.initiate(payload);
      
      if (data.success) {
        setStep('success');
        if (onSuccess) setTimeout(() => onSuccess(data.payment), 2000);
      } else {
        setStep('error');
        setErrorMsg(data.message || 'Payment was declined by your bank.');
      }
    } catch (err) {
      setStep('error');
      setErrorMsg(err.response?.data?.message || 'Payment failed due to network error.');
    }
  };

  const handleCardNumber = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCard((prev) => ({ ...prev, number: formatted.slice(0, 19) }));
  };

  const handleExpiry = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    setCard((prev) => ({ ...prev, expiry: val.slice(0, 5) }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
            <div>
              <h2 className="text-xl font-extrabold text-secondary-700">Pay Deposit</h2>
              <p className="text-sm text-gray-500 mt-1">Reserve this property securely</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="p-6">
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Order Summary */}
                <div className="bg-primary-50 rounded-2xl p-4 flex items-center justify-between border border-primary-100">
                  <div>
                    <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Total Deposit</p>
                    <p className="text-2xl font-extrabold text-secondary-700">{depositAmount} <span className="text-sm font-medium text-gray-500">EGP</span></p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-500">
                    <Lock size={20} />
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {errorMsg}
                  </div>
                )}

                {/* Card Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Card Number</label>
                    <div className="relative">
                      <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text" required placeholder="0000 0000 0000 0000"
                        value={card.number} onChange={handleCardNumber}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Cardholder Name</label>
                    <input
                      type="text" required placeholder="Name on card"
                      value={card.name} onChange={(e) => setCard((p) => ({ ...p, name: e.target.value.toUpperCase() }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Expiry Date</label>
                      <input
                        type="text" required placeholder="MM/YY"
                        value={card.expiry} onChange={handleExpiry}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">CVV</label>
                      <input
                        type="password" required placeholder="123" maxLength="4"
                        value={card.cvv} onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full py-3.5 text-base shadow-lg shadow-primary-500/20">
                  Pay {depositAmount} EGP
                </Button>
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 mt-2">
                  <Lock size={12} /> Payments are secure and encrypted
                </p>
              </form>
            )}

            {step === 'processing' && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 border-4 border-gray-100 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-secondary-700">Processing Payment</h3>
                <p className="text-sm text-gray-500 mt-2">Please do not close this window...</p>
              </div>
            )}

            {step === 'success' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-xl font-extrabold text-secondary-700">Payment Successful!</h3>
                <p className="text-sm text-gray-500 mt-2">Your deposit has been paid and a receipt has been sent to your email.</p>
                <Button onClick={onClose} className="w-full mt-8 bg-green-500 hover:bg-green-600 border-transparent shadow-lg shadow-green-500/20">
                  Done
                </Button>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={40} />
                </div>
                <h3 className="text-xl font-extrabold text-secondary-700">Payment Failed</h3>
                <p className="text-sm text-gray-500 mt-2">{errorMsg}</p>
                <Button onClick={() => { setStep('form'); setErrorMsg(''); }} className="w-full mt-8" variant="outline">
                  Try Again
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
