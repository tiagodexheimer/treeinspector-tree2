'use client';

import { divIcon, LatLngBounds } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect, useState, useMemo, useRef } from 'react';
import useSupercluster from 'use-supercluster';
import ServiceOrderCreateModal from './ServiceOrderCreateModal';

interface MapTree {
    id: number;
    lat: number;
    lng: number;
    lbl: string; // etiqueta
    sp: string;  // especie
    st: string;  // status (saúde)
    sev?: number; // severity
    pc?: number; // pest count
}

// Helper to get color from health status
const getHealthColor = (status: string): string => {
    const s = status?.toLowerCase() || '';
    if (s.includes('ruim') || s.includes('péssim')) return '#ef4444'; // Red
    if (s.includes('regular')) return '#eab308'; // Yellow
    if (s.includes('mort') || s.includes('desv')) return '#000000'; // Black
    return '#22c55e'; // Green (Bom)
};

const getTreeIcon = (status: string, isSelected: boolean) => {
    const color = isSelected ? '#3b82f6' : getHealthColor(status); // Blue if selected, else health color
    const strokeColor = isSelected ? '#1d4ed8' : '#2e3a47';
    const strokeWidth = isSelected ? '12' : '8';
    const scale = isSelected ? 1.2 : 1;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${24 * scale}" height="${24 * scale}">
        <!-- Trunk -->
        <path d="M224 480h64c8.8 0 16-7.2 16-16V352h-96v112c0 8.8 7.2 16 16 16z" fill="#795548"/>
        <!-- Foliage (Color coded) -->
        <path d="M464 256h-23.7c9.5-18.7 15.7-39.7 15.7-62.1 0-69.6-50.6-127.3-116.8-141C333.1 22.9 296.8 0 256 0s-77.1 22.9-83.2 52.9C106.6 66.8 56 124.5 56 193.9c0 22.3 6.2 43.4 15.7 62.1H48c-26.5 0-48 21.5-48 48s21.5 48 48 48h416c26.5 0 48-21.5 48-48s-21.5-48-48-48z" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
    </svg>`;

    return divIcon({
        html: svg,
        className: 'bg-transparent',
        iconSize: [24 * scale, 24 * scale],
        iconAnchor: [12 * scale, 12 * scale],
        popupAnchor: [0, -12 * scale]
    });
};

const getClusterIcon = (count: number, majorityColor: string) => {
    return divIcon({
        html: `<div style="
            width: 30px; 
            height: 30px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background-color: ${majorityColor}; 
            opacity: 0.9;
            border-radius: 50%; 
            color: white; 
            font-weight: bold; 
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
        ">${count}</div>`,
        className: 'cluster-marker',
        iconSize: [30, 30]
    });
};

// Calculate majority health color from cluster leaves
const getMajorityHealthColor = (leaves: any[]): string => {
    const statusCounts: Record<string, number> = {};

    leaves.forEach(leaf => {
        const status = leaf.properties?.status || 'Regular';
        const color = getHealthColor(status);
        statusCounts[color] = (statusCounts[color] || 0) + 1;
    });

    // Find the color with the highest count
    let maxCount = 0;
    let majorityColor = '#22c55e'; // Default green

    for (const [color, count] of Object.entries(statusCounts)) {
        if (count > maxCount) {
            maxCount = count;
            majorityColor = color;
        }
    }

    return majorityColor;
};

// Selection Box Interface
interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

interface MarkersProps {
    isSelectionMode: boolean;
    onSelectedIdsChange: (ids: number[] | ((prev: number[]) => number[])) => void;
    selectedTreeIds: number[];
}

