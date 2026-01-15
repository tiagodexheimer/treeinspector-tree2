'use client';

import { divIcon } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect, useState, useMemo, useRef } from 'react';
import useSupercluster from 'use-supercluster';
import dynamic from 'next/dynamic';

const PhytosanitaryHeatmap = dynamic(() => import('./PhytosanitaryHeatmap'), { ssr: false });

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

const getHealthColor = (status: string): string => {
  const s = status?.toLowerCase() || '';
  if (s.includes('ruim') || s.includes('péssim')) return '#ef4444'; // Red
  if (s.includes('regular')) return '#eab308'; // Yellow
  if (s.includes('mort') || s.includes('desv')) return '#000000'; // Black
  return '#22c55e'; // Green (Bom)
};

const iconCache: Record<string, any> = {};

const getTreeIcon = (status: string) => {
  const color = getHealthColor(status);
  const cacheKey = `tree-${color}`;
  if (iconCache[cacheKey]) return iconCache[cacheKey];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16">
        <path d="M224 480h64c8.8 0 16-7.2 16-16V352h-96v112c0 8.8 7.2 16 16 16z" fill="#795548"/>
        <path d="M464 256h-23.7c9.5-18.7 15.7-39.7 15.7-62.1 0-69.6-50.6-127.3-116.8-141C333.1 22.9 296.8 0 256 0s-77.1 22.9-83.2 52.9C106.6 66.8 56 124.5 56 193.9c0 22.3 6.2 43.4 15.7 62.1H48c-26.5 0-48 21.5-48 48s21.5 48 48 48h416c26.5 0 48-21.5 48-48s-21.5-48-48-48z" fill="${color}" stroke="#2e3a47" stroke-width="8"/>
    </svg>`;

  iconCache[cacheKey] = divIcon({
    html: svg,
    className: 'bg-transparent',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
  return iconCache[cacheKey];
};

const getClusterIcon = (count: number, majorityColor: string) => {
  const cacheKey = `cluster-${count}-${majorityColor}`;
  if (iconCache[cacheKey]) return iconCache[cacheKey];

  iconCache[cacheKey] = divIcon({
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
  return iconCache[cacheKey];
};

// Simplified majority health color from pre-calculated counts
const getMajorityHealthColorFromCounts = (counts: any): string => {
  const mapping = [
    { color: '#ef4444', count: counts.ruim },
    { color: '#eab308', count: counts.regular },
    { color: '#000000', count: counts.morta },
    { color: '#22c55e', count: counts.bom },
  ];

  let majority = mapping[0];
  for (let i = 1; i < mapping.length; i++) {
    if (mapping[i].count > majority.count) {
      majority = mapping[i];
    }
  }

  return majority.count > 0 ? majority.color : '#22c55e';
};

function Markers() {
  const map = useMap();
  const [bounds, setBounds] = useState<any>(null);
  const [zoom, setZoom] = useState(10);
  const [trees, setTrees] = useState<MapTree[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false); // NEW STATE

  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Função de busca dinâmica
  const fetchTreesInBounds = async (mapBounds: L.LatLngBounds) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const sw = mapBounds.getSouthWest();
      const ne = mapBounds.getNorthEast();

      const params = new URLSearchParams({
        minLat: sw.lat.toString(),
        maxLat: ne.lat.toString(),
        minLng: sw.lng.toString(),
        maxLng: ne.lng.toString()
      });

      const response = await fetch(`/api/trees?${params.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      if (Array.isArray(data)) {
        setTrees(data);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to fetch trees:', error);
      }
    }
  };

  useEffect(() => {
    if (!map) return;

    const updateMap = () => {
      const b = map.getBounds();
      setBounds([
        b.getSouthWest().lng,
        b.getSouthWest().lat,
        b.getNorthEast().lng,
        b.getNorthEast().lat
      ]);

      setZoom(Math.round(map.getZoom()));

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

      fetchTimeoutRef.current = setTimeout(() => {
        fetchTreesInBounds(b);
      }, 300);
    };

    updateMap();
    map.on('moveend', updateMap);
    map.on('zoomend', updateMap);

    return () => {
      map.off('moveend', updateMap);
      map.off('zoomend', updateMap);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [map]);


  const points = useMemo(() => trees.map(tree => ({
    type: 'Feature',
    properties: {
      cluster: false,
      treeId: tree.id,
      etiqueta: tree.lbl,
      species: tree.sp,
      status: tree.st
    },
    geometry: {
      type: 'Point',
      coordinates: [tree.lng, tree.lat]
    }
  })), [trees]);

  const superclusterOptions = useMemo(() => ({
    radius: 75,
    maxZoom: 17,
    map: (props: any) => {
      const s = (props.status || '').toLowerCase();
      return {
        bom: s.includes('bom') ? 1 : 0,
        regular: s.includes('regular') ? 1 : 0,
        ruim: (s.includes('ruim') || s.includes('péssim') || s.includes('pessim')) ? 1 : 0,
        morta: (s.includes('morta') || s.includes('desv')) ? 1 : 0,
      };
    },
    reduce: (acc: any, props: any) => {
      acc.bom += props.bom;
      acc.regular += props.regular;
      acc.ruim += props.ruim;
      acc.morta += props.morta;
    }
  }), []);

  const { clusters, supercluster } = useSupercluster({
    points: points as any,
    bounds: bounds,
    zoom: zoom,
    options: superclusterOptions
  });

  const heatmapPoints = useMemo(() => {
    if (!showHeatmap) return [];
    return trees
      .filter((t: any) => {
        // Heatmap triggers:
        // 1. High Severity (>= 2)
        // 2. Confirmed Pests (pc > 0)
        // 3. Bad Health Status (Ruim, Morta, Desvitalizada)
        // Explicitly EXCLUDE 'Regular' and 'Bom' unless they match above criteria
        const badStatus = t.st && (t.st.includes('Ruim') || t.st.includes('Morta') || t.st.includes('Desvitalizada') || t.st.includes('Péssima'));
        return (t.sev && t.sev >= 2) || (t.pc && t.pc > 0) || badStatus;
      })
      .map((t: any) => ({
        lat: t.lat,
        lng: t.lng,
        // Intensity tuning:
        // Severity 5 -> 1.0 (Red)
        // Severity 3 -> 0.6 (Yellow)
        // Pest Count > 0 -> 0.7 (Orange) if no severity
        // Bad Status -> 0.5 (Green/Yellowish fallback)
        intensity: t.sev ? (t.sev / 5) : (t.pc ? 0.7 : 0.5)
      }));
  }, [trees, showHeatmap]);

  return (
    <>
      <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', marginTop: '10px', marginRight: '10px' }}>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`font-bold py-2 px-4 rounded shadow border transition-colors ${showHeatmap
            ? 'bg-orange-600 text-white border-orange-700 hover:bg-orange-700'
            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
        >
          {showHeatmap ? '🔥 Mapa de Calor: ON' : '🌲 Mapa de Calor: OFF'}
        </button>
      </div>

      {showHeatmap && <PhytosanitaryHeatmap points={heatmapPoints} />}

      {!showHeatmap &&
        clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count } = cluster.properties;

          if (isCluster) {
            const majorityColor = getMajorityHealthColorFromCounts(cluster.properties);

            return (
              <Marker
                key={`cluster-${cluster.id}`}
                position={[latitude, longitude]}
                icon={getClusterIcon(point_count, majorityColor)}
                eventHandlers={{
                  click: () => {
                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 22);
                    map.setView([latitude, longitude], expansionZoom, { animate: true });
                  }
                }}
              />
            );
          }

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
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/trees/${cluster.properties.treeId}`}
                    className="inline-block px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })
      }
    </>
  );
}

export default function Map() {
  return (
    <MapContainer
      center={[-29.852807, -51.178395]}
      zoom={18}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      maxZoom={22}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={22}
      />

      <Markers />

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