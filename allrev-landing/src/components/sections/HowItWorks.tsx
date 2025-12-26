import { motion } from 'framer-motion';
import { Settings2, FolderKanban, PieChart, ArrowRight } from 'lucide-react';
import { Container } from '../layout/Container';
import { content } from '../../content';

export function HowItWorks() {
  // Mapeamento visual para dar personalidade a cada etapa
  const stepsConfig = [
    {
      icon: Settings2,
      color: 'text-blue-600',
      bg: 'bg-blue-600/10',
      border: 'border-blue-200',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      icon: FolderKanban,
      color: 'text-indigo-600',
      bg: 'bg-indigo-600/10',
      border: 'border-indigo-200',
      gradient: 'from-indigo-600 to-violet-600',
    },
    {
      icon: PieChart,
      color: 'text-emerald-600',
      bg: 'bg-emerald-600/10',
      border: 'border-emerald-200',
      gradient: 'from-emerald-600 to-teal-600',
    },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-white relative overflow-hidden">
      {/* Background Grid Sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <Container className="relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-display"
          >
            {content.howItWorks.title}
          </motion.h2>
          <p className="mt-4 text-lg text-slate-600">
            Elimine as "zonas cinzentas" da sua operação. Na AllRev, tudo segue um processo
            auditável.
          </p>
        </div>

        <div className="relative grid gap-8 lg:grid-cols-3">
          {/* Linha Conectora (Apenas Desktop) */}
          <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600"
            />
          </div>

          {content.howItWorks.steps.map((step, index) => {
            const config = stepsConfig[index];
            const Icon = config.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.3 }}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Círculo do Ícone com Efeito Pulse */}
                <div
                  className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-2xl bg-white border-2 ${config.border} shadow-xl mb-8 group-hover:scale-110 transition-transform duration-300`}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${config.gradient}`}
                  ></div>
                  <Icon className={`w-10 h-10 ${config.color}`} />

                  {/* Badge de Número */}
                  <div
                    className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm`}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Seta Mobile (Aparece só em telas pequenas entre os cards) */}
                {index < 2 && (
                  <div className="lg:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 text-slate-300">
                    <ArrowRight className="w-6 h-6 rotate-90" />
                  </div>
                )}

                {/* Conteúdo do Texto */}
                <div className="bg-slate-50 rounded-2xl p-6 w-full h-full border border-slate-100 group-hover:bg-white group-hover:shadow-lg transition-all">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
