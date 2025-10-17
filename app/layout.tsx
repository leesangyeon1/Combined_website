//this is the file for overall layout, meta data, header/puter, global script

import type { Metadata } from 'next';
import Script from 'next/script';
import { PropsWithChildren } from 'react';

import BootstrapClient from '../components/BootstrapClient';
import Footer from '../components/Footer';
import Header from '../components/Header';
import site from '../content/site.json';

import '../styles/globals.scss';

export const metadata: Metadata = {
  title: `${site.meta.siteName} — ${site.meta.jobTitle}`,
  description: site.meta.description,
  openGraph: {
    title: site.meta.jobTitle,
    description: site.meta.description,
    type: 'website',
    images: [
      {
        url: site.meta.ogImage,
        width: 1200,
        height: 630,
        alt: site.meta.jobTitle
      }
    ]
  },
  themeColor: site.meta.themeColor,
  icons: {
    icon: '/favicon.ico'
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.meta.siteName,
  jobTitle: 'Systems Administrator / HPC & Kubernetes',
  url: 'https://leesangyeon1.github.io',
  sameAs: [site.social.linkedin],
  knowsAbout: ['HPC', 'Kubernetes', 'Linux', 'Slurm', 'InfiniBand', 'Networking', 'Ansible']
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <Script id="person-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(jsonLd)}
        </Script>
      </head>
      <body id="top">
        <BootstrapClient />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
