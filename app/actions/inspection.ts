"use server";

import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function checkAuth() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Você precisa estar autenticado.");
    }
    const role = (session.user as any).role;
    if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
        throw new Error("Apenas Inspetores, Gestores ou Administradores podem realizar inspeções.");
    }
    return session.user;
}

// Update signature to accept optional data
export async function createInspection(treeId: number, data: any, treeRemoved: boolean = false) {
    const user = await checkAuth();

    const inspection = await prisma.inspection.create({
        data: {
            treeId,
            createdById: user.id,
            tree_removed: treeRemoved,
            // Capture date if provided in data, else default
            data_inspecao: data.data_inspecao ? new Date(data.data_inspecao) : new Date(),

            // Map other related data if passed in structure (e.g. from a web form)
            // For now, assuming basic creation or that 'data' contains the relations
            // If data is used for detailed fields, we'd need to map dendrometrics/etc here too
            // But aligned with request:
        }
    });

    if (treeRemoved) {
        await prisma.tree.update({
            where: { id_arvore: treeId },
            data: { status: 'Removida' }
        });
    }

    revalidatePath(`/trees/${treeId}`);
    return inspection;
}
