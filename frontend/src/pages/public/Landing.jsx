import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, MessageCircle, Home, ArrowRight, Star, MapPin, Users, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Landing = () => {
  const features = [
    { icon: Search, title: 'Smart Search', desc: 'Filter by price, location, gender, and room type to find your perfect match.' },
    { icon: Shield, title: 'Verified Brokers', desc: 'All brokers are verified by our team to ensure trust and safety.' },
    { icon: MessageCircle, title: 'Direct Contact', desc: 'Connect instantly via WhatsApp or phone call with property owners.' },
    { icon: Home, title: 'Quality Housing', desc: 'Curated listings near MSA University with detailed photos and amenities.' },
  ];

  const stats = [
    { value: '2,000+', label: 'Properties' },
    { value: '5,000+', label: 'Students' },
    { value: '200+', label: 'Verified Brokers' },
    { value: '4.8★', label: 'Average Rating' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up as a student, parent, or broker in seconds.' },
    { num: '02', title: 'Search & Filter', desc: 'Browse listings with powerful filters tailored to your needs.' },
    { num: '03', title: 'Contact & Book', desc: 'Reach out to brokers directly and secure your housing.' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative gradient-hero min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-primary-300 mb-6 border border-white/10">
                <Star size={14} className="fill-primary-400 text-primary-400" /> Trusted by 5,000+ MSA Students
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Find Your Perfect <br /><span className="text-primary-400">Student Home</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-lg mb-8 leading-relaxed">
                DorMsa helps MSA University students and parents find trusted, affordable housing near campus. Browse verified listings and connect with brokers instantly.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/listings">
                  <Button size="lg" icon={Search}>Browse Listings</Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="lg" className="!border-white/30 !text-white hover:!bg-white/10" icon={ArrowRight}>Get Started</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:block">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="bg-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold text-primary-400">{stat.value}</p>
                        <p className="text-sm text-gray-300 mt-1">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-secondary-700 mb-4">Why Choose <span className="text-primary-500">DorMsa</span>?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We make finding student housing simple, safe, and fast.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }} className="group bg-gray-50 hover:bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 group-hover:bg-primary-500 flex items-center justify-center mb-4 transition-colors duration-300">
                  <f.icon size={26} className="text-primary-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-secondary-700 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-secondary-700 mb-4">How It <span className="text-primary-500">Works</span></h2>
            <p className="text-gray-500">Three simple steps to find your perfect housing.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.15 }} className="relative bg-white p-8 rounded-2xl shadow-card border border-gray-100">
                <span className="text-5xl font-black text-primary-100">{step.num}</span>
                <h3 className="text-xl font-bold text-secondary-700 mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && <ArrowRight size={24} className="hidden md:block absolute -right-4 top-1/2 text-primary-300" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to Find Your New Home?</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">Join thousands of MSA students who found their perfect housing through DorMsa.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register"><Button size="lg" icon={ArrowRight}>Get Started Free</Button></Link>
              <Link to="/listings"><Button variant="outline" size="lg" className="!border-white/30 !text-white hover:!bg-white/10" icon={Search}>Browse Listings</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
