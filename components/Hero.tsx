'use client';
import React from 'react';
import ClusterField from './ClusterField';

export default function Hero() {
  return (
    <section className="relative w-full">
      <ClusterField />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-neutral-200">
          Hover하면 입자/선이 <b>정렬</b>되고, 벗어나면 부드럽게 흩어집니다.
        </p>
      </div>
    </section>
  );
}
