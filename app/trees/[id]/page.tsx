'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import GrowthChart from '../../../components/GrowthChart';
import HealthTrendChart from '../../../components/HealthTrendChart';
import InspectionComparisonGallery from '../../../components/InspectionComparisonGallery'; // Import added // Import added
import dynamic from 'next/dynamic';
import ServiceOrderCreateModal from '../../components/ServiceOrderCreateModal';

const MiniMap = dynamic(() => import('../../components/MiniMap'), {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Carregando Mapa...</div>
});

const HEALTH_SCORE_MAP: Record<string, number> = {
    'Bom': 3,
    'Regular': 2,
    'Ruim': 1,
    'Desvitalizada': 0
};

export default function TreeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [tree, setTree] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    // State for inspection details modal/expansion
    const [expandedInspectionId, setExpandedInspectionId] = useState<number | null>(null);

    // Edit form state
    const [formData, setFormData] = useState({
        numero_etiqueta: '',
        rua: '',
        numero: '',
        bairro: '',
        lat: '',
        lng: ''
    });

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
        // ... (keep existing logic)
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
        // ... (keep existing logic)
        if (!confirm('Tem certeza que deseja apagar esta árvore? Isso é irreversível.')) return;
        try {
            const res = await fetch(`/api/trees/${params.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/trees');
            }
        } catch (e) { console.error(e); }
    }

    const [isOSModalOpen, setIsOSModalOpen] = useState(false);

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
                fetchTree(); // Refresh to show in history
            } else {
                alert('Erro ao criar O.S.');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao criar O.S.');
        }
    }

    // Helper to format chart data
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

    if (loading) return <div className="p-8">Carregando...</div>;
    if (!tree) return <div className="p-8">Árvore não encontrada</div>;

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/trees" className="text-gray-500 hover:text-gray-900">&larr;</Link>
                    <div>
                        <h1 className="text-3xl font-bold">{tree.nome_popular || tree.species.nome_comum} <span className="text-lg text-gray-500 font-normal">#{tree.id_arvore}</span></h1>
                        <div className="text-sm text-gray-500 italic">{tree.species.nome_cientifico}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded">Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">Salvar</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditing(true)} className="px-4 py-2 border rounded hover:bg-gray-50">Editar</button>
                            <button onClick={() => setIsOSModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Criar O.S.</button>
                            <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50">Excluir</button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Column 1: Photo & Map */}
                <div className="space-y-6">
                    {/* Tree Cover Photo */}
                    <div className="bg-white p-4 rounded-lg shadow flex justify-center bg-gray-100">
                        {tree.cover_photo ? (
                            <div className="relative w-full h-64 flex items-center justify-center bg-gray-200">
                                <img
                                    src={tree.cover_photo.startsWith('content') ? `https://placehold.co/600x400/e2e8f0/475569?text=Foto+Sincronizada+(Pendente+Upload)` : tree.cover_photo}
                                    alt="Foto da Árvore"
                                    className="w-full h-full object-contain rounded"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Erro+na+Foto'; }}
                                />
                            </div>
                        ) : (
                            <div className="text-gray-500 italic h-64 flex items-center justify-center bg-gray-100 rounded border border-dashed border-gray-300 w-full">Sem foto de capa</div>
                        )}
                    </div>

                    {/* MiniMap Section */}
                    {tree.lat && tree.lng && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Localização</h2>
                            <MiniMap lat={tree.lat} lng={tree.lng} currentTreeId={tree.id_arvore} />
                            <p className="text-xs text-gray-500 mt-2 text-center">Árvore atual em <span className="text-red-600 font-bold">Vermelho</span>, vizinhas em <span className="text-blue-600 font-bold">Azul</span>.</p>
                        </div>
                    )}
                </div>

                {/* Column 2: Data & Charts */}
                <div className="space-y-6">




                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Dados Cadastrais</h2>
                        <div className="space-y-4">
                            {editing ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase">Etiqueta</label>
                                            <input className="w-full border p-1 rounded" value={formData.numero_etiqueta} onChange={e => setFormData({ ...formData, numero_etiqueta: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase">Bairro</label>
                                            <input className="w-full border p-1 rounded" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase">Rua</label>
                                        <input className="w-full border p-1 rounded" value={formData.rua} onChange={e => setFormData({ ...formData, rua: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase">Número</label>
                                        <input className="w-full border p-1 rounded" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded">
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase">Lat</label>
                                            <input className="w-full border p-1 rounded" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 uppercase">Lng</label>
                                            <input className="w-full border p-1 rounded" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs text-gray-500 uppercase">Etiqueta</span>
                                            <span className="font-medium">{tree.numero_etiqueta || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-500 uppercase">Espécie</span>
                                            <span className="font-medium italic">{tree.species.nome_cientifico}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Endereço</span>
                                        <span className="font-medium">{tree.rua}, {tree.numero} - {tree.bairro}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs text-gray-500 uppercase">Latitude</span>
                                            <span className="font-mono">{tree.lat}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-500 uppercase">Longitude</span>
                                            <span className="font-mono">{tree.lng}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Crescimento (DAP & Altura)</h2>
                        <GrowthChart data={chartData} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Evolução da Saúde</h2>
                        <HealthTrendChart data={healthChartData} />
                    </div>

                    {/* Comparison Gallery (New) */}
                    <InspectionComparisonGallery inspections={tree.inspections} />
                </div>

                {/* Column 3: History & Service Orders */}
                <div className="space-y-6">
                    {/* Management Recommendation Card (Moved) */}
                    {tree.inspections?.[0] && (
                        <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${tree.inspections[0].managementActions?.[0]?.necessita_manejo ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex justify-between items-center">
                                Recomendação Técnica
                                <span className="text-xs font-normal text-gray-400">
                                    {new Date(tree.inspections[0].data_inspecao).toLocaleDateString()}
                                </span>
                            </h2>

                            {(() => {
                                const action = tree.inspections[0].managementActions?.[0];
                                if (!action || !action.necessita_manejo) {
                                    return (
                                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-medium">Nenhuma intervenção necessária</span>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${action.manejo_tipo === 'Supressão' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {action.manejo_tipo}
                                            </span>
                                            {action.supressao_tipo && (
                                                <span className="text-gray-700 font-medium border border-gray-200 px-2 py-1 rounded text-sm">
                                                    {action.supressao_tipo}
                                                </span>
                                            )}
                                        </div>

                                        {action.poda_tipos && action.poda_tipos.length > 0 && (
                                            <div className="bg-gray-50 p-3 rounded text-sm">
                                                <span className="font-bold text-gray-700 block mb-1">Tipos de Poda:</span>
                                                <ul className="list-disc list-inside text-gray-600">
                                                    {action.poda_tipos.map((t: string, i: number) => (
                                                        <li key={i}>{t}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {action.justification && (
                                            <div className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3 py-1">
                                                "{action.justification}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Phytosanitary & Risk Analysis (New) */}
                    {tree.inspections?.[0]?.phytosanitary?.[0] && (
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-l-purple-500">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex justify-between items-center h-full">
                                Análise de Risco & Fitossanidade
                            </h2>

                            <div className="space-y-4">
                                {/* Risk Rating (TRAQ) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <span className="block text-xs text-gray-500 uppercase font-bold">Probabilidade de Falha</span>
                                        <span className={`font-medium ${tree.inspections[0].phytosanitary[0].risk_probability === 'Extrema' ? 'text-red-700 font-bold' :
                                            tree.inspections[0].phytosanitary[0].risk_probability === 'Alta' ? 'text-orange-600' :
                                                'text-gray-800'
                                            }`}>
                                            {tree.inspections[0].phytosanitary[0].risk_probability || 'Não avaliada'}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <span className="block text-xs text-gray-500 uppercase font-bold">Classificação de Risco</span>
                                        <span className="text-lg font-bold text-gray-800">
                                            {tree.inspections[0].phytosanitary[0].risk_rating ?
                                                `${tree.inspections[0].phytosanitary[0].risk_rating}/12` : '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Pest Presence */}
                                <div>
                                    <span className="block text-sm font-bold text-gray-700 mb-1">Pragas Identificadas:</span>
                                    {tree.inspections[0].phytosanitary[0].pests && tree.inspections[0].phytosanitary[0].pests.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {tree.inspections[0].phytosanitary[0].pests.map((pest: any) => (
                                                <span key={pest.id} className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-red-200">
                                                    {pest.common_name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-sm italic">Nenhuma praga registrada na última inspeção.</span>
                                    )}
                                </div>

                                {/* Severity & Notes */}
                                {tree.inspections[0].phytosanitary[0].severity_level && (
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-700">Severidade Geral: </span>
                                        <span className="text-gray-800">
                                            {['Insignificante', 'Leve', 'Moderada', 'Alta', 'Extrema'][tree.inspections[0].phytosanitary[0].severity_level - 1]}
                                            ({tree.inspections[0].phytosanitary[0].severity_level}/5)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Unified History Section */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Histórico Completo</h2>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {/* Combine and Sort History Items */}
                            {[
                                ...(tree.inspections || []).map((i: any) => ({ ...i, type: 'inspection', date: i.data_inspecao })),
                                ...(tree.serviceOrders || []).map((o: any) => ({ ...o, type: 'service_order', date: o.created_at }))
                            ]
                                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((item: any) => (
                                    <div key={`${item.type}-${item.id_inspecao || item.id}`} className="flex gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'inspection' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {item.type === 'inspection' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-gray-900">
                                                    {item.type === 'inspection' ? 'Inspeção Realizada' : `Ordem de Serviço #${item.id}`}
                                                </h4>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {item.type === 'inspection' ? (
                                                <div className="mt-1 text-sm text-gray-600">
                                                    <p>Saúde: <span className="font-medium">{item.phytosanitary?.[0]?.estado_saude || 'Não avaliada'}</span></p>

                                                    {/* Severity Level (New) */}
                                                    {item.phytosanitary?.[0]?.severity_level && (
                                                        <p className="text-xs text-gray-600">
                                                            Severidade: <span className="font-medium">{['Leve', 'Leve', 'Média', 'Média', 'Alta'][item.phytosanitary[0].severity_level - 1] || item.phytosanitary[0].severity_level}</span>
                                                        </p>
                                                    )}

                                                    {/* Pests (New Catalog) */}
                                                    {item.phytosanitary?.[0]?.pests?.length > 0 && (
                                                        <p className="text-xs text-red-500 mt-1">
                                                            Pragas: {item.phytosanitary[0].pests.map((p: any) => p.common_name).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-1 text-sm text-gray-600">
                                                    <p>Status: <span className={`font-medium ${item.status === 'Concluída' ? 'text-green-600' : 'text-yellow-600'
                                                        }`}>{item.status}</span></p>
                                                    {item.description ? (
                                                        <p className="text-xs italic mt-1">"{item.description}"</p>
                                                    ) : item.observations ? (
                                                        <p className="text-xs italic mt-1">"{item.observations}"</p>
                                                    ) : null}
                                                    <div className="mt-2">
                                                        <Link href={`/service-orders/${item.id}`} className="text-xs text-green-600 hover:text-green-800">Ver Detalhes</Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {(!tree.inspections?.length && !tree.serviceOrders?.length) && (
                                <p className="text-center text-gray-500 py-4">Nenhum evento registrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ServiceOrderCreateModal
                isOpen={isOSModalOpen}
                onClose={() => setIsOSModalOpen(false)}
                onSubmit={handleCreateOS}
                treeCount={1}
            />
            <ServiceOrderCreateModal
                isOpen={isOSModalOpen}
                onClose={() => setIsOSModalOpen(false)}
                onSubmit={handleCreateOS}
                treeCount={1}
            />
        </div >
    );
}
