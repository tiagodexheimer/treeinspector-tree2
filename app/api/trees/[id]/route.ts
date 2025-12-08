import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = parseInt(params.id);

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
                        managementActions: true
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
    { params }: { params: { id: string } }
) {
    const id = parseInt(params.id);
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
    { params }: { params: { id: string } }
) {
    const id = parseInt(params.id);

    try {
        await prisma.tree.delete({
            where: { id_arvore: id }
        });

        return NextResponse.json({ message: 'Tree deleted' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete tree' }, { status: 500 });
    }
}
