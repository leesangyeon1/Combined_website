'use client';

import { useEffect } from 'react';

export default function BootstrapClient() {
  useEffect(() => {
    const loadBootstrap = async () => {
      try {
        await import('bootstrap/dist/js/bootstrap.bundle.min.js');
      } catch (error) {
        console.warn('Bootstrap JS failed to load', error);
      }
    };

    loadBootstrap();
  }, []);

  return null;
}
