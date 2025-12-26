import { Container } from '../layout/Container';
import { content } from '../../content';

export function HowItWorks() {
  return (
    <section className="py-14">
      <Container>
        <h2 className="text-2xl font-semibold text-slate-900">{content.howItWorks.title}</h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {content.howItWorks.steps.map((s, idx) => (
            <div
              key={s.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-xs font-semibold text-indigo-700">Passo {idx + 1}</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{s.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
