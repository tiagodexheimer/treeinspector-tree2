import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
    try {
        const [speciesCount, pestsCount, treesCount] = await Promise.all([
            prisma.species.count(),
            prisma.pestCatalog.count(),
            prisma.tree.count()
        ]);

        return NextResponse.json({
            species: speciesCount,
            pests: pestsCount,
            trees: treesCount
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
