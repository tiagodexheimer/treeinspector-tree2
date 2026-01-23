"use server";

import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Não autorizado. Apenas administradores podem realizar esta ação.");
    }
}

export async function getUsers() {
    await checkAdmin();
    return prisma.user.findMany({
        orderBy: { created_at: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            created_at: true,
        },
    });
}

export async function createUser(data: any) {
    await checkAdmin();
    const { name, email, password, role } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            active: true,
        },
    });

    revalidatePath("/admin/users");
    return user;
}

export async function updateUser(id: string, data: any) {
    await checkAdmin();
    const { name, email, role, active, password } = data;

    const updateData: any = { name, email, role, active };
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/admin/users");
    return user;
}

export async function deleteUser(id: string) {
    await checkAdmin();
    // Don't delete the last admin
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    const userToDelete = await prisma.user.findUnique({ where: { id } });

    if (userToDelete?.role === "ADMIN" && admins <= 1) {
        throw new Error("Não é possível excluir o único administrador do sistema.");
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
}

export async function updateProfile(data: any) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Não autorizado. Faça login para atualizar seu perfil.");
    }

    const { name, email, password } = data;
    const userId = session.user.id;

    // Check if email is already taken by another user
    if (email) {
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                id: { not: userId }
            }
        });
        if (existingUser) {
            throw new Error("Este e-mail já está sendo usado por outro usuário.");
        }
    }

    const updateData: any = { name, email };
    if (password) {
        console.log(`[updateProfile] Hashing new password for user ${userId}`);
        updateData.password = await bcrypt.hash(password, 10);
        console.log(`[updateProfile] Password hashed successfully`);
    }

    console.log(`[updateProfile] Updating user ${userId} with data:`, { ...updateData, password: password ? '[HIDDEN]' : undefined });

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    // Verification log
    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
    });

    if (password && updatedUser?.password) {
        const check = await bcrypt.compare(password, updatedUser.password);
        console.log(`[updateProfile] Password update verification: ${check ? 'SUCCESS' : 'FAILED'}`);
        if (!check) {
            throw new Error("Falha interna ao verificar a atualização da senha. Por favor, tente novamente.");
        }
    }

    console.log(`[updateProfile] User ${userId} updated successfully in database`);

    revalidatePath("/settings/profile");
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}
