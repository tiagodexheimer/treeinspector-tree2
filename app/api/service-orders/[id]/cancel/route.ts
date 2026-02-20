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
    const { reason } = body;

    try {
        const updatedOS = await prisma.serviceOrder.update({
            where: { id },
            data: {
                status: 'Planejada',
                cancel_reason: reason || 'Execução interrompida'
            }
        });

        return NextResponse.json(updatedOS);
    } catch (error) {
        console.error('Error cancelling OS:', error);
        return NextResponse.json({ error: 'Failed to cancel service order' }, { status: 500 });
    }
}
