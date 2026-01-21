'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface SpeciesStat {
    speciesId: number;
    nome_comum: string;
    nome_cientifico: string;
    count: number;
}

interface SpeciesDashboardProps {
    data: SpeciesStat[];
    loading: boolean;
    selectedBairro: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function SpeciesDashboard({ data, loading, selectedBairro }: SpeciesDashboardProps) {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-inner border border-gray-100 m-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    <p className="text-gray-500 font-medium">Carregando análise de espécies...</p>
                </div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-inner border border-gray-100 m-4">
                <p className="text-gray-500">Nenhum dado encontrado para os filtros selecionados.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-6 bg-gray-50 flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                            Abundância por Espécie
                        </h3>
                        {selectedBairro && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                {selectedBairro}
                            </span>
                        )}
                    </div>

                    <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="nome_comum"
                                    type="category"
                                    width={150}
                                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`${value} árvores`, 'Quantidade']}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Info & Cards */}
                <div className="flex flex-col gap-6">
                    {/* Top 1 Highlight */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl shadow-lg text-white">
                        <p className="text-emerald-100 text-sm font-medium uppercase tracking-widest mb-1">Espécie Predominante</p>
                        <h4 className="text-2xl font-black mb-1">{data[0].nome_comum}</h4>
                        <p className="text-emerald-200 text-sm italic mb-4">{data[0].nome_cientifico}</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black leading-none">{data[0].count}</span>
                            <span className="text-emerald-100 font-medium mb-1">indivíduos</span>
                        </div>
                    </div>

                    {/* Stats List */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                        <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Distribuição Detalhada</h4>
                        <div className="flex flex-col gap-3">
                            {data.slice(0, 10).map((s, idx) => (
                                <div key={s.speciesId} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                        <span className="font-medium text-gray-700 truncate">{s.nome_comum}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border">{s.count}</span>
                                </div>
                            ))}
                            {data.length > 10 && (
                                <p className="text-xs text-center text-gray-400 mt-2">Exibindo as 10 mais abundantes</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
