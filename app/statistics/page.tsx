'use client';

import { useEffect, useState, useMemo } from 'react';
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

import SpeciesDashboard from './SpeciesDashboard';
import ManagementMetricsDashboard from './ManagementMetricsDashboard';

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

interface SpeciesStat {
    speciesId: number;
    nome_comum: string;
    nome_cientifico: string;
    count: number;
}

interface ManagementMetrics {
    month: number;
    monthName: string;
    treeCount: number;
    totalCost: number;
}

interface ManagementSummary {
    totalTrees: number;
    totalCost: number;
}

type StatMode = 'management' | 'health' | 'grid' | 'species' | 'metrics';
type GridType = 'health' | 'management';

export default function StatisticsPage() {
    const [stats, setStats] = useState<NeighborhoodStat[]>([]);
    const [gridStats, setGridStats] = useState<GridStat[]>([]);
    const [speciesStats, setSpeciesStats] = useState<SpeciesStat[]>([]);
    const [metricsData, setMetricsData] = useState<ManagementMetrics[]>([]);
    const [metricsSummary, setMetricsSummary] = useState<ManagementSummary>({ totalTrees: 0, totalCost: 0 });
    const [loading, setLoading] = useState(true);
    const [statMode, setStatMode] = useState<StatMode>('management');
    const [gridType, setGridType] = useState<GridType>('health');
    const [selectedBairro, setSelectedBairro] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const router = useRouter();

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2];
    const months = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' }
    ];

    // Get list of neighborhoods and handle initial redirect if needed
    const neighborhoods = useMemo(() => {
        if (stats.length > 0) return stats.map(s => s.bairro).sort();
        return [];
    }, [stats]);

    // Fetch Base Stats (Neighborhoods) always initially to get filter list
    useEffect(() => {
        async function fetchBaseStats() {
            if (stats.length === 0) {
                const res = await fetch('/api/statistics/neighborhoods');
                const data = await res.json();
                setStats(data);
            }
        }
        fetchBaseStats();
    }, [stats.length]);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                if (statMode === 'grid') {
                    if (gridStats.length === 0) {
                        const res = await fetch('/api/statistics/grid');
                        const data = await res.json();
                        setGridStats(data);
                    }
                } else if (statMode === 'species') {
                    const url = new URL('/api/statistics/species', window.location.origin);
                    if (selectedBairro) url.searchParams.set('bairro', selectedBairro);

                    const res = await fetch(url.toString());
                    const data = await res.json();
                    setSpeciesStats(data);
                } else if (statMode === 'metrics') {
                    const url = new URL('/api/statistics/management-history', window.location.origin);
                    url.searchParams.set('year', selectedYear.toString());
                    if (selectedMonth) url.searchParams.set('month', selectedMonth.toString());

                    const res = await fetch(url.toString());
                    const data = await res.json();
                    setMetricsData(data.data);
                    setMetricsSummary(data.summary);
                }
                // Neighborhood stats (for health/management modes) are handled by fetchBaseStats
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [statMode, gridStats.length, selectedBairro, selectedYear, selectedMonth]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">Estatísticas</h1>

                    {/* Mode Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setStatMode('management')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'management' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Manejo</button>
                        <button onClick={() => setStatMode('health')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'health' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Qualidade (Bairro)</button>
                        <button onClick={() => setStatMode('grid')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'grid' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Micro-Regiões</button>
                        <button onClick={() => setStatMode('species')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'species' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Espécies</button>
                        <button onClick={() => setStatMode('metrics')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${statMode === 'metrics' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Métricas</button>
                    </div>

                    {/* Sub-toggle for Grid */}
                    {statMode === 'grid' && (
                        <div className="flex bg-gray-100 p-1 rounded-lg ml-2 animate-fade-in border border-blue-200">
                            <button onClick={() => setGridType('health')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${gridType === 'health' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}>Saúde</button>
                            <button onClick={() => setGridType('management')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${gridType === 'management' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}>Necessidade</button>
                        </div>
                    )}

                    {/* Bairro Filter for Species Abundance */}
                    {statMode === 'species' && (
                        <div className="flex items-center gap-2 ml-4 animate-fade-in">
                            <label htmlFor="bairro-filter" className="text-xs font-bold text-gray-500 uppercase">Filtrar por Bairro:</label>
                            <select
                                id="bairro-filter"
                                value={selectedBairro}
                                onChange={(e) => setSelectedBairro(e.target.value)}
                                className="p-1.5 text-sm border-2 border-emerald-100 rounded-lg bg-emerald-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-900"
                            >
                                <option value="">Todos os Bairros</option>
                                {neighborhoods.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Year/Month Filter for Metrics */}
                    {statMode === 'metrics' && (
                        <div className="flex items-center gap-4 ml-4 animate-fade-in">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Ano:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="p-1.5 text-sm border-2 border-blue-100 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-900"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Mês:</label>
                                <select
                                    value={selectedMonth || ''}
                                    onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                                    className="p-1.5 text-sm border-2 border-blue-100 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-900"
                                >
                                    <option value="">Todos os Meses</option>
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => router.back()} className="text-blue-600 hover:underline">Voltar</button>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                {/* Loader Overlay for Data Fetching */}
                {(loading && statMode !== 'species' && statMode !== 'metrics') && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-75">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                )}

                {statMode === 'species' ? (
                    <SpeciesDashboard
                        data={speciesStats}
                        loading={loading}
                        selectedBairro={selectedBairro}
                    />
                ) : statMode === 'metrics' ? (
                    <ManagementMetricsDashboard
                        data={metricsData}
                        summary={metricsSummary}
                        loading={loading}
                        year={selectedYear}
                        month={selectedMonth}
                    />
                ) : (
                    <MapComponent
                        stats={stats}
                        gridStats={gridStats}
                        statMode={statMode}
                        gridType={gridType}
                    />
                )}
            </div>
        </div>
    );
}
