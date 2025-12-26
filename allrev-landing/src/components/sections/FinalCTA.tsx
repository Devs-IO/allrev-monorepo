import { Container } from '../layout/Container';
import { content } from '../../content';

export function FinalCTA() {
  return (
    <section className="py-14">
      <Container>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:flex md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">{content.finalCta.title}</div>
            <div className="mt-2 text-sm text-slate-700">{content.finalCta.subtitle}</div>
          </div>
          <a
            href={content.finalCta.buttonHref}
            className="mt-6 inline-flex rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 md:mt-0"
          >
            {content.finalCta.buttonLabel}
          </a>
        </div>
      </Container>
    </section>
  );
}
