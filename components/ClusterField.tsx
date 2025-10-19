'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const DynamicVantaField = dynamic(() => import('./VantaNetField'), { ssr: false });

export default function ClusterField() {
  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden">
      <DynamicVantaField className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow">
          Systems & HPC — Clean Aligned Particles
        </h1>
      </div>
    </div>
  );
}
