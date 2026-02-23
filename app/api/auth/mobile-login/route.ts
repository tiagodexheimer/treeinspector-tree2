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
            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            console.log(`[mobile-login] ✅ SignIn bem sucedido para: ${email}`);

            // Buscamos os dados do usuário para retornar ao App Android
            const user = await prisma.user.findUnique({
                where: { email },
                select: { name: true, role: true }
            });

            // Criamos a resposta
            const response = NextResponse.json({
                success: true,
                message: "Login realizado com sucesso",
                email: email,
                name: user?.name || "Usuário",
                role: user?.role || "INSPETOR"
            });

            // IMPORTANTE: Em NextAuth v5, quando usamos signIn no servidor (Route Handler),
            // os cookies são definidos no cookie store global do Next.js.
            // O NextResponse.json cria um novo objeto que NÃO herda esses cookies automaticamente.
            // Precisamos garantir que eles sejam propagados para a resposta que volta para o App Android.
            const cookieStore = await (await import('next/headers')).cookies();
            const allCookies = cookieStore.getAll();

            console.log(`[mobile-login] 🍪 Propagando ${allCookies.length} cookies para o App: ${allCookies.map(c => c.name).join(', ')}`);

            allCookies.forEach(cookie => {
                console.log(`[mobile-login]   -> Setting cookie: ${cookie.name}, Value hash: ${cookie.value.substring(0, 10)}...`);
                response.cookies.set(cookie.name, cookie.value, {
                    ...cookie,
                    secure: process.env.NODE_ENV === 'production'
                } as any);
            });

            return response;

        } catch (error: any) {
            if (error.type === 'CredentialsSignin' || error.message?.includes('CredentialsSignin')) {
                return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
            }
            console.error('[mobile-login] Erro durante signIn:', error);
            return NextResponse.json({ error: 'Falha na autenticação' }, { status: 401 });
        }
    } catch (error) {
        console.error('[mobile-login] Erro fatal:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
