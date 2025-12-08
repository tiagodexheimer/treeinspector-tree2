'use client';

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
}

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
    <MapContainer center={[-23.5505, -46.6333]} zoom={13} scrollWheelZoom={true} style={{ height: '600px', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trees.map((tree) => (
        tree.lat && tree.lng ? (
          <Marker key={tree.id_arvore} position={[tree.lat, tree.lng]}>
            <Popup>
              <strong>Etiqueta:</strong> {tree.numero_etiqueta} <br />
              <strong>Espécie:</strong> {tree.species?.nome_comum || 'Desconhecida'} <br />
              <span className="text-xs text-gray-500">ID: {tree.id_arvore}</span>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
}
