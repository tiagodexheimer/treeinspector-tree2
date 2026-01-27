import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const { description, photos, materials } = body;
    // photos: [{ uri: string, category: 'Antes' | 'Durante' | 'Depois' }]
    // materials: [{ name: string, quantity: number, unit: string }]

    try {
        const os = await prisma.serviceOrder.findUnique({
            where: { id },
            include: { managementActions: true }
        });

        if (!os) {
            return NextResponse.json({ error: 'Service Order not found' }, { status: 404 });
        }

        const updatedOS = await prisma.serviceOrder.update({
            where: { id },
            data: {
                status: 'Aguardando Revisão',
                executed_at: new Date(),
                description: description,
                photos: photos && Array.isArray(photos) ? {
                    create: photos.map((photo: any) => ({
                        uri: photo.uri,
                        category: photo.category || 'Depois'
                    }))
                } : undefined,
                materials: materials && Array.isArray(materials) ? {
                    create: materials.map((mat: any) => ({
                        name: mat.name,
                        quantity: mat.quantity,
                        unit: mat.unit
                    }))
                } : undefined
            },
            include: {
                photos: true
            }
        });

        // Closing associated management actions is now handled by the Gestor approval (PATCH)

        return NextResponse.json(updatedOS);
    } catch (error) {
        console.error('Error finalizing OS:', error);
        return NextResponse.json({ error: 'Failed to finalize service order' }, { status: 500 });
    }
}
