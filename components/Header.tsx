//Set header + Scroll shade (client)
'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import site from '../content/site.json';

type NavItem = (typeof site.navigation)[number];

type HeaderProps = {
  navItems?: NavItem[];
  linkedinUrl?: string;
};

const defaultNav = site.navigation;
const defaultLinkedIn = site.social.linkedin;

export default function Header({ navItems = defaultNav, linkedinUrl = defaultLinkedIn }: HeaderProps) {
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 8) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className="site-header header-blur position-fixed top-0 start-0 end-0" style={{ height: 'var(--header-h)', zIndex: 1000 }}>
      <div className="container h-100 d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="d-inline-flex align-items-center justify-content-center border rounded-3"
            style={{ width: 36, height: 36, borderColor: 'var(--border)', background: '#0b1220', color: '#cbd5e1' }}
            aria-label="LinkedIn (opens in a new tab)"
          >
            <span className="visually-hidden">LinkedIn</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
            </svg>
          </a>
          <strong className="fs-6 text-white">{site.meta.siteName}</strong>
        </div>

        <nav className="d-flex align-items-center gap-2 flex-wrap justify-content-end" aria-label="Primary">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-decoration-none text-white-50 small">
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            className="btn btn-primary d-none d-md-inline-flex align-items-center gap-2 px-3 py-2"
            aria-label={`Contact ${site.meta.siteName}`}
          >
            Contact
          </a>
          <Link href="/resume" className="btn btn-outline-light btn-ghost d-inline-flex d-md-none px-3 py-2">
            Resume
          </Link>
        </nav>
      </div>
    </header>
  );
}
