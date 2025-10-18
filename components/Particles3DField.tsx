'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Particles3DFieldProps = {
  particleCount?: number;
  gridGap?: number;
  snapRadius?: number;
  snapSpeed?: number;
  depth?: number;
  color?: number;
  background?: string;
  className?: string;
};

export default function Particles3DField({
  particleCount = 400,
  gridGap = 12,
  snapRadius = 120,
  snapSpeed = 0.08,
  depth = 400,
  color = 0x07cfeb,
  background = '#000000',
  className = '',
}: Particles3DFieldProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 1, 2000);
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const gridTargets = new Float32Array(particleCount * 3);

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      positions[ix] = rand(-300, 300);
      positions[ix + 1] = rand(-200, 200);
      positions[ix + 2] = rand(-depth, depth);
      velocities[ix] = rand(-0.5, 0.5);
      velocities[ix + 1] = rand(-0.5, 0.5);
      velocities[ix + 2] = rand(-0.5, 0.5);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size: 3.2,
      transparent: true,
      opacity: 0.9,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const cols = Math.max(1, Math.floor(600 / gridGap));
    const rows = Math.max(1, Math.floor(400 / gridGap));
    const layers = Math.max(1, Math.floor(depth / gridGap));
    const gridCenters: THREE.Vector3[] = [];

    for (let x = -cols / 2; x < cols / 2; x++) {
      for (let y = -rows / 2; y < rows / 2; y++) {
        for (let z = -layers / 2; z < layers / 2; z++) {
          gridCenters.push(new THREE.Vector3(x * gridGap, y * gridGap, z * gridGap));
        }
      }
    }

    for (let i = 0; i < particleCount; i++) {
      const target = gridCenters[Math.floor(Math.random() * gridCenters.length)];
      const ix = i * 3;
      gridTargets[ix] = target.x;
      gridTargets[ix + 1] = target.y;
      gridTargets[ix + 2] = target.z;
    }

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const mouse3D = new THREE.Vector3();

    const onMouseMove = (event: MouseEvent) => {
      const bounds = container.getBoundingClientRect();
      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      mouse3D.copy(raycaster.ray.origin).add(raycaster.ray.direction.clone().multiplyScalar(500));
    };

    window.addEventListener('mousemove', onMouseMove);

    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
    let animationFrame = 0;

    const animate = () => {
      controls.update();
      const posArray = positionAttribute.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const particle = new THREE.Vector3(posArray[ix], posArray[ix + 1], posArray[ix + 2]);
        const target = new THREE.Vector3(gridTargets[ix], gridTargets[ix + 1], gridTargets[ix + 2]);
        const distance = particle.distanceTo(mouse3D);

        if (distance < snapRadius) {
          particle.lerp(target, snapSpeed);
        } else {
          velocities[ix] += (Math.random() - 0.5) * 0.02;
          velocities[ix + 1] += (Math.random() - 0.5) * 0.02;
          velocities[ix + 2] += (Math.random() - 0.5) * 0.02;
          particle.x += velocities[ix];
          particle.y += velocities[ix + 1];
          particle.z += velocities[ix + 2];

          if (particle.length() > 800) {
            particle.multiplyScalar(0.95);
          }
        }

        posArray[ix] = particle.x;
        posArray[ix + 1] = particle.y;
        posArray[ix + 2] = particle.z;
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    const handleResize = () => {
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [background, color, depth, gridGap, particleCount, snapRadius, snapSpeed]);

  return <div ref={mountRef} className={`pointer-events-none w-full h-full ${className}`} />;
}
