import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';

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
                        t.id_arvore as id, 
                        ST_Y(t.localizacao::geometry) as lat, 
                        ST_X(t.localizacao::geometry) as lng, 
                        t.numero_etiqueta as etiqueta,
                        t.rua || ', ' || t.numero as address, 
                        t.bairro,
                        s.nome_comum as species_common,
                        s.nome_cientifico as species_scientific,
                        (SELECT blob_url FROM "PhotoMetadata" pm WHERE pm.tree_id = t.id_arvore ORDER BY captured_at DESC LIMIT 1) as photo_url,
                        ST_Distance(t.localizacao, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as distance
                    FROM "Tree" t
                    LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
                    WHERE ST_DWithin(t.localizacao, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius})
                    AND t.status != 'Removida'
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

        const bairro = searchParams.get('bairro');
        const endereco = searchParams.get('endereco');
        const etiqueta = searchParams.get('etiqueta');
        const species = searchParams.get('species');

        // Bounding Box parameters
        const minLat = searchParams.get('minLat');
        const maxLat = searchParams.get('maxLat');
        const minLng = searchParams.get('minLng');
        const maxLng = searchParams.get('maxLng');

        // Build WHERE clause dynamically (Default: Exclude Removed trees from Map)
        let whereClause = Prisma.sql`WHERE t.localizacao IS NOT NULL AND t.status != 'Removida'`;

        if (bairro) {
            whereClause = Prisma.sql`${whereClause} AND t.bairro ILIKE ${'%' + bairro + '%'}`;
        }
        if (endereco) {
            whereClause = Prisma.sql`${whereClause} AND (t.rua ILIKE ${'%' + endereco + '%'} OR t.endereco ILIKE ${'%' + endereco + '%'})`;
        }
        if (etiqueta) {
            whereClause = Prisma.sql`${whereClause} AND t.numero_etiqueta ILIKE ${'%' + etiqueta + '%'}`;
        }
        if (species) {
            // Join with Species table is already in query
            whereClause = Prisma.sql`${whereClause} AND (s.nome_comum ILIKE ${'%' + species + '%'} OR s.nome_cientifico ILIKE ${'%' + species + '%'})`;
        }

        // BBOX Filter
        if (minLat && maxLat && minLng && maxLng) {
            whereClause = Prisma.sql`${whereClause} AND t.localizacao && ST_MakeEnvelope(${parseFloat(minLng)}, ${parseFloat(minLat)}, ${parseFloat(maxLng)}, ${parseFloat(maxLat)}, 4326)`;
        }

        // Busca usando SQL Raw com filtros dinâmicos
        const trees: any[] = await prisma.$queryRaw`
            SELECT 
                t.id_arvore as id,
                ST_Y(t.localizacao::geometry) as lat,
                ST_X(t.localizacao::geometry) as lng,
                t.numero_etiqueta as lbl,
                s.nome_comum as sp,
                p.estado_saude as st,
                p.severity_level as sev,
                (SELECT COUNT(*)::int FROM "_PestCatalogToPhytosanitaryData" pc WHERE pc."B" = p.id) as pc
            FROM "Tree" t
            LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
            LEFT JOIN LATERAL (
                SELECT id_inspecao 
                FROM "Inspection" 
                WHERE "treeId" = t.id_arvore 
                ORDER BY data_inspecao DESC 
                LIMIT 1
            ) last_i ON true
            LEFT JOIN "PhytosanitaryData" p ON p."inspectionId" = last_i.id_inspecao
            ${whereClause}
        `;

        const mapData = trees.map(t => ({
            ...t,
            st: t.st || 'Regular',
            sev: t.sev || 0,
            pc: t.pc || 0
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
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
            return NextResponse.json({ error: 'Não autorizado para criar árvores' }, { status: 403 });
        }

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