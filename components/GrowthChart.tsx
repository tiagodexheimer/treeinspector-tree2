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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dateStr = typeof label === 'number' ? new Date(label).toLocaleDateString() : label;

        return (
            <div className="bg-white p-2 border border-gray-200 shadow rounded text-sm">
                <p className="font-bold">{dateStr}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: <span className="font-medium">{entry.value}</span>
                    </p>
                ))}
                {payload[0].payload.timestamp && (
                    <p className="text-[10px] text-gray-400 mt-1 border-t pt-1">
                        {new Date(payload[0].payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function GrowthChart({ data }: GrowthChartProps) {
    if (!data || data.length === 0) {
        return <div className="text-gray-500 text-sm text-center py-8">Dados insuficientes para gráfico.</div>;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(unix) => new Date(unix).toLocaleDateString()}
                    />
                    <YAxis yAxisId="left" label={{ value: 'DAP (cm)', angle: -90, position: 'insideLeft', offset: 10 }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Altura (m)', angle: 90, position: 'insideRight', offset: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="dap" stroke="#8884d8" name="DAP (cm)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="height" stroke="#82ca9d" name="Altura (m)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
