'use client';

import dynamic from 'next/dynamic';
import Navigation from '../../components/Navigation';

// Dymanic import to simple client-side rendering
const ServiceOrderCreationMap = dynamic(
    () => import('../../components/ServiceOrderCreationMap'),
    {
        ssr: false,
        loading: () => (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
                <p className="mt-4 text-gray-500">Carregando mapa de criação...</p>
            </div>
        )
    }
);

export default function CreateServiceOrderMapPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />

            <div className="flex-1 relative">
                <div className="absolute top-4 left-4 z-[1000]">
                    <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
                        <h1 className="text-xl font-bold text-gray-800">Nova Ordem de Serviço</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Selecione as árvores no mapa abaixo para criar uma nova O.S.
                        </p>
                        <ul className="text-xs text-gray-500 mt-2 list-disc ml-4 space-y-1">
                            <li>Use o modo <strong>Seleção</strong> para desenhar uma área.</li>
                            <li>Clique em árvores individuais para adicionar/remover.</li>
                            <li>Clique em "Criar Ordem de Serviço" quando finalizar.</li>
                        </ul>
                    </div>
                </div>
                <ServiceOrderCreationMap />
            </div>
        </div>
    );
}
