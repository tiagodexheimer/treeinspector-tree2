import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
    try {
        // Fetch all trees that need management
        // optimizing to fetch only necessary fields
        // Fetch trees with minimal fields for aggregation
        // We fetch ALL trees to calculate health statistics accurately, not just those needing management
        const trees = await prisma.tree.findMany({
            where: {
                // Ensure we mostly get trees with location/neighborhood
                bairro: { not: null },
            },
            select: {
                id_arvore: true,
                bairro: true,
                lat: true,
                lng: true,
                inspections: {
                    orderBy: { data_inspecao: 'desc' },
                    take: 1,
                    select: {
                        managementActions: {
                            select: {
                                necessita_manejo: true,
                                manejo_tipo: true,
                                supressao_tipo: true,
                                poda_tipos: true
                            }
                        },
                        phytosanitary: {
                            select: {
                                estado_saude: true
                            }
                        }
                    }
                }
            }
        });

        // Aggregate by Bairro
        const stats = new Map<string, {
            bairro: string;
            total: number;

            // Management counts
            remocao: number;
            substituicao: number;
            poda: number;

            // Health counts
            health: { [key: string]: number };

            // Location avg
            latSum: number;
            lngSum: number;
            countLatChat: number;
        }>();

        for (const tree of (trees as any[])) {
            const bairro = tree.bairro?.trim();
            if (!bairro) continue;

            if (!stats.has(bairro)) {
                stats.set(bairro, {
                    bairro,
                    total: 0,
                    remocao: 0,
                    substituicao: 0,
                    poda: 0,
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

            const entry = stats.get(bairro)!;
            entry.total++;

            // Sum coordinates
            if (tree.lat && tree.lng) {
                entry.latSum += tree.lat;
                entry.lngSum += tree.lng;
                entry.countLatChat++;
            }

            const inspection = tree.inspections[0];
            if (!inspection) continue;

            // Health Stats
            const health = inspection.phytosanitary[0]?.estado_saude || 'Regular'; // Default to regular if missing? Or ignore.
            if (health) {
                // Normalize keys slightly if needed, but assuming DB standard
                if (entry.health[health] !== undefined) {
                    entry.health[health]++;
                } else {
                    // Handle variations or map to closest
                    if (health.includes('Morta') || health.includes('Desvitalizada')) entry.health['Morta/Desvitalizada']++;
                    else if (health.includes('Ruim')) entry.health['Ruim']++;
                    else if (health.includes('Regular')) entry.health['Regular']++;
                    else if (health.includes('Bom')) entry.health['Bom']++;
                }
            }

            // Management Stats
            const action = inspection.managementActions[0];
            if (action && action.necessita_manejo) {
                const type = action.manejo_tipo?.toLowerCase();
                const subType = action.supressao_tipo?.toLowerCase();

                if (subType?.includes('remoção') || subType?.includes('remocao')) {
                    entry.remocao++;
                } else if (subType?.includes('substituição') || subType?.includes('substituicao')) {
                    entry.substituicao++;
                }

                if (type?.includes('poda')) {
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
