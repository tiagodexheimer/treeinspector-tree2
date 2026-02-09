'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import ServiceOrderEditModal from '../../components/ServiceOrderEditModal';
import ServiceOrderAdjustmentModal from '../../components/ServiceOrderAdjustmentModal';
import { CHECKLIST_LABELS } from '../../lib/constants';

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
    const canEditOrCancel = ['ADMIN', 'GESTOR', 'INSPETOR'].includes(role) || (role === 'OPERACIONAL' && order.status === 'Aguardando Ajustes');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

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

    async function handleAdjustmentSubmit(notes: string) {
        try {
            const res = await fetch(`/api/service-orders/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Aguardando Ajustes',
                    adjustment_notes: notes
                })
            });
            if (res.ok) {
                alert('Solicitação de ajuste enviada!');
                setIsAdjustmentModalOpen(false);
                fetchOrder();
            } else {
                alert('Erro ao enviar solicitação');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao enviar solicitação');
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
                    order.status === 'Aguardando Revisão' ? 'bg-orange-600' :
                        order.status === 'Aguardando Ajustes' ? 'bg-amber-500' :
                            'bg-blue-700'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-white">
                    <div>
                        <Link href="/service-orders" className="text-white/80 hover:text-white mb-2 inline-block">&larr; Voltar para Lista</Link>
                        <h1 className="text-3xl font-bold">Ordem de Serviço #{order.id}</h1>
                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-white/80 text-sm">
                            <p>📅 Criada em {new Date(order.created_at).toLocaleDateString()}</p>
                            {order.start_time && (
                                <p>⏱️ Iniciada em {new Date(order.start_time).toLocaleDateString()}</p>
                            )}
                            {order.executed_at && order.start_time && (
                                <p className="text-white font-bold">✨ Duração: {(() => {
                                    const diffMs = new Date(order.executed_at).getTime() - new Date(order.start_time).getTime();
                                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
                                })()}</p>
                            )}
                        </div>
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
                        {order.status === 'Aguardando Ajustes' && order.adjustment_notes && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg shadow-sm animate-pulse-subtle">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">⚠️</span>
                                    <h3 className="text-lg font-bold text-amber-900">Ajustes Solicitados</h3>
                                </div>
                                <p className="text-amber-800 whitespace-pre-wrap leading-relaxed">
                                    {order.adjustment_notes}
                                </p>
                            </div>
                        )}

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
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex items-center gap-4 border-t pt-4">
                                <div>
                                    <label className="block text-sm text-gray-500 uppercase">Prioridade</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        {order.priority === 'Emergencial' && <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-black uppercase ring-4 ring-red-100">🔥 Emergencial</span>}
                                        {order.priority === 'Alta' && <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-black uppercase ring-4 ring-orange-100">⚡ Alta</span>}
                                        {order.priority === 'Moderada' && <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-black uppercase ring-4 ring-blue-100">Moderada</span>}
                                        {order.priority === 'Baixa' && <span className="px-3 py-1 bg-gray-400 text-white rounded-full text-sm font-black uppercase ring-4 ring-gray-100">Baixa</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm text-gray-500 uppercase">Observações do Planejamento</label>
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-100 italic">
                                    {order.observations || 'Nenhuma observação registrada durante o planejamento.'}
                                </p>
                            </div>

                            {/* Detalhes da Execução Realizada */}
                            {(order.status === 'Aguardando Revisão' || order.status === 'Concluída' || order.description) && (
                                <div className="mt-8 pt-6 border-t border-blue-100 bg-blue-50/30 p-4 rounded-xl">
                                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <span className="text-xl">🛠️</span> Detalhes da Execução
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                        {order.start_time && (
                                            <div>
                                                <label className="block text-sm font-bold text-blue-700 uppercase mb-1 text-[10px] tracking-wider">Início</label>
                                                <p className="text-gray-800 font-medium">
                                                    {new Date(order.start_time).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {order.executed_at && (
                                            <div>
                                                <label className="block text-sm font-bold text-blue-700 uppercase mb-1 text-[10px] tracking-wider">Término</label>
                                                <p className="text-gray-800 font-medium">
                                                    {new Date(order.executed_at).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {order.start_time && (order.executed_at || order.status === 'Em Execução') && (
                                            <div>
                                                <label className="block text-sm font-bold text-blue-700 uppercase mb-1 text-[10px] tracking-wider">Duração do Serviço</label>
                                                <p className="text-blue-700 font-black text-lg">
                                                    {(() => {
                                                        const start = new Date(order.start_time).getTime();
                                                        const end = order.executed_at ? new Date(order.executed_at).getTime() : Date.now();
                                                        const diffMs = end - start;

                                                        const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                                        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                                                        if (hours > 0) {
                                                            return `${hours}h ${minutes}m`;
                                                        }
                                                        return `${minutes} min`;
                                                    })()}
                                                </p>
                                            </div>
                                        )}
                                    </div>



                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Checklist */}
                                        {order.checklist && Object.keys(order.checklist).length > 0 && (
                                            <div className="space-y-6">
                                                {/* Checklist de Preparo */}
                                                {Object.entries(order.checklist).some(([key]) => key in CHECKLIST_LABELS) && (
                                                    <div>
                                                        <label className="block text-sm font-bold text-blue-700 uppercase mb-2 text-[10px] tracking-wider">Atividades de Preparo e Segurança</label>
                                                        <div className="space-y-2">
                                                            {Object.entries(order.checklist)
                                                                .filter(([key]) => key in CHECKLIST_LABELS)
                                                                .map(([item, checked]: [string, any]) => (
                                                                    <div key={item} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-blue-100 text-sm">
                                                                        <span className={checked ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                                                            {checked ? "✓" : "✗"}
                                                                        </span>
                                                                        <span className="text-gray-700">{CHECKLIST_LABELS[item] || item}</span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Checklist de Execução */}
                                                {Object.entries(order.checklist).some(([key]) => !(key in CHECKLIST_LABELS)) && (
                                                    <div>
                                                        <label className="block text-sm font-bold text-green-700 uppercase mb-2 text-[10px] tracking-wider">Execução do Trabalho (Manejo)</label>
                                                        <div className="space-y-2">
                                                            {Object.entries(order.checklist)
                                                                .filter(([key]) => !(key in CHECKLIST_LABELS))
                                                                .map(([item, checked]: [string, any]) => {
                                                                    const itemId = item.replace(/\D/g, ''); // Extract numeric ID
                                                                    const tree = order.trees?.find((t: any) => t.id_arvore.toString() === itemId);
                                                                    const label = tree ? `${tree.species?.nome_comum || 'Espécie desconhecida'} (ID: ${tree.id_arvore})` : item;
                                                                    return (
                                                                        <div key={item} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-green-100 text-sm">
                                                                            <span className={checked ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                                                                {checked ? "✓" : "✗"}
                                                                            </span>
                                                                            <span className="text-gray-700 font-medium">{label}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Materiais */}
                                        {order.materials && order.materials.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-bold text-blue-700 uppercase mb-2 text-[10px] tracking-wider">Materiais Consumidos</label>
                                                <div className="space-y-2">
                                                    {order.materials.map((mat: any) => (
                                                        <div key={mat.id} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-blue-100 text-sm">
                                                            <span className="text-gray-700">{mat.name}</span>
                                                            <span className="font-bold text-blue-700">{mat.quantity} {mat.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fotos da Execução */}
                                    {order.photos && order.photos.length > 0 && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-bold text-blue-700 uppercase mb-4 text-[10px] tracking-wider">Registro Fotográfico (Antes / Depois)</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {order.photos.map((photo: any) => (
                                                    <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition bg-gray-100">
                                                        <img
                                                            src={photo.uri}
                                                            alt={`Foto ${photo.category}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${photo.category === 'Antes' ? 'bg-orange-600' : 'bg-green-600'
                                                            }`}>
                                                            {photo.category}
                                                        </div>
                                                        <a
                                                            href={photo.uri}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                                                        >
                                                            <span className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Ampliar ↗</span>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                <span>🌳</span> Árvores Incluídas ({order.trees.length})
                            </h2>
                            <div className="space-y-3">
                                {order.trees.map((tree: any) => (
                                    <Link key={tree.id_arvore} href={`/trees/${tree.id_arvore}`} className="block border rounded-lg p-3 hover:bg-green-50 hover:border-green-300 transition shadow-sm bg-gray-50/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">#{tree.numero_etiqueta || 'Sem Etiqueta'}</span>
                                                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">ID: {tree.id_arvore}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 italic mt-1">{tree.species?.nome_comum || 'Espécie desconhecida'}</p>
                                            </div>
                                            <span className="text-blue-600 text-[10px] font-bold uppercase tracking-tighter">Detalhes</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

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

                                        {order.status === 'Aguardando Revisão' && canEditOrCancel && (
                                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-3">
                                                <p className="text-sm font-bold text-orange-800 text-center">Revisão Pendente</p>
                                                <button
                                                    onClick={() => updateStatus('Concluída')}
                                                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition font-black uppercase text-sm shadow-sm"
                                                >
                                                    ✅ Aprovar e Concluir
                                                </button>
                                                <button
                                                    onClick={() => setIsAdjustmentModalOpen(true)}
                                                    className="w-full bg-white border-2 border-orange-500 text-orange-600 py-2 rounded hover:bg-orange-50 transition font-bold text-sm"
                                                >
                                                    ⚠️ Solicitar Ajustes
                                                </button>
                                            </div>
                                        )}

                                        {order.status !== 'Aguardando Revisão' && (
                                            <button
                                                onClick={() => updateStatus(order.status === 'Planejada' ? 'Em Execução' : 'Aguardando Revisão')}
                                                className="w-full border-2 border-green-600 text-green-700 py-2 rounded hover:bg-green-50 transition font-medium"
                                            >
                                                {order.status === 'Planejada' ? 'Iniciar Execução' : 'Enviar para Revisão'}
                                            </button>
                                        )}

                                        {canEditOrCancel && (
                                            <button
                                                onClick={() => updateStatus('Cancelada')}
                                                className="w-full border border-red-200 text-red-600 py-2 rounded hover:bg-red-50 transition text-sm"
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
                initialData={{ ...order, role }}
            />

            <ServiceOrderAdjustmentModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                onSubmit={handleAdjustmentSubmit}
            />
        </div>
    );
}
