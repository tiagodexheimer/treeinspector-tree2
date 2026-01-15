'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapProps {
    points: {
        lat: number;
        lng: number;
        intensity: number; // 0.0 to 1.0 (or higher)
    }[];
}

export default function PhytosanitaryHeatmap({ points }: HeatmapProps) {
    const map = useMap();
    const heatLayerRef = useRef<any>(null); // Type 'any' because leaflet.heat types might be messy or global

    useEffect(() => {
        if (!map) return;

        // Convert data format for L.heatLayer: [lat, lng, intensity]
        const heatPoints = points.map(p => [p.lat, p.lng, p.intensity]);

        // Remove previous layer if exists
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null; // Clean ref
        }

        // If we have points, create new layer
        if (heatPoints.length > 0) {
            // @ts-ignore - leaflet.heat adds this method to L
            heatLayerRef.current = L.heatLayer(heatPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 17,
                gradient: {
                    0.2: 'blue',
                    0.4: 'lime',
                    0.6: 'yellow',
                    0.8: '#f97316', // Orange
                    1.0: '#ef4444'  // Red
                },
                minOpacity: 0.4
            }).addTo(map);
        }

        // Cleanup on unmount or points change
        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
                heatLayerRef.current = null;
            }
        };

    }, [map, points]);

    return null; // This component renders nothing in DOM, it just manages the layer
}
