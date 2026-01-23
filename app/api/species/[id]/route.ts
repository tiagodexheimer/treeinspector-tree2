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

        const species = await prisma.species.update({
            where: { id_especie: parseInt(id) },
            data: {
                nome_comum: body.nome_comum,
                nome_cientifico: body.nome_cientifico,
                family: body.family || null,
                native_status: body.native_status || null,
                porte: body.porte || null,
                growth_rate: body.growth_rate || null,
                max_height_m: body.max_height_m ? parseFloat(body.max_height_m) : null,
                description: body.description || null
            }
        });

        return NextResponse.json(species);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Nome científico já existe' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update species' }, { status: 500 });
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

        // Check if species has trees
        const treeCount = await prisma.tree.count({
            where: { speciesId: parseInt(id) }
        });

        if (treeCount > 0) {
            return NextResponse.json({
                error: `Não é possível deletar. Existem ${treeCount} árvore(s) cadastradas para esta espécie.`
            }, { status: 400 });
        }

        await prisma.species.delete({
            where: { id_especie: parseInt(id) }
        });

        return NextResponse.json({ message: 'Species deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete species' }, { status: 500 });
    }
}
