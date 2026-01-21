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
    const { description, photos } = body;

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
                status: 'Concluída',
                executed_at: new Date(),
                description: description,
                photos: photos && Array.isArray(photos) ? {
                    create: photos.map((photo: string) => ({
                        uri: photo
                    }))
                } : undefined
            },
            include: {
                photos: true
            }
        });

        // Close associated management actions
        const managementIds = os.managementActions.map(ma => ma.id);
        if (managementIds.length > 0) {
            await prisma.managementAction.updateMany({
                where: { id: { in: managementIds } },
                data: { necessita_manejo: false }
            });
        }

        return NextResponse.json(updatedOS);
    } catch (error) {
        console.error('Error finalizing OS:', error);
        return NextResponse.json({ error: 'Failed to finalize service order' }, { status: 500 });
    }
}
