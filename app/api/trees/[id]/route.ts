import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '@/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);

    try {
        // POWER QUERY: Fetch everything in ONE RTT using JSON aggregation
        // We list Tree columns explicitly to avoid 'geometry' deserialization error in Prisma
        const results = await prisma.$queryRaw`
            WITH tree_base AS (
                SELECT 
                    id_arvore, uuid, numero_etiqueta, nome_popular, cover_photo, status, 
                    rua, numero, bairro, endereco, "speciesId", created_at, updated_at,
                    ST_Y(localizacao::geometry) as lat, 
                    ST_X(localizacao::geometry) as lng,
                    (SELECT JSON_BUILD_OBJECT(
                        'id_especie', s.id_especie, 
                        'nome_comum', s.nome_comum, 
                        'nome_cientifico', s.nome_cientifico
                    ) FROM "Species" s WHERE s.id_especie = t."speciesId") as species
                FROM "Tree" t 
                WHERE t.id_arvore = ${id} 
                LIMIT 1
            )
            SELECT 
                tb.*,
                COALESCE((
                    SELECT JSON_AGG(i_data ORDER BY i_data.data_inspecao DESC) FROM (
                        SELECT 
                            i.*,
                            COALESCE((SELECT JSON_AGG(d.*) FROM "DendrometricData" d WHERE d."inspectionId" = i.id_inspecao), '[]'::json) as dendrometrics,
                            COALESCE((
                                SELECT JSON_AGG(p_data) FROM (
                                    SELECT 
                                        p.*,
                                        COALESCE((
                                            SELECT JSON_AGG(cat.*) 
                                            FROM "PestCatalog" cat
                                            JOIN "_PestCatalogToPhytosanitaryData" join_p ON cat.id = join_p."A"
                                            WHERE join_p."B" = p.id
                                        ), '[]'::json) as pests
                                    FROM "PhytosanitaryData" p 
                                    WHERE p."inspectionId" = i.id_inspecao
                                ) p_data
                            ), '[]'::json) as phytosanitary,
                            COALESCE((
                                SELECT JSON_AGG(ma_data) FROM (
                                    SELECT 
                                        ma.*,
                                        COALESCE((
                                            SELECT JSON_AGG(so.*)
                                            FROM "ServiceOrder" so
                                            JOIN "_ManagementActionToServiceOrder" join_so ON so.id = join_so."B"
                                            WHERE join_so."A" = ma.id
                                        ), '[]'::json) as "serviceOrders"
                                    FROM "ManagementAction" ma
                                    WHERE ma."inspectionId" = i.id_inspecao
                                ) ma_data
                            ), '[]'::json) as "managementActions",
                            COALESCE((SELECT JSON_AGG(ph.*) FROM "InspectionPhoto" ph WHERE ph."inspectionId" = i.id_inspecao), '[]'::json) as photos
                        FROM "Inspection" i
                        WHERE i."treeId" = tb.id_arvore
                    ) i_data
                ), '[]'::json) as inspections,
                COALESCE((SELECT JSON_AGG(pm.*) FROM "PhotoMetadata" pm WHERE pm.tree_id = tb.id_arvore), '[]'::json) as photos,
                COALESCE((
                    SELECT JSON_AGG(so.*) 
                    FROM "ServiceOrder" so
                    JOIN "_ServiceOrderToTree" so_t ON so.id = so_t."A"
                    WHERE so_t."B" = tb.id_arvore
                ), '[]'::json) as "serviceOrders"
            FROM tree_base tb;
        `;

        const tree = (results as any[])[0];

        if (!tree) {
            return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
        }

        return NextResponse.json(tree);
    } catch (error) {
        console.error('Error fetching tree:', error);
        return NextResponse.json({ error: 'Failed to fetch tree' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const role = (session.user as any).role;
    if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();

    try {
        const updatedTree = await prisma.$transaction(async (tx) => {
            const tree = await tx.tree.update({
                where: { id_arvore: id },
                data: {
                    numero_etiqueta: body.numero_etiqueta,
                    rua: body.rua,
                    numero: body.numero,
                    bairro: body.bairro,
                    endereco: body.endereco,
                    // species update logic could be complex (find first in Species table), for now assume speciesId passed
                    ...(body.speciesId && { speciesId: parseInt(body.speciesId) })
                },
                include: { species: true }
            });

            if (body.lat !== undefined && body.lng !== undefined) {
                await tx.$executeRaw`
                    UPDATE "Tree" 
                    SET "localizacao" = ST_SetSRID(ST_MakePoint(${parseFloat(body.lng)}, ${parseFloat(body.lat)}), 4326)
                    WHERE "id_arvore" = ${id}
                `;
            }

            return tree;
        });

        // Fetch again to get updated coordinates if needed by frontend (though PATCH usually returns the object)
        const finalCoords: any[] = await prisma.$queryRaw`
            SELECT ST_Y(localizacao::geometry) as lat, ST_X(localizacao::geometry) as lng 
            FROM "Tree" WHERE id_arvore = ${id}
        `;

        return NextResponse.json({
            ...updatedTree,
            lat: finalCoords[0]?.lat || null,
            lng: finalCoords[0]?.lng || null
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update tree' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'Apenas administradores podem excluir árvores' }, { status: 403 });
    }

    const { id: idString } = await params;
    const id = parseInt(idString);

    try {
        // Perform a manual cascade delete within a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Find all inspections to get their IDs
            const inspections = await tx.inspection.findMany({
                where: { treeId: id },
                select: { id_inspecao: true }
            });

            const inspectionIds = inspections.map(i => i.id_inspecao);

            if (inspectionIds.length > 0) {
                // 2. Delete Inspection Children
                await tx.dendrometricData.deleteMany({ where: { inspectionId: { in: inspectionIds } } });
                await tx.phytosanitaryData.deleteMany({ where: { inspectionId: { in: inspectionIds } } });

                // ManagementAction is referenced by ServiceOrder, so we might need to handle ServiceOrders first if they link to Management
                // Checking schema: ServiceOrder has tree_id AND management_id.
                // We should delete ServiceOrders for the TREE first.

                // 3. Delete Service Orders links (and possibly the SO if it's specific to this tree)
                // In many-to-many, we can't just deleteMany by treeId if it's not a field.
                // We'll disconnect them or delete them if they only belong to this tree.
                // For simplicity and to match previous intended behavior:
                await tx.serviceOrder.deleteMany({
                    where: {
                        trees: {
                            some: { id_arvore: id }
                        }
                    }
                });

                // Now safe to delete ManagementActions
                await tx.managementAction.deleteMany({ where: { inspectionId: { in: inspectionIds } } });
                await tx.inspectionPhoto.deleteMany({ where: { inspectionId: { in: inspectionIds } } });

                // 4. Delete Inspections
                await tx.inspection.deleteMany({ where: { treeId: id } });
            } else {
                // Even if no inspections, ensure ServiceOrders linked to this tree are gone
                await tx.serviceOrder.deleteMany({
                    where: {
                        trees: {
                            some: { id_arvore: id }
                        }
                    }
                });
            }

            // 5. Delete Tree Photos (PhotoMetadata)
            await tx.photoMetadata.deleteMany({ where: { tree_id: id } });

            // 6. Finally, Delete the Tree
            await tx.tree.delete({
                where: { id_arvore: id }
            });
        });

        return NextResponse.json({ message: 'Tree deleted successfully' });
    } catch (error) {
        console.error('Delete failed:', error);
        return NextResponse.json({ error: 'Failed to delete tree' }, { status: 500 });
    }
}
