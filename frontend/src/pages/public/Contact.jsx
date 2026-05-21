import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Contact = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-700 mb-3">Get in <span className="text-primary-500">Touch</span></h1>
        <p className="text-gray-500 max-w-xl mx-auto">Have a question or feedback? We'd love to hear from you.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          {[
            { icon: MapPin, title: 'Address', text: 'MSA University, 6th of October City, Giza, Egypt' },
            { icon: Phone, title: 'Phone', text: '+20 100 000 0000' },
            { icon: Mail, title: 'Email', text: 'support@dormsa.com' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-soft border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <item.icon size={22} className="text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-700">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-secondary-700 mb-6">Send a Message</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Name" placeholder="Your name" />
              <Input label="Email" type="email" placeholder="you@example.com" />
            </div>
            <Input label="Subject" placeholder="How can we help?" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-secondary-700">Message</label>
              <textarea rows={5} placeholder="Write your message here..." className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
            </div>
            <Button icon={Send} className="w-full sm:w-auto">Send Message</Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
