import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const { treeIds }: { treeIds: number[] } = body;

        if (!treeIds || !Array.isArray(treeIds) || treeIds.length === 0) {
            return NextResponse.json({ error: 'treeIds é obrigatório' }, { status: 400 });
        }

        // Fetch full tree data for all selected trees
        const trees: any[] = await prisma.$queryRaw`
            SELECT
                t.id_arvore,
                t.numero_etiqueta,
                t.nome_popular,
                t.rua,
                t.numero,
                t.bairro,
                t.endereco,
                t.status,
                ST_Y(t.localizacao::geometry) as lat,
                ST_X(t.localizacao::geometry) as lng,
                s.nome_comum as especie_comum,
                s.nome_cientifico as especie_cientifica,
                s.family as familia,
                s.native_status,
                s.porte,
                -- Latest dendrometric data
                d.dap1_cm,
                d.dap2_cm,
                d.altura_total_m,
                d.altura_copa_m,
                -- Latest phytosanitary data
                p.estado_saude,
                p.severity_level,
                p.risk_probability,
                p.risk_rating,
                p.target_value,
                p.danos_tipo,
                -- Latest management action
                m.necessita_manejo,
                m.manejo_tipo,
                m.poda_tipos,
                -- Last inspection date
                last_i.data_inspecao as ultima_inspecao,
                last_i.id_inspecao,
                -- Cover photo
                t.cover_photo,
                (SELECT pm.blob_url FROM "PhotoMetadata" pm WHERE pm.tree_id = t.id_arvore ORDER BY pm.captured_at DESC LIMIT 1) as photo_url
            FROM "Tree" t
            LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
            LEFT JOIN LATERAL (
                SELECT i.id_inspecao, i.data_inspecao
                FROM "Inspection" i
                WHERE i."treeId" = t.id_arvore
                ORDER BY i.data_inspecao DESC
                LIMIT 1
            ) last_i ON true
            LEFT JOIN LATERAL (
                SELECT d2.*
                FROM "DendrometricData" d2
                WHERE d2."inspectionId" = last_i.id_inspecao
                LIMIT 1
            ) d ON true
            LEFT JOIN LATERAL (
                SELECT p2.*
                FROM "PhytosanitaryData" p2
                WHERE p2."inspectionId" = last_i.id_inspecao
                LIMIT 1
            ) p ON true
            LEFT JOIN LATERAL (
                SELECT m2.*
                FROM "ManagementAction" m2
                WHERE m2."inspectionId" = last_i.id_inspecao
                LIMIT 1
            ) m ON true
            WHERE t.id_arvore = ANY(${treeIds}::int[])
            ORDER BY t.rua ASC NULLS LAST, t.numero ASC NULLS LAST, t.numero_etiqueta ASC NULLS LAST
        `;

        return NextResponse.json({ trees });
    } catch (error) {
        console.error('Error fetching assessment plan data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// GET: fetch trees by street (for the planner's street mode)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const rua = searchParams.get('rua');
        const bairro = searchParams.get('bairro');
        const numeroInicial = searchParams.get('numero_inicial');
        const numeroFinal = searchParams.get('numero_final');

        if (!rua) {
            return NextResponse.json({ error: 'Parâmetro rua é obrigatório' }, { status: 400 });
        }

        let trees: any[];

        if (numeroInicial && numeroFinal) {
            trees = await prisma.$queryRaw`
                SELECT
                    t.id_arvore,
                    t.numero_etiqueta,
                    t.rua,
                    t.numero,
                    t.bairro,
                    t.status,
                    ST_Y(t.localizacao::geometry) as lat,
                    ST_X(t.localizacao::geometry) as lng,
                    s.nome_comum as especie_comum,
                    s.nome_cientifico as especie_cientifica,
                    p.estado_saude,
                    p.risk_rating,
                    last_i.data_inspecao as ultima_inspecao
                FROM "Tree" t
                LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
                LEFT JOIN LATERAL (
                    SELECT i.id_inspecao, i.data_inspecao
                    FROM "Inspection" i WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC LIMIT 1
                ) last_i ON true
                LEFT JOIN LATERAL (
                    SELECT p2.estado_saude, p2.risk_rating
                    FROM "PhytosanitaryData" p2 WHERE p2."inspectionId" = last_i.id_inspecao
                    LIMIT 1
                ) p ON true
                WHERE t.rua ILIKE ${`%${rua}%`}
                  AND t.status != 'Removida'
                  ${bairro ? prisma.$queryRaw`AND t.bairro ILIKE ${'%' + bairro + '%'}` : prisma.$queryRaw``}
                ORDER BY t.rua ASC NULLS LAST, t.numero ASC NULLS LAST, t.numero_etiqueta ASC NULLS LAST
            `;
        } else {
            trees = await prisma.$queryRaw`
                SELECT
                    t.id_arvore,
                    t.numero_etiqueta,
                    t.rua,
                    t.numero,
                    t.bairro,
                    t.status,
                    ST_Y(t.localizacao::geometry) as lat,
                    ST_X(t.localizacao::geometry) as lng,
                    s.nome_comum as especie_comum,
                    s.nome_cientifico as especie_cientifica,
                    p.estado_saude,
                    p.risk_rating,
                    last_i.data_inspecao as ultima_inspecao
                FROM "Tree" t
                LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
                LEFT JOIN LATERAL (
                    SELECT i.id_inspecao, i.data_inspecao
                    FROM "Inspection" i WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC LIMIT 1
                ) last_i ON true
                LEFT JOIN LATERAL (
                    SELECT p2.estado_saude, p2.risk_rating
                    FROM "PhytosanitaryData" p2 WHERE p2."inspectionId" = last_i.id_inspecao
                    LIMIT 1
                ) p ON true
                WHERE t.rua ILIKE ${`%${rua}%`}
                  AND t.status != 'Removida'
                ORDER BY t.rua ASC NULLS LAST, t.numero ASC NULLS LAST, t.numero_etiqueta ASC NULLS LAST
            `;
        }

        return NextResponse.json({ trees });
    } catch (error) {
        console.error('Error fetching trees by street:', error);
        return NextResponse.json({ error: 'Failed to fetch trees' }, { status: 500 });
    }
}
