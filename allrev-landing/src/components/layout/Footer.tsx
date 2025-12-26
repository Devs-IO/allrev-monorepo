// src/components/layout/Footer.tsx
import { Mail, MessageCircle, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Container } from './Container';
import { content } from '../../content';
import logo from '../../assets/logo.png'; // Use uma versão branca do logo se tiver, ou aplique filtro

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Coluna 1: Marca & Sobre */}
          <div className="lg:col-span-2">
            <div
              className="flex items-center gap-2 mb-6 text-white cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {/* Dica: Para logo PNG preto em fundo escuro, use brightness-0 invert para deixá-lo branco via CSS */}
              <img src={logo} alt="AllRev" className="h-8 w-auto brightness-0 invert opacity-90" />
              <span className="text-xl font-bold tracking-tight">AllRev</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {content.brand.tagline}. <br />
              Simplificando a gestão operacional para que você foque na qualidade editorial.
            </p>
            <div className="flex gap-4 mt-6">
              {/* Ícones sociais decorativos */}
              <a
                href="#"
                className="p-2 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div>
            <h3 className="text-white font-semibold mb-6">Navegação</h3>
            <ul className="space-y-4">
              {content.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm hover:text-indigo-400 transition-colors flex items-center gap-2"
                  >
                    <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={content.cta.primaryHref}
                  className="text-sm hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                  Agendar Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato */}
          <div>
            <h3 className="text-white font-semibold mb-6">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-indigo-500 shrink-0" />
                <a
                  href={`mailto:${content.footer.contact}`}
                  className="hover:text-white transition-colors"
                >
                  {content.footer.contact}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-indigo-500 shrink-0" />
                <a
                  href={content.cta.primaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Falar no WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-indigo-500 shrink-0" />
                <span className="text-slate-400">Atendimento Digital para todo o Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha Divisória */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>
            © {currentYear} {content.brand.name}. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
