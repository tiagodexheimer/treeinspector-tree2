import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse [animation-delay:2s]"></div>
            </div>

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
                <LoginForm />

                <p className="mt-8 text-slate-500 text-sm">
                    Acesso restrito a pessoal autorizado da <span className="text-emerald-500 font-semibold tracking-wide">TreeInspector</span>.
                </p>
            </div>
        </main>
    );
}
