import { motion } from 'framer-motion';
import { Building2, BookOpenCheck, GitMerge, Check } from 'lucide-react';
import { Container } from '../layout/Container';
import { content } from '../../content';

export function Audience() {
  // Mapeamos ícones específicos para cada item do array de texto
  // A ordem deve bater com a ordem do content.ts
  const icons = [
    { icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Corporativo' },
    { icon: BookOpenCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Editorial' },
    { icon: GitMerge, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Processos' },
  ];

  return (
    <section id="para-quem" className="relative py-24 bg-slate-900 overflow-hidden">
      {/* Elementos de Fundo Decorativos (Luzes) */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>

      <Container className="relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-indigo-400 font-semibold tracking-wider uppercase text-sm"
          >
            Público-Alvo
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl font-display"
          >
            {content.audience.title}
          </motion.h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {content.audience.items.map((item, index) => {
            // Fallback seguro caso adicione mais itens no futuro
            const Style = icons[index] || {
              icon: Check,
              color: 'text-slate-400',
              bg: 'bg-slate-800',
              label: 'Geral',
            };
            const Icon = Style.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className="group relative flex flex-col h-full"
              >
                {/* O Cartão */}
                <div className="relative flex-1 rounded-2xl bg-slate-800/50 border border-slate-700 p-8 backdrop-blur-sm transition-all duration-300 group-hover:bg-slate-800 group-hover:border-slate-600 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
                  {/* Barra colorida no topo (Sotaque) */}
                  <div
                    className={`absolute top-0 left-8 right-8 h-[2px] ${Style.color.replace(
                      'text-',
                      'bg-',
                    )} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Header do Card */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${Style.bg} ${Style.color} transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${Style.color} opacity-80`}
                      >
                        {Style.label}
                      </span>
                      <div className="h-1 w-12 bg-slate-700 rounded mt-1 group-hover:w-full transition-all duration-500"></div>
                    </div>
                  </div>

                  {/* Texto */}
                  <p className="text-lg font-medium leading-relaxed text-slate-300 group-hover:text-white transition-colors">
                    {item}
                  </p>

                  {/* Ícone decorativo de fundo (marca d'água) */}
                  <Icon className="absolute -bottom-4 -right-4 h-24 w-24 text-slate-800/50 -rotate-12 group-hover:-rotate-0 group-hover:text-slate-700/30 transition-all duration-500 pointer-events-none" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
