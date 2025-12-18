import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

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

        return NextResponse.json(order);
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
                assigned_to
            }
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating service order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
