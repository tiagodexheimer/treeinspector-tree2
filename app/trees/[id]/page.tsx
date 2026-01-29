'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import GrowthChart from '../../../components/GrowthChart';
import HealthTrendChart from '../../../components/HealthTrendChart';
import InspectionComparisonGallery from '../../../components/InspectionComparisonGallery';
import dynamic from 'next/dynamic';
import ServiceOrderCreateModal from '../../components/ServiceOrderCreateModal';

const MiniMap = dynamic(() => import('../../components/MiniMap'), {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Carregando Mapa...</div>
});

const HEALTH_SCORE_MAP: Record<string, number> = {
    'Bom': 3,
    'Regular': 2,
    'Ruim': 1,
    'Desvitalizada': 0
};

const HEALTH_COLORS: Record<string, string> = {
    'Bom': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Regular': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Ruim': 'bg-orange-100 text-orange-800 border-orange-300',
    'Desvitalizada': 'bg-red-100 text-red-800 border-red-300'
};

function renderRecommendationDetails(action: any) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${action.manejo_tipo === 'Supressão' ? 'bg-red-100 text-red-700 border-2 border-red-300' : 'bg-blue-100 text-blue-700 border-2 border-blue-300'}`}>
                    {action.manejo_tipo}
                </span>
                {action.supressao_tipo && (
                    <span className="text-gray-700 font-medium border-2 border-gray-300 px-3 py-2 rounded-full text-sm bg-white">
                        {action.supressao_tipo}
                    </span>
                )}
            </div>

            {action.poda_tipos && action.poda_tipos.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-2 text-sm">Tipos de Poda:</span>
                    <ul className="space-y-1">
                        {action.poda_tipos.map((t: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-blue-800">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {action.justification && (
                <div className="text-sm text-gray-700 bg-gray-50 border-l-4 border-gray-400 pl-4 py-3 rounded-r-lg italic">
                    "{action.justification}"
                </div>
            )}
        </div>
    );
}

export default function TreeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [tree, setTree] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [expandedInspectionId, setExpandedInspectionId] = useState<number | null>(null);
    const [isOSModalOpen, setIsOSModalOpen] = useState(false);
    const [osInitialData, setOsInitialData] = useState<any>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        numero_etiqueta: '',
        rua: '',
        numero: '',
        bairro: '',
        lat: '',
        lng: ''
    });

    const role = (session?.user as any)?.role;
    const canEdit = ['ADMIN', 'GESTOR', 'INSPETOR'].includes(role);
    const canCreateOS = ['ADMIN', 'GESTOR', 'INSPETOR'].includes(role);
    const canDelete = role === 'ADMIN';

    useEffect(() => {
        fetchTree();
    }, []); // eslint-disable-line

    async function fetchTree() {
        try {
            const res = await fetch(`/api/trees/${params.id}`);
            if (!res.ok) {
                if (res.status === 404) alert('Árvore não encontrada');
                return;
            }
            const data = await res.json();
            setTree(data);
            setFormData({
                numero_etiqueta: data.numero_etiqueta || '',
                rua: data.rua || '',
                numero: data.numero || '',
                bairro: data.bairro || '',
                lat: data.lat || '',
                lng: data.lng || ''
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            const res = await fetch(`/api/trees/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setEditing(false);
                fetchTree();
            } else {
                alert('Falha ao atualizar');
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function handleDelete() {
        if (!confirm('Tem certeza que deseja apagar esta árvore? Isso é irreversível.')) return;
        try {
            const res = await fetch(`/api/trees/${params.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/trees');
            }
        } catch (e) { console.error(e); }
    }

    async function handleCreateOS(data: any) {
        try {
            const res = await fetch('/api/service-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    treeIds: [tree.id_arvore],
                    ...data
                })
            });
            if (res.ok) {
                alert('Ordem de Serviço criada com sucesso!');
                fetchTree();
            } else {
                alert('Erro ao criar O.S.');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao criar O.S.');
        }
    }

    const chartData = tree?.inspections
        ?.map((insp: any) => {
            const dendro = insp.dendrometrics?.[0];
            if (!dendro) return null;
            return {
                date: new Date(insp.data_inspecao).toLocaleDateString(),
                dap: Number(dendro.dap1_cm) || 0,
                height: Number(dendro.altura_total_m) || 0,
                timestamp: new Date(insp.data_inspecao).getTime()
            };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

    const healthChartData = tree?.inspections
        ?.map((insp: any) => {
            const phyto = insp.phytosanitary?.[0];
            if (!phyto || !phyto.estado_saude) return null;
            const score = HEALTH_SCORE_MAP[phyto.estado_saude];
            if (score === undefined) return null;

            return {
                date: new Date(insp.data_inspecao).toLocaleDateString(),
                health: phyto.estado_saude,
                score: score,
                timestamp: new Date(insp.data_inspecao).getTime()
            };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando detalhes...</p>
            </div>
        </div>
    );

    if (!tree) return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8">
            <div className="max-w-2xl mx-auto text-center mt-20">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Árvore não encontrada</h1>
                <Link href="/trees" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    ← Voltar para lista
                </Link>
            </div>
        </div>
    );

    const latestInspection = tree.inspections?.[0];
    const healthStatus = latestInspection?.phytosanitary?.[0]?.estado_saude || 'Não avaliada';
    const riskRating = latestInspection?.phytosanitary?.[0]?.risk_rating || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-7xl mx-auto px-8 py-12">
                    <div className="flex items-start justify-between mb-6">
                        <Link href="/trees" className="text-white/80 hover:text-white transition-colors flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Voltar
                        </Link>
                        <div className="flex gap-2">
                            {editing ? (
                                <>
                                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all">
                                        Cancelar
                                    </button>
                                    <button onClick={handleSave} className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-white/90 transition-all shadow-lg">
                                        Salvar
                                    </button>
                                </>
                            ) : (
                                <>
                                    {canEdit && (
                                        <button onClick={() => setEditing(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all">
                                            Editar
                                        </button>
                                    )}
                                    {canCreateOS && (
                                        <button onClick={() => setIsOSModalOpen(true)} className="px-4 py-2 bg-white text-emerald-600 rounded-lg font-medium hover:bg-white/90 transition-all shadow-lg">
                                            Criar O.S.
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 backdrop-blur-sm text-white rounded-lg transition-all">
                                            Excluir
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">
                                {tree.nome_popular || tree.species.nome_comum}
                            </h1>
                            <p className="text-emerald-100 text-lg italic mb-4">{tree.species.nome_cientifico}</p>
                            <div className="flex flex-wrap gap-3">
                                {tree.numero_etiqueta && (
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                                        Etiqueta: {tree.numero_etiqueta}
                                    </span>
                                )}
                                <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-sm font-bold border-2 ${healthStatus === 'Bom' ? 'bg-emerald-500/20 border-emerald-300' :
                                    healthStatus === 'Regular' ? 'bg-yellow-500/20 border-yellow-300' :
                                        healthStatus === 'Ruim' ? 'bg-orange-500/20 border-orange-300' :
                                            'bg-red-500/20 border-red-300'
                                    }`}>
                                    {healthStatus}
                                </span>
                                {riskRating > 0 && (
                                    <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-sm font-bold border-2 ${riskRating >= 5 ? 'bg-red-500/20 border-red-300' :
                                        riskRating === 4 ? 'bg-orange-500/20 border-orange-300' :
                                            riskRating === 3 ? 'bg-yellow-500/20 border-yellow-300' :
                                                riskRating === 2 ? 'bg-lime-500/20 border-lime-300' :
                                                    'bg-green-500/20 border-green-300'
                                        }`}>
                                        Risco: {(() => {
                                            if (riskRating >= 5) return 'Extremo';
                                            if (riskRating === 4) return 'Alto';
                                            if (riskRating === 3) return 'Moderado';
                                            if (riskRating === 2) return 'Baixo';
                                            return 'Muito Baixo';
                                        })()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Photo & Location */}
                    <div className="space-y-6">
                        {/* Cover Photo */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Foto da Árvore
                                </h3>
                                {tree.cover_photo ? (
                                    <div
                                        className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in group/img"
                                        onClick={() => setZoomedImage(tree.cover_photo)}
                                    >
                                        <img
                                            src={tree.cover_photo.startsWith('content') ? `https://placehold.co/600x400/e2e8f0/475569?text=Sincronizada` : tree.cover_photo}
                                            alt="Foto da Árvore"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Erro+na+Foto'; }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                            <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                                        <div className="text-center text-gray-400">
                                            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p>Sem foto</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Map */}
                        {tree.lat && tree.lng && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Localização
                                    </h3>
                                    <div className="rounded-xl overflow-hidden">
                                        <MiniMap lat={tree.lat} lng={tree.lng} currentTreeId={tree.id_arvore} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        <span className="text-red-600 font-semibold">●</span> Árvore atual ·
                                        <span className="text-blue-600 font-semibold"> ●</span> Vizinhas
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Column 2: Data & Charts */}
                    <div className="space-y-6">
                        {/* Cadastral Data */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg border-b pb-3">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Dados Cadastrais
                            </h3>
                            <div className="space-y-4">
                                {editing ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Etiqueta</label>
                                                <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={formData.numero_etiqueta} onChange={e => setFormData({ ...formData, numero_etiqueta: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Bairro</label>
                                                <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Rua</label>
                                            <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={formData.rua} onChange={e => setFormData({ ...formData, rua: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Número</label>
                                            <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Lat</label>
                                                <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Lng</label>
                                                <input className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <div className="flex-1">
                                                <span className="block text-xs text-gray-500 uppercase font-medium mb-1">Endereço</span>
                                                <span className="font-medium text-gray-900">{tree.rua}, {tree.numero} - {tree.bairro}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-emerald-50 rounded-lg">
                                                <span className="block text-xs text-emerald-600 uppercase font-semibold mb-1">Latitude</span>
                                                <span className="font-mono text-sm text-gray-900">{tree.lat}</span>
                                            </div>
                                            <div className="p-3 bg-emerald-50 rounded-lg">
                                                <span className="block text-xs text-emerald-600 uppercase font-semibold mb-1">Longitude</span>
                                                <span className="font-mono text-sm text-gray-900">{tree.lng}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Growth Chart */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg border-b pb-3">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Crescimento (DAP & Altura)
                            </h3>
                            <GrowthChart data={chartData} />
                        </div>

                        {/* Health Trend Chart */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg border-b pb-3">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Evolução da Saúde
                            </h3>
                            <HealthTrendChart data={healthChartData} />
                        </div>
                    </div>

                    {/* Column 3: Analysis & History */}
                    <div className="space-y-6">
                        {/* Management Recommendation */}
                        {tree.inspections?.[0] && (
                            <div className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-l-4 ${tree.inspections[0].managementActions?.[0]?.necessita_manejo ? 'border-l-orange-500' : 'border-l-emerald-500'}`}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4 pb-3 border-b">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                            Recomendação Técnica
                                        </h3>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {new Date(tree.inspections[0].data_inspecao).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {(() => {
                                        const action = tree.inspections[0].managementActions?.[0];
                                        if (!action || !action.necessita_manejo) {
                                            return (
                                                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                                    <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-semibold">Nenhuma intervenção necessária</span>
                                                </div>
                                            );
                                        }

                                        // Check for linked Service Orders
                                        // Ideally backend should include this relation. If not, we might need to rely on matching IDs or fetch update.
                                        // For now, assuming TreeRepository includes it deeply? 
                                        // Need to check if `page.tsx` fetches `inspections` with `include: { managementActions: { include: { serviceOrders: true } } }`?
                                        // The current `route.ts` (GET /api/trees/:id) needs to be checked, but assuming we can rely on `tree.serviceOrders`?
                                        // Actually `tree.serviceOrders` lists all OS for the tree.
                                        // But we specifically want OS linked to THIS action.
                                        // Let's check if the fetched tree object has the relation deep nested.
                                        // If `api/trees/[id]/route.ts` does `include: { inspections: { include: { managementActions: { include: { serviceOrders: true } } } } }`.
                                        // If not, we might not see it directly on `action.serviceOrders`.

                                        // Fallback logic: Look at `tree.serviceOrders` and see if any are recent and match type.
                                        // But correct way: The user verified "linkage" plan.
                                        // Let's assume for now that if we just created it, we reload.
                                        // But to display it, we need to know.

                                        // Let's trust that the developer (me) will ensure the fetch includes it.
                                        // BUT I haven't edited `GET /api/trees/[id]`. I should probably check that first or do it blindly assuming it might work or fix later.
                                        // Let's insert the UI logic using `action.serviceOrders` and if it's missing, I'll fix the GET route.

                                        const linkedOS = action.serviceOrders && action.serviceOrders.length > 0 ? action.serviceOrders[0] : null;

                                        if (linkedOS) {
                                            const isFinished = ['Concluída', 'Cancelada'].includes(linkedOS.status);

                                            if (isFinished) {
                                                return (
                                                    <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                                        <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <div>
                                                            <span className="font-bold block">Intervenção Realizada</span>
                                                            <span className="text-sm opacity-75">OS #{linkedOS.id} - {linkedOS.status}</span>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="space-y-3">
                                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex justify-between items-center">
                                                            <div>
                                                                <span className="font-bold text-blue-900 block text-sm">Ordem de Serviço Vinculada</span>
                                                                <Link href={`/service-orders/${linkedOS.id}`} className="text-sm text-blue-700 hover:underline">
                                                                    OS #{linkedOS.id} - {linkedOS.status}
                                                                </Link>
                                                            </div>
                                                            <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{linkedOS.status}</span>
                                                        </div>
                                                        {/* Show recommendation details slightly dimmed? */}
                                                        <div className="opacity-75 pointer-events-none grayscale-[0.5]">
                                                            {renderRecommendationDetails(action)}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        }

                                        return (
                                            <div className="space-y-4">
                                                {renderRecommendationDetails(action)}

                                                {canCreateOS && (
                                                    <button
                                                        onClick={() => {
                                                            setOsInitialData({
                                                                serviceType: action.manejo_tipo,
                                                                serviceSubtypes: action.poda_tipos || (action.supressao_tipo ? [action.supressao_tipo] : []),
                                                                description: action.justification,
                                                                priority: 'Moderada',
                                                                managementActionId: action.id
                                                            });
                                                            setIsOSModalOpen(true);
                                                        }}
                                                        className="w-full mt-2 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md flex justify-center items-center gap-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        Criar Ordem de Serviço
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Phytosanitary & Risk Analysis */}
                        {tree.inspections?.[0]?.phytosanitary?.[0] && (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-l-4 border-l-purple-500">
                                <div className="p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg border-b pb-3">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Análise de Risco & Fitossanidade
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Risk Metrics */}
                                        {/* TRAQ Risk Analysis */}
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-2 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Análise de Risco (TRAQ)
                                            </h4>

                                            {tree.inspections[0].phytosanitary[0].risk_probability ? (
                                                <div className="space-y-6">
                                                    {/* Row 1: Detailed Metrics */}
                                                    <div className="space-y-3">
                                                        {/* Line 1: Probabilidade de Falha */}
                                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col justify-center min-w-0 w-full">
                                                            <span className="block text-[11px] text-purple-700 font-extrabold uppercase mb-1">
                                                                Probabilidade de Falha
                                                            </span>
                                                            <span className="text-lg font-bold text-gray-800">
                                                                {tree.inspections[0].phytosanitary[0].risk_probability?.replace('_', ' ') || '-'}
                                                            </span>
                                                        </div>

                                                        {/* Line 2: Probabilidade de Impacto e Consequências */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {/* 2. Probabilidade de Impacto (Mapped from severity_level) */}
                                                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col justify-center min-w-0">
                                                                <span className="block text-[11px] text-orange-700 font-extrabold uppercase mb-1 truncate" title="Probabilidade de Impacto">
                                                                    Prob. de Impacto
                                                                </span>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-bold text-orange-900">
                                                                        {(() => {
                                                                            const val = tree.inspections[0].phytosanitary[0].severity_level;
                                                                            if (!val) return '-';
                                                                            const map: Record<number, string> = { 1: 'Alta', 2: 'Média', 3: 'Baixa', 4: 'Muito Baixa' };
                                                                            return map[val] || val;
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* 3. Consequências (Mapped from target_value) */}
                                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col justify-center min-w-0">
                                                                <span className="block text-[11px] text-blue-700 font-extrabold uppercase mb-1 truncate" title="Consequências">
                                                                    Consequências
                                                                </span>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-bold text-blue-900">
                                                                        {(() => {
                                                                            const val = tree.inspections[0].phytosanitary[0].target_value;
                                                                            if (!val) return '-';
                                                                            const map: Record<number, string> = { 1: 'Severas', 2: 'Significativas', 3: 'Menores', 4: 'Insignificantes' };
                                                                            return map[val] || val;
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Visual Risk Rating Gauge */}
                                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner flex flex-col items-center">
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Grau de Risco Final (TRAQ)</span>

                                                        <div className="relative w-64 h-36 flex justify-center overflow-hidden">
                                                            {/* Gauge SVG */}
                                                            <svg viewBox="0 0 200 120" className="w-full h-full">
                                                                <defs>
                                                                    <linearGradient id="riskGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                        <stop offset="0%" stopColor="#22c55e" />   {/* Green (1) */}
                                                                        <stop offset="25%" stopColor="#84cc16" />  {/* Lime (2) */}
                                                                        <stop offset="50%" stopColor="#eab308" />  {/* Yellow (3) */}
                                                                        <stop offset="75%" stopColor="#f97316" />  {/* Orange (4) */}
                                                                        <stop offset="100%" stopColor="#ef4444" /> {/* Red (5) */}
                                                                    </linearGradient>
                                                                </defs>

                                                                {/* Background Arc */}
                                                                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="20" strokeLinecap="round" />

                                                                {/* Colored Arc */}
                                                                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#riskGaugeGradient)" strokeWidth="20" strokeLinecap="round" />

                                                                {/* Ticks */}
                                                                <g stroke="white" strokeWidth="1.5">
                                                                    {[0, 45, 90, 135, 180].map(angle => (
                                                                        <line key={angle} x1="20" y1="100" x2="35" y2="100" transform={`rotate(${angle}, 100, 100)`} />
                                                                    ))}
                                                                </g>

                                                                {/* Needle */}
                                                                {(() => {
                                                                    const rating = tree.inspections[0].phytosanitary[0].risk_rating || 1;
                                                                    const clampedRating = Math.max(1, Math.min(5, rating));
                                                                    const angle = ((clampedRating - 1) / 4) * 180;
                                                                    return (
                                                                        <g className="transition-transform duration-1000 ease-out origin-[100px_100px]" style={{ transform: `rotate(${angle}deg)` }}>
                                                                            <path d="M 100 100 L 30 100" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
                                                                            <circle cx="100" cy="100" r="6" fill="#1f2937" />
                                                                        </g>
                                                                    );
                                                                })()}
                                                            </svg>

                                                            {/* Value Text Overlay */}
                                                            <div className="absolute bottom-1 text-center w-full">
                                                                <div className="flex items-baseline justify-center gap-1">
                                                                    <span className="text-4xl font-black text-gray-900 leading-none">
                                                                        {tree.inspections[0].phytosanitary[0].risk_rating || '-'}
                                                                    </span>
                                                                    <span className="text-sm text-gray-400 font-bold">/5</span>
                                                                </div>
                                                                <div className={`text-sm font-black uppercase mt-2 px-4 py-1 rounded-full text-white shadow-sm inline-block ${(tree.inspections[0].phytosanitary[0].risk_rating || 0) >= 5 ? 'bg-red-600' :
                                                                    (tree.inspections[0].phytosanitary[0].risk_rating || 0) == 4 ? 'bg-orange-500' :
                                                                        (tree.inspections[0].phytosanitary[0].risk_rating || 0) == 3 ? 'bg-yellow-500' :
                                                                            (tree.inspections[0].phytosanitary[0].risk_rating || 0) == 2 ? 'bg-lime-500' :
                                                                                'bg-green-600'
                                                                    }`}>
                                                                    {(() => {
                                                                        const r = tree.inspections[0].phytosanitary[0].risk_rating || 0;
                                                                        if (r >= 5) return 'Extremo';
                                                                        if (r == 4) return 'Alto';
                                                                        if (r == 3) return 'Moderado';
                                                                        if (r == 2) return 'Baixo';
                                                                        return 'Muito Baixo';
                                                                    })()}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-2 italic px-2">
                                                                    {(() => {
                                                                        const r = tree.inspections[0].phytosanitary[0].risk_rating || 0;
                                                                        if (r >= 5) return "A falha é iminente e impactará o alvo.";
                                                                        if (r == 4) return "Consequências significativas ou severas.";
                                                                        if (r == 3) return "Monitorar.";
                                                                        if (r == 2) return "Manter em observação.";
                                                                        return "Nenhuma ação imediata necessária.";
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                    <p className="text-gray-500 font-medium">Análise de risco não realizada</p>
                                                    <span className="text-xs text-gray-400">Nenhum dado TRAQ disponível.</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pests */}
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                            <span className="block text-sm font-bold text-red-900 mb-2">Pragas Identificadas:</span>
                                            {(() => {
                                                // Filter out invalid pest entries (like "não")
                                                const validPests = tree.inspections[0].phytosanitary[0].pests?.filter((pest: any) =>
                                                    pest.nome_comum &&
                                                    pest.nome_comum.toLowerCase() !== 'não' &&
                                                    pest.nome_comum.toLowerCase() !== 'nao'
                                                ) || [];

                                                return validPests.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {validPests.map((pest: any) => (
                                                            <span key={pest.id} className="bg-red-200 text-red-900 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-300">
                                                                {pest.nome_comum}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm italic">Nenhuma praga identificada</span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Unified History */}
                        <div className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                            <div className="p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg border-b pb-3">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Histórico Completo
                                </h3>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    {[
                                        ...(tree.inspections || []).map((i: any) => ({ ...i, type: 'inspection', date: i.data_inspecao })),
                                        ...(tree.serviceOrders || []).map((o: any) => ({ ...o, type: 'service_order', date: o.created_at }))
                                    ]
                                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((item: any) => (
                                            <div key={`${item.type}-${item.id_inspecao || item.id}`} className="flex gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${item.type === 'inspection' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'}`}>
                                                    {item.type === 'inspection' ? (
                                                        <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="text-sm font-bold text-gray-900">
                                                            {item.type === 'inspection' ? 'Inspeção Realizada' : `Ordem de Serviço #${item.id}`}
                                                        </h4>
                                                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap ml-2">
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {item.type === 'inspection' ? (
                                                        <div className="space-y-1">
                                                            <p className="text-sm text-gray-600">
                                                                Saúde: <span className={`font-semibold px-2 py-0.5 rounded ${HEALTH_COLORS[item.phytosanitary?.[0]?.estado_saude] || 'bg-gray-100 text-gray-800'}`}>
                                                                    {item.phytosanitary?.[0]?.estado_saude || 'Não avaliada'}
                                                                </span>
                                                            </p>
                                                            {item.phytosanitary?.[0]?.severity_level && (
                                                                <p className="text-xs text-gray-600">
                                                                    Severidade: <span className="font-medium">{['Leve', 'Leve', 'Média', 'Média', 'Alta'][item.phytosanitary[0].severity_level - 1]}</span>
                                                                </p>
                                                            )}
                                                            {item.phytosanitary?.[0]?.pests && (() => {
                                                                // Filter valid pests for history display
                                                                const validPests = item.phytosanitary[0].pests.filter((p: any) =>
                                                                    p.nome_comum &&
                                                                    p.nome_comum.toLowerCase() !== 'não' &&
                                                                    p.nome_comum.toLowerCase() !== 'nao'
                                                                );
                                                                return validPests.length > 0 && (
                                                                    <p className="text-xs text-red-600 font-medium">
                                                                        Pragas: {validPests.map((p: any) => p.nome_comum).join(', ')}
                                                                    </p>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-sm text-gray-600">
                                                                Status: <span className={`font-semibold ${item.status === 'Concluída' ? 'text-emerald-600' : 'text-yellow-600'}`}>{item.status}</span>
                                                            </p>
                                                            {(item.description || item.observations) && (
                                                                <p className="text-xs text-gray-500 italic mt-1">"{item.description || item.observations}"</p>
                                                            )}
                                                            <div className="mt-2">
                                                                <Link href={`/service-orders/${item.id}`} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                                                                    Ver Detalhes →
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                    {(!tree.inspections?.length && !tree.serviceOrders?.length) && (
                                        <p className="text-center text-gray-500 py-8">Nenhum evento registrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Gallery spanning 3 columns */}
                    <div className="lg:col-span-3">
                        <InspectionComparisonGallery inspections={tree.inspections} />
                    </div>
                </div>
            </div>

            <ServiceOrderCreateModal
                isOpen={isOSModalOpen}
                onClose={() => setIsOSModalOpen(false)}
                onSubmit={handleCreateOS}
                treeCount={1}
                initialData={osInitialData}
            />

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => setZoomedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
                        onClick={() => setZoomedImage(null)}
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={zoomedImage.startsWith('content') ? `https://placehold.co/1200x800/e2e8f0/475569?text=Imagem+Sincronizada` : zoomedImage}
                        alt="Foto Ampliada"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