function Markers({ isSelectionMode, onSelectedIdsChange, selectedTreeIds }: MarkersProps) {
    const map = useMap();
    const [bounds, setBounds] = useState<any>(null);
    const [zoom, setZoom] = useState(10);
    const [trees, setTrees] = useState<MapTree[]>([]);

    // Selection States
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const isDraggingSelection = useRef(false);
    const mapContainerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        mapContainerRef.current = map.getContainer();
    }, [map]);

    useEffect(() => {
        async function fetchTrees() {
            try {
                // Use the same bounded fetch or just get all for now, but ensure correct format
                const response = await fetch('/api/trees');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTrees(data);
                } else {
                    console.error('API returned non-array:', data);
                    setTrees([]);
                }
            } catch (error) {
                console.error('Failed to fetch trees:', error);
                setTrees([]);
            }
        }
        fetchTrees();
    }, []);

    // Update bounds on move
    useEffect(() => {
        const updateMap = () => {
            const b = map.getBounds();
            setBounds([
                b.getSouthWest().lng,
                b.getSouthWest().lat,
                b.getNorthEast().lng,
                b.getNorthEast().lat
            ]);
            setZoom(map.getZoom());
        };

        updateMap();
        map.on('moveend', updateMap);
        return () => { map.off('moveend', updateMap); };
    }, [map]);

    const points = useMemo(() => trees.map(tree => ({
        type: 'Feature',
        properties: {
            cluster: false,
            treeId: tree.id,
            etiqueta: tree.lbl,
            species: tree.sp,
            status: tree.st || 'Regular'
        },
        geometry: {
            type: 'Point',
            coordinates: [tree.lng, tree.lat]
        }
    })), [trees]);

    const { clusters, supercluster } = useSupercluster({
        points: points as any,
        bounds: bounds,
        zoom: zoom,
        options: { radius: 75, maxZoom: 17 }
    });

    const handleTreeClick = (treeId: number, originalEvent: MouseEvent) => {
        onSelectedIdsChange(prev =>
            prev.includes(treeId)
                ? prev.filter(id => id !== treeId)
                : [...prev, treeId]
        );
    };

    const treesRef = useRef(trees);
    treesRef.current = trees;

    const finalizeSelection = () => {
        if (!selectionBox) return;
        const start = map.containerPointToLatLng([selectionBox.startX, selectionBox.startY]);
        const end = map.containerPointToLatLng([selectionBox.endX, selectionBox.endY]);
        const selectionBounds = new LatLngBounds(start, end);

        const treesInBox = treesRef.current.filter(tree =>
            selectionBounds.contains([tree.lat, tree.lng])
        );

        const newIds = treesInBox.map(t => t.id);
        onSelectedIdsChange(prev => {
            const combined = new Set([...prev, ...newIds]);
            return Array.from(combined);
        });
        setSelectionBox(null);
    };

    return (
        <>
            {isSelectionMode && (
                <div
                    className="absolute inset-0 z-[400]"
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        isDraggingSelection.current = true;
                        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
                    }}
                    onMouseMove={(e) => {
                        if (!isDraggingSelection.current || !selectionBox) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        setSelectionBox(prev => prev ? ({ ...prev, endX: x, endY: y }) : null);
                    }}
                    onMouseUp={() => {
                        if (isDraggingSelection.current) {
                            isDraggingSelection.current = false;
                            finalizeSelection();
                        }
                    }}
                    onMouseLeave={() => {
                        if (isDraggingSelection.current) {
                            isDraggingSelection.current = false;
                            setSelectionBox(null);
                        }
                    }}
                >
                    {selectionBox && (
                        <div style={{
                            position: 'absolute',
                            left: Math.min(selectionBox.startX, selectionBox.endX),
                            top: Math.min(selectionBox.startY, selectionBox.endY),
                            width: Math.abs(selectionBox.endX - selectionBox.startX),
                            height: Math.abs(selectionBox.endY - selectionBox.startY),
                            border: '2px dashed #3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            pointerEvents: 'none'
                        }} />
                    )}
                </div>
            )}

            {clusters.map((cluster) => {
                const [longitude, latitude] = cluster.geometry.coordinates;
                const { cluster: isCluster, point_count } = cluster.properties;

                if (isCluster) {
                    const leaves = supercluster.getLeaves(cluster.id, Infinity);
                    const majorityColor = getMajorityHealthColor(leaves);
                    return (
                        <Marker
                            key={`cluster-${cluster.id}`}
                            position={[latitude, longitude]}
                            icon={getClusterIcon(point_count, majorityColor)}
                            eventHandlers={{
                                click: () => {
                                    if (!isSelectionMode) {
                                        const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 22);
                                        map.setView([latitude, longitude], expansionZoom, { animate: true });
                                    }
                                }
                            }}
                        />
                    );
                }

                const isSelected = selectedTreeIds.includes(cluster.properties.treeId);

                return (
                    <Marker
                        key={`tree-${cluster.properties.treeId}`}
                        position={[latitude, longitude]}
                        icon={getTreeIcon(cluster.properties.status, isSelected)}
                        opacity={isSelected ? 1.0 : 0.9}
                        zIndexOffset={isSelected ? 1000 : 0}
                        eventHandlers={{
                            click: (e) => {
                                handleTreeClick(cluster.properties.treeId, e.originalEvent);
                                if (isSelectionMode) {
                                    e.target.closePopup();
                                }
                            }
                        }}
                    >
                        {!isSelectionMode && (
                            <Popup>
                                <strong>Etiqueta:</strong> {cluster.properties.etiqueta} <br />
                                <strong>Espécie:</strong> {cluster.properties.species || 'Desconhecida'} <br />
                                <strong>Saúde:</strong> {cluster.properties.status} <br />
                                <div className="mt-2 flex gap-2">
                                    <Link
                                        href={`/trees/${cluster.properties.treeId}`}
                                        className="inline-block px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                                    >
                                        Ver Detalhes
                                    </Link>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                );
            })}
        </>
    );
}

