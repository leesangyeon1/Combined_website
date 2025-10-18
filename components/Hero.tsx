'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const Particles3DField = dynamic(() => import('./Particles3DField'), { ssr: false });

export default function Hero() {
  return (
    <section className="relative w-full">
      <div className="relative h-[600px] w-full overflow-hidden rounded-2xl">
        <Particles3DField
          particleCount={600}
          gridGap={15}
          snapRadius={150}
          snapSpeed={0.1}
          depth={500}
          color={0x07cfeb}
          background="#020617"
          className="absolute inset-0"
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl font-bold text-white drop-shadow-xl md:text-6xl">3D Cluster Field</h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-200 md:text-xl">
            Hover near the points to snap them into a subtle 3D lattice while the rest of your site content stays
            perfectly intact in the foreground.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-10 text-neutral-200">
        <p>
          이 히어로 섹션은 3D 파티클을 배경으로 활용하면서도, 기존 페이지 컨텐츠가 그대로 유지되도록 설계되어
          있습니다.
        </p>
      </div>
    </section>
  );
}
