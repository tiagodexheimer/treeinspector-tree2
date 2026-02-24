'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Dynamically import Map to avoid SSR issues
const AssessmentPlanMap = dynamic(() => import('../components/AssessmentPlanMap'), { ssr: false });

interface Tree {
    id_arvore: number;
    numero_etiqueta: string;
    rua: string | null;
    numero: string | null;
    bairro: string | null;
    especie_comum: string | null;
    especie_cientifica: string | null;
    estado_saude: string | null;
    risk_rating: number | null;
    ultima_inspecao: string | null;
}

interface ExportData {
    trees: any[];
}

const ALLOWED_ROLES = ['ADMIN', 'GESTOR', 'INSPETOR'];

export default function AssessmentPlanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const role = (session?.user as any)?.role;

    // Redirect unauthorized users once session is loaded
    useEffect(() => {
        if (status === 'loading') return;
        if (!session || !ALLOWED_ROLES.includes(role)) {
            router.replace('/');
        }
    }, [status, session, role, router]);

    const [activeTab, setActiveTab] = useState<'street' | 'map'>('street');
    const [selectedTreeIds, setSelectedTreeIds] = useState<number[]>([]);
    const [streetQuery, setStreetQuery] = useState('');
    const [streetSuggestions, setStreetSuggestions] = useState<{ rua: string, count: number }[]>([]);
    const [treesInStreet, setTreesInStreet] = useState<Tree[]>([]);
    const [loading, setLoading] = useState(false);

    // Block rendering for unauthorized users
    if (status === 'loading' || !session || !ALLOWED_ROLES.includes(role)) {
        return null;
    }

    // Fetch street suggestions as user types
    useEffect(() => {
        if (streetQuery.length < 2) {
            setStreetSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/trees/streets?q=${encodeURIComponent(streetQuery)}`);
                const data = await res.json();
                setStreetSuggestions(data);
            } catch (e) {
                console.error('Failed to fetch streets', e);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [streetQuery]);

    const handleSelectStreet = async (rua: string) => {
        setStreetQuery(rua);
        setStreetSuggestions([]);
        setLoading(true);
        try {
            const res = await fetch(`/api/assessment-plan?rua=${encodeURIComponent(rua)}`);
            const data = await res.json();
            setTreesInStreet(data.trees || []);
        } catch (e) {
            console.error('Failed to fetch trees for street', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleTreeSelection = (id: number) => {
        setSelectedTreeIds(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const selectAllInStreet = () => {
        const streetIds = treesInStreet.map(t => t.id_arvore);
        setSelectedTreeIds(prev => Array.from(new Set([...prev, ...streetIds])));
    };

    const deselectAllInStreet = () => {
        const streetIds = treesInStreet.map(t => t.id_arvore);
        setSelectedTreeIds(prev => prev.filter(id => !streetIds.includes(id)));
    };

    const handleExport = async () => {
        if (selectedTreeIds.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch('/api/assessment-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ treeIds: selectedTreeIds })
            });
            const data = await res.json();
            const trees: any[] = data.trees || [];

            const rowsHtml = trees.map(tree => `
                <tr>
                    <td>${tree.numero_etiqueta || '-'}</td>
                    <td>${tree.rua || ''}, ${tree.numero || 'SN'}<br><small>${tree.bairro || ''}</small></td>
                    <td><em>${tree.especie_comum || 'Desconhecida'}</em><br><small>${tree.especie_cientifica || ''}</small></td>
                    <td>
                        DAP: ${tree.dap1_cm ? tree.dap1_cm + 'cm' : '-'} | Alt: ${tree.altura_total_m ? tree.altura_total_m + 'm' : '-'}<br>
                        Saúde: ${tree.estado_saude || '-'} | Risco: ${tree.risk_probability || tree.risk_rating || '-'}
                    </td>
                    <td style="text-align:center;"><div style="width:20px;height:20px;border:2px solid black;margin:auto;"></div></td>
                    <td></td>
                </tr>
            `).join('');

            const printHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Roteiro de Avaliação de Campo</title>
    <style>
        @page { margin: 1.5cm; size: portrait; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0; }
        h1 { font-size: 16px; margin: 0 0 4px 0; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
        .header-right { text-align: right; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #eee; text-align: left; padding: 4px 6px; border: 1px solid #aaa; font-size: 10px; }
        td { padding: 4px 6px; border: 1px solid #aaa; vertical-align: top; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        .footer { margin-top: 20px; border-top: 1px dashed #999; padding-top: 6px; font-size: 9px; color: #666; }
        td:nth-child(5) { width: 36px; }
        td:nth-child(6) { min-width: 100px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Roteiro de Avaliação de Campo</h1>
        <div class="header-right">
            <div>Data: ${new Date().toLocaleDateString('pt-BR')}</div>
            <div>Total de Árvores: ${trees.length}</div>
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Etiqueta</th>
                <th>Endereço / Referência</th>
                <th>Espécie</th>
                <th>Dados Conhecidos (DAP / Alt / Saúde / Risco)</th>
                <th>✓</th>
                <th>Observações de Campo</th>
            </tr>
        </thead>
        <tbody>
            ${rowsHtml}
        </tbody>
    </table>
    <div class="footer">TreeInspector — Planejador de Avaliação</div>
    <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

            const printWin = window.open('', '_blank');
            if (printWin) {
                printWin.document.write(printHtml);
                printWin.document.close();
            } else {
                alert('Bloqueador de pop-ups impediu a abertura da janela de impressão. Por favor, permita pop-ups para este site.');
            }
        } catch (e) {
            console.error('Failed to export', e);
            alert('Erro ao gerar dados de exportação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`p-8 min-h-screen ${activeTab === 'map' ? 'w-full' : 'max-w-7xl mx-auto'}`}>
            <style jsx global>{`
                @media print {
                    /* Most important: undo h-screen and overflow-auto from layout.tsx */
                    html, body, #__next, main, [data-next-app-root] {
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        position: static !important;
                        display: block !important;
                        flex: none !important;
                    }

                    /* Hide all UI elements except the print container */
                    nav, .no-print, button, .leaflet-control-container {
                        display: none !important;
                    }

                    .print-only {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    @page {
                        margin: 1.5cm;
                        size: portrait;
                    }

                    table {
                        page-break-inside: auto;
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto !important;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                }
            `}</style>

            <div className="flex justify-between items-center mb-8 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Planejador de Avaliação</h1>
                    <p className="text-gray-600 mt-1">Selecione as árvores para vistoria em campo.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleExport}
                        disabled={selectedTreeIds.length === 0 || loading}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Exportar para Impressão ({selectedTreeIds.length})
                    </button>
                    <Link href="/" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">
                        Cancelar
                    </Link>
                </div>
            </div>

            <div className={`grid grid-cols-1 gap-8 no-print ${activeTab === 'map' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                {/* Selection Panel */}
                <div className={`space-y-6 ${activeTab === 'map' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border">
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('street')}
                                className={`flex-1 py-4 text-center font-medium transition ${activeTab === 'street' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Por Rua / Trecho
                            </button>
                            <button
                                onClick={() => setActiveTab('map')}
                                className={`flex-1 py-4 text-center font-medium transition ${activeTab === 'map' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Seleção no Mapa
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'street' ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar Rua</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Nome da rua..."
                                                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                                                    value={streetQuery}
                                                    onChange={(e) => setStreetQuery(e.target.value)}
                                                />
                                                {streetSuggestions.length > 0 && (
                                                    <ul className="absolute z-50 w-full bg-white border rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
                                                        {streetSuggestions.map((s, i) => (
                                                            <li
                                                                key={i}
                                                                className="px-4 py-2 hover:bg-green-50 cursor-pointer flex justify-between border-b last:border-0"
                                                                onClick={() => handleSelectStreet(s.rua)}
                                                            >
                                                                <span>{s.rua}</span>
                                                                <span className="text-xs text-gray-400">{s.count} árvores</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleSelectStreet(streetQuery)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                            >
                                                Ver Árvores
                                            </button>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-10 text-gray-500">Carregando árvores...</div>
                                    ) : treesInStreet.length > 0 ? (
                                        <div className="animate-in fade-in duration-300">
                                            <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">{treesInStreet.length} árvores encontradas</span>
                                                <div className="flex gap-3 text-xs">
                                                    <button onClick={selectAllInStreet} className="text-green-600 font-bold hover:underline">Selecionar Todas</button>
                                                    <span className="text-gray-300">|</span>
                                                    <button onClick={deselectAllInStreet} className="text-red-600 font-bold hover:underline">Limpar Desta Rua</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
                                                {treesInStreet.map(tree => (
                                                    <div
                                                        key={tree.id_arvore}
                                                        className={`p-3 border rounded-lg cursor-pointer transition flex items-center gap-3 ${selectedTreeIds.includes(tree.id_arvore) ? 'border-green-500 bg-green-50' : 'hover:border-gray-400'}`}
                                                        onClick={() => toggleTreeSelection(tree.id_arvore)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            readOnly
                                                            checked={selectedTreeIds.includes(tree.id_arvore)}
                                                            className="h-4 w-4 rounded border-gray-300 text-green-600 cursor-pointer"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-gray-900 truncate">{tree.numero_etiqueta}</div>
                                                            <div className="text-xs text-gray-600 truncate">{tree.especie_comum || 'Desconhecida'}</div>
                                                            <div className="text-xs text-gray-500 truncate">{tree.numero ? `Nº ${tree.numero}` : 'S/N'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : streetQuery.length > 3 && !loading ? (
                                        <div className="text-center py-10 text-gray-400">Nenhuma árvore encontrada nesta rua.</div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <p>Selecione uma rua para começar</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-500">
                                    <AssessmentPlanMap
                                        selectedTreeIds={selectedTreeIds}
                                        onSelectedIdsChange={setSelectedTreeIds}
                                    />
                                    <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Use o modo seleção para desenhar um retângulo e selecionar várias árvores de uma vez.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Selection Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md border sticky top-8">
                        <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                            <h2 className="font-bold text-gray-800 flex items-center justify-between">
                                Planejamento Atual
                                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">{selectedTreeIds.length}</span>
                            </h2>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {selectedTreeIds.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    Nenhuma árvore selecionada.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* We would ideally show the labels here, but we only have IDs mostly.
                                       We could store a map of ID -> SmallInfo if needed, or just show IDs/Count. 
                                       For UX, let's just show count and a clear all button for now. */}
                                    <p className="text-sm text-gray-600 mb-4">Você selecionou {selectedTreeIds.length} árvores de diferentes locais.</p>
                                    <button
                                        onClick={() => setSelectedTreeIds([])}
                                        className="w-full text-xs text-red-600 border border-red-200 py-2 rounded hover:bg-red-50 transition"
                                    >
                                        Limpar Toda a Seleção
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                            <button
                                onClick={handleExport}
                                disabled={selectedTreeIds.length === 0 || loading}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow hover:bg-green-700 disabled:opacity-50 transition"
                            >
                                Gerar Lista de Campo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
