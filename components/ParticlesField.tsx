'use client';

import { useEffect, useMemo, useRef } from 'react';

const PARTICLES_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js';

declare global {
  interface Window {
    particlesJS?: {
      load: (
        tagId: string,
        pathConfigJson: string,
        callback?: () => void
      ) => void;
    };
    pJSDom?: Array<{
      pJS: {
        canvas: { el: HTMLCanvasElement };
        particles: {
          array: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            _lineLock?: boolean;
          }>;
        };
        interactivity: {
          mouse: { pos_x?: number | null; pos_y?: number | null; status?: string };
        };
        fn: {
          particlesUpdate: () => void;
          vendors: { destroy: () => void };
        };
      };
    }>;
  }
}

function destroyInstance(containerId: string) {
  if (typeof window === 'undefined' || !window.pJSDom) return;

  window.pJSDom = window.pJSDom.filter((instance) => {
    if (instance.pJS.canvas.el.id === containerId) {
      instance.pJS.fn.vendors.destroy();
      return false;
    }

    return true;
  });
}

function ensureScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${PARTICLES_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PARTICLES_SCRIPT_SRC;
    script.async = true;
    script.dataset.loaded = 'false';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true }
    );

    document.body.appendChild(script);
  });
}

function attachLineAlignment(instance: (typeof window.pJSDom)[number]['pJS']) {
  const originalUpdate = instance.fn.particlesUpdate.bind(instance.fn);

  const alignParticles = () => {
    const mouse = instance.interactivity.mouse;
    const mouseX = mouse.pos_x ?? null;
    const mouseY = mouse.pos_y ?? null;

    if (mouseX === null || mouseY === null || mouse.status !== 'mousemove') {
      instance.particles.array.forEach((particle) => {
        if (particle._lineLock) {
          particle._lineLock = false;
          particle.vx += (Math.random() - 0.5) * 0.2;
          particle.vy += (Math.random() - 0.5) * 0.2;
        }
      });
      return;
    }

    const influenceRadius = 140;
    const spacing = 22;
    const easing = 0.18;

    const nearby = instance.particles.array
      .map((particle) => {
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { particle, distance };
      })
      .filter(({ distance }) => distance <= influenceRadius)
      .sort((a, b) => a.particle.x - b.particle.x);

    if (!nearby.length) {
      instance.particles.array.forEach((particle) => {
        if (particle._lineLock) {
          particle._lineLock = false;
        }
      });
      return;
    }

    const startX = mouseX - ((nearby.length - 1) / 2) * spacing;

    nearby.forEach(({ particle }, index) => {
      const targetX = startX + index * spacing;
      const targetY = mouseY;
      particle._lineLock = true;
      particle.vx += (targetX - particle.x) * easing;
      particle.vy += (targetY - particle.y) * easing;
      particle.x += particle.vx * easing;
      particle.y += particle.vy * easing;
    });
  };

  instance.fn.particlesUpdate = () => {
    originalUpdate();
    alignParticles();
  };
}

export default function ParticlesField({ className }: { className?: string }) {
  const containerId = useMemo(
    () => `particles-js-${Math.random().toString(36).slice(2)}`,
    []
  );
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    let cancelled = false;
    initializedRef.current = true;

    ensureScript().then(() => {
      if (cancelled || !window.particlesJS) return;

      window.particlesJS.load(containerId, '/assets/particles.json', () => {
        if (cancelled || !window.pJSDom) return;

        const instance = window.pJSDom.find(
          ({ pJS }) => pJS.canvas.el.id === containerId
        );

        if (!instance) return;

        attachLineAlignment(instance.pJS);
      });
    });

    return () => {
      cancelled = true;
      destroyInstance(containerId);
    };
  }, [containerId]);

  return <div id={containerId} className={className} />;
}
