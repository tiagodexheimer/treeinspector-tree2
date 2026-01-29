import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const role = (session.user as any).role;
        if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { treeIds, description, status, assignedToId, serviceType, serviceSubtypes, priority, managementActionId } = body;
        // treeIds should be an array of numbers

        if (!treeIds || !Array.isArray(treeIds) || treeIds.length === 0) {
            return NextResponse.json({ error: 'treeIds array is required' }, { status: 400 });
        }

        // We need to find the management actions for these trees if we want to link them?
        // The user said: "when it's an OS with 2 or more trees... including all trees"
        // Usually OS is based on "needs management".
        // For now, let's just link the Trees. And optionally link ManagementActions if we can find them "open" for these trees.
        // Let's find open management actions for these trees.

        const trees = await prisma.tree.findMany({
            where: { id_arvore: { in: treeIds } },
            include: {
                inspections: {
                    orderBy: { data_inspecao: 'desc' },
                    take: 1,
                    include: {
                        managementActions: true
                    }
                }
            }
        });

        // Collect management actions that need handling
        const managementIds: number[] = [];

        // If explicit ID provided, use it
        if (managementActionId) {
            managementIds.push(managementActionId);
        } else {
            // Auto-detect otherwise
            trees.forEach(t => {
                const insp = t.inspections[0];
                if (insp && insp.managementActions && insp.managementActions.length > 0) {
                    // Assuming we want to include the LATEST management action required
                    const action = insp.managementActions[0];
                    if (action.necessita_manejo) {
                        managementIds.push(action.id);
                    }
                }
            });
        }

        const newOS = await prisma.serviceOrder.create({
            data: {
                status: status || 'Planejada',
                createdById: session.user.id,
                assignedToId: assignedToId,
                description: description,
                observations: description, // Use description as observations for now ?
                trees: {
                    connect: treeIds.map((id: any) => ({ id_arvore: id }))
                },
                managementActions: {
                    connect: managementIds.map(id => ({ id }))
                },
                serviceType,
                serviceSubtypes: serviceSubtypes || [],
                priority: priority || 'Moderada'
            },
            include: {
                trees: true,
                managementActions: true
            }
        });

        return NextResponse.json(newOS, { status: 201 });

    } catch (error) {
        console.error('Error creating service order:', error);
        return NextResponse.json({ error: 'Failed to create service order' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth();
        const role = (session?.user as any)?.role;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'active', 'finished', or specific status
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const radius = searchParams.get('radius'); // meters

        let where: any = {};

        if (status === 'active') {
            where.status = {
                notIn: ['Concluída', 'Cancelada']
            };
        } else if (status === 'finished') {
            where.status = {
                in: ['Concluída', 'Cancelada']
            };
        } else if (status) {
            where.status = status;
        }

        // RBAC Filter: Operacional only sees assigned to them or unassigned
        if (role === 'OPERACIONAL') {
            where.OR = [
                { assignedToId: session?.user?.id },
                { assignedToId: null }
            ];
        }

        // If Lat/Lng provided, logic is complex because OS has multiple Trees.
        // Rule: If ANY tree in the OS is within radius, include the OS.
        // Prisma doesn't support geospatial join easily. 
        // Easier approach: Get Trees within radius first, then find OS linked to them.

        if (lat && lng && radius) {
            const r = parseFloat(radius);
            const latVal = parseFloat(lat);
            const lngVal = parseFloat(lng);

            // Find trees nearby using PostGIS
            const nearbyTrees: any[] = await prisma.$queryRaw`
                SELECT id_arvore FROM "Tree"
                WHERE ST_DWithin(localizacao, ST_SetSRID(ST_MakePoint(${lngVal}, ${latVal}), 4326)::geography, ${r})
            `;

            const treeIds = nearbyTrees.map(t => t.id_arvore);

            where.trees = {
                some: {
                    id_arvore: { in: treeIds }
                }
            };
        }

        const serviceOrders = await prisma.serviceOrder.findMany({
            where,
            include: {
                trees: {
                    include: {
                        species: true
                    }
                },
                managementActions: true
            },
            orderBy: { created_at: 'desc' }
        });

        // Precisamos adicionar lat/lng manualmente para cada árvore em cada OS
        const serviceOrdersWithCoords = await Promise.all(serviceOrders.map(async (so) => {
            const treesWithCoords = await Promise.all(so.trees.map(async (tree: any) => {
                const coords: any[] = await prisma.$queryRaw`
                    SELECT ST_Y(localizacao::geometry) as lat, ST_X(localizacao::geometry) as lng 
                    FROM "Tree" WHERE id_arvore = ${tree.id_arvore}
                `;
                return {
                    ...tree,
                    lat: coords[0]?.lat || null,
                    lng: coords[0]?.lng || null
                };
            }));
            return {
                ...so,
                trees: treesWithCoords
            };
        }));

        return NextResponse.json(serviceOrdersWithCoords);

    } catch (error) {
        console.error('Error fetching service orders:', error);
        return NextResponse.json({ error: 'Failed to fetch service orders' }, { status: 500 });
    }
}
