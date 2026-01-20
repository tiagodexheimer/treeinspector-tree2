import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // We need to find the highest numeric tag.
        // Since numero_etiqueta is a string, we use raw SQL to cast and find max, 
        // or a simple findFirst with ordering if they are mostly numeric.

        // Let's use a robust approach: find all tags that look numeric and get the max
        const result: any[] = await prisma.$queryRaw`
            SELECT numero_etiqueta 
            FROM "Tree" 
            WHERE numero_etiqueta ~ '^[0-9]+$'
            ORDER BY CAST(numero_etiqueta AS BIGINT) DESC 
            LIMIT 1
        `;

        const latestTag = result.length > 0 ? result[0].numero_etiqueta : "0";

        return NextResponse.json({
            latest_tag: latestTag,
            next_tag: (parseInt(latestTag) + 1).toString()
        });
    } catch (error) {
        console.error('Error fetching latest tag:', error);
        return NextResponse.json({ error: 'Failed to fetch latest tag' }, { status: 500 });
    }
}
