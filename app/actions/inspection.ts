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

export async function createInspection(treeId: number, data: any) {
    const user = await checkAuth();

    const inspection = await prisma.inspection.create({
        data: {
            treeId,
            createdById: user.id,
            // ... other data mapping from form
            // Note: This matches the user request to track 'createdById'
        }
    });

    revalidatePath(`/trees/${treeId}`);
    return inspection;
}
