'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero / Summary Section */}
      <section className="bg-white border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">TreeInspector Hub</h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Plataforma integrada de gestão de arborização urbana. Acompanhe inspeções,
                gerencie o inventário arbóreo e controle ordens de serviço em tempo real.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/trees" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                Listagem Completa
              </Link>
              <Link href="/service-orders" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Gerenciar OS
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-blue-800 font-semibold mb-2">Inventário Arbóreo</h3>
              <p className="text-blue-600 text-sm">Visualize a distribuição geográfica e saúde das árvores.</p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h3 className="text-green-800 font-semibold mb-2">Monitoramento</h3>
              <p className="text-green-600 text-sm">Acompanhe métricas de crescimento e fitossanidade.</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
              <h3 className="text-yellow-800 font-semibold mb-2">Intervenções</h3>
              <p className="text-yellow-600 text-sm">Gerencie podas, supressões e substituições.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="flex-1 min-h-[600px] relative">
        <Map />

        {/* Map Legend / Overlay */}
        <div className="absolute bottom-8 left-8 bg-white p-4 rounded-lg shadow-lg z-[1000] border border-gray-200 max-w-xs">
          <h4 className="font-semibold text-gray-900 mb-2">Legenda</h4>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Árvore Cadastrada</span>
          </div>
        </div>
      </section>
    </div>
  );
}
