import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface InspectionStat {
    date: string;
    inspectorId: string;
    inspectorName: string;
    count: number;
}

interface MonthlyStat {
    month: number;
    monthName: string;
    count: number;
}

interface InspectionSummary {
    totalEvaluations: number;
}

interface Props {
    data: InspectionStat[];
    monthlyData?: MonthlyStat[];
    summary: InspectionSummary;
    loading: boolean;
    year: number;
    month: number | null;
}

export default function InspectionStatsDashboard({ data, monthlyData, summary, loading, year, month }: Props) {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-xl font-medium">Nenhuma avaliação encontrada</p>
                <p className="text-sm">Tente selecionar outro mês ou ano.</p>
            </div>
        );
    }

    // Prepare data for the Bar Chart: aggregate total by Inspector
    const inspectorTotals: Record<string, number> = {};
    data.forEach(item => {
        if (!inspectorTotals[item.inspectorName]) {
            inspectorTotals[item.inspectorName] = 0;
        }
        inspectorTotals[item.inspectorName] += item.count;
    });

    const chartData = Object.keys(inspectorTotals).map(name => ({
        name,
        'Árvores Avaliadas': inspectorTotals[name]
    })).sort((a, b) => b['Árvores Avaliadas'] - a['Árvores Avaliadas']);

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col justify-center items-center">
                        <h3 className="text-gray-500 font-medium uppercase text-sm tracking-wider mb-2">
                            Total de Avaliações
                        </h3>
                        <p className="text-5xl font-bold text-purple-700">
                            {summary.totalEvaluations}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            {month ? 'No mês selecionado' : `No ano de ${year}`}
                        </p>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-[2]">
                        <h3 className="text-gray-800 font-bold mb-4">Avaliadores mais Ativos</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="Árvores Avaliadas" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Monthly Statistics Chart - Only visible if no specific month is selected */}
                {!month && monthlyData && monthlyData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                            <h3 className="text-lg font-bold text-gray-800">Avaliações por Mês</h3>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="monthName"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number | any) => [`${value} avaliações`, 'Total']}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={35} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Detailed Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-gray-800 font-bold">Relatório Diário de Avaliações</h3>
                        <span className="text-sm text-gray-500">{data.length} registros encontrados</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium">Data</th>
                                    <th className="p-4 font-medium">Inspetor</th>
                                    <th className="p-4 font-medium text-right">Qtd. Avaliadas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-900">
                                            {new Date(row.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                    {row.inspectorName.substring(0, 2).toUpperCase()}
                                                </div>
                                                {row.inspectorName}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-900 text-right font-bold">
                                            {row.count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
