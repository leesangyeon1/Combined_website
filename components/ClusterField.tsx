'use client';

import { useEffect, useRef } from 'react';

type ClusterFieldProps = {
  className?: string;
  pointCount?: number;
  connectionDistance?: number;
  attractionRadius?: number;
};

const DEFAULT_POINT_COUNT = 70;
const DEFAULT_CONNECTION_DISTANCE = 130;
const DEFAULT_ATTRACTION_RADIUS = 160;

export default function ClusterField({
  className,
  pointCount = DEFAULT_POINT_COUNT,
  connectionDistance = DEFAULT_CONNECTION_DISTANCE,
  attractionRadius = DEFAULT_ATTRACTION_RADIUS
}: ClusterFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const resizeCanvas = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const scale = window.devicePixelRatio || 1;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(scale, scale);
    };

    resizeCanvas();

    type Point = {
      x: number;
      y: number;
      vx: number;
      vy: number;
    };

    const points: Point[] = Array.from({ length: pointCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    }));

    const pointer = {
      x: width / 2,
      y: height / 2,
      active: false
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerenter', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    let animationFrame: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      points.forEach((point) => {
        point.x += point.vx;
        point.y += point.vy;

        if (pointer.active) {
          const dx = pointer.x - point.x;
          const dy = pointer.y - point.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < attractionRadius) {
            const influence = (1 - dist / attractionRadius) * 0.12;
            point.vx += (dx / dist) * influence;
            point.vy += (dy / dist) * influence;
          }
        }

        point.vx *= 0.98;
        point.vy *= 0.98;

        if (point.x <= 0 || point.x >= width) {
          point.vx *= -1;
          point.x = Math.min(Math.max(point.x, 0), width);
        }

        if (point.y <= 0 || point.y >= height) {
          point.vy *= -1;
          point.y = Math.min(Math.max(point.y, 0), height);
        }

        ctx.beginPath();
        ctx.fillStyle = 'rgba(7, 207, 235, 0.9)';
        ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const pointA = points[i];
          const pointB = points[j];
          const dx = pointA.x - pointB.x;
          const dy = pointA.y - pointB.y;
          const distance = Math.hypot(dx, dy);

          if (distance <= connectionDistance) {
            const opacity = 1 - distance / connectionDistance;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(7, 207, 235, ${opacity * 0.6})`;
            ctx.lineWidth = 1.2;
            ctx.moveTo(pointA.x, pointA.y);
            ctx.lineTo(pointB.x, pointB.y);
            ctx.stroke();
          }
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }

    draw();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resizeCanvas);
      }
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerenter', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [attractionRadius, connectionDistance, pointCount]);

  return <canvas ref={canvasRef} className={className} />;
}
