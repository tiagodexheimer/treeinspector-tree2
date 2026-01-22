"use server";

import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function checkAuth(restrictedToOperacional = false) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Você precisa estar autenticado.");
    }
    const role = (session.user as any).role;
    return { user: session.user, role };
}

export async function createServiceOrder(data: any) {
    const { user, role } = await checkAuth();

    if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
        throw new Error("Não autorizado para criar ordens de serviço.");
    }

    const so = await prisma.serviceOrder.create({
        data: {
            ...data,
            createdById: user.id,
            status: 'Planejada'
        }
    });

    revalidatePath("/service-orders");
    return so;
}

export async function updateServiceOrderStatus(id: number, status: string, photos?: string[]) {
    const { user, role } = await checkAuth();

    const so = await prisma.serviceOrder.findUnique({
        where: { id },
    });

    if (!so) throw new Error("Ordem de serviço não encontrada.");

    // RBAC for closing/updating SO
    const isAdminOrGestor = ['ADMIN', 'GESTOR'].includes(role);
    const isAssignedOperacional = role === 'OPERACIONAL' && (so.assignedToId === user.id || !so.assignedToId);

    if (!isAdminOrGestor && !isAssignedOperacional) {
        throw new Error("Você não tem permissão para atualizar esta Ordem de Serviço.");
    }

    const updatedSo = await prisma.serviceOrder.update({
        where: { id },
        data: {
            status,
            executed_at: status === 'Concluída' ? new Date() : undefined,
            // Handle photos...
        }
    });

    revalidatePath("/service-orders");
    revalidatePath(`/service-orders/${id}`);
    return updatedSo;
}
