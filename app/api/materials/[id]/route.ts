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
    if (!['ADMIN', 'GESTOR'].includes(role)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const material = await prisma.materialMaster.update({
            where: { id },
            data: {
                name: body.name,
                unit: body.unit,
                unit_cost: body.unit_cost,
                auto_load: body.auto_load,
                active: body.active
            }
        });

        return NextResponse.json(material);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
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
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        await prisma.materialMaster.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }
}
