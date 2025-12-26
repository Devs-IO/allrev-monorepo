import { Container } from '../layout/Container';
import { content } from '../../content';

export function Hero() {
  return (
    <section>
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-sm font-medium text-slate-600">{content.brand.tagline}</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {content.hero.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-700">{content.hero.subtitle}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={content.cta.primaryHref}
                className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {content.cta.primaryLabel}
              </a>
              <a
                href={content.cta.secondaryHref}
                className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                {content.cta.secondaryLabel}
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
            {/* TODO: coloque um screenshot real em src/assets e troque o src */}
            <div className="aspect-[16/10] w-full rounded-lg bg-white" />
            <div className="mt-3 text-xs text-slate-500">{content.hero.screenshotAlt}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
