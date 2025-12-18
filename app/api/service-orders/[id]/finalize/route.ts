import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const { description, photos } = body;
    // photos: array of { uri: string } ? or array of strings?
    // Let's assume array of strings (uris) for simplicity or array of objects if needed.
    // Based on `ServiceOrderPhoto` model: `uri` string.

    try {
        const os = await prisma.serviceOrder.findUnique({ where: { id } });

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
                        uri: photo // Assuming photo is a string URL
                    }))
                } : undefined
            },
            include: {
                photos: true
            }
        });

        return NextResponse.json(updatedOS);
    } catch (error) {
        console.error('Error finalizing OS:', error);
        return NextResponse.json({ error: 'Failed to finalize service order' }, { status: 500 });
    }
}
