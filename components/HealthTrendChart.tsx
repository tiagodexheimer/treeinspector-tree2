'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';

interface HealthData {
    date: string;
    health: string;
    timestamp: number;
    score: number; // 0-3
}

interface HealthTrendChartProps {
    data: HealthData[];
}

const HEALTH_MAP: Record<string, number> = {
    'Bom': 3,
    'Regular': 2,
    'Ruim': 1,
    'Desvitalizada': 0
};

const REVERSE_MAP: Record<number, string> = {
    3: 'Bom',
    2: 'Regular',
    1: 'Ruim',
    0: 'Desvitalizada'
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const score = payload[0].value;
        const status = REVERSE_MAP[score] || 'Desconhecido';
        return (
            <div className="bg-white p-2 border border-gray-200 shadow rounded text-sm">
                <p className="font-bold">{label}</p>
                <p style={{ color: payload[0].color }}>
                    Estado: <span className="font-medium">{status}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function HealthTrendChart({ data }: HealthTrendChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-8">Dados insuficientes para gráfico de saúde.</div>;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                        domain={[0, 3]}
                        ticks={[0, 1, 2, 3]}
                        tickFormatter={(value) => REVERSE_MAP[value] || ''}
                        width={80}
                    />

                    {/* Zones */}
                    <ReferenceArea y1={0} y2={1} fill="red" fillOpacity={0.1} />
                    <ReferenceArea y1={1} y2={2} fill="orange" fillOpacity={0.1} />
                    <ReferenceArea y1={2} y2={3} fill="green" fillOpacity={0.1} />

                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    <Line
                        type="stepAfter"
                        dataKey="score"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Estado de Saúde"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
