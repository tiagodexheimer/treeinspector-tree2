import ProfileSettings from "@/components/ProfileSettings";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 pt-10">
                <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Voltar para Configurações
                </Link>
            </div>
            <ProfileSettings />
        </div>
    );
}
