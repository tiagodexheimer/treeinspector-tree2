'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  return (
    <div className="flex-1 flex flex-col h-full w-full">
      <section className="flex-1 relative w-full h-full">
        <Map />
      </section>
    </div>
  );
}
