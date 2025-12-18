'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { divIcon, LatLngBounds } from 'leaflet';
import useSupercluster from 'use-supercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

interface Tree {
    id_arvore: number;
    lat: number;
    lng: number;
    numero_etiqueta: string;
    bairro?: string;
    species?: {
        nome_comum: string;
    };
}

interface SelectedTree {
    id: number;
    etiqueta: string;
    species: string;
    bairro: string;
}

interface SelectionMapProps {
    onTreeSelect: (tree: SelectedTree) => void;
    onRectangleSelect: (trees: SelectedTree[]) => void;
    selectedTreeIds: number[];
    selectionMode: 'rectangle' | 'click';
}

const getTreeIcon = (isSelected: boolean) => {
    const color = isSelected ? '#2563eb' : '#22c55e';
    const strokeColor = isSelected ? '#1d4ed8' : '#2e3a47';
    const strokeWidth = isSelected ? 12 : 8;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20">
        <path d="M224 480h64c8.8 0 16-7.2 16-16V352h-96v112c0 8.8 7.2 16 16 16z" fill="#795548"/>
        <path d="M464 256h-23.7c9.5-18.7 15.7-39.7 15.7-62.1 0-69.6-50.6-127.3-116.8-141C333.1 22.9 296.8 0 256 0s-77.1 22.9-83.2 52.9C106.6 66.8 56 124.5 56 193.9c0 22.3 6.2 43.4 15.7 62.1H48c-26.5 0-48 21.5-48 48s21.5 48 48 48h416c26.5 0 48-21.5 48-48s-21.5-48-48-48z" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
    </svg>`;

    return divIcon({
        html: svg,
        className: 'bg-transparent',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const getClusterIcon = (count: number, hasSelected: boolean) => {
    const bgColor = hasSelected ? 'rgba(37, 99, 235, 0.9)' : 'rgba(34, 197, 94, 0.9)';
    return divIcon({
        html: `<div style="
            width: 30px; 
            height: 30px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background-color: ${bgColor}; 
            border-radius: 50%; 
            color: white; 
            font-weight: bold; 
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            font-size: 12px;
        ">${count}</div>`,
        className: 'cluster-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

// Inner component that uses the map context
function MapContent({
    trees,
    onTreeSelect,
    onRectangleSelect,
    selectedTreeIds,
    selectionMode
}: {
    trees: Tree[];
    onTreeSelect: (tree: SelectedTree) => void;
    onRectangleSelect: (trees: SelectedTree[]) => void;
    selectedTreeIds: number[];
    selectionMode: 'rectangle' | 'click';
}) {
    const map = useMap();
    const [bounds, setBounds] = useState<any>(null);
    const [zoom, setZoom] = useState(14);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ lat: number; lng: number } | null>(null);
    const [currentRect, setCurrentRect] = useState<HTMLDivElement | null>(null);

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

    // Convert trees to GeoJSON points
    const points = useMemo(() => trees.map(tree => ({
        type: 'Feature',
        properties: {
            cluster: false,
            treeId: tree.id_arvore,
            etiqueta: tree.numero_etiqueta,
            species: tree.species?.nome_comum || '',
            bairro: tree.bairro || '',
            isSelected: selectedTreeIds.includes(tree.id_arvore)
        },
        geometry: {
            type: 'Point',
            coordinates: [tree.lng, tree.lat]
        }
    })), [trees, selectedTreeIds]);

    const { clusters, supercluster } = useSupercluster({
        points: points as any,
        bounds: bounds,
        zoom: zoom,
        options: { radius: 60, maxZoom: 17 }
    });

    // Rectangle selection handler
    useMapEvents({
        mousedown: (e) => {
            if (selectionMode !== 'rectangle') return;
            setIsDrawing(true);
            setStartPos({ lat: e.latlng.lat, lng: e.latlng.lng });

            const rect = document.createElement('div');
            rect.style.cssText = `
                position: absolute;
                border: 2px dashed #2563eb;
                background: rgba(37, 99, 235, 0.1);
                pointer-events: none;
                z-index: 1000;
            `;
            map.getContainer().appendChild(rect);
            setCurrentRect(rect);
            map.dragging.disable();
        },
        mousemove: (e) => {
            if (!isDrawing || !startPos || !currentRect) return;

            const startPoint = map.latLngToContainerPoint([startPos.lat, startPos.lng]);
            const currentPoint = map.latLngToContainerPoint(e.latlng);

            const left = Math.min(startPoint.x, currentPoint.x);
            const top = Math.min(startPoint.y, currentPoint.y);
            const width = Math.abs(currentPoint.x - startPoint.x);
            const height = Math.abs(currentPoint.y - startPoint.y);

            currentRect.style.left = `${left}px`;
            currentRect.style.top = `${top}px`;
            currentRect.style.width = `${width}px`;
            currentRect.style.height = `${height}px`;
        },
        mouseup: (e) => {
            if (!isDrawing || !startPos) return;

            if (currentRect) {
                currentRect.remove();
                setCurrentRect(null);
            }

            const selectionBounds = new LatLngBounds(
                [Math.min(startPos.lat, e.latlng.lat), Math.min(startPos.lng, e.latlng.lng)],
                [Math.max(startPos.lat, e.latlng.lat), Math.max(startPos.lng, e.latlng.lng)]
            );

            const treesInBounds = trees.filter(tree =>
                tree.lat && tree.lng && selectionBounds.contains([tree.lat, tree.lng])
            ).map(tree => ({
                id: tree.id_arvore,
                etiqueta: tree.numero_etiqueta,
                species: tree.species?.nome_comum || '',
                bairro: tree.bairro || ''
            }));

            if (treesInBounds.length > 0) {
                onRectangleSelect(treesInBounds);
            }

            setIsDrawing(false);
            setStartPos(null);
            map.dragging.enable();
        }
    });

    return (
        <>
            {clusters.map((cluster) => {
                const [longitude, latitude] = cluster.geometry.coordinates;
                const { cluster: isCluster, point_count } = cluster.properties;

                if (isCluster) {
                    // Check if any tree in cluster is selected
                    const leaves = supercluster.getLeaves(cluster.id, Infinity);
                    const hasSelected = leaves.some((leaf: any) =>
                        selectedTreeIds.includes(leaf.properties.treeId)
                    );

                    return (
                        <Marker
                            key={`cluster-${cluster.id}`}
                            position={[latitude, longitude]}
                            icon={getClusterIcon(point_count, hasSelected)}
                            eventHandlers={{
                                click: () => {
                                    const expansionZoom = Math.min(
                                        supercluster.getClusterExpansionZoom(cluster.id),
                                        22
                                    );
                                    map.setView([latitude, longitude], expansionZoom, {
                                        animate: true
                                    });
                                }
                            }}
                        />
                    );
                }

                // Individual Marker
                const isSelected = selectedTreeIds.includes(cluster.properties.treeId);
                return (
                    <Marker
                        key={`tree-${cluster.properties.treeId}`}
                        position={[latitude, longitude]}
                        icon={getTreeIcon(isSelected)}
                        eventHandlers={{
                            click: () => {
                                if (selectionMode === 'click') {
                                    onTreeSelect({
                                        id: cluster.properties.treeId,
                                        etiqueta: cluster.properties.etiqueta,
                                        species: cluster.properties.species,
                                        bairro: cluster.properties.bairro
                                    });
                                }
                            }
                        }}
                    />
                );
            })}
        </>
    );
}

export default function SelectionMap({
    onTreeSelect,
    onRectangleSelect,
    selectedTreeIds,
    selectionMode
}: SelectionMapProps) {
    const [trees, setTrees] = useState<Tree[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTrees() {
            try {
                const response = await fetch('/api/trees');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    setTrees(data);
                } else {
                    setError('Formato de dados invalido');
                }
            } catch (err) {
                console.error('Failed to fetch trees:', err);
                setError('Erro ao carregar arvores');
            } finally {
                setLoading(false);
            }
        }
        fetchTrees();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando arvores...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-red-600">
                    <p className="text-xl mb-2">⚠️</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={[-29.852, -51.1841]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapContent
                trees={trees}
                onTreeSelect={onTreeSelect}
                onRectangleSelect={onRectangleSelect}
                selectedTreeIds={selectedTreeIds}
                selectionMode={selectionMode}
            />
        </MapContainer>
    );
}
