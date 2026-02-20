'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area,
    Legend
} from 'recharts';
import { TreePine, Scale, DollarSign, Calendar } from 'lucide-react';

interface MonthlyData {
    month: number;
    monthName: string;
    treeCount: number;
    totalCost: number;
}

interface ManagementMetricsDashboardProps {
    data: MonthlyData[];
    summary: {
        totalTrees: number;
        totalCost: number;
    };
    loading: boolean;
    year: number;
    month: number | null;
}

const TREE_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7'];
const COST_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-2 uppercase">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                        {entry.name}: {formatter ? formatter(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function ManagementMetricsDashboard({ data, summary, loading, year, month }: ManagementMetricsDashboardProps) {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl shadow-inner border border-gray-100 m-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 font-medium">Carregando métricas de manejo...</p>
                </div>
            </div>
        );
    }

    const filteredData = month ? data.filter(d => d.month === month) : data;
    const hasData = filteredData.some(d => d.treeCount > 0 || d.totalCost > 0);

    return (
        <div className="flex-1 overflow-auto p-6 bg-gray-50 flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
                        <TreePine size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Árvores Manejadas</p>
                        <h4 className="text-3xl font-black text-gray-900">{summary.totalTrees}</h4>
                        <p className="text-xs text-emerald-600 font-bold mt-1">Acumulado {year}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Custo Total Estimado</p>
                        <h4 className="text-3xl font-black text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalCost)}
                        </h4>
                        <p className="text-xs text-blue-600 font-bold mt-1">Acumulado {year}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Período de Análise</p>
                        <h4 className="text-xl font-black text-gray-900">
                            {month ? `${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2000, month - 1, 1))} / ${year}` : `Ano de ${year}`}
                        </h4>
                        <p className="text-xs text-purple-600 font-bold mt-1">Dados consolidados</p>
                    </div>
                </div>
            </div>

            {!hasData && !loading ? (
                <div className="flex-1 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Calendar size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">Sem dados para o período</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                            Nenhuma ordem de serviço finalizada foi encontrada para {month ? `${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(2000, month - 1, 1))} de ${year}` : `o ano de ${year}`}.
                            Tente selecionar outro período.
                        </p>
                    </div>
                </div>
            ) : (

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trees Managed Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                Árvores Manejadas por Mês
                            </h3>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="monthName"
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip formatter={(val: number) => `${val} árvores`} />} />
                                    <Bar dataKey="treeCount" name="Árvores" radius={[4, 4, 0, 0]} barSize={40}>
                                        {filteredData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={TREE_COLORS[index % TREE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Costs Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                Custo de Manejo
                            </h3>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={filteredData}>
                                    <defs>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="monthName"
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `R$ ${val}`}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)} />}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalCost"
                                        name="Custo"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCost)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
