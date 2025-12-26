import { MessageCircle } from 'lucide-react';
import { Container } from '../layout/Container';
import { content } from '../../content';

export function FinalCTA() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <div className="relative isolate overflow-hidden bg-slate-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
          {/* Efeitos de luz de fundo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/30 blur-[100px] -z-10"></div>

          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {content.finalCta.title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
            {content.finalCta.subtitle}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href={content.cta.primaryHref} // Reutilizando o link correto do whats
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MessageCircle className="h-4 w-4" />
              {content.finalCta.buttonLabel}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
