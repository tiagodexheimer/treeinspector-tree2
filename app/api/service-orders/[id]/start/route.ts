import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id: idString } = await params;
    const id = parseInt(idString);
    const body = await request.json();
    const { checklist, photosBefore } = body;

    try {
        const updatedOS = await prisma.serviceOrder.update({
            where: { id },
            data: {
                status: 'Em Execução',
                start_time: new Date(),
                checklist: checklist || {},
                // Salvar fotos se fornecidas
                photos: (photosBefore && Array.isArray(photosBefore)) ? {
                    create: photosBefore.map((uri: string) => ({
                        uri,
                        category: 'Antes'
                    }))
                } : undefined
            }
        });

        return NextResponse.json(updatedOS);
    } catch (error) {
        console.error('Error starting OS:', error);
        return NextResponse.json({ error: 'Failed to start service order' }, { status: 500 });
    }
}
