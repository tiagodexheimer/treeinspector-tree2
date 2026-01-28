import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await context.params;
        const id = parseInt(idParam);
        const order = await prisma.serviceOrder.findUnique({
            where: { id },
            include: {
                trees: {
                    select: {
                        id_arvore: true,
                        numero_etiqueta: true,
                        rua: true,
                        numero: true,
                        bairro: true,
                        endereco: true,
                        cover_photo: true,
                        species: true
                    }
                },
                managementActions: true,
                photos: true,
                materials: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Service Order not found' }, { status: 404 });
        }

        // Add coordinates to each tree manually
        const orderWithCoords = {
            ...order,
            trees: await Promise.all(((order as any).trees || []).map(async (tree: any) => {
                const coords: any[] = await prisma.$queryRaw`
                    SELECT ST_Y(localizacao::geometry) as lat, ST_X(localizacao::geometry) as lng 
                    FROM "Tree" WHERE id_arvore = ${tree.id_arvore}
                `;
                return {
                    ...tree,
                    lat: coords[0]?.lat || null,
                    lng: coords[0]?.lng || null
                };
            }))
        };

        return NextResponse.json(orderWithCoords as any);
    } catch (error) {
        console.error('Error fetching service order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const role = (session.user as any).role;
    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { serviceType, serviceSubtypes, description, status, assigned_to, priority, adjustment_notes, materials, checklist } = body;

    // RBAC: OPERACIONAL can set to 'Aguardando Revisão' or 'Em Execução'
    if (role === 'OPERACIONAL') {
        const allowedKeys = ['status', 'description', 'checklist', 'materials'];
        const bodyKeys = Object.keys(body);
        const hasDisallowedKeys = bodyKeys.some(key => !allowedKeys.includes(key));

        const allowedStatuses = ['Em Execução', 'Aguardando Revisão', 'Aguardando Ajustes'];
        if (hasDisallowedKeys || !allowedStatuses.includes(status)) {
            return NextResponse.json({
                error: 'Não autorizado. Papel Operacional pode apenas atualizar o status para execução ou revisão.'
            }, { status: 403 });
        }
    } else if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    try {

        const currentOrder = await prisma.serviceOrder.findUnique({
            where: { id },
            select: { executed_at: true }
        });

        const updatedOrder = await prisma.serviceOrder.update({
            where: { id },
            data: {
                serviceType,
                serviceSubtypes,
                description,
                status,
                priority: priority as any,
                assigned_to,
                adjustment_notes,
                checklist,
                // Only set executed_at if transitioning to Review and it's not already set
                executed_at: (status === 'Aguardando Revisão' && !currentOrder?.executed_at)
                    ? new Date()
                    : undefined,
                materials: materials ? {
                    deleteMany: {},
                    create: materials.map((m: any) => ({
                        name: m.name,
                        quantity: m.quantity,
                        unit: m.unit
                    }))
                } : undefined
            },
            include: {
                managementActions: true
            }
        });

        // If the OS is concluded, we should mark associated management actions as done
        if (status === 'Concluída') {
            const managementIds = (updatedOrder as any).managementActions.map((ma: any) => ma.id);
            if (managementIds.length > 0) {
                await prisma.managementAction.updateMany({
                    where: { id: { in: managementIds } },
                    data: { necessita_manejo: false }
                });
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating service order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
