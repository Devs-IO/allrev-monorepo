import { motion } from 'framer-motion';
import { AlertTriangle, Banknote, MessageSquareWarning } from 'lucide-react';
import { Container } from '../layout/Container';
import { content } from '../../content';

export function PainPoints() {
  // Configuração visual específica para cada "Dor"
  // Usamos cores quentes (Rose, Orange, Amber) para gerar senso de urgência/problema
  const painConfig = [
    {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-100/50',
      border: 'group-hover:border-amber-200',
      shadow: 'group-hover:shadow-amber-500/10',
      badge: 'Crítico',
    },
    {
      icon: Banknote,
      color: 'text-rose-600',
      bg: 'bg-rose-100/50',
      border: 'group-hover:border-rose-200',
      shadow: 'group-hover:shadow-rose-500/10',
      badge: 'Financeiro',
    },
    {
      icon: MessageSquareWarning,
      color: 'text-orange-600',
      bg: 'bg-orange-100/50',
      border: 'group-hover:border-orange-200',
      shadow: 'group-hover:shadow-orange-500/10',
      badge: 'Operacional',
    },
  ];

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Background Decorativo: Manchas de "Caos" sutis ao fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-slate-100 rounded-full blur-3xl opacity-60 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-rose-50 rounded-full blur-3xl opacity-40"></div>
      </div>

      <Container className="relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Alerta Operacional
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-display"
          >
            {content.painPoints.title}
          </motion.h2>
          <p className="mt-4 text-lg text-slate-600">
            Enquanto você lê isso, há um prazo se perdendo em uma conversa de WhatsApp.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {content.painPoints.items.map((item, index) => {
            const config = painConfig[index];
            const Icon = config.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="group relative"
              >
                {/* O Card */}
                <div
                  className={`relative h-full bg-white rounded-2xl p-8 border border-slate-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${config.border} ${config.shadow}`}
                >
                  {/* Badge Flutuante no Topo */}
                  <div
                    className={`absolute top-6 right-6 px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${config.bg} ${config.color}`}
                  >
                    {config.badge}
                  </div>

                  {/* Ícone com brilho */}
                  <div
                    className={`w-14 h-14 rounded-xl ${config.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-7 h-7 ${config.color}`} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-800">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 leading-relaxed mb-6">{item.desc}</p>

                  {/* Linha de "Risco" inferior */}
                  <div className="absolute bottom-0 left-6 right-6 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full w-1/3 ${config.color.replace(
                        'text-',
                        'bg-',
                      )} opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:w-full`}
                    ></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
