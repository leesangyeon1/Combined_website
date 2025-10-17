'use client';

import { useEffect, useRef } from 'react';

type LaserFlowProps = {
  className?: string;
};

export default function LaserFlow({ className = '' }: LaserFlowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    let animationFrame = 0;
    let renderer: import('three').WebGLRenderer | undefined;
    let scene: import('three').Scene | undefined;
    let camera: import('three').PerspectiveCamera | undefined;
    let points: import('three').Points | undefined;
    let velocities: number[] = [];

    const init = async () => {
      const THREE = await import('three');
      if (!containerRef.current) {
        return;
      }

      const {
        WebGLRenderer,
        PerspectiveCamera,
        Scene,
        Color,
        BufferGeometry,
        Float32BufferAttribute,
        PointsMaterial,
        Points,
        AdditiveBlending
      } = THREE;

      const container = containerRef.current;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(new Color('#000000'), 0);

      container.appendChild(renderer.domElement);

      scene = new Scene();
      camera = new PerspectiveCamera(60, width / height, 0.1, 100);
      camera.position.z = 5;

      const particleCount = 420;
      const positions = new Float32Array(particleCount * 3);
      velocities = new Array(particleCount).fill(0);

      for (let i = 0; i < particleCount; i += 1) {
        const x = (Math.random() - 0.5) * 6;
        const y = Math.random() * 4 - 2;
        const z = (Math.random() - 0.5) * 6;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        velocities[i] = 0.002 + Math.random() * 0.004;
      }

      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

      const material = new PointsMaterial({
        color: 0x60a5fa,
        size: 0.05,
        transparent: true,
        opacity: 0.85,
        blending: AdditiveBlending
      });

      points = new Points(geometry, material);
      scene.add(points);

      const animate = () => {
        if (!renderer || !scene || !camera || !points) {
          return;
        }

        const positionAttr = points.geometry.getAttribute('position') as import('three').BufferAttribute;
        const positionArray = positionAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i += 1) {
          positionArray[i * 3 + 1] += velocities[i];
          if (positionArray[i * 3 + 1] > 2) {
            positionArray[i * 3 + 1] = -2;
          }
        }

        positionAttr.needsUpdate = true;

        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      };

      const handleResize = () => {
        if (!renderer || !camera || !containerRef.current) {
          return;
        }
        const { clientWidth, clientHeight } = containerRef.current;
        renderer.setSize(clientWidth || window.innerWidth, clientHeight || window.innerHeight);
        camera.aspect = (clientWidth || window.innerWidth) / (clientHeight || window.innerHeight);
        camera.updateProjectionMatrix();
      };

      window.addEventListener('resize', handleResize);
      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrame);
        if (points) {
          points.geometry.dispose();
          (points.material as import('three').Material).dispose();
        }
        renderer?.dispose();
        if (renderer?.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    };

    let cleanup: (() => void) | undefined;
    init().then((fn) => {
      cleanup = fn || cleanup;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`laser-flow-container position-absolute top-0 start-0 w-100 h-100 ${className}`}
      aria-hidden="true"
    />
  );
}
