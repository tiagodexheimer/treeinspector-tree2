import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);

    try {
        const tree = await prisma.tree.findUnique({
            where: { id_arvore: id },
            include: {
                species: true,
                inspections: {
                    orderBy: { data_inspecao: 'desc' },
                    include: {
                        dendrometrics: true, // we might want just the valid ones?
                        phytosanitary: true,
                        managementActions: true,
                        photos: true
                    }
                },
                photos: true
            }
        });

        if (!tree) {
            return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
        }

        return NextResponse.json(tree);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tree' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();

    try {
        const updatedTree = await prisma.tree.update({
            where: { id_arvore: id },
            data: {
                numero_etiqueta: body.numero_etiqueta,
                rua: body.rua,
                numero: body.numero,
                bairro: body.bairro,
                endereco: body.endereco,
                lat: body.lat ? parseFloat(body.lat) : undefined,
                lng: body.lng ? parseFloat(body.lng) : undefined,
                // species update logic could be complex (find first in Species table), for now assume speciesId passed
                ...(body.speciesId && { speciesId: parseInt(body.speciesId) })
            },
            include: { species: true }
        });

        return NextResponse.json(updatedTree);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update tree' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

                // 3. Delete Service Orders (directly linked to Tree)
                // This will also clear the reference to ManagementActions, allowing them to be deleted.
                await tx.serviceOrder.deleteMany({ where: { tree_id: id } });

                // Now safe to delete ManagementActions
                await tx.managementAction.deleteMany({ where: { inspectionId: { in: inspectionIds } } });
                await tx.inspectionPhoto.deleteMany({ where: { inspectionId: { in: inspectionIds } } });

                // 4. Delete Inspections
                await tx.inspection.deleteMany({ where: { treeId: id } });
            } else {
                // Even if no inspections, ensure ServiceOrders are gone
                await tx.serviceOrder.deleteMany({ where: { tree_id: id } });
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
