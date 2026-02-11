import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const onlyActive = searchParams.get('active') === 'true';
        const autoLoad = searchParams.get('autoLoad') === 'true';

        const where: any = {};
        if (onlyActive) where.active = true;
        if (autoLoad) where.auto_load = true;

        const materials = await prisma.materialMaster.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(materials);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const role = (session.user as any).role;
    if (!['ADMIN', 'GESTOR'].includes(role)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    try {
        const body = await request.json();

        const material = await prisma.materialMaster.create({
            data: {
                name: body.name,
                unit: body.unit,
                unit_cost: body.unit_cost || 0,
                auto_load: body.auto_load || false,
                active: body.active !== undefined ? body.active : true
            }
        });

        return NextResponse.json(material, { status: 201 });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Material com este nome já existe' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
    }
}
