import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// 0.003 degrees is approx 330 meters
const GRID_SIZE = 0.003;

interface GridCell {
    latSum: number;
    lngSum: number;
    count: number;
    health: { [key: string]: number };
    management: { [key: string]: number };
    gridLat: number;
    gridLng: number;
}

export async function GET() {
    try {
        // Fetch trees with location and health data
        const trees = await prisma.tree.findMany({
            where: {
                lat: { not: null },
                lng: { not: null }
            },
            select: {
                id_arvore: true,
                lat: true,
                lng: true,
                inspections: {
                    orderBy: { data_inspecao: 'desc' },
                    take: 1,
                    select: {
                        phytosanitary: {
                            select: {
                                estado_saude: true
                            }
                        },
                        managementActions: {
                            select: {
                                manejo_tipo: true,
                                poda_tipos: true,
                                supressao_tipo: true,
                                necessita_manejo: true
                            }
                        }
                    }
                }
            }
        });

        // Grid Aggregation
        const grid = new Map<string, GridCell>();

        for (const tree of trees) {
            if (!tree.lat || !tree.lng) continue;

            // Quantize coordinates to create grid keys
            const gridLat = Math.round(tree.lat / GRID_SIZE) * GRID_SIZE;
            const gridLng = Math.round(tree.lng / GRID_SIZE) * GRID_SIZE;
            const key = `${gridLat.toFixed(4)}_${gridLng.toFixed(4)}`;

            if (!grid.has(key)) {
                grid.set(key, {
                    latSum: 0,
                    lngSum: 0,
                    count: 0,
                    health: {
                        'Bom': 0,
                        'Regular': 0,
                        'Ruim': 0,
                        'Morta/Desvitalizada': 0
                    },
                    management: {
                        'Remocao': 0,
                        'Substituicao': 0,
                        'Poda': 0
                    },
                    gridLat: gridLat,
                    gridLng: gridLng
                });
            }

            const cell = grid.get(key)!;
            cell.latSum += tree.lat;
            cell.lngSum += tree.lng;
            cell.count++;

            // Health Count
            const health = tree.inspections[0]?.phytosanitary[0]?.estado_saude || 'Regular';

            // Normalize health status
            let normalizedHealth = 'Regular';
            if (health.includes('Bom')) normalizedHealth = 'Bom';
            else if (health.includes('Ruim')) normalizedHealth = 'Ruim';
            else if (health.includes('Morta') || health.includes('Desv')) normalizedHealth = 'Morta/Desvitalizada';

            if (cell.health[normalizedHealth] !== undefined) {
                cell.health[normalizedHealth]++;
            } else {
                cell.health['Regular']++; // Fallback
            }

            // Management Count
            const management = tree.inspections[0]?.managementActions[0];
            if (management && management.necessita_manejo) {
                if (management.supressao_tipo === 'Remoção') cell.management['Remocao']++;
                else if (management.supressao_tipo === 'Substituição' || management.supressao_tipo === 'substituicao') cell.management['Substituicao']++;
                else if (management.manejo_tipo === 'Poda' || (management.poda_tipos && management.poda_tipos.length > 0)) cell.management['Poda']++;
            }
        }

        // Format result
        const result = Array.from(grid.values()).map(cell => {
            // Determine predominant health
            let maxHealth = 'Regular';
            let maxHealthCount = -1;
            for (const [status, count] of Object.entries(cell.health)) {
                if (count > maxHealthCount) {
                    maxHealthCount = count;
                    maxHealth = status;
                }
            }

            // Determine predominant management
            let maxManagement = '';
            let maxManagementCount = 0;
            for (const [action, count] of Object.entries(cell.management)) {
                // Priority: Removal > Replacement > Pruning
                if (count > maxManagementCount) {
                    maxManagementCount = count;
                    maxManagement = action;
                }
            }

            if (cell.management['Remocao'] > 0 && cell.management['Remocao'] >= cell.management['Substituicao'] && cell.management['Remocao'] >= cell.management['Poda']) {
                maxManagement = 'Remocao';
            } else if (cell.management['Substituicao'] > 0 && cell.management['Substituicao'] >= cell.management['Poda']) {
                if (maxManagement !== 'Remocao') maxManagement = 'Substituicao';
            }

            return {
                lat: cell.latSum / cell.count, // Centroid of trees in cell
                lng: cell.lngSum / cell.count,
                count: cell.count,
                predominant_health: maxHealth,
                health_counts: cell.health,
                predominant_action: maxManagementCount > 0 ? maxManagement : null,
                management_counts: cell.management,
                grid_lat: cell.gridLat, // Quantized Center
                grid_lng: cell.gridLng  // Quantized Center
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching grid stats:', error);
        return NextResponse.json({ error: 'Failed to fetch grid stats' }, { status: 500 });
    }
}
