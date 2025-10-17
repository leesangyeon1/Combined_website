'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import site from '../content/site.json';
import LaserFlow from './LaserFlow';

type HeroContent = typeof site.hero;
type HeroEffect = 'cluster' | 'it' | 'network';

const heroData = site.hero;

export default function Hero({ data = heroData }: { data?: HeroContent }) {
  const [activeEffect, setActiveEffect] = useState<HeroEffect>('cluster');
  const vantaRef = useRef<any>(null);
  const vantaContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const elements = document.querySelectorAll('.reveal');

    if (prefersReducedMotion || typeof window === 'undefined') {
      elements.forEach((el) => el.classList.add('reveal-visible'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('reveal-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const destroyVanta = () => {
      if (vantaRef.current && typeof vantaRef.current.destroy === 'function') {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };

    if (activeEffect !== 'cluster') {
      destroyVanta();
      return undefined;
    }

    const initVanta = async () => {
      if (typeof window === 'undefined') return undefined;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return undefined;
      }
      const [{ default: VANTA }, THREE] = await Promise.all([
        import('vanta/dist/vanta.net.min'),
        import('three')
      ]);

      if (isCancelled || !vantaContainerRef.current) {
        return undefined;
      }

      destroyVanta();

      vantaRef.current = VANTA({
        el: vantaContainerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x34d399,
        backgroundAlpha: 0.0,
        points: 12.0,
        maxDistance: 20.0,
        spacing: 15.0
      });

      return undefined;
    };

    initVanta();

    return () => {
      isCancelled = true;
      if (activeEffect !== 'cluster') {
        destroyVanta();
      }
    };
  }, [activeEffect]);

  useEffect(() => {
    return () => {
      if (vantaRef.current && typeof vantaRef.current.destroy === 'function') {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };
  }, []);

  return (
    <section className="py-5 section-divider position-relative">
      <div className="hero-background-layer" aria-hidden="true">
        <div
          ref={vantaContainerRef}
          className={`position-absolute top-0 start-0 w-100 h-100 ${activeEffect === 'cluster' ? '' : 'd-none'}`}
        />
        {activeEffect === 'it' ? <LaserFlow /> : null}
      </div>
      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="row g-5 align-items-center">
          <div className="col-lg-7 reveal">
            <span className="tag-pill mb-3 d-inline-block">{data.tagline}</span>
            <h1 className="display-5 fw-bold mb-3">{data.title}</h1>
            <p className="text-muted-custom mb-4">{data.subtitle}</p>
            <div className="d-flex flex-wrap gap-3">
              <a href={data.primaryCta.href} className="btn btn-primary px-4 py-2">
                {data.primaryCta.label}
              </a>
              <Link href={data.secondaryCta.href} className="btn btn-outline-light btn-ghost px-4 py-2">
                {data.secondaryCta.label}
              </Link>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="hero-panel p-4 reveal">
              <div className="row g-3 row-cols-1">
                {data.cards.map((card) => {
                  const effect = card.effect as HeroEffect;
                  const isActive = activeEffect === effect;
                  return (
                    <div key={card.title} className="col">
                      <button
                        type="button"
                        className={`w-100 text-start card-panel p-4 h-100 bg-transparent border-0 ${
                          isActive ? 'shadow-lg' : ''
                        }`}
                        onClick={() => setActiveEffect(effect)}
                        aria-pressed={isActive}
                      >
                        <h3 className="h5 mb-2 text-white">{card.title}</h3>
                        <p className="mb-0 text-muted-custom small">{card.body}</p>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
