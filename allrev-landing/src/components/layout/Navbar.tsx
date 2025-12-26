import { Container } from './Container';
import { content } from '../../content';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{content.brand.name}</div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {content.nav.map((i) => (
              <a key={i.href} href={i.href} className="text-sm text-slate-700 hover:text-slate-900">
                {i.label}
              </a>
            ))}
          </nav>

          <a
            href={content.cta.primaryHref}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {content.cta.primaryLabel}
          </a>
        </div>
      </Container>
    </header>
  );
}
