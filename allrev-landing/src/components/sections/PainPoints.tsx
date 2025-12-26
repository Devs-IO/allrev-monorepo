import { Container } from '../layout/Container';
import { content } from '../../content';

export function PainPoints() {
  return (
    <section className="bg-slate-50 py-14">
      <Container>
        <h2 className="text-2xl font-semibold text-slate-900">{content.painPoints.title}</h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {content.painPoints.items.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-sm font-semibold text-slate-900">{p.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{p.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
