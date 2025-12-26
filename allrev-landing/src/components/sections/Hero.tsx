import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, Play } from 'lucide-react';
import { Container } from '../layout/Container';
import { content } from '../../content';
// Importe suas imagens reais aqui
import dashboardImg from '../../assets/dashboard.png';
import ordensImg from '../../assets/ordens.png';

// Configuração dos Slides
const slides = [
  {
    badge: 'Controle Total',
    title: 'Gestão completa de Prazos e Entregas',
    subtitle: 'Nunca mais perca uma data. Visualize o status de cada revisão em tempo real.',
    image: dashboardImg, // Imagem 1
    color: 'from-indigo-600 to-violet-600',
  },
  {
    badge: 'Financeiro Automático',
    title: 'Chega de calcular repasses manualmente',
    subtitle: 'Relatórios de bruto e líquido automáticos para cada colaborador da sua editora.',
    image: ordensImg, // Imagem 2 (Use uma diferente se tiver)
    color: 'from-blue-600 to-cyan-500',
  },
  {
    badge: 'Portal do Cliente',
    title: 'Seu cliente preenche, você só gerencia',
    subtitle:
      'Elimine o vai-e-vem de e-mails. Formulários de entrada padronizados e profissionais.',
    image: dashboardImg, // Imagem 3
    color: 'from-emerald-500 to-teal-600',
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Rotação automática dos slides (5 segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-slate-50 pt-20 pb-16 lg:pt-32 lg:pb-24">
      {/* Background Animado (Aurora) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-400/20 blur-[120px] rounded-full mix-blend-multiply animate-pulse-glow z-0"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-cyan-400/20 blur-[100px] rounded-full mix-blend-multiply z-0"></div>

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Coluna de Texto (Esquerda) */}
          <div className="flex flex-col justify-center text-center lg:text-left h-[400px]">
            {' '}
            {/* Altura fixa para evitar pulos */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-white/50 backdrop-blur border-slate-200 text-slate-800 w-fit mx-auto lg:mx-0`}
                >
                  <span
                    className={`flex h-2 w-2 rounded-full mr-2 bg-gradient-to-r ${slides[currentSlide].color}`}
                  ></span>
                  {slides[currentSlide].badge}
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl font-display">
                  <span
                    className={`text-transparent bg-clip-text bg-gradient-to-r ${slides[currentSlide].color}`}
                  >
                    {slides[currentSlide].title}
                  </span>
                </h1>

                <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  {slides[currentSlide].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
            {/* Botões Estáticos (Sempre visíveis) */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href={content.cta.primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-slate-800 hover:scale-105 transition-all duration-300"
              >
                {content.cta.primaryLabel}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <a
                href={content.cta.secondaryHref}
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all"
              >
                <Play className="mr-2 h-4 w-4 fill-slate-700" />
                Ver Demonstração
              </a>
            </div>
            {/* Indicadores do Slide */}
            <div className="mt-8 flex gap-2 justify-center lg:justify-start">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-8 bg-indigo-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Coluna da Imagem (Direita) - Efeito 3D Flutuante */}
          <div className="relative perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30, rotateY: -10 }}
                animate={{ opacity: 1, y: 0, rotateY: -5 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.7, type: 'spring' }}
                className="relative z-10"
              >
                <div className="relative rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur-sm animate-float">
                  <img
                    src={slides[currentSlide].image}
                    alt="Dashboard Preview"
                    className="rounded-xl w-full h-auto object-cover border border-slate-100"
                  />

                  {/* Card Flutuante Decorativo */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-pulse-glow hidden md:flex">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-r ${slides[currentSlide].color} flex items-center justify-center`}
                    >
                      <ChevronRight className="text-white h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Status Atual</p>
                      <p className="text-sm font-bold text-slate-900">Aprovado</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Sombra chão */}
            <div className="absolute -bottom-10 left-10 right-10 h-10 bg-black/20 blur-2xl rounded-[100%] z-0"></div>
          </div>
        </div>
      </Container>
    </section>
  );
}
