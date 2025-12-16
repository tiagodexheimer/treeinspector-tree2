'use client';

import { useState } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

export interface NeighborhoodStat {
    bairro: string;
    remocao: number;
    substituicao: number;
    poda: number;
    predominant_health?: string;
    health_counts?: { [key: string]: number };
    lat: number;
    lng: number;
}

export interface GridStat {
    lat: number;
    lng: number;
    count: number;
    predominant_health: string;
    health_counts: { [key: string]: number };
    predominant_action?: string;
    management_counts?: { [key: string]: number };
    grid_lat?: number;
    grid_lng?: number;
}

export type StatMode = 'management' | 'health' | 'grid';
export type GridType = 'health' | 'management';

interface MapComponentProps {
    stats: NeighborhoodStat[];
    gridStats: GridStat[];
    statMode: StatMode;
    gridType: GridType;
}

const getChartIcon = (stat: NeighborhoodStat | GridStat, mode: StatMode, gridType: GridType) => {
    if (mode === 'grid') {
        const s = stat as GridStat;
        let color = '#9ca3af'; // Default Gray (No action / Regular)

        if (gridType === 'management') {
            const action = s.predominant_action;
            if (action === 'Remocao') color = '#ef4444';
            else if (action === 'Substituicao') color = '#f59e0b';
            else if (action === 'Poda') color = '#3b82f6';
            else color = '#e5e7eb'; // Very light gray for no action
        } else {
            // Health
            const health = s.predominant_health || 'Regular';
            if (health.includes('Bom')) color = '#22c55e'; // Green
            else if (health.includes('Ruim')) color = '#ef4444'; // Red
            else if (health.includes('Morta') || health.includes('Desv')) color = '#000000'; // Black
            else color = '#eab308'; // Default/Regular -> Yellow
        }

        // Dynamic Size based on count
        const size = Math.max(20, Math.min(80, Math.log2(s.count + 1) * 8 + 10));
        const fontSize = Math.max(10, size / 3);

        const html = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="
                width: ${size}px; 
                height: ${size}px; 
                background-color: ${color}cc; /* Alpha */
                border-radius: 50%; 
                border: 2px solid white; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${color === '#e5e7eb' ? '#374151' : 'white'};
                font-weight: bold;
                font-size: ${fontSize}px;
            ">
                ${s.count}
            </div>
        </div>
        `;

        return divIcon({
            html: html,
            className: 'bg-transparent',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    }

    // Existing modes (Neighborhood)
    const s = stat as NeighborhoodStat;

    if (mode === 'management') {
        const total = s.remocao + s.substituicao + s.poda;
        const max = Math.max(s.remocao, s.substituicao, s.poda, 5);

        const hRemocao = (s.remocao / max) * 60;
        const hSubstituicao = (s.substituicao / max) * 60;
        const hPoda = (s.poda / max) * 60;

        const html = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; align-items: flex-end; gap: 4px; padding: 4px; background: rgba(255,255,255,0.8); border-radius: 4px; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                 ${s.remocao > 0 ? `
                 <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 10px; font-weight: bold; color: #ef4444;">${s.remocao}</span>
                    <div style="width: 12px; height: ${hRemocao}px; background-color: #ef4444; border-radius: 2px 2px 0 0;"></div>
                 </div>` : ''}
                 ${s.substituicao > 0 ? `
                 <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 10px; font-weight: bold; color: #f59e0b;">${s.substituicao}</span>
                    <div style="width: 12px; height: ${hSubstituicao}px; background-color: #f59e0b; border-radius: 2px 2px 0 0;"></div>
                 </div>` : ''}
                 ${s.poda > 0 ? `
                 <div style="display: flex; flex-direction: column; align-items: center;">
                    <span style="font-size: 10px; font-weight: bold; color: #3b82f6;">${s.poda}</span>
                    <div style="width: 12px; height: ${hPoda}px; background-color: #3b82f6; border-radius: 2px 2px 0 0;"></div>
                 </div>` : ''}
            </div>
            <span style="background: white; padding: 2px 4px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 2px; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">${s.bairro}</span>
        </div>`;

        return divIcon({ html, className: 'bg-transparent', iconSize: [60, 80], iconAnchor: [30, 80], popupAnchor: [0, -80] });
    } else {
        // Health Mode (Neighborhood)
        let color = '#eab308';
        const health = s.predominant_health || 'Regular';
        if (health.includes('Bom')) color = '#22c55e';
        else if (health.includes('Ruim')) color = '#ef4444';
        else if (health.includes('Morta') || health.includes('Desv')) color = '#000000';

        const count = s.health_counts ? s.health_counts[health] || 0 : 0;

        const html = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 40px; height: 40px; background-color: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; opacity: 0.9;">
                ${count}
            </div>
            <span style="background: white; padding: 2px 4px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 2px; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">${s.bairro}</span>
        </div>`;

        return divIcon({ html, className: 'bg-transparent', iconSize: [40, 60], iconAnchor: [20, 60], popupAnchor: [0, -60] });
    }
};

// Grid cell size in degrees (must match API)
const GRID_SIZE = 0.003;

// Get rectangle color based on grid type
const getGridRectColor = (stat: GridStat, gridType: GridType): string => {
    if (gridType === 'management') {
        const action = stat.predominant_action;
        if (action === 'Remocao') return '#ef4444';
        if (action === 'Substituicao') return '#f59e0b';
        if (action === 'Poda') return '#3b82f6';
        return '#9ca3af';
    } else {
        const health = stat.predominant_health || 'Regular';
        if (health.includes('Bom')) return '#22c55e';
        if (health.includes('Ruim')) return '#ef4444';
        if (health.includes('Morta') || health.includes('Desv')) return '#000000';
        return '#eab308';
    }
};

export default function MapComponent({ stats, gridStats, statMode, gridType }: MapComponentProps) {
    // Track selected grid cell for showing rectangle
    const [selectedCell, setSelectedCell] = useState<number | null>(null);

    return (
        <MapContainer center={[-29.852, -51.1841]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Grid cell rectangle (only show for selected cell) */}
            {statMode === 'grid' && selectedCell !== null && Array.isArray(gridStats) && gridStats[selectedCell] && (() => {
                const stat = gridStats[selectedCell];
                if (!stat.grid_lat || !stat.grid_lng) return null;
                const halfSize = GRID_SIZE / 2;
                const bounds: [[number, number], [number, number]] = [
                    [stat.grid_lat - halfSize, stat.grid_lng - halfSize],
                    [stat.grid_lat + halfSize, stat.grid_lng + halfSize]
                ];
                return (
                    <Rectangle
                        key={`rect-selected`}
                        bounds={bounds}
                        pathOptions={{
                            color: getGridRectColor(stat, gridType),
                            weight: 2,
                            opacity: 1,
                            fillColor: getGridRectColor(stat, gridType),
                            fillOpacity: 0.3
                        }}
                    />
                );
            })()}

            {(statMode === 'grid' ? (Array.isArray(gridStats) ? gridStats : []) : (Array.isArray(stats) ? stats : [])).map((stat, idx) => (
                stat.lat && stat.lng ? (
                    <Marker
                        key={idx}
                        position={[stat.lat, stat.lng]}
                        icon={getChartIcon(stat as any, statMode, gridType)}
                        eventHandlers={{
                            click: () => {
                                if (statMode === 'grid') {
                                    setSelectedCell(selectedCell === idx ? null : idx);
                                }
                            }
                        }}
                    >
                        <Popup>
                            {statMode === 'grid' ? (
                                <>
                                    <strong>Micro-Região</strong><br />
                                    Total Árvores: {(stat as GridStat).count}<hr className="my-1" />
                                    {gridType === 'health' ? (
                                        <>
                                            <strong>Saúde Predominante: {(stat as GridStat).predominant_health}</strong><br />
                                            <div className="text-xs mt-1 grid grid-cols-2 gap-x-2">
                                                <span>🟢 Bom:</span> <strong>{(stat as GridStat).health_counts?.['Bom'] || 0}</strong>
                                                <span>🟡 Regular:</span> <strong>{(stat as GridStat).health_counts?.['Regular'] || 0}</strong>
                                                <span>🔴 Ruim:</span> <strong>{(stat as GridStat).health_counts?.['Ruim'] || 0}</strong>
                                                <span>⚫ Morta:</span> <strong>{(stat as GridStat).health_counts?.['Morta/Desvitalizada'] || 0}</strong>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <strong>Ação Predominante: {(stat as GridStat).predominant_action || 'Nenhuma'}</strong><br />
                                            <div className="text-xs mt-1">
                                                Remoção: {(stat as GridStat).management_counts?.['Remocao'] || 0}<br />
                                                Subst.: {(stat as GridStat).management_counts?.['Substituicao'] || 0}<br />
                                                Poda: {(stat as GridStat).management_counts?.['Poda'] || 0}
                                            </div>
                                        </>
                                    )}
                                    <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                                        <a
                                            href={`/statistics/details?lat=${(stat as GridStat).grid_lat}&lng=${(stat as GridStat).grid_lng}`}
                                            className="inline-block px-3 py-1 bg-blue-600 !text-white font-bold text-xs rounded hover:bg-blue-700 transition decoration-0"
                                            style={{ color: 'white', textDecoration: 'none' }}
                                        >
                                            Ver Lista de Árvores
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <strong>{(stat as NeighborhoodStat).bairro}</strong><br />
                                    {statMode === 'management' ? (
                                        <>Remoção: {(stat as NeighborhoodStat).remocao}<br />Substituição: {(stat as NeighborhoodStat).substituicao}<br />Poda: {(stat as NeighborhoodStat).poda}</>
                                    ) : (
                                        <>Predominante: {(stat as NeighborhoodStat).predominant_health}<br />(Bom/Reg/Ruim)</>
                                    )}
                                </>
                            )}
                        </Popup>
                    </Marker>
                ) : null
            ))}

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
        </MapContainer>
    );
}
