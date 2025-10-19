'use client';
import { useEffect, useRef } from 'react';

type ParticlesFieldProps = {
  width?: number;
  height?: number;
  particleCount?: number;
  gridGap?: number;
  linkDistance?: number;
  hoverSnapSpeed?: number;
  freeJitter?: number;
  className?: string;
};

type Vec2 = { x: number; y: number };

export default function ParticlesField({
  width,
  height,
  particleCount = 120,
  gridGap = 60,
  linkDistance = 120,
  hoverSnapSpeed = 0.15,
  freeJitter = 0.6,
  className = '',
}: ParticlesFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const parent = containerRef.current!;
    let w = width ?? parent.clientWidth;
    let h = height ?? parent.clientHeight;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      w = width ?? parent.clientWidth;
      h = height ?? parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildGridTargets();
    };

    const particles: {
      p: Vec2;
      v: Vec2;
      t: Vec2;
    }[] = [];

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        p: { x: rand(0, w), y: rand(0, h) },
        v: { x: rand(-1, 1), y: rand(-1, 1) },
        t: { x: 0, y: 0 },
      });
    }

    const gridTargets: Vec2[] = [];
    const rebuildGridTargets = () => {
      gridTargets.length = 0;
      const cols = Math.max(1, Math.floor(w / gridGap));
      const rows = Math.max(1, Math.floor(h / gridGap));
      const offsetX = (w - (cols - 1) * gridGap) / 2;
      const offsetY = (h - (rows - 1) * gridGap) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          gridTargets.push({ x: Math.floor(offsetX + c * gridGap), y: Math.floor(offsetY + r * gridGap) });
        }
      }

      const shuffled = [...gridTargets].sort(() => Math.random() - 0.5);
      particles.forEach((pt, i) => {
        pt.t = shuffled[i % shuffled.length];
      });
    };

    let isHover = false;
    let rafId = 0;

    const enter = () => (isHover = true);
    const leave = () => (isHover = false);

    parent.addEventListener('pointerenter', enter);
    parent.addEventListener('pointerleave', leave);
    window.addEventListener('resize', resize);
    resize();

    const step = () => {
      ctx.clearRect(0, 0, w, h);

      for (const pt of particles) {
        if (isHover) {
          pt.p.x += (pt.t.x - pt.p.x) * hoverSnapSpeed;
          pt.p.y += (pt.t.y - pt.p.y) * hoverSnapSpeed;
          pt.v.x *= 0.85;
          pt.v.y *= 0.85;
        } else {
          pt.v.x += rand(-freeJitter, freeJitter) * 0.05;
          pt.v.y += rand(-freeJitter, freeJitter) * 0.05;
          pt.v.x = Math.max(-1.4, Math.min(1.4, pt.v.x));
          pt.v.y = Math.max(-1.4, Math.min(1.4, pt.v.y));

          pt.p.x += pt.v.x;
          pt.p.y += pt.v.y;

          if (pt.p.x < 0 || pt.p.x > w) pt.v.x *= -1, (pt.p.x = Math.max(0, Math.min(w, pt.p.x)));
          if (pt.p.y < 0 || pt.p.y > h) pt.v.y *= -1, (pt.p.y = Math.max(0, Math.min(h, pt.p.y)));
        }
      }

      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;

      if (isHover) {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        const byKey: Record<string, Vec2[]> = {};
        for (const pt of particles) {
          const keyX = Math.round(pt.t.x) + ':row';
          const keyY = Math.round(pt.t.y) + ':col';
          (byKey[keyX] ||= []).push(pt.p);
          (byKey[keyY] ||= []).push(pt.p);
        }
        const drawChain = (arr: Vec2[]) => {
          arr.sort((a, b) => (Math.abs(a.x - b.x) > Math.abs(a.y - b.y) ? a.x - b.x : a.y - b.y));
          for (let i = 0; i < arr.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(arr[i].x, arr[i].y);
            ctx.lineTo(arr[i + 1].x, arr[i + 1].y);
            ctx.stroke();
          }
        };
        Object.values(byKey).forEach(drawChain);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.30)';
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i].p;
            const b = particles[j].p;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= linkDistance) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.globalAlpha = Math.max(0.05, 1 - dist / linkDistance) * 0.6;
              ctx.stroke();
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      for (const pt of particles) {
        ctx.beginPath();
        ctx.arc(pt.p.x, pt.p.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#7cfe0b';
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      parent.removeEventListener('pointerenter', enter);
      parent.removeEventListener('pointerleave', leave);
      window.removeEventListener('resize', resize);
    };
  }, [width, height, particleCount, gridGap, linkDistance, hoverSnapSpeed, freeJitter]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
