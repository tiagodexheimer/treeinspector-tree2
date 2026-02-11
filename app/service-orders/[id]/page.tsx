'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import ServiceOrderEditModal from '../../components/ServiceOrderEditModal';
import ServiceOrderAdjustmentModal from '../../components/ServiceOrderAdjustmentModal';
import ServiceOrderExecutionModal from '../../components/ServiceOrderExecutionModal';
import { CHECKLIST_LABELS } from '../../lib/constants';
import { EXECUTION_CHECKLIST_ITEMS } from '../../lib/checklistConstants';

// Dynamically import Map to avoid SSR issues
const ServiceOrderMap = dynamic(() => import('../../components/ServiceOrderMap'), {
    ssr: false,
    loading: () => <p className="text-center py-12 text-gray-500">Carregando Mapa...</p>
});

export default function ServiceOrderDetail() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
    const [laborCost, setLaborCost] = useState(1.0);

    const role = (session?.user as any)?.role;
    const canEditOrCancel = ['ADMIN', 'GESTOR', 'INSPETOR'].includes(role) || (role === 'OPERACIONAL' && order?.status === 'Aguardando Ajustes');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
    const [executionAction, setExecutionAction] = useState<'start' | 'finalize' | 'cancel' | null>(null);

    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchOrder();
        fetchSettings();
        fetchedRef.current = true;

        const handleAfterPrint = () => {
            setMapImageUrl(null);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, []);

    function generateStaticMapUrl(trees: any[]): string | null {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey || !trees || trees.length === 0) return null;

        // Calculate center based on all trees
        const lats = trees.map((t: any) => t.lat);
        const lngs = trees.map((t: any) => t.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

        // Build markers string - limit to first 20 trees due to URL length
        const treesToShow = trees.slice(0, 20);
        const markers = treesToShow.map((t: any, idx) => {
            // Label must be A-Z or 0-9
            const label = t.numero_etiqueta ?
                String(t.numero_etiqueta).replace(/[^A-Z0-9]/ig, '').substring(0, 1).toUpperCase() :
                String(idx + 1).substring(0, 1);

            return `markers=color:red|label:${label}|${t.lat},${t.lng}`;
        }).join('&');

        return `https://maps.googleapis.com/maps/api/staticmap?` +
            `center=${centerLat},${centerLng}&` +
            `zoom=16&` +
            `size=1000x400&` +
            `scale=2&` +
            `maptype=roadmap&` +
            `${markers}&` +
            `key=${apiKey}`;
    }

    function handlePrint() {
        if (order?.trees?.length > 0) {
            const staticMapUrl = generateStaticMapUrl(order.trees);
            if (staticMapUrl) {
                const img = new Image();
                img.onload = () => {
                    setMapImageUrl(staticMapUrl);

                    // Small delay to ensure React has rendered the image
                    setTimeout(() => {
                        window.print();
                        // For browsers that don't support afterprint or where window.print() is blocking
                        // this provides an immediate fallback reset
                        setTimeout(() => setMapImageUrl(null), 1000);
                    }, 500);
                };
                img.onerror = () => {
                    console.error("Failed to load static map image");
                    window.print();
                };
                img.src = staticMapUrl;
                return;
            }
        }

        window.print();
    }

    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.labor_cost) {
                setLaborCost(parseFloat(data.labor_cost));
            }
        } catch (error) {
            console.error(error);
        }
    }

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

    function openExecutionModal(action: 'start' | 'finalize' | 'cancel') {
        setExecutionAction(action);
        setIsExecutionModalOpen(true);
    }

    if (loading) return <div className="p-8 text-center">Carregando detalhes...</div>;
    if (!order) return <div className="p-8 text-center">Ordem de serviço não encontrada</div>;

    const isActive = order.status !== 'Concluída' && order.status !== 'Cancelada';

    return (
        <>
            <style jsx global>{`
                @media print {
                    /* Page configuration */
                    @page {
                        size: A4;
                        margin: 10mm;
                    }

                    /* Reset body and html */
                    html, body {
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-size: 11pt;
                    }

                    /* Hide UI elements */
                    nav, header, footer, button, .no-print {
                        display: none !important;
                    }

                    /* Remove transforms and effects */
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        transform: none !important;
                        animation: none !important;
                        transition: none !important;
                    }

                    /* Force visibility and overflow */
                    div, section, main {
                        overflow: visible !important;
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                    }

                    /* Container adjustments */
                    .min-h-screen {
                        min-height: 0 !important;
                        height: auto !important;
                    }

                    .max-w-7xl {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 5mm !important;
                    }

                    /* Keep some grid columns for efficiency */
                    .grid {
                        display: grid !important;
                        gap: 12px !important;
                    }
                    
                    .md\\:grid-cols-2 {
                        grid-template-columns: 1fr 1fr !important;
                    }

                    .lg\\:grid-cols-3 {
                        grid-template-columns: 1fr 1fr 1fr !important;
                    }

                    .lg\\:col-span-2 {
                        grid-column: span 2 !important;
                    }

                    /* Map container */
                    .h-96 {
                        height: 320px !important;
                        margin-bottom: 15px !important;
                        break-inside: avoid !important;
                    }

                    /* Prevent awkward breaks on small blocks */
                    .bg-white.rounded-lg.shadow {
                        box-shadow: none !important;
                        border: 1px solid #eee !important;
                        padding: 8px !important;
                        margin-bottom: 8px !important;
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    /* Spacing adjustments */
                    .space-y-6 > * + * {
                        margin-top: 5px !important;
                    }

                    .gap-8 {
                        gap: 12px !important;
                    }

                    /* Typography */
                    h1 { font-size: 16pt !important; }
                    h2 { font-size: 13pt !important; margin-bottom: 4px !important; }
                    h3 { font-size: 11pt !important; }
                    p, div { font-size: 9pt !important; }

                    /* Page breaks */
                    .page-break-before {
                        break-before: page;
                        margin-top: 15px !important;
                    }
                    
                    /* Optimization: Avoid breaking inside the form if possible */
                    .break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    /* Remove negative margins */
                    .-mt-8 {
                        margin-top: 0 !important;
                    }

                    /* Header section */
                    .py-8 {
                        padding-top: 0 !important;
                        padding-bottom: 5px !important;
                        background: none !important;
                        color: black !important;
                    }
                    
                    .py-8 .text-white {
                        color: black !important;
                    }

                    /* Add title on first page */
                    .py-8::before {
                        content: 'ORDEM DE SERVIÇO';
                        display: block;
                        font-size: 15pt;
                        font-weight: bold;
                        margin-bottom: 5px;
                        padding-bottom: 5px;
                        border-bottom: 2px solid black;
                        text-align: center;
                    }

                    /* Checklist Columns */
                    .checklist-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 8px !important;
                    }

                    /* Tree Table optimization */
                    table {
                        width: 100% !important;
                        font-size: 8pt !important;
                    }
                    
                    th, td {
                        padding: 3px 5px !important;
                        border: 0.5px solid #eee !important;
                    }

                    .h-96 {
                        height: 300px !important;
                    }
                }
            `}</style>
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
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePrint}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold backdrop-blur-sm transition flex items-center gap-2"
                                title="Imprimir ou salvar como PDF"
                            >
                                🖨️ Imprimir
                            </button>
                            <div className="bg-white text-gray-800 px-4 py-2 rounded-full font-bold shadow">
                                {order.status}
                            </div>
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
                                {mapImageUrl ? (
                                    <img
                                        src={mapImageUrl}
                                        alt="Mapa capturado"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ServiceOrderMap trees={order.trees} />
                                )}
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
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-blue-700 uppercase mb-2 text-[10px] tracking-wider">Materiais Consumidos</label>
                                                        <div className="space-y-2">
                                                            {order.materials.map((mat: any) => (
                                                                <div key={mat.id} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-blue-100 text-sm">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-gray-700 font-medium">{mat.name}</span>
                                                                        <span className="text-[10px] text-gray-400">R$ {parseFloat(mat.unit_cost).toFixed(2)} / {mat.unit}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="font-bold text-blue-700">{mat.quantity} {mat.unit}</span>
                                                                        <div className="text-[10px] font-bold text-gray-500">R$ {(mat.quantity * mat.unit_cost).toFixed(2)}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Resumo de Custos */}
                                                    <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm space-y-3">
                                                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest border-b pb-2">Resumo Financeiro da Execução</h4>

                                                        {/* Custo da Equipe */}
                                                        <div className="flex justify-between items-center text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-600">Custo da Equipe (Homem-Hora)</span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {order.team_size || 1} pessoas × {(() => {
                                                                        const start = new Date(order.start_time).getTime();
                                                                        const end = new Date(order.executed_at).getTime();
                                                                        const hours = (end - start) / (1000 * 60 * 60);
                                                                        return hours.toFixed(2);
                                                                    })()}h
                                                                </span>
                                                            </div>
                                                            <span className="font-bold text-gray-800">
                                                                {(() => {
                                                                    const start = new Date(order.start_time).getTime();
                                                                    const end = new Date(order.executed_at).getTime();
                                                                    const hours = (end - start) / (1000 * 60 * 60);
                                                                    const teamSize = order.team_size || 1;
                                                                    return (hours * teamSize * laborCost).toFixed(2);
                                                                })()}
                                                            </span>
                                                        </div>

                                                        {/* Custo de Materiais */}
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">Total em Materiais</span>
                                                            <span className="font-bold text-gray-800">
                                                                R$ {order.materials.reduce((acc: number, m: any) => acc + (m.quantity * m.unit_cost), 0).toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {/* Custo Total */}
                                                        <div className="pt-2 border-t flex justify-between items-center">
                                                            <span className="font-black text-blue-900 uppercase text-xs">Custo Total Estimado</span>
                                                            <div className="text-right">
                                                                <span className="text-xl font-black text-blue-700">
                                                                    R$ {(() => {
                                                                        const start = new Date(order.start_time).getTime();
                                                                        const end = new Date(order.executed_at).getTime();
                                                                        const hours = (end - start) / (1000 * 60 * 60);
                                                                        const teamSize = order.team_size || 1;
                                                                        const teamCost = (hours * teamSize * laborCost);
                                                                        const matCost = order.materials.reduce((acc: number, m: any) => acc + (m.quantity * m.unit_cost), 0);
                                                                        return (teamCost + matCost).toFixed(2);
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>
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
                                                <>
                                                    {order.status === 'Planejada' && (
                                                        <button
                                                            onClick={() => openExecutionModal('start')}
                                                            className="w-full border-2 border-green-600 text-green-700 py-2 rounded hover:bg-green-50 transition font-medium flex items-center justify-center gap-2"
                                                        >
                                                            <span>▶️</span> Iniciar Execução
                                                        </button>
                                                    )}

                                                    {order.status === 'Em Execução' && (
                                                        <button
                                                            onClick={() => openExecutionModal('finalize')}
                                                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition font-bold shadow-md flex items-center justify-center gap-2"
                                                        >
                                                            <span>✅</span> Finalizar Execução
                                                        </button>
                                                    )}

                                                    {/* Fallback simple status update if needed, but prefer modal for flow */}
                                                    {/* <button
                                                    onClick={() => updateStatus(order.status === 'Planejada' ? 'Em Execução' : 'Aguardando Revisão')}
                                                    className="w-full border-2 border-gray-300 text-gray-500 py-1 rounded text-xs hover:bg-gray-50 transition"
                                                >
                                                    (Debug: Avançar Status Manualmente)
                                                </button> */}
                                                </>
                                            )}

                                            {canEditOrCancel && (
                                                <button
                                                    onClick={() => order.status === 'Em Execução' ? openExecutionModal('cancel') : updateStatus('Cancelada')}
                                                    className="w-full border border-red-200 text-red-600 py-2 rounded hover:bg-red-50 transition text-sm"
                                                >
                                                    {order.status === 'Em Execução' ? 'Interromper Serviço' : 'Cancelar OS'}
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

                {/* FIELD EXECUTION FORM - Only visible when printing */}
                <div className="hidden print:block max-w-7xl mx-auto px-8 py-6 mt-4 break-inside-avoid">
                    <div className="border-4 border-gray-800 p-6 bg-white">
                        <h2 className="text-2xl font-bold text-center mb-6 pb-4 border-b-2 border-gray-800 uppercase">
                            Formulário de Execução em Campo
                        </h2>

                        {/* Warning about photos */}
                        <div className="bg-yellow-100 border-4 border-yellow-600 p-4 mb-6">
                            <p className="text-lg font-bold text-center text-yellow-900">
                                ⚠️ ATENÇÃO: REALIZAR FOTOS ANTES E DEPOIS DA EXECUÇÃO ⚠️
                            </p>
                            <p className="text-center text-sm text-yellow-800 mt-2">
                                As fotos são obrigatórias para documentação e comprovação do serviço executado
                            </p>
                        </div>

                        {/* Execution date/time fields */}
                        <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 border-2 border-gray-400">
                            <div>
                                <label className="block text-sm font-bold mb-2">Data de Início:</label>
                                <div className="border-b-2 border-gray-800 h-8"></div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Hora de Início:</label>
                                <div className="border-b-2 border-gray-800 h-8"></div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Data de Término:</label>
                                <div className="border-b-2 border-gray-800 h-8"></div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Hora de Término:</label>
                                <div className="border-b-2 border-gray-800 h-8"></div>
                            </div>
                        </div>

                        {/* Execution Checklist */}
                        <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-600">
                            Checklist de Segurança e Execução
                        </h3>
                        <p className="text-sm text-gray-700 mb-4 italic">
                            Marque os itens conforme forem verificados/realizados durante a execução:
                        </p>

                        <div className="space-y-4">
                            {Object.entries(
                                EXECUTION_CHECKLIST_ITEMS.reduce((acc, item) => {
                                    if (!acc[item.category]) acc[item.category] = [];
                                    acc[item.category].push(item);
                                    return acc;
                                }, {} as Record<string, typeof EXECUTION_CHECKLIST_ITEMS>)
                            ).map(([category, items]) => (
                                <div key={category} className="mb-2 break-inside-avoid">
                                    <h4 className="font-bold text-sm mb-2 bg-gray-200 p-1 border-l-4 border-gray-800">
                                        {category}
                                    </h4>
                                    <div className="checklist-grid ml-2">
                                        {items.map(item => (
                                            <div key={item.id} className="flex items-center gap-2 py-0.5">
                                                <span className="text-lg font-bold flex-shrink-0">☐</span>
                                                <span className="text-[9pt] leading-tight">
                                                    {item.label}
                                                    {item.isMandatory && <strong className="text-red-700"> *</strong>}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Signature section */}
                        <div className="mt-8 pt-6 border-t-2 border-gray-800">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-sm font-bold mb-4">Responsável pela Execução:</p>
                                    <div className="border-b-2 border-gray-800 h-8 mb-2"></div>
                                    <p className="text-xs text-gray-600">Nome legível</p>
                                    <div className="border-b-2 border-gray-800 h-12 mt-4"></div>
                                    <p className="text-xs text-gray-600">Assinatura</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold mb-4">Supervisor/Fiscal:</p>
                                    <div className="border-b-2 border-gray-800 h-8 mb-2"></div>
                                    <p className="text-xs text-gray-600">Nome legível</p>
                                    <div className="border-b-2 border-gray-800 h-12 mt-4"></div>
                                    <p className="text-xs text-gray-600">Assinatura</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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

                <ServiceOrderExecutionModal
                    isOpen={isExecutionModalOpen}
                    onClose={() => setIsExecutionModalOpen(false)}
                    action={executionAction}
                    serviceOrderId={order.id}
                    initialStartTime={order.start_time}
                    onSuccess={fetchOrder}
                />
            </div>
        </>
    );
}
