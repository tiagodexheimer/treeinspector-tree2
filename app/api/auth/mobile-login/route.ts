import { NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        console.log(`[mobile-login] 🔄 Iniciando signIn para: ${email}`);

        try {
            // No NextAuth v5, signIn pode ser chamado programaticamente.
            // Usamos redirect: false para evitar 302 no App Mobile.
            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            // Se chegou aqui sem lançar erro de credenciais, o login foi bem sucedido
            // e os cookies de sessão foram definidos no contexto da resposta.

            // Buscamos os dados do usuário para retornar ao App Android (que espera role e name)
            const user = await prisma.user.findUnique({
                where: { email },
                select: { name: true, role: true }
            });

            return NextResponse.json({
                success: true,
                message: "Login realizado com sucesso",
                email: email,
                name: user?.name || "Usuário",
                role: user?.role || "INSPETOR"
            });

        } catch (error: any) {
            // Erros conhecidos do NextAuth
            if (error.type === 'CredentialsSignin' || error.message?.includes('CredentialsSignin')) {
                return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
            }

            // Log do erro para debug mas não expor detalhes sensíveis
            console.error('[mobile-login] Erro durante signIn:', error);

            return NextResponse.json({ error: 'Falha na autenticação' }, { status: 401 });
        }

    } catch (error) {
        console.error('[mobile-login] Erro fatal:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
