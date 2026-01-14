import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const GRID_SIZE = 0.003;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
        return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
    }

    const gridLat = parseFloat(latStr);
    const gridLng = parseFloat(lngStr);

    // Calculate bounds for this grid cell
    const half = GRID_SIZE / 2;
    const minLat = gridLat - half;
    const maxLat = gridLat + half;
    const minLng = gridLng - half;
    const maxLng = gridLng + half;

    try {
        // Use raw query for spatial filtering within the grid cell
        const trees: any[] = await prisma.$queryRaw`
            SELECT 
                t.id_arvore, 
                t.rua, 
                t.numero, 
                t.bairro,
                s.nome_popular,
                (
                    SELECT p.estado_saude 
                    FROM "PhytosanitaryData" p
                    JOIN "Inspection" i ON p."inspectionId" = i.id_inspecao
                    WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC, p.valid_from DESC
                    LIMIT 1
                ) as estado_saude,
                (
                    SELECT m.necessita_manejo 
                    FROM "ManagementAction" m
                    JOIN "Inspection" i ON m."inspectionId" = i.id_inspecao
                    WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC, m.valid_from DESC
                    LIMIT 1
                ) as necessita_manejo,
                (
                    SELECT m.manejo_tipo 
                    FROM "ManagementAction" m
                    JOIN "Inspection" i ON m."inspectionId" = i.id_inspecao
                    WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC, m.valid_from DESC
                    LIMIT 1
                ) as manejo_tipo,
                (
                    SELECT m.supressao_tipo 
                    FROM "ManagementAction" m
                    JOIN "Inspection" i ON m."inspectionId" = i.id_inspecao
                    WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC, m.valid_from DESC
                    LIMIT 1
                ) as supressao_tipo,
                (
                    SELECT m.poda_tipos 
                    FROM "ManagementAction" m
                    JOIN "Inspection" i ON m."inspectionId" = i.id_inspecao
                    WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC, m.valid_from DESC
                    LIMIT 1
                ) as poda_tipos,
                (
                    SELECT i.data_inspecao
                    FROM "Inspection" i
                    WHERE i."treeId" = t.id_arvore
                    ORDER BY i.data_inspecao DESC
                    LIMIT 1
                ) as data_inspecao
            FROM "Tree" t
            LEFT JOIN "Species" s ON t."speciesId" = s.id_especie
            WHERE ST_Within(t.localizacao, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))
        `;

        // Format for frontend
        const formatted = trees.map(t => {
            let manejoTexto = 'Sem necessidade';
            if (t.necessita_manejo) {
                if (t.supressao_tipo) manejoTexto = t.supressao_tipo;
                else if (t.poda_tipos && t.poda_tipos.length > 0) manejoTexto = `Poda (${t.poda_tipos.join(', ')})`;
                else if (t.manejo_tipo) manejoTexto = t.manejo_tipo;
            }

            return {
                id: t.id_arvore,
                endereco: `${t.rua || 'Rua Desconhecida'}, ${t.numero || 'SN'}`,
                bairro: t.bairro || '-',
                especie: t.nome_popular || 'Não ident.',
                saude: t.estado_saude || 'Não avaliado',
                manejo: manejoTexto,
                data_inspecao: t.data_inspecao
            };
        });

        return NextResponse.json(formatted);

    } catch (error) {
        console.error('Error fetching grid details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
