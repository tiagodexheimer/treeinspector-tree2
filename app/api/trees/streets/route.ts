import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';

        let streets: { rua: string; count: bigint }[];

        if (q) {
            streets = await prisma.$queryRaw`
                SELECT
                    t.rua,
                    COUNT(*)::int as count
                FROM "Tree" t
                WHERE t.rua IS NOT NULL
                  AND t.status != 'Removida'
                  AND t.rua ILIKE ${`%${q}%`}
                GROUP BY t.rua
                ORDER BY t.rua ASC
                LIMIT 50
            `;
        } else {
            streets = await prisma.$queryRaw`
                SELECT
                    t.rua,
                    COUNT(*)::int as count
                FROM "Tree" t
                WHERE t.rua IS NOT NULL
                  AND t.status != 'Removida'
                GROUP BY t.rua
                ORDER BY t.rua ASC
                LIMIT 100
            `;
        }

        return NextResponse.json(
            streets.map(s => ({ rua: s.rua, count: Number(s.count) }))
        );
    } catch (error) {
        console.error('Error fetching streets:', error);
        return NextResponse.json({ error: 'Failed to fetch streets' }, { status: 500 });
    }
}
