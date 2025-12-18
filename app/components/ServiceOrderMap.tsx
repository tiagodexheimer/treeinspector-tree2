'use client';

import { divIcon, LatLngBoundsExpression } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect } from 'react';

interface ServiceOrderMapProps {
    trees: {
        id_arvore: number;
        lat: number;
        lng: number;
        numero_etiqueta: string;
        species?: {
            nome_comum: string;
        };
    }[];
}

const getTreeIcon = () => {
    const color = '#ef4444'; // Red for OS targets

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

function MapBounds({ trees }: { trees: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (trees.length > 0) {
            const latLngs = trees.map(t => [t.lat, t.lng]);
            const bounds = latLngs as unknown as LatLngBoundsExpression;
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        }
    }, [trees, map]);

    return null;
}

export default function ServiceOrderMap({ trees }: ServiceOrderMapProps) {
    // Calculate center based on first tree or default
    const centerLat = trees.length > 0 ? trees[0].lat : -29.852;
    const centerLng = trees.length > 0 ? trees[0].lng : -51.1841;

    return (
        <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-md border border-gray-200 relative z-0">
            <MapContainer
                center={[centerLat, centerLng]}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxNativeZoom={19}
                    maxZoom={22}
                />

                <MapBounds trees={trees} />

                {trees.map(tree => (
                    <Marker
                        key={tree.id_arvore}
                        position={[tree.lat, tree.lng]}
                        icon={getTreeIcon()}
                    >
                        <Popup>
                            <strong>#{tree.numero_etiqueta || tree.id_arvore}</strong><br />
                            {tree.species?.nome_comum || 'Espécie desconhecida'}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
