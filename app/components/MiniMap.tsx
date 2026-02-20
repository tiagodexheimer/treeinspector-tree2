'use client';

import { divIcon } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect, useState, useRef } from 'react';

interface MiniMapProps {
    lat: number;
    lng: number;
    currentTreeId: number;
}

const getTreeIcon = (isCurrent: boolean) => {
    const color = isCurrent ? '#ef4444' : '#3b82f6'; // Red for current, Blue for others

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24">
        <path d="M224 480h64c8.8 0 16-7.2 16-16V352h-96v112c0 8.8 7.2 16 16 16z" fill="#795548"/>
        <path d="M464 256h-23.7c9.5-18.7 15.7-39.7 15.7-62.1 0-69.6-50.6-127.3-116.8-141C333.1 22.9 296.8 0 256 0s-77.1 22.9-83.2 52.9C106.6 66.8 56 124.5 56 193.9c0 22.3 6.2 43.4 15.7 62.1H48c-26.5 0-48 21.5-48 48s21.5 48 48 48h416c26.5 0 48-21.5 48-48s-21.5-48-48-48z" fill="${color}" stroke="#2e3a47" stroke-width="8"/>
    </svg>`;

    return divIcon({
        html: svg,
        className: 'bg-transparent',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

export default function MiniMap({ lat, lng, currentTreeId }: MiniMapProps) {
    const [nearbyTrees, setNearbyTrees] = useState<any[]>([]);

    const fetchCalled = useRef(false);

    useEffect(() => {
        if (fetchCalled.current) return;
        fetchCalled.current = true;

        async function fetchNearby() {
            try {
                // Fetch nearby trees within 500m
                const res = await fetch(`/api/trees?lat=${lat}&lng=${lng}&radius=500`);
                if (res.ok) {
                    const data = await res.json();
                    setNearbyTrees(data);
                }
            } catch (e) {
                console.error("Failed to fetch nearby trees", e);
            }
        }
        fetchNearby();
    }, [lat, lng]);

    return (
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden shadow-md border border-gray-200 relative z-0">
            <MapContainer
                center={[lat, lng]}
                zoom={19}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxNativeZoom={19}
                    maxZoom={22}
                />

                {/* Current Tree Marker */}
                <Marker position={[lat, lng]} icon={getTreeIcon(true)} zIndexOffset={1000}>
                    <Popup>Árvore Atual (#{currentTreeId})</Popup>
                </Marker>

                {/* Nearby Trees */}
                {nearbyTrees.filter(t => (t.id || t.id_arvore) !== currentTreeId).map(tree => (
                    <Marker
                        key={tree.id || tree.id_arvore}
                        position={[tree.lat, tree.lng]}
                        icon={getTreeIcon(false)}
                    >
                        <Popup>
                            <strong>#{tree.etiqueta || tree.numero_etiqueta || tree.id || tree.id_arvore}</strong><br />
                            {tree.species_common || tree.species?.nome_comum || 'Desconhecida'}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
