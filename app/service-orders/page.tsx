'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface ServiceOrder {
    id: number;
    status: string;
    description: string | null;
    created_at: string;
    createdById: string | null;
    assignedToId: string | null;
    assignedTo?: { name: string | null; email: string };
    trees: {
        id_arvore: number;
        numero_etiqueta: string;
        species?: {
            nome_comum: string;
        }
    }[];
}

export default function ServiceOrdersPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active');
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const role = (session?.user as any)?.role;
    const canCreate = ['ADMIN', 'GESTOR', 'INSPETOR'].includes(role);

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    async function fetchOrders() {
        setLoading(true);
        try {
            const res = await fetch(`/api/service-orders?status=${activeTab}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Failed to fetch service orders', error);
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Planejada': return 'bg-blue-100 text-blue-800';
            case 'Em Execução': return 'bg-yellow-100 text-yellow-800';
            case 'Concluída': return 'bg-green-100 text-green-800';
            case 'Cancelada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-green-700 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Ordens de Serviço</h1>
                            <p className="mt-2 text-green-100">Gerencie as atividades de manejo das árvores</p>
                        </div>
                        <div className="flex gap-4">
                            {canCreate && (
                                <>
                                    <Link
                                        href="/service-orders/create-map"
                                        className="bg-white text-green-700 font-bold py-2 px-4 rounded shadow hover:bg-green-50 transition flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                                        </svg>
                                        Mapa
                                    </Link>
                                    <Link
                                        href="/trees"
                                        className="bg-green-600 text-white font-bold py-2 px-4 rounded shadow border border-green-500 hover:bg-green-500 transition flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                        </svg>
                                        Lista
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden min-h-[500px]">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`${activeTab === 'active'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-lg transition-colors`}
                            >
                                Ativas
                            </button>
                            <button
                                onClick={() => setActiveTab('finished')}
                                className={`${activeTab === 'finished'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-lg transition-colors`}
                            >
                                Finalizadas
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                Nenhuma ordem de serviço encontrada nesta categoria.
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {orders.map(os => {
                                    const isAssignedToMe = os.assignedToId === session?.user?.id;
                                    return (
                                        <div
                                            key={os.id}
                                            className={`bg-white border text-left border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col ${isAssignedToMe ? 'ring-2 ring-blue-500 border-transparent shadow-blue-100' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-400">#{os.id}</span>
                                                    {isAssignedToMe && (
                                                        <span className="bg-blue-600 text-white text-[10px] uppercase px-1.5 py-0.5 rounded font-black tracking-tighter animate-pulse">Minha</span>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(os.status)}`}>
                                                    {os.status}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                                                {os.trees.length} Árvore(s)
                                            </h3>

                                            <div className="mb-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {os.trees.slice(0, 3).map(t => (
                                                        <span key={t.id_arvore} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                            #{t.id_arvore} ({t.numero_etiqueta || 'S/N'})
                                                        </span>
                                                    ))}
                                                    {os.trees.length > 3 && (
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                            +{os.trees.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {os.description && (
                                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                    {os.description}
                                                </p>
                                            )}

                                            <div className="flex justify-between items-center text-[10px] text-gray-500 mt-auto pt-4 border-t border-gray-100">
                                                <span>
                                                    {new Date(os.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="font-semibold text-right max-w-[120px] truncate">
                                                    {os.assignedTo?.name || os.assignedTo?.email || '⚠️ Não atribuído'}
                                                </span>
                                            </div>
                                            <div className="mt-4 pt-2 border-t border-gray-100 flex justify-end">
                                                <Link href={`/service-orders/${os.id}`} className="text-sm font-medium text-green-600 hover:text-green-800">
                                                    Ver Detalhes &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
