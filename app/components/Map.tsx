'use client';

import { divIcon } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect, useState, useMemo } from 'react';
import useSupercluster from 'use-supercluster';

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
    iconSize: [24, 24], // Slightly larger for better visibility
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const getClusterIcon = (count: number) => {
  return divIcon({
    html: `<div style="
            width: 30px; 
            height: 30px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background-color: rgba(34, 197, 94, 0.9); 
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

function Markers() {
  const map = useMap();
  const [bounds, setBounds] = useState<any>(null);
  const [zoom, setZoom] = useState(10);
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

    updateMap(); // Initial
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
      species: tree.species?.nome_comum,
      status: tree.inspections?.[0]?.phytosanitary?.[0]?.estado_saude || 'Regular'
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
    options: { radius: 75, maxZoom: 17 } // Clusters break apart at zoom 18
  });

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count } = cluster.properties;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={getClusterIcon(point_count)}
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
        return (
          <Marker
            key={`tree-${cluster.properties.treeId}`}
            position={[latitude, longitude]}
            icon={getTreeIcon(cluster.properties.status)}
          >
            <Popup>
              <strong>Etiqueta:</strong> {cluster.properties.etiqueta} <br />
              <strong>Espécie:</strong> {cluster.properties.species || 'Desconhecida'} <br />
              <strong>Saúde:</strong> {cluster.properties.status} <br />
              <span className="text-xs text-gray-500">ID: {cluster.properties.treeId}</span>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function Map() {
  return (
    <MapContainer
      center={[-29.852, -51.1841]}
      zoom={16} // Increased initial zoom level as requested
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', zIndex: 0 }}
      maxZoom={22}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={22}
      />

      <Markers />

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
