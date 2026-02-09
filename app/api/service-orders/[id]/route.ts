import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await context.params;
        const id = parseInt(idParam);

        // ONE ROUND TRIP TO RULE THEM ALL
        // We use JSON aggregation to fetch all relations in a single DB call
        const results = await prisma.$queryRaw`
            WITH so AS (
                SELECT * FROM "ServiceOrder" WHERE id = ${id} LIMIT 1
            )
            SELECT 
                so.*,
                COALESCE((
                    SELECT JSON_AGG(t_data) FROM (
                        SELECT 
                            t.id_arvore, t.numero_etiqueta, t.rua, t.numero, t.bairro, t.endereco, t.cover_photo,
                            ST_Y(t.localizacao::geometry) as lat, 
                            ST_X(t.localizacao::geometry) as lng,
                            (SELECT JSON_BUILD_OBJECT(
                                'id_especie', s.id_especie, 
                                'nome_comum', s.nome_comum, 
                                'nome_cientifico', s.nome_cientifico
                            ) FROM "Species" s WHERE s.id_especie = t."speciesId") as species
                        FROM "Tree" t
                        JOIN "_ServiceOrderToTree" so_t ON t.id_arvore = so_t."B"
                        WHERE so_t."A" = so.id
                    ) t_data
                ), '[]'::json) as trees,
                COALESCE((
                    SELECT JSON_AGG(ma.*) FROM "ManagementAction" ma 
                    JOIN "_ManagementActionToServiceOrder" ma_so ON ma.id = ma_so."A"
                    WHERE ma_so."B" = so.id
                ), '[]'::json) as "managementActions",
                COALESCE((
                    SELECT JSON_AGG(sop.*) FROM "ServiceOrderPhoto" sop WHERE sop."serviceOrderId" = so.id
                ), '[]'::json) as photos,
                COALESCE((
                    SELECT JSON_AGG(som.*) FROM "ServiceOrderMaterial" som WHERE som."serviceOrderId" = so.id
                ), '[]'::json) as materials
            FROM so;
        `;

        const order = (results as any[])[0];

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

        const updatedOrder = await prisma.$transaction(async (tx) => {
            // 1. Update the Service Order
            const order = await tx.serviceOrder.update({
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
                    managementActions: true,
                    trees: true
                }
            });

            // 2. If Concluída + Remoção, update trees to 'Removida'
            // We must use 'order.serviceType' because 'serviceType' from body might be undefined if not changing
            const finalStatus = order.status;
            const finalServiceType = order.serviceType;

            if (finalStatus === 'Concluída' && finalServiceType === 'Remoção') {
                const treeIds = order.trees.map(t => t.id_arvore);
                if (treeIds.length > 0) {
                    await tx.tree.updateMany({
                        where: { id_arvore: { in: treeIds } },
                        data: { status: 'Removida' }
                    });
                }
            }

            return order;
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
