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
        const { tree_id, tree_ids, management_id, assigned_to, observations, action_type, poda_type } = body;

        // Handle batch creation (from map selection)
        if (tree_ids && Array.isArray(tree_ids) && tree_ids.length > 0) {
            const createdOrders = [];

            for (const treeId of tree_ids) {
                // Create inspection for each tree
                const newInspection = await prisma.inspection.create({
                    data: {
                        treeId: Number(treeId),
                    }
                });

                // Create management action
                const newManagement = await prisma.managementAction.create({
                    data: {
                        inspectionId: newInspection.id_inspecao,
                        manejo_tipo: action_type || 'Poda',
                        poda_tipos: poda_type ? [poda_type] : [],
                        justification: observations || 'OS criada via ferramenta de mapa',
                        valid_from: new Date()
                    }
                });

                // Create service order
                const newServiceOrder = await prisma.serviceOrder.create({
                    data: {
                        tree_id: Number(treeId),
                        management_id: newManagement.id,
                        status: 'Planejada',
                        assigned_to: assigned_to || null,
                        observations: observations || null,
                    }
                });

                createdOrders.push(newServiceOrder);
            }

            return NextResponse.json({
                message: `${createdOrders.length} ordem(s) de serviço criada(s)`,
                count: createdOrders.length,
                orders: createdOrders
            }, { status: 201 });
        }

        // Original single tree logic
        let finalManagementId = management_id;

        // If no management_id, create Ad-Hoc Inspection + ManagementAction
        if (!finalManagementId && tree_id && action_type) {
            const newInspection = await prisma.inspection.create({
                data: {
                    treeId: Number(tree_id),
                }
            });

            const newManagement = await prisma.managementAction.create({
                data: {
                    inspectionId: newInspection.id_inspecao,
                    manejo_tipo: action_type,
                    poda_tipos: poda_type ? [poda_type] : [],
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
