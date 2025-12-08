import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const assigned_to = searchParams.get('assigned_to');

        const serviceOrders = await prisma.serviceOrder.findMany({
            where: {
                ...(status && { status }),
                ...(assigned_to && { assigned_to }),
            },
            include: {
                tree: {
                    include: {
                        species: true,
                    },
                },
                management: {
                    include: {
                        inspection: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return NextResponse.json(serviceOrders);
    } catch (error) {
        console.error('Error fetching service orders:', error);
        return NextResponse.json({ error: 'Failed to fetch service orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tree_id, management_id, assigned_to, observations, action_type, poda_type } = body;

        let finalManagementId = management_id;

        // If no management_id, create Ad-Hoc Inspection + ManagementAction
        if (!finalManagementId && tree_id && action_type) {
            const newInspection = await prisma.inspection.create({
                data: {
                    treeId: Number(tree_id),
                    // Create empty dendrometric/phytosanitary to satisfy database integrity if needed, 
                    // or rely on schema allowing them to be missing (they are arrays, so 0 is fine).
                }
            });

            const newManagement = await prisma.managementAction.create({
                data: {
                    inspectionId: newInspection.id_inspecao,
                    action_type: action_type,
                    poda_type: poda_type,
                    justification: 'Ordem de Serviço criada administrativamente via Web Dashboard',
                    valid_from: new Date()
                }
            });

            finalManagementId = newManagement.id;
        }

        if (!finalManagementId) {
            return NextResponse.json({ error: 'Missing management_id or action_type' }, { status: 400 });
        }

        const newServiceOrder = await prisma.serviceOrder.create({
            data: {
                tree_id: Number(tree_id),
                management_id: Number(finalManagementId),
                status: 'Planejada',
                assigned_to,
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

        return NextResponse.json(newServiceOrder, { status: 201 });
    } catch (error) {
        console.error('Error creating service order:', error);
        return NextResponse.json({ error: 'Failed to create service order' }, { status: 500 });
    }
}
