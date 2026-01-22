'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import ServiceOrderEditModal from '../../components/ServiceOrderEditModal';

// Dynamically import Map to avoid SSR issues
const ServiceOrderMap = dynamic(() => import('../../components/ServiceOrderMap'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Carregando Mapa...</div>
});

export default function ServiceOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const role = (session?.user as any)?.role;
    const canEditOrCancel = ['ADMIN', 'GESTOR', 'INSPETOR'].includes(role);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, []);

    async function fetchOrder() {
        try {
            const res = await fetch(`/api/service-orders/${params.id}`);
            if (!res.ok) {
                if (res.status === 404) alert('Ordem de serviço não encontrada');
                return;
            }
            const data = await res.json();
            setOrder(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(newStatus: string) {
        if (!confirm(`Tem certeza que deseja alterar o status para "${newStatus}"?`)) return;
        try {
            const res = await fetch(`/api/service-orders/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchOrder();
            } else {
                alert('Erro ao atualizar status');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar status');
        }
    }

    async function handleEditSubmit(data: any) {
        try {
            const res = await fetch(`/api/service-orders/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                alert('Dados atualizados com sucesso!');
                fetchOrder();
            } else {
                alert('Erro ao atualizar dados');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar dados');
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando detalhes...</div>;
    if (!order) return <div className="p-8 text-center">Ordem de serviço não encontrada</div>;

    const isActive = order.status !== 'Concluída' && order.status !== 'Cancelada';

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className={`py-8 ${order.status === 'Concluída' ? 'bg-green-700' :
                order.status === 'Cancelada' ? 'bg-red-700' :
                    'bg-blue-700'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-white">
                    <div>
                        <Link href="/service-orders" className="text-white/80 hover:text-white mb-2 inline-block">&larr; Voltar para Lista</Link>
                        <h1 className="text-3xl font-bold">Ordem de Serviço #{order.id}</h1>
                        <p className="mt-2 text-white/80">Criada em {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white text-gray-800 px-4 py-2 rounded-full font-bold shadow">
                        {order.status}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Map Section */}
                        <div className="bg-white rounded-lg shadow overflow-hidden h-96">
                            <ServiceOrderMap trees={order.trees} />
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Detalhes do Serviço</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-gray-500 uppercase">Tipo de Serviço</label>
                                    <p className="font-medium text-lg">{order.serviceType || 'Não especificado'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 uppercase">Atribuído a</label>
                                    <p className="font-medium">{order.assigned_to || 'Sem atribuição'}</p>
                                </div>
                            </div>

                            {order.serviceSubtypes && order.serviceSubtypes.length > 0 && (
                                <div className="mt-4">
                                    <label className="block text-sm text-gray-500 uppercase mb-2">Especificações</label>
                                    <div className="flex flex-wrap gap-2">
                                        {order.serviceSubtypes.map((sub: string) => (
                                            <span key={sub} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100">
                                                {sub}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <label className="block text-sm text-gray-500 uppercase">Descrição / Observações</label>
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-100">
                                    {order.description || order.observations || 'Nenhuma observação registrada.'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Árvores Incluídas ({order.trees.length})</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {order.trees.map((tree: any) => (
                                    <Link key={tree.id_arvore} href={`/trees/${tree.id_arvore}`} className="block border rounded p-3 hover:bg-green-50 hover:border-green-300 transition">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold text-gray-900">#{tree.numero_etiqueta || tree.id_arvore}</span>
                                                <p className="text-sm text-gray-500 italic">{tree.species?.nome_comum || 'Espécie desconhecida'}</p>
                                            </div>
                                            <span className="text-blue-600 text-sm font-medium">Ver &rarr;</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Actions */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Ações</h3>
                            <div className="space-y-3">
                                {isActive && (
                                    <>
                                        {canEditOrCancel && (
                                            <button
                                                onClick={() => setIsEditModalOpen(true)}
                                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium"
                                            >
                                                Editar Detalhes
                                            </button>
                                        )}
                                        <button
                                            onClick={() => updateStatus('Concluída')}
                                            className="w-full border-2 border-green-600 text-green-700 py-2 rounded hover:bg-green-50 transition font-medium"
                                        >
                                            Marcar como Concluída
                                        </button>
                                        {canEditOrCancel && (
                                            <button
                                                onClick={() => updateStatus('Cancelada')}
                                                className="w-full border border-red-200 text-red-600 py-2 rounded hover:bg-red-50 transition"
                                            >
                                                Cancelar OS
                                            </button>
                                        )}
                                    </>
                                )}
                                {!isActive && (
                                    <div className="text-center text-gray-500 py-4 italic">
                                        Esta ordem de serviço está {order.status.toLowerCase()}. Nenhuma ação disponível.
                                        {canEditOrCancel && (order.status === 'Cancelada' || order.status === 'Concluída') && (
                                            <button
                                                onClick={() => updateStatus('Planejada')} // Reopen?
                                                className="mt-4 text-sm text-blue-600 underline block w-full"
                                            >
                                                Reabrir OS
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ServiceOrderEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditSubmit}
                initialData={order}
            />
        </div>
    );
}
