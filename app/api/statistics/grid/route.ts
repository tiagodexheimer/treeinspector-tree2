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
        // Fetch trees with location and health data using Raw SQL to extract PostGIS coordinates
        const trees: any[] = await prisma.$queryRaw`
            SELECT 
                t.id_arvore,
                ST_Y(t.localizacao::geometry) as lat,
                ST_X(t.localizacao::geometry) as lng,
                p.estado_saude,
                m.necessita_manejo,
                m.manejo_tipo,
                m.supressao_tipo,
                m.poda_tipos
            FROM "Tree" t
            LEFT JOIN LATERAL (
                SELECT id_inspecao 
                FROM "Inspection" 
                WHERE "treeId" = t.id_arvore 
                ORDER BY data_inspecao DESC 
                LIMIT 1
            ) last_i ON true
            LEFT JOIN "PhytosanitaryData" p ON p."inspectionId" = last_i.id_inspecao
            LEFT JOIN "ManagementAction" m ON m."inspectionId" = last_i.id_inspecao
            WHERE t.localizacao IS NOT NULL
        `;

        // Grid Aggregation
        const grid = new Map<string, GridCell>();

        for (const tree of trees) {
            const lat = tree.lat;
            const lng = tree.lng;

            if (lat === null || lng === null) continue;

            // Quantize coordinates to create grid keys
            const gridLat = Math.round(lat / GRID_SIZE) * GRID_SIZE;
            const gridLng = Math.round(lng / GRID_SIZE) * GRID_SIZE;

            // Faster key generation
            const key = `${gridLat.toFixed(4)}|${gridLng.toFixed(4)}`;

            let cell = grid.get(key);
            if (!cell) {
                cell = {
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
                        'Poda': 0,
                        'Transplante': 0
                    },
                    gridLat: gridLat,
                    gridLng: gridLng
                };
                grid.set(key, cell);
            }

            cell.latSum += lat;
            cell.lngSum += lng;
            cell.count++;

            // Health Count - Optimized normalization
            const health = tree.estado_saude || 'Regular';
            let normalizedHealth = 'Regular';
            if (health.includes('Bom')) normalizedHealth = 'Bom';
            else if (health.includes('Ruim') || health.includes('péssim')) normalizedHealth = 'Ruim';
            else if (health.includes('Morta') || health.includes('Desv')) normalizedHealth = 'Morta/Desvitalizada';

            cell.health[normalizedHealth]++;

            // Management Count
            if (tree.necessita_manejo) {
                const tipo = (tree.manejo_tipo || '').toLowerCase();
                const subTipo = (tree.supressao_tipo || '').toLowerCase();

                if (subTipo.includes('remoção') || subTipo.includes('remocao') || tipo.includes('remoção') || tipo.includes('remocao')) {
                    cell.management['Remocao']++;
                }
                else if (subTipo.includes('substituição') || subTipo.includes('substituicao') || tipo.includes('substituição') || tipo.includes('substituicao')) {
                    cell.management['Substituicao']++;
                }
                else if (tipo.includes('transplante')) {
                    cell.management['Transplante']++;
                }
                else if (tipo.includes('poda') || (tree.poda_tipos && tree.poda_tipos.length > 0)) {
                    cell.management['Poda']++;
                }
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
                // Priority: Removal > Replacement > Transplant > Pruning
                if (count > maxManagementCount) {
                    maxManagementCount = count;
                    maxManagement = action;
                }
            }

            // Tie-breaking priority
            if (cell.management['Remocao'] > 0 && cell.management['Remocao'] >= maxManagementCount) maxManagement = 'Remocao';
            else if (cell.management['Substituicao'] > 0 && cell.management['Substituicao'] >= maxManagementCount) maxManagement = 'Substituicao';

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

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200'
            }
        });
    } catch (error) {
        console.error('Error fetching grid stats:', error);
        return NextResponse.json({ error: 'Failed to fetch grid stats' }, { status: 500 });
    }
}
