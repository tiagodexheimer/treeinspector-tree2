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
    // A tree belongs to this cell if round(tree.lat / SIZE) * SIZE == gridLat
    // This implies tree.lat is within [gridLat - SIZE/2, gridLat + SIZE/2)
    const half = GRID_SIZE / 2;
    const minLat = gridLat - half;
    const maxLat = gridLat + half;
    const minLng = gridLng - half;
    const maxLng = gridLng + half;

    try {
        const trees = await prisma.tree.findMany({
            where: {
                lat: {
                    gte: minLat,
                    lt: maxLat
                },
                lng: {
                    gte: minLng,
                    lt: maxLng
                }
            },
            select: {
                id_arvore: true,
                rua: true,
                numero: true,
                bairro: true,
                nome_popular: true,
                inspections: {
                    orderBy: { data_inspecao: 'desc' },
                    take: 1,
                    select: {
                        uuid: true,
                        data_inspecao: true,
                        phytosanitary: {
                            select: { estado_saude: true }
                        },
                        managementActions: {
                            select: {
                                necessita_manejo: true,
                                manejo_tipo: true,
                                poda_tipos: true,
                                supressao_tipo: true
                            }
                        }
                    }
                }
            }
        });

        // Format for frontend
        const formatted = trees.map(t => {
            const insp = t.inspections[0];
            const mgmt = insp?.managementActions[0];

            let manejoTexto = 'Sem necessidade';
            if (mgmt?.necessita_manejo) {
                if (mgmt.supressao_tipo) manejoTexto = mgmt.supressao_tipo;
                else if (mgmt.poda_tipos && mgmt.poda_tipos.length > 0) manejoTexto = `Poda (${mgmt.poda_tipos.join(', ')})`;
                else if (mgmt.manejo_tipo) manejoTexto = mgmt.manejo_tipo;
            }

            return {
                id: t.id_arvore,
                endereco: `${t.rua || 'Rua Desconhecida'}, ${t.numero || 'SN'}`,
                bairro: t.bairro || '-',
                especie: t.nome_popular || 'Não ident.',
                saude: insp?.phytosanitary[0]?.estado_saude || 'Não avaliado',
                manejo: manejoTexto,
                data_inspecao: insp?.data_inspecao
            };
        });

        return NextResponse.json(formatted);

    } catch (error) {
        console.error('Error fetching grid details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
