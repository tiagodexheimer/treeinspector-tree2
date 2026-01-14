import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

// Força a renderização dinâmica para garantir dados sempre atualizados,
// mas controlaremos o cache via headers na resposta do mapa.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // ==========================================
        // 1. VERIFICAÇÃO DE FILTROS E PAGINAÇÃO
        // ==========================================
        // Se houver qualquer parâmetro de filtro ou paginação, entramos no modo detalhado
        const hasFilters = searchParams.get('page') ||
            searchParams.get('q') ||
            searchParams.get('species') ||
            searchParams.get('bairro') ||
            searchParams.get('radius');

        if (hasFilters) {
            // Recria o 'where' básico baseado nos params
            const bairro = searchParams.get('bairro');
            const endereco = searchParams.get('endereco');
            const etiqueta = searchParams.get('etiqueta');
            const species = searchParams.get('species');
            const q = searchParams.get('q');

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
                ...(etiqueta && { numero_etiqueta: { contains: etiqueta, mode: 'insensitive' } }),
                ...(species && {
                    species: {
                        OR: [
                            { nome_comum: { contains: species, mode: 'insensitive' } },
                            { nome_cientifico: { contains: species, mode: 'insensitive' } }
                        ]
                    }
                })
            };

            // CASO A: Mobile (Geolocalização via PostGIS)
            if (searchParams.get('lat') && searchParams.get('radius')) {
                const lat = parseFloat(searchParams.get('lat')!);
                const lng = parseFloat(searchParams.get('lng')!);
                const radius = parseFloat(searchParams.get('radius')!);

                // Usando raw query para busca por raio no PostGIS
                const trees: any[] = await prisma.$queryRaw`
                    SELECT 
                        t.id_arvore, 
                        ST_Y(t.localizacao::geometry) as lat, 
                        ST_X(t.localizacao::geometry) as lng, 
                        t.numero_etiqueta,
                        t.rua, 
                        t.numero, 
                        t.bairro,
                        s.nome_comum,
                        s.nome_cientifico,
                        ST_Distance(t.localizacao, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as distance
                    FROM "Tree" t
                    LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
                    WHERE ST_DWithin(t.localizacao, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius})
                    ORDER BY distance ASC
                    LIMIT 50
                `;

                return NextResponse.json(trees);
            }

            // CASO B: Lista Administrativa (Paginada)
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const skip = (page - 1) * limit;

            const total = await prisma.tree.count({ where });
            // Precisamos extrair lat/lng via query raw se quisermos exibi-los na lista, 
            // mas a lista administrativa muitas vezes não mostra lat/lng diretamente.
            // Se precisar, teremos que usar queryRaw aqui também.
            const trees = await prisma.tree.findMany({
                where,
                orderBy: { id_arvore: 'desc' },
                skip,
                take: limit,
                include: { species: true, inspections: { take: 1 } }
            });

            return NextResponse.json({
                data: trees,
                pagination: { total, pages: Math.ceil(total / limit), currentPage: page, limit }
            });
        }

        // ==========================================
        // 2. MODO MAPA GERAL (PostGIS 추출)
        // ==========================================

        // Busca TUDO usando SQL Raw para extrair coordenadas do PostGIS
        const trees: any[] = await prisma.$queryRaw`
            SELECT 
                t.id_arvore as id,
                ST_Y(t.localizacao::geometry) as lat,
                ST_X(t.localizacao::geometry) as lng,
                t.numero_etiqueta as lbl,
                s.nome_comum as sp,
                (
                    SELECT p.estado_saude 
                    FROM "PhytosanitaryData" p
                    JOIN "Inspection" i ON p."inspectionId" = i.id_inspecao
                    WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC, p.valid_from DESC
                    LIMIT 1
                ) as st
            FROM "Tree" t
            LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
            WHERE t.localizacao IS NOT NULL
        `;

        const mapData = trees.map(t => ({
            ...t,
            st: t.st || 'Regular'
        }));

        // Retorna com Cache Headers agressivos
        return NextResponse.json(mapData, {
            headers: {
                'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
            }
        });

    } catch (error) {
        console.error('Error fetching trees:', error);
        return NextResponse.json({ error: 'Failed to fetch trees' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { speciesId, numero_etiqueta, rua, numero, bairro, endereco, lat, lng, photo_uri } = body;

        // Note: Prisma does not support inserting into Unsupported fields directly with create().
        // We need to use $executeRaw or first create and then update with raw SQL.
        // We'll use a transaction for safety.

        const newTreeId = await prisma.$transaction(async (tx) => {
            const tree = await tx.tree.create({
                data: {
                    speciesId: Number(speciesId),
                    numero_etiqueta,
                    rua,
                    numero: numero ? String(numero) : null,
                    bairro,
                    endereco,
                    photos: photo_uri ? {
                        create: {
                            blob_url: photo_uri,
                            file_name: 'tree_photo.jpg'
                        }
                    } : undefined
                },
                select: { id_arvore: true }
            });

            if (lat && lng) {
                await tx.$executeRaw`
                    UPDATE "Tree" 
                    SET "localizacao" = ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)
                    WHERE "id_arvore" = ${tree.id_arvore}
                `;
            }

            return tree.id_arvore;
        });

        const createdTree = await prisma.tree.findUnique({
            where: { id_arvore: newTreeId },
            include: { species: true }
        });

        return NextResponse.json(createdTree, { status: 201 });
    } catch (error) {
        console.error('Error creating tree:', error);
        return NextResponse.json({ error: 'Failed to create tree' }, { status: 500 });
    }
}