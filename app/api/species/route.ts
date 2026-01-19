import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const q = searchParams.get('q');

        const where = q ? {
            OR: [
                { nome_comum: { contains: q, mode: 'insensitive' as const } },
                { nome_cientifico: { contains: q, mode: 'insensitive' as const } },
                { family: { contains: q, mode: 'insensitive' as const } }
            ]
        } : {};

        const [species, total] = await Promise.all([
            prisma.species.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { nome_comum: 'asc' }
            }),
            prisma.species.count({ where })
        ]);

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
