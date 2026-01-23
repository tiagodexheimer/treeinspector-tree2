import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
    try {
        const pests = await prisma.pestCatalog.findMany({
            orderBy: { nome_comum: 'asc' }
        });
        return NextResponse.json(pests);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch pests' }, { status: 500 });
    }
}

import { auth } from '@/auth';

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const role = (session.user as any).role;
    if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    try {
        const body = await request.json();

        const pest = await prisma.pestCatalog.create({
            data: {
                nome_comum: body.nome_comum,
                nome_cientifico: body.nome_cientifico || null,
                tipo: body.tipo || null
            }
        });

        return NextResponse.json(pest, { status: 201 });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Praga já existe' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create pest' }, { status: 500 });
    }
}
