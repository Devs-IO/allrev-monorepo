import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronRight,
  Users,
  FileText,
  BarChart3,
  Clock,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

// --- Componentes UI Base (Simulando shadcn para portabilidade) ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 h-11 px-8';
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    gradient: 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:opacity-90 shadow-lg',
    outline: 'border-2 border-slate-900 text-slate-900 hover:bg-slate-50',
  };
  return (
    <button
      className={`${base} ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700">
    {children}
  </span>
);

// --- Seções da Landing Page ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* Placeholder para o Logo - Ajuste o src conforme seu arquivo */}
          <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-900">
            <img
              src="/path-to-your-logo.png"
              alt="AllRev Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">AllRev</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Funcionalidades
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Como Funciona
          </a>
          <Button variant="primary" className="h-9 px-4 text-xs">
            Agendar Demonstração
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <X className="h-6 w-6 text-slate-900" />
          ) : (
            <Menu className="h-6 w-6 text-slate-900" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-sm font-medium text-slate-600">
              Funcionalidades
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600">
              Como Funciona
            </a>
            <Button variant="primary" className="w-full">
              Agendar Demonstração
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <Badge>Sistema de Gestão Especializado</Badge>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
                Gestão completa para empresas de{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-600">
                  revisão acadêmica.
                </span>
              </h1>
              <p className="max-w-[600px] text-lg text-slate-600 leading-relaxed">
                Centralize trabalhos, prazos, equipe e relatórios financeiros. Deixe o cliente
                preencher formulários e acompanhe a execução por etapas sem perder o controle.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="gradient" className="h-12 text-base shadow-cyan-500/25">
                Agendar Demonstração <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="secondary" className="h-12 text-base">
                Ver como funciona
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />{' '}
                <span>Controle de Prazos</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />{' '}
                <span>Relatórios Financeiros</span>
              </div>
            </div>
          </div>

          {/* Mockup Visual - Área da Imagem */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto w-full max-w-[600px] lg:max-w-none"
          >
            <div className="relative rounded-xl border border-slate-200 bg-white/50 p-2 shadow-2xl backdrop-blur-sm">
              <div className="rounded-lg bg-slate-100 overflow-hidden aspect-[16/10] flex items-center justify-center border border-slate-200">
                {/* Aqui entra o Print do Dashboard */}
                <span className="text-slate-400 font-medium">
                  Print do Dashboard / Lista de Trabalhos
                </span>
              </div>

              {/* Floating Card - Elemento decorativo */}
              <div className="absolute -bottom-6 -left-6 rounded-lg bg-white p-4 shadow-xl border border-slate-100 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Status</p>
                    <p className="text-sm font-bold text-slate-900">Revisão Concluída</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      title: 'Papéis e Permissões',
      desc: 'Acesso segregado para ADMs, Gestores, Revisores e Clientes. Cada um vê apenas o necessário.',
      icon: Users,
    },
    {
      title: 'Gestão de Trabalhos',
      desc: 'Controle total de status, serviços contratados, valores, débitos e prazos em um só lugar.',
      icon: FileText,
    },
    {
      title: 'Formulários Dinâmicos',
      desc: 'Seu cliente preenche os dados (Normalização, Memorial) e o sistema gera o orçamento.',
      icon: ShieldCheck,
    },
    {
      title: 'Monitoramento por Trilhas',
      desc: 'Acompanhe projetos complexos com checklists de Inspeção e Vanguarda.',
      icon: Clock,
    },
    {
      title: 'Relatórios Financeiros',
      desc: 'Cálculo automático de Bruto vs Líquido e recortes por colaborador ou serviço.',
      icon: BarChart3,
    },
    {
      title: 'Histórico Completo',
      desc: 'Rastreabilidade total de alterações e etapas vencidas para evitar retrabalho.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Tudo o que sua editora precisa para escalar
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Funcionalidades desenhadas para a realidade de revisões acadêmicas e editoriais.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 shadow-2xl sm:px-16 md:pt-20 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-24 lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Quer reduzir retrabalho e <br />
              ter controle do seu fluxo?
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Pare de depender de planilhas e WhatsApp. Profissionalize sua gestão hoje mesmo com a
              AllRev.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <Button variant="gradient" className="h-12 px-8 text-base">
                Agendar Demonstração
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-white py-12 border-t border-slate-100">
    <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2">
        {/* Logo pequeno ou Texto */}
        <span className="text-xl font-bold text-slate-900">AllRev</span>
      </div>
      <p className="text-sm text-slate-500">© 2024 AllRev. Todos os direitos reservados.</p>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}
