'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const ParticlesField = dynamic(() => import('./ParticlesField'), { ssr: false });

export default function ClusterField() {
  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden">
      <ParticlesField
        particleCount={140}
        gridGap={64}
        linkDistance={120}
        hoverSnapSpeed={0.2}
        freeJitter={0.8}
        className="absolute inset-0"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow">
          Systems & HPC — Clean Aligned Particles
        </h1>
      </div>
    </div>
  );
}
