'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
                router.push('/service-orders');
            }
        }
    }, [status, session, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
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
