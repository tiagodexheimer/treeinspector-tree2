'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
    date: string;
    dap: number;
    height: number;
    timestamp: number;
}

interface GrowthChartProps {
    data: ChartData[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-8">Dados insuficientes para gráfico.</div>;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" label={{ value: 'DAP (cm)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Altura (m)', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="dap" stroke="#8884d8" name="DAP (cm)" />
                    <Line yAxisId="right" type="monotone" dataKey="height" stroke="#82ca9d" name="Altura (m)" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
