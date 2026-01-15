import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
    try {
        // Fetch all trees that need management
        // optimizing to fetch only necessary fields
        // Fetch trees with minimal fields for aggregation
        // We fetch ALL trees to calculate health statistics accurately, not just those needing management
        // Fetch trees using Raw SQL to extract PostGIS coordinates and latest health/management data
        const trees: any[] = await prisma.$queryRaw`
            SELECT 
                t.id_arvore,
                t.bairro,
                ST_Y(t.localizacao::geometry) as lat,
                ST_X(t.localizacao::geometry) as lng,
                p.estado_saude,
                m.necessita_manejo,
                m.manejo_tipo,
                m.supressao_tipo
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
            WHERE t.bairro IS NOT NULL
        `;

        // Aggregate by Bairro
        const stats = new Map<string, {
            bairro: string;
            total: number;

            // Management counts
            remocao: number;
            substituicao: number;
            poda: number;
            transplante: number;

            // Health counts
            health: { [key: string]: number };

            // Location avg
            latSum: number;
            lngSum: number;
            countLatChat: number;
        }>();

        for (const tree of (trees as any[])) {
            const bairroRaw = tree.bairro?.trim();
            if (!bairroRaw) continue;

            // Normalize to lowercase for grouping (prevents duplicates like "Parque Amador" vs "Parque amador")
            const bairroKey = bairroRaw.toLowerCase();

            // Use title case for display
            const bairroDisplay = bairroRaw.charAt(0).toUpperCase() + bairroRaw.slice(1).toLowerCase();

            if (!stats.has(bairroKey)) {
                stats.set(bairroKey, {
                    bairro: bairroDisplay,
                    total: 0,
                    remocao: 0,
                    substituicao: 0,
                    poda: 0,
                    transplante: 0,
                    health: {
                        'Bom': 0,
                        'Regular': 0,
                        'Ruim': 0,
                        'Morta/Desvitalizada': 0
                    },
                    latSum: 0,
                    lngSum: 0,
                    countLatChat: 0
                });
            }

            const entry = stats.get(bairroKey)!;
            entry.total++;

            // Sum coordinates
            if (tree.lat && tree.lng) {
                entry.latSum += tree.lat;
                entry.lngSum += tree.lng;
                entry.countLatChat++;
            }

            // Health Stats
            // Normalize to handle case sensitivity and variations
            const rawHealth = tree.estado_saude || 'Regular';
            const h = rawHealth.toLowerCase();

            if (h.includes('morta') || h.includes('desv')) {
                entry.health['Morta/Desvitalizada']++;
            } else if (h.includes('ruim') || h.includes('péssim') || h.includes('pessim')) {
                entry.health['Ruim']++;
            } else if (h.includes('bom') || h.includes('boa')) {
                entry.health['Bom']++;
            } else {
                // Default fallback to Regular for any other value (including 'regular', null default, etc)
                entry.health['Regular']++;
            }

            // Management Stats
            if (tree.necessita_manejo) {
                const type = (tree.manejo_tipo || '').toLowerCase();
                const subType = (tree.supressao_tipo || '').toLowerCase();

                if (subType.includes('remoção') || subType.includes('remocao') || type.includes('remoção') || type.includes('remocao')) {
                    entry.remocao++;
                } else if (subType.includes('substituição') || subType.includes('substituicao') || type.includes('substituição') || type.includes('substituicao')) {
                    entry.substituicao++;
                } else if (type.includes('transplante')) {
                    entry.transplante++;
                }

                if (type.includes('poda')) {
                    entry.poda++;
                }
            }
        }

        // Calculate averages and format result
        const result = Array.from(stats.values()).map(s => {
            // Determine predominant health
            let maxHealth = 'Regular';
            let maxCount = -1;
            for (const [status, count] of Object.entries(s.health)) {
                if (count > maxCount) {
                    maxCount = count;
                    maxHealth = status;
                }
            }

            return {
                bairro: s.bairro,
                // Management
                remocao: s.remocao,
                substituicao: s.substituicao,
                poda: s.poda,
                transplante: s.transplante,

                // Health
                predominant_health: maxHealth,
                health_counts: s.health,

                lat: s.countLatChat > 0 ? s.latSum / s.countLatChat : null,
                lng: s.countLatChat > 0 ? s.lngSum / s.countLatChat : null
            };
        }).filter(s => s.lat !== null && s.lng !== null); // Only return neighborhoods with location

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}
