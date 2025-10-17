//common footer
import site from '../content/site.json';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="py-4 section-divider position-relative">
      <div className="container text-center footer-muted small d-flex flex-column flex-sm-row justify-content-center align-items-center gap-2">
        <span>© {year} {site.meta.siteName}</span>
        <span aria-hidden="true">•</span>
        <a href="#top" className="text-decoration-none text-muted-custom">
          Back to top
        </a>
      </div>
    </footer>
  );
}
