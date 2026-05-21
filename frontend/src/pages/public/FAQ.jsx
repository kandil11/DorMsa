import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Search, ChevronDown, ChevronUp, BookOpen, Shield, CreditCard, Home, User } from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Getting Started',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600',
    questions: [
      {
        q: 'What is DorMsa?',
        a: 'DorMsa is a student housing platform that connects MSA University students and parents with verified brokers near October City, Egypt. We help you find safe, affordable accommodation close to campus.',
      },
      {
        q: 'Who can use DorMsa?',
        a: 'DorMsa is designed for MSA University students, their parents, and verified property brokers in the 6th of October City area.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Register" on the homepage, enter your name, phone number, and choose your role (Student, Parent, or Broker). You\'ll receive an OTP on your phone to verify your account.',
      },
      {
        q: 'Is DorMsa free to use?',
        a: 'Yes! Searching and browsing listings is completely free. Students can contact brokers directly at no charge.',
      },
    ],
  },
  {
    category: 'Finding a Property',
    icon: Home,
    color: 'bg-primary-50 text-primary-600',
    questions: [
      {
        q: 'How do I search for listings near MSA campus?',
        a: 'Use the "Distance from Campus" filter on the Listings page to find properties within a specific radius of MSA University. Results are sorted by distance by default.',
      },
      {
        q: 'Can I filter listings by gender policy?',
        a: 'Yes. You can filter listings by Male-only, Female-only, or Mixed accommodation using the Gender filter.',
      },
      {
        q: 'What room types are available?',
        a: 'Listings are categorized as Single, Double, Triple, or Shared rooms across various property types including studios, apartments, and villas.',
      },
      {
        q: 'How do I save a listing for later?',
        a: 'Click the heart/bookmark icon on any listing or the "Save to Favorites" button on the property detail page. Access your saved listings from your student dashboard.',
      },
      {
        q: 'What are Saved Searches?',
        a: 'You can save your filter settings (price range, gender, room type, distance) as a named search preset. When new matching listings are added, you\'ll be automatically notified.',
      },
    ],
  },
  {
    category: 'Contacting Brokers',
    icon: User,
    color: 'bg-green-50 text-green-600',
    questions: [
      {
        q: 'How do I contact a broker about a listing?',
        a: 'On any property detail page you\'ll find two contact options: a WhatsApp button (opens WhatsApp chat with the broker) and a Call button (initiates a direct phone call).',
      },
      {
        q: 'Are all brokers verified?',
        a: 'Brokers on DorMsa go through an identity verification process where they submit their ID documents to our admin team. Verified brokers display a blue verification badge on their profile and listings.',
      },
      {
        q: 'What does the verification badge mean?',
        a: 'The verification badge (✓) means the broker\'s identity has been confirmed by the DorMsa admin team. We recommend prioritizing verified brokers for your safety.',
      },
    ],
  },
  {
    category: 'Payments & Contracts',
    icon: CreditCard,
    color: 'bg-amber-50 text-amber-600',
    questions: [
      {
        q: 'How does the deposit payment work?',
        a: 'After agreeing on a property, you can pay a deposit securely through DorMsa. We use a secure payment gateway (similar to PayMob/Stripe) to process card payments. Your card details are never stored on our servers.',
      },
      {
        q: 'Can I get a receipt or contract?',
        a: 'Yes! After a booking is confirmed, you can download a pre-filled digital lease agreement (PDF) from your dashboard. The contract includes both parties\' details, rental terms, and property information.',
      },
      {
        q: 'Where can I see my payment history?',
        a: 'Log in and go to Student Dashboard → Payment History. You\'ll see all deposits with their date, amount, status, and transaction reference.',
      },
      {
        q: 'What if a payment fails?',
        a: 'Failed payments are recorded in your payment history with the failure reason. No money is deducted for failed transactions. Try again or use a different card.',
      },
    ],
  },
  {
    category: 'Safety & Security',
    icon: Shield,
    color: 'bg-red-50 text-red-600',
    questions: [
      {
        q: 'How does DorMsa protect my personal data?',
        a: 'Your data is encrypted and stored securely on our servers. We never share your personal information with third parties without your consent. Passwords are hashed using industry-standard bcrypt.',
      },
      {
        q: 'What should I do if I suspect a fraudulent listing?',
        a: 'Contact our support team immediately via the Support section in your dashboard. Our fraud detection system also automatically flags suspicious duplicate listings for admin review.',
      },
      {
        q: 'Can I report a broker or listing?',
        a: 'Yes. Submit a support ticket from your dashboard (category: Fraud) with details of the issue. Our admin team reviews all reports and can suspend accounts or remove listings.',
      },
      {
        q: 'My account was suspended — what do I do?',
        a: 'If you believe your account was suspended in error, contact our support team through the support form. Note that suspended accounts cannot log in until reactivated by an admin.',
      },
    ],
  },
];

/**
 * FR50 — FAQ Section: searchable static FAQ repository
 */
const FAQ = () => {
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredData = FAQ_DATA.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      ({ q, a }) =>
        (activeCategory === 'all' || cat.category === activeCategory) &&
        (q.toLowerCase().includes(search.toLowerCase()) || a.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((cat) => cat.questions.length > 0);

  const totalResults = filteredData.reduce((acc, c) => acc + c.questions.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={32} className="text-primary-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-secondary-700 mb-3">Help & FAQ</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Find answers to common questions about DorMsa. Can't find what you're looking for?{' '}
          <a href="/student/support" className="text-primary-500 hover:underline">Contact support →</a>
        </p>
      </motion.div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-sm"
        />
        {search && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${activeCategory === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </button>
        {FAQ_DATA.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(activeCategory === cat.category ? 'all' : cat.category)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${activeCategory === cat.category ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* FAQ Sections */}
      {filteredData.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <HelpCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No results for "{search}"</p>
          <p className="text-sm mt-1">Try different keywords or browse all categories.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredData.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <motion.div key={cat.category} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cat.color}`}>
                    <CatIcon size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-secondary-700">{cat.category}</h2>
                </div>
                <div className="space-y-2">
                  {cat.questions.map(({ q, a }, qi) => {
                    const key = `${cat.category}-${qi}`;
                    const isOpen = !!openItems[key];
                    return (
                      <div key={key} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-secondary-700 text-sm">{q}</span>
                          {isOpen ? <ChevronUp size={16} className="text-primary-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                              className="overflow-hidden border-t border-gray-100"
                            >
                              <div className="px-5 py-4">
                                <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FAQ;
