'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import MapComponent to disable SSR for Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    )
});

// Update Interface
interface NeighborhoodStat {
    bairro: string;
    remocao: number;
    substituicao: number;
    poda: number;
    predominant_health?: string;
    health_counts?: { [key: string]: number };
    lat: number;
    lng: number;
}

interface GridStat {
    lat: number;
    lng: number;
    count: number;
    predominant_health: string;
    health_counts: { [key: string]: number };
    predominant_action?: string;
    management_counts?: { [key: string]: number };
}

type StatMode = 'management' | 'health' | 'grid';
type GridType = 'health' | 'management';

export default function StatisticsPage() {
    const [stats, setStats] = useState<NeighborhoodStat[]>([]);
    const [gridStats, setGridStats] = useState<GridStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [statMode, setStatMode] = useState<StatMode>('management');
    const [gridType, setGridType] = useState<GridType>('health');
    const router = useRouter();

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                if (statMode === 'grid') {
                    // Always fetch grid if needed, data structure supports both types now
                    if (gridStats.length === 0) {
                        const res = await fetch('/api/statistics/grid');
                        const data = await res.json();
                        setGridStats(data);
                    }
                } else {
                    if (stats.length === 0) {
                        const res = await fetch('/api/statistics/neighborhoods');
                        const data = await res.json();
                        setStats(data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [statMode, stats.length, gridStats.length]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">Mapa de Estatísticas</h1>

                    {/* Mode Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setStatMode('management')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'management' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Manejo</button>
                        <button onClick={() => setStatMode('health')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'health' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Qualidade (Bairro)</button>
                        <button onClick={() => setStatMode('grid')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'grid' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Micro-Regiões</button>
                    </div>

                    {/* Sub-toggle for Grid */}
                    {statMode === 'grid' && (
                        <div className="flex bg-gray-100 p-1 rounded-lg ml-2 animate-fade-in border border-blue-200">
                            <button onClick={() => setGridType('health')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${gridType === 'health' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}>Saúde</button>
                            <button onClick={() => setGridType('management')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${gridType === 'management' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}>Necessidade</button>
                        </div>
                    )}
                </div>
                <button onClick={() => router.back()} className="text-blue-600 hover:underline">Voltar</button>
            </div>

            <div className="flex-1 relative">
                {/* Loader Overlay for Data Fetching */}
                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-75">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                )}

                <MapComponent
                    stats={stats}
                    gridStats={gridStats}
                    statMode={statMode}
                    gridType={gridType}
                />

                <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto', marginBottom: '20px', marginRight: '20px' }}>
                    <div className="leaflet-control leaflet-bar bg-white p-4 shadow-lg rounded-lg border border-gray-200">
                        {statMode === 'grid' ? (
                            <>
                                <h4 className="font-bold text-gray-900 mb-2">Micro-Regiões ({gridType === 'health' ? 'Saúde' : 'Manejo'})</h4>

                                {gridType === 'health' ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#22c55e]"></span><span className="text-sm">Bom</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#eab308]"></span><span className="text-sm">Regular</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#ef4444]"></span><span className="text-sm">Ruim</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-black"></span><span className="text-sm">Morta</span></div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#ef4444]"></span><span className="text-sm">Remoção</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#f59e0b]"></span><span className="text-sm">Substituição</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#3b82f6]"></span><span className="text-sm">Poda</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#e5e7eb] border border-gray-400"></span><span className="text-sm">Sem Ação</span></div>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 mt-2">Tamanho = Volume</div>
                            </>
                        ) : (
                            /* Reuse existing legends logic or simplify */
                            statMode === 'management' ? (
                                <>
                                    <h4 className="font-bold text-gray-900 mb-2">Legenda (Manejo)</h4>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-[#ef4444] rounded-sm"></span><span className="text-sm text-gray-700">Remoção</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-[#f59e0b] rounded-sm"></span><span className="text-sm text-gray-700">Substituição</span></div>
                                        <div className="flex items-center gap-2"><span className="w-4 h-4 bg-[#3b82f6] rounded-sm"></span><span className="text-sm text-gray-700">Poda</span></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h4 className="font-bold text-gray-900 mb-2">Legenda (Saúde)</h4>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-[#22c55e] border border-gray-200"></span>
                                            <span className="text-sm text-gray-700">Bom</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-[#eab308] border border-gray-200"></span>
                                            <span className="text-sm text-gray-700">Regular</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-[#ef4444] border border-gray-200"></span>
                                            <span className="text-sm text-gray-700">Ruim</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-black border border-gray-200"></span>
                                            <span className="text-sm text-gray-700">Morta</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 max-w-[150px]">
                                            Círculo e cor indicam o estado predominante no bairro.
                                        </p>
                                    </div>
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
