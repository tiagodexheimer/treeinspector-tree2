'use client';

import { divIcon } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect, useState } from 'react';

interface Tree {
  id_arvore: number;
  lat: number;
  lng: number;
  numero_etiqueta: string;
  speciesId: number;
  species?: {
    nome_comum: string;
  };
  inspections?: {
    phytosanitary?: {
      estado_saude?: string;
    }[];
  }[];
}

const getTreeIcon = (status: string) => {
  let color = '#22c55e'; // Green (Bom)
  const s = status?.toLowerCase() || '';

  if (s.includes('ruim') || s.includes('péssim')) color = '#ef4444'; // Red
  else if (s.includes('regular')) color = '#eab308'; // Yellow
  else if (s.includes('mort') || s.includes('desv')) color = '#000000'; // Black

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16">
        <!-- Trunk -->
        <path d="M224 480h64c8.8 0 16-7.2 16-16V352h-96v112c0 8.8 7.2 16 16 16z" fill="#795548"/>
        <!-- Foliage (Color coded) -->
        <path d="M464 256h-23.7c9.5-18.7 15.7-39.7 15.7-62.1 0-69.6-50.6-127.3-116.8-141C333.1 22.9 296.8 0 256 0s-77.1 22.9-83.2 52.9C106.6 66.8 56 124.5 56 193.9c0 22.3 6.2 43.4 15.7 62.1H48c-26.5 0-48 21.5-48 48s21.5 48 48 48h416c26.5 0 48-21.5 48-48s-21.5-48-48-48z" fill="${color}" stroke="#2e3a47" stroke-width="8"/>
    </svg>`;

  return divIcon({
    html: svg,
    className: 'bg-transparent',
    iconSize: [18, 18],
    iconAnchor: [9, 9], // Center
    popupAnchor: [0, -10]
  });
};

export default function Map() {
  const [trees, setTrees] = useState<Tree[]>([]);

  useEffect(() => {
    async function fetchTrees() {
      try {
        const response = await fetch('/api/trees');
        const data = await response.json();
        setTrees(data);
      } catch (error) {
        console.error('Failed to fetch trees:', error);
      }
    }
    fetchTrees();
  }, []);

  return (
    <MapContainer center={[-29.852, -51.1841]} zoom={13} scrollWheelZoom={true} style={{ height: '600px', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trees.map((tree) => {
        const status = tree.inspections?.[0]?.phytosanitary?.[0]?.estado_saude || 'Regular';
        return tree.lat && tree.lng ? (
          <Marker
            key={tree.id_arvore}
            position={[tree.lat, tree.lng]}
            icon={getTreeIcon(status)}
          >
            <Popup>
              <strong>Etiqueta:</strong> {tree.numero_etiqueta} <br />
              <strong>Espécie:</strong> {tree.species?.nome_comum || 'Desconhecida'} <br />
              <strong>Saúde:</strong> {status} <br />
              <span className="text-xs text-gray-500">ID: {tree.id_arvore}</span>
            </Popup>
          </Marker>
        ) : null;
      })}

      {/* Legend Overlay */}
      <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
        <div className="leaflet-control leaflet-bar bg-white p-4 shadow-lg rounded-lg border border-gray-200">
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
          </div>
        </div>
      </div>
    </MapContainer>
  );
}
