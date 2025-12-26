import { motion } from 'framer-motion';
import { Users, Calendar, FileCheck, ShieldCheck, BarChart3, Briefcase } from 'lucide-react';
import { Container } from '../layout/Container';
import { content } from '../../content';

export function Features() {
  const icons = [Users, Calendar, FileCheck, ShieldCheck, BarChart3, Briefcase];

  return (
    <section id="funcionalidades" className="py-24 bg-white relative">
      <Container>
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-indigo-600 font-semibold tracking-wide uppercase text-sm"
          >
            Funcionalidades
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-4xl font-extrabold text-slate-900 sm:text-5xl font-display"
          >
            Um sistema vivo, não um arquivo morto.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.features.items.map((feature, index) => {
            const Icon = icons[index] || Users;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 border border-slate-100 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
