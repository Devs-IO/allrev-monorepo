// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import { Menu, X, ArrowUp } from 'lucide-react';
import { Container } from './Container';
import { content } from '../../content';
import logo from '../../assets/logo_.png'; // Garanta que este arquivo existe

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitora o scroll para efeitos visuais e botão "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/50 py-2'
            : 'bg-white/50 backdrop-blur-sm py-4'
        }`}
      >
        <Container>
          <div className="flex items-center justify-between">
            {/* LOGO - Clica e sobe */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={scrollToTop}>
              <img
                src={logo}
                alt={content.brand.name}
                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {/* Opcional: Manter o nome ao lado ou remover se o logo já tiver */}
              {/* <span className="text-lg font-bold text-slate-900 font-display">{content.brand.name}</span> */}
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {content.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-600 hover:after:w-full after:transition-all duration-300"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* CTA & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <a
                href={content.cta.primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
              >
                {content.cta.primaryLabel}
              </a>

              {/* Botão Menu Mobile */}
              <button
                className="md:hidden p-2 text-slate-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5">
              {content.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-600 hover:text-indigo-600 py-2 border-b border-slate-50"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={content.cta.primaryHref}
                className="rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white mt-2"
              >
                {content.cta.primaryLabel}
              </a>
            </div>
          )}
        </Container>
      </header>

      {/* BOTÃO FLUTUANTE "VOLTAR AO TOPO" */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 p-3 rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 transition-all duration-500 hover:bg-indigo-700 hover:-translate-y-1 ${
          isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </>
  );
}
