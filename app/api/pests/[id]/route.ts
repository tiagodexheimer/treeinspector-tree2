import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

import { auth } from '@/auth';

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

    try {
        const { id } = await params;
        const body = await request.json();

        const pest = await prisma.pestCatalog.update({
            where: { id: parseInt(id) },
            data: {
                nome_comum: body.nome_comum,
                nome_cientifico: body.nome_cientifico || null,
                tipo: body.tipo || null
            }
        });

        return NextResponse.json(pest);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update pest' }, { status: 500 });
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
        return NextResponse.json({ error: 'Não autorizado. Apenas administradores podem deletar.' }, { status: 403 });
    }

    try {
        const { id } = await params;

        await prisma.pestCatalog.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Pest deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete pest' }, { status: 500 });
    }
}
