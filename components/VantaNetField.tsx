'use client';

import React, { useEffect, useRef } from 'react';

export type VantaNetFieldProps = {
  className?: string;
};

export default function VantaNetField({ className = '' }: VantaNetFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let vantaInstance: any;
    let controller: any;

    const loadEffect = async () => {
      if (!containerRef.current) return;
      const [threeModule, vantaNet] = await Promise.all([
        import('three'),
        import('vanta/dist/vanta.net.min'),
      ]);
      if (cancelled) return;

      const THREE = (threeModule as any).default || threeModule;
      const NET = (vantaNet as any).default || vantaNet;
      if (typeof window !== 'undefined') {
        (window as any).THREE = THREE;
      }

      vantaInstance = NET({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x07cfeb,
        backgroundColor: 0x050712,
        points: 11,
        maxDistance: 22,
        spacing: 18,
        showDots: true,
        forceAnimate: true,
      });

      const alignModule = await import('@/lib/local-cluster-align');
      if (cancelled || !vantaInstance) return;
      const attach = alignModule.attachLocalClusterAlign as (
        instance: any,
        opts?: Record<string, unknown>,
      ) => any;
      controller = attach(vantaInstance, {
        affectRadius: 168,
        hoverStrength: 0.4,
        clickStrength: 0.9,
        clickDuration: 420,
        alignMode: 'axis',
        axis: 'x',
        gridSize: 14,
        circleRadius: 90,
        flowCurl: 1.25,
        alignLines: true,
        maxAffected: (typeof window !== 'undefined' && window.innerWidth < 768) ? 80 : 140,
        restoreEase: 0.08,
        debugHelpers: false,
      });
    };

    loadEffect();

    return () => {
      cancelled = true;
      try {
        controller?.destroy?.();
      } catch (err) {
        console.warn('local-cluster-align cleanup', err);
      }
      controller = null;
      if (typeof vantaInstance?.destroy === 'function') {
        vantaInstance.destroy();
      }
      vantaInstance = null;
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
