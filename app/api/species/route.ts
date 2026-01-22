import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const q = searchParams.get('q');

        let species;
        let total;

        if (q) {
            // Use unaccent for accent-insensitive search in PostgreSQL
            // We use raw query to access specialized unaccent function
            const searchTerm = `%${q}%`;

            species = await prisma.$queryRaw<any[]>`
                SELECT * FROM "Species"
                WHERE unaccent(nome_comum) ILIKE unaccent(${searchTerm})
                   OR unaccent(nome_cientifico) ILIKE unaccent(${searchTerm})
                   OR unaccent(family) ILIKE unaccent(${searchTerm})
                ORDER BY nome_comum ASC
                LIMIT ${limit}
                OFFSET ${(page - 1) * limit}
            `;

            const totalResult = await prisma.$queryRaw<any[]>`
                SELECT COUNT(*) as count FROM "Species"
                WHERE unaccent(nome_comum) ILIKE unaccent(${searchTerm})
                   OR unaccent(nome_cientifico) ILIKE unaccent(${searchTerm})
                   OR unaccent(family) ILIKE unaccent(${searchTerm})
            `;
            total = Number(totalResult[0].count);
        } else {
            [species, total] = await Promise.all([
                prisma.species.findMany({
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { nome_comum: 'asc' }
                }),
                prisma.species.count()
            ]);
        }

        return NextResponse.json({
            data: species,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch species' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const role = (session.user as any).role;
    if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    try {
        const body = await request.json();

        const species = await prisma.species.create({
            data: {
                nome_comum: body.nome_comum,
                nome_cientifico: body.nome_cientifico,
                family: body.family || null,
                native_status: body.native_status || null,
                porte: body.porte || null,
                growth_rate: body.growth_rate || null,
                max_height_m: body.max_height_m ? parseFloat(body.max_height_m) : null,
                description: body.description || null
            }
        });

        return NextResponse.json(species, { status: 201 });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Nome científico já existe' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create species' }, { status: 500 });
    }
}
