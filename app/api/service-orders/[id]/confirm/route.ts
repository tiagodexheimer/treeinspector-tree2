import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, observations } = body;

        const updatedServiceOrder = await prisma.serviceOrder.update({
            where: {
                id: Number(id),
            },
            data: {
                status: status || 'Concluída',
                executed_at: new Date(),
                observations,
            },
            include: {
                tree: {
                    include: {
                        species: true,
                    },
                },
                management: true,
            },
        });

        return NextResponse.json(updatedServiceOrder);
    } catch (error) {
        console.error('Error confirming service order:', error);
        return NextResponse.json({ error: 'Failed to confirm service order' }, { status: 500 });
    }
}
