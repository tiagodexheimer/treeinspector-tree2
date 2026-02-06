import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "./app/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    // cookies removed to use default NextAuth behavior
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    console.log(`[auth] 🔍 Tentando login: ${email}`);

                    try {
                        console.log(`[auth] 🔄 Verificando ligação à Base de Dados...`);
                        await prisma.$connect();
                        console.log(`[auth] 🔗 Ligação à DB OK.`);

                        // Cast para evitar erro de lint se types não estiverem sync
                        const userModel = (prisma as any).user;
                        const user = await userModel.findUnique({ where: { email } });

                        if (!user) {
                            console.log(`[auth] ❌ Utilizador não encontrado na DB: ${email}`);
                            return null;
                        }
                        if (!user.active) {
                            console.log(`[auth] ⚠️ Utilizador inativo: ${email}`);
                            return null;
                        }

                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) {
                            console.log(`[auth] ✅ Login bem sucedido: ${email}`);
                            return user;
                        } else {
                            console.log(`[auth] ❌ Palavra-passe incorreta para: ${email}`);
                        }
                    } catch (dbError: any) {
                        console.error(`[auth] 🚨 Erro de ligação à Base de Dados:`, dbError.message);
                        return null;
                    }
                } else {
                    console.log(`[auth] ⚠️ Formato de credenciais inválido:`, parsedCredentials.error.format());
                }

                return null;
            },
        }),
    ],
});
