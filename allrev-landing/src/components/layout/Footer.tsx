import { Container } from './Container';
import { content } from '../../content';

export function Footer() {
  return (
    <footer className="border-t py-10">
      <Container>
        <div className="flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} {content.brand.name}
          </div>
          <div>{content.footer.contact}</div>
        </div>
      </Container>
    </footer>
  );
}