export default function ServiceOrderCreationMap() {
    const [isSelectionMode, setIsSelectionMode] = useState(true);
    const [selectedTreeIds, setSelectedTreeIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleCreateServiceOrder = async (data: any) => {
        try {
            const res = await fetch('/api/service-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    treeIds: selectedTreeIds,
                    ...data
                })
            });
            if (res.ok) {
                alert('Ordem de Serviço criada com sucesso!');
                setSelectedTreeIds([]);
            } else {
                alert('Erro ao criar O.S.');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao criar O.S.');
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* Tool Toggle */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex gap-1">
                <button
                    onClick={() => setIsSelectionMode(false)}
                    className={`p-2 rounded ${!isSelectionMode ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    title="Modo Navegar (Arrastar para Mover)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                    </svg>
                </button>
                <button
                    onClick={() => setIsSelectionMode(true)}
                    className={`p-2 rounded ${isSelectionMode ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    title="Modo Seleção (Arrastar para Selecionar)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </button>
            </div>

            {/* Creation UI - OUTSIDE MapContainer */}
            <div className="absolute bottom-8 left-4 z-[2000]">
                <div className="bg-white p-4 rounded-lg shadow-xl border border-green-500 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-5 mb-2">
                    <h4 className="font-bold text-gray-800">
                        {selectedTreeIds.length} Árvores Selecionadas
                    </h4>
                    <div className="flex gap-2">
                        <button
                            onClick={openModal}
                            disabled={selectedTreeIds.length === 0}
                            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            Criar Ordem de Serviço
                        </button>
                        {selectedTreeIds.length > 0 && (
                            <button
                                onClick={() => setSelectedTreeIds([])}
                                className="bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <MapContainer
                center={[-29.852, -51.1841]}
                zoom={16}
                scrollWheelZoom={true}
                dragging={!isSelectionMode}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                maxZoom={22}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxNativeZoom={19}
                    maxZoom={22}
                />

                <Markers
                    isSelectionMode={isSelectionMode}
                    selectedTreeIds={selectedTreeIds}
                    onSelectedIdsChange={setSelectedTreeIds}
                />

                <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
                    <div className="leaflet-control leaflet-bar bg-white p-4 shadow-lg rounded-lg border border-gray-200">
                        {/* Legend content same as before */}
                        <h4 className="font-bold text-gray-900 mb-2">Estado Fitossanitário</h4>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#22c55e]"></span>
                                <span className="text-sm text-gray-700">Bom</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#eab308]"></span>
                                <span className="text-sm text-gray-700">Regular</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#ef4444]"></span>
                                <span className="text-sm text-gray-700">Ruim</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-black"></span>
                                <span className="text-sm text-gray-700">Morta / Desvitalizada</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                <span className="w-4 h-4 rounded-full bg-[#3b82f6] border-2 border-[#1d4ed8]"></span>
                                <span className="text-sm text-gray-900 font-bold">Selecionada</span>
                            </div>
                        </div>
                    </div>
                </div>
            </MapContainer>

            <ServiceOrderCreateModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleCreateServiceOrder}
                treeCount={selectedTreeIds.length}
            />
        </div>
    );
}
