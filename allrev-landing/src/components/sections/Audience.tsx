import { Container } from '../layout/Container';
import { content } from '../../content';

export function Audience() {
  return (
    <section id="para-quem" className="bg-slate-50 py-14">
      <Container>
        <h2 className="text-2xl font-semibold text-slate-900">{content.audience.title}</h2>

        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {content.audience.items.map((i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm"
            >
              {i}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
