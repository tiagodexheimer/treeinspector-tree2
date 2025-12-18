'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import GrowthChart from '../../../components/GrowthChart';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('../../components/MiniMap'), {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Carregando Mapa...</div>
});

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
                </div>

                {/* Column 3: History & Service Orders */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Histórico de Inspeções</h2>
                        {tree.inspections.length === 0 ? <div className="text-gray-500">Nenhuma inspeção registrada.</div> : (
                            <ul className="space-y-4">
                                {tree.inspections.map((insp: any) => (
                                    <li key={insp.id_inspecao} className="border-b last:border-0 pb-4">
                                        <div
                                            className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                                            onClick={() => setExpandedInspectionId(expandedInspectionId === insp.id_inspecao ? null : insp.id_inspecao)}
                                        >
                                            <div>
                                                <span className="font-bold text-green-800">{new Date(insp.data_inspecao).toLocaleDateString()}</span>
                                                <div className="text-xs text-gray-500">ID: {insp.id_inspecao}</div>
                                            </div>
                                            <span className="text-blue-600 text-sm">{expandedInspectionId === insp.id_inspecao ? 'Ocultar' : 'Detalhes'}</span>
                                        </div>

                                        {expandedInspectionId === insp.id_inspecao && (
                                            <div className="mt-2 p-3 bg-gray-50 rounded text-sm space-y-3 animation-fade-in">
                                                {/* Dendro */}
                                                {insp.dendrometrics?.[0] && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700">Dendrometria</h4>
                                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                                            <div className="col-span-2 grid grid-cols-4 gap-2 bg-gray-100 p-2 rounded">
                                                                <div><span className="text-gray-500 block text-xs">DAP 1</span> {insp.dendrometrics[0].dap1_cm || '-'} cm</div>
                                                                <div><span className="text-gray-500 block text-xs">DAP 2</span> {insp.dendrometrics[0].dap2_cm || '-'} cm</div>
                                                                <div><span className="text-gray-500 block text-xs">DAP 3</span> {insp.dendrometrics[0].dap3_cm || '-'} cm</div>
                                                                <div><span className="text-gray-500 block text-xs">DAP 4</span> {insp.dendrometrics[0].dap4_cm || '-'} cm</div>
                                                            </div>
                                                            <div><span className="text-gray-500">Altura:</span> {insp.dendrometrics[0].altura_total_m} m</div>
                                                            <div><span className="text-gray-500">Copa:</span> {insp.dendrometrics[0].altura_copa_m} m</div>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Phyto */}
                                                {insp.phytosanitary?.[0] && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mt-2">Fitossanidade</h4>
                                                        <div className="mt-1 space-y-1">
                                                            <div><span className="text-gray-500">Saúde:</span> <span className={`font-medium ${insp.phytosanitary[0].estado_saude === 'Bom' ? 'text-green-600' : 'text-red-600'}`}>{insp.phytosanitary[0].estado_saude || '-'}</span></div>
                                                            {insp.phytosanitary[0].pragas && insp.phytosanitary[0].pragas.length > 0 && (
                                                                <div><span className="text-gray-500">Pragas:</span> {insp.phytosanitary[0].pragas.join(', ')}</div>
                                                            )}
                                                            {insp.phytosanitary[0].danos_tipo && (
                                                                <div><span className="text-gray-500">Danos:</span> {insp.phytosanitary[0].danos_tipo} <span className="text-xs bg-red-100 text-red-800 px-1 rounded">{insp.phytosanitary[0].danos_severidade}</span></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Management */}
                                                {insp.managementActions?.[0] && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mt-2">Manejo</h4>
                                                        {insp.managementActions[0].necessita_manejo ? (
                                                            <div className="mt-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-bold uppercase">{insp.managementActions[0].manejo_tipo}</span>
                                                                    {insp.managementActions[0].supressao_tipo && <span className="text-xs text-gray-600">({insp.managementActions[0].supressao_tipo})</span>}
                                                                </div>
                                                                {insp.managementActions[0].poda_tipos && insp.managementActions[0].poda_tipos.length > 0 && (
                                                                    <div className="text-xs text-gray-600 mt-1">Tipos: {insp.managementActions[0].poda_tipos.join(', ')}</div>
                                                                )}
                                                                {insp.managementActions[0].justification && (
                                                                    <p className="text-gray-600 mt-1 italic text-sm">"{insp.managementActions[0].justification}"</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-green-600 italic">Não necessita manejo.</div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Photos */}
                                                {insp.photos && insp.photos.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2">Fotos da Inspeção</h4>
                                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                                            {insp.photos.map((photo: any) => (
                                                                <div key={photo.id} className="relative w-24 h-24 bg-gray-200 rounded shrink-0">
                                                                    <img
                                                                        src={photo.uri?.startsWith('http') || photo.uri?.startsWith('/') ? photo.uri : 'https://placehold.co/100?text=IMG'}
                                                                        alt="Foto"
                                                                        className="w-full h-full object-cover rounded"
                                                                    />
                                                                    <span className="text-[10px] absolute bottom-0 w-full bg-black/50 text-white text-center truncate px-1">{photo.uri}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Service Orders Status */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Ordens de Serviço</h2>
                        {tree.serviceOrders && tree.serviceOrders.length > 0 ? (
                            <div className="space-y-4">
                                {tree.serviceOrders.map((os: any) => (
                                    <div key={os.id} className="border border-green-200 bg-green-50 p-3 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-green-800">OS #{os.id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${os.status === 'Concluída' ? 'bg-green-200 text-green-800' :
                                                os.status === 'Em Execução' ? 'bg-blue-200 text-blue-800' :
                                                    os.status === 'Planejada' ? 'bg-yellow-200 text-yellow-800' :
                                                        'bg-gray-200 text-gray-800'
                                                }`}>
                                                {os.status}
                                            </span>
                                        </div>
                                        <div className="text-sm mt-1 text-gray-700">Responsável: {os.assigned_to || 'N/A'}</div>
                                        {os.observations && <div className="text-xs text-gray-500 mt-1 italic">"{os.observations}"</div>}
                                    </div>
                                ))}
                                <div className="text-center mt-2">
                                    <Link href="/service-orders" className="text-sm text-green-600 hover:text-green-800 font-medium">
                                        Gerenciar O.S. &rarr;
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                </div>
                                <p className="text-gray-500 text-sm">Nenhuma ordem de serviço aberta.</p>
                                <Link href="/service-orders" className="mt-4 inline-block text-sm bg-green-50 text-green-700 px-4 py-2 rounded border border-green-200 hover:bg-green-100">
                                    Criar O.S.
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
