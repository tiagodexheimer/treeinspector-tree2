import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bairro = searchParams.get('bairro');
        const endereco = searchParams.get('endereco');
        const q = searchParams.get('q');

        const trees = await prisma.tree.findMany({
            where: {
                ...(q && {
                    OR: [
                        { numero_etiqueta: { contains: q, mode: 'insensitive' } },
                        { rua: { contains: q, mode: 'insensitive' } },
                        { endereco: { contains: q, mode: 'insensitive' } }
                    ]
                }),
                ...(bairro && { bairro: { contains: bairro, mode: 'insensitive' } }),
                ...(endereco && {
                    OR: [
                        { endereco: { contains: endereco, mode: 'insensitive' } },
                        { rua: { contains: endereco, mode: 'insensitive' } }
                    ]
                }),
            },
            orderBy: { id_arvore: 'desc' },
            include: { species: true }
        });
        return NextResponse.json(trees);
    } catch (error) {
        console.error('Error fetching trees:', error);
        return NextResponse.json({ error: 'Failed to fetch trees' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { speciesId, numero_etiqueta, rua, numero, bairro, endereco, lat, lng, photo_uri } = body;

        const newTree = await prisma.tree.create({
            data: {
                speciesId: Number(speciesId),
                numero_etiqueta,
                rua,
                numero,
                bairro,
                endereco,
                lat,
                lng,
                photo_uri
            },
            include: {
                species: true
            }
        });

        return NextResponse.json(newTree, { status: 201 });
    } catch (error) {
        console.error('Error creating tree:', error);
        return NextResponse.json({ error: 'Failed to create tree' }, { status: 500 });
    }
}
