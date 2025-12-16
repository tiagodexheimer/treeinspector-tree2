import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bairro = searchParams.get('bairro');
        const endereco = searchParams.get('endereco');
        const q = searchParams.get('q');

        // Pagination params - only active if 'page' is present
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

        // Build base where clause
        const where: any = {
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
        };

        // If pagination is requested
        if (pageParam || limitParam) {
            const page = parseInt(pageParam || '1');
            const limit = parseInt(limitParam || '20');
            const skip = (page - 1) * limit;

            const total = await prisma.tree.count({ where });

            const trees = await prisma.tree.findMany({
                where,
                orderBy: { id_arvore: 'desc' },
                skip,
                take: limit,
                include: {
                    species: true,
                    inspections: {
                        orderBy: { data_inspecao: 'desc' },
                        take: 1,
                        include: {
                            phytosanitary: {
                                orderBy: { valid_from: 'desc' },
                                take: 1
                            }
                        }
                    }
                }
            });

            return NextResponse.json({
                data: trees,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    limit
                }
            });
        }

        // Default: Return ALL trees (Backward compatibility for Map)
        const trees = await prisma.tree.findMany({
            where,
            orderBy: { id_arvore: 'desc' },
            include: {
                species: true,
                inspections: {
                    orderBy: { data_inspecao: 'desc' },
                    take: 1,
                    include: {
                        phytosanitary: {
                            orderBy: { valid_from: 'desc' },
                            take: 1
                        }
                    }
                }
            }
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
                photos: photo_uri ? {
                    create: {
                        blob_url: photo_uri,
                        file_name: 'tree_photo.jpg' // Default name as we don't have one
                    }
                } : undefined
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
