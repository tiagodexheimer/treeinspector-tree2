import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await context.params;
        const id = parseInt(idParam);
        const order = await prisma.serviceOrder.findUnique({
            where: { id },
            include: {
                trees: {
                    include: {
                        species: true
                    }
                },
                managementActions: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Service Order not found' }, { status: 404 });
        }

        // Add coordinates to each tree manually
        const orderWithCoords = {
            ...order,
            trees: await Promise.all(order.trees.map(async (tree: any) => {
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

        return NextResponse.json(orderWithCoords);
    } catch (error) {
        console.error('Error fetching service order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await context.params;
        const id = parseInt(idParam);
        const body = await request.json();
        const { serviceType, serviceSubtypes, description, status, assigned_to } = body;

        const updatedOrder = await prisma.serviceOrder.update({
            where: { id },
            data: {
                serviceType,
                serviceSubtypes,
                description,
                status,
                assigned_to,
                executed_at: status === 'Concluída' ? new Date() : undefined
            },
            include: {
                managementActions: true
            }
        });

        // If the OS is concluded, we should mark associated management actions as done
        if (status === 'Concluída') {
            const managementIds = updatedOrder.managementActions.map(ma => ma.id);
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
