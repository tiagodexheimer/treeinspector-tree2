import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bairro = searchParams.get('bairro');

    try {
        const whereClause: any = {};
        if (bairro) {
            whereClause.bairro = { equals: bairro, mode: 'insensitive' as const };
        }

        const speciesStats = await prisma.tree.groupBy({
            by: ['speciesId'],
            where: whereClause,
            _count: {
                id_arvore: true
            },
            orderBy: {
                _count: {
                    id_arvore: 'desc'
                }
            },
            take: 20 // Return top 20 species
        });

        // Fetch species names for the IDs
        const speciesIds = speciesStats.map(s => s.speciesId);
        const speciesNames = await prisma.species.findMany({
            where: {
                id_especie: { in: speciesIds }
            },
            select: {
                id_especie: true,
                nome_comum: true,
                nome_cientifico: true
            }
        });

        const namesMap = new Map(speciesNames.map(s => [s.id_especie, s]));

        const result = speciesStats.map(s => ({
            speciesId: s.speciesId,
            nome_comum: namesMap.get(s.speciesId)?.nome_comum || 'Desconhecida',
            nome_cientifico: namesMap.get(s.speciesId)?.nome_cientifico || 'Desconhecida',
            count: s._count.id_arvore
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching species statistics:', error);
        return NextResponse.json({ error: 'Failed to fetch species statistics' }, { status: 500 });
    }
}
