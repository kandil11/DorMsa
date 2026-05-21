import { motion } from 'framer-motion';
import { Shield, Users, Target, Award } from 'lucide-react';

const About = () => {
  const values = [
    { icon: Shield, title: 'Trust & Safety', desc: 'All brokers are verified. We prioritize student safety above everything.' },
    { icon: Users, title: 'Community First', desc: 'Built by MSA students, for MSA students and their families.' },
    { icon: Target, title: 'Simplicity', desc: 'Find your perfect housing in minutes, not days.' },
    { icon: Award, title: 'Quality', desc: 'Every listing is reviewed for accuracy and quality standards.' },
  ];

  return (
    <div>
      <section className="gradient-hero py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">About <span className="text-primary-400">DorMsa</span></h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">We're on a mission to make student housing simple, safe, and accessible for every MSA University student.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-extrabold text-secondary-700 mb-4">Our Story</h2>
              <p className="text-gray-600 leading-relaxed mb-4">DorMsa was born from the frustration of searching for student housing near MSA University. We noticed that students and parents spent weeks looking for safe, affordable housing options — often relying on word of mouth or unverified listings.</p>
              <p className="text-gray-600 leading-relaxed">Our platform bridges this gap by connecting verified brokers with students, providing transparent listings with real photos, honest pricing, and direct communication channels.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                {[{ val: '2,000+', label: 'Listings' }, { val: '5,000+', label: 'Users' }, { val: '200+', label: 'Brokers' }, { val: '98%', label: 'Satisfaction' }].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-extrabold text-primary-500">{s.val}</p>
                    <p className="text-sm text-gray-600">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-secondary-700 text-center mb-12">Our <span className="text-primary-500">Values</span></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl shadow-card border border-gray-100 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <v.icon size={26} className="text-primary-500" />
                </div>
                <h3 className="font-bold text-secondary-700 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
