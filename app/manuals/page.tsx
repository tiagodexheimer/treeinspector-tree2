"use client";

import Link from "next/link";
import { ClipboardList, TreeDeciduous, BookOpen, ShieldCheck, Zap } from "lucide-react";

const manuals = [
    {
        title: "Manual de Ordem de Serviço (OS)",
        description: "Aprenda a criar, gerenciar e revisar ordens de serviço, desde o planejamento até a execução em campo.",
        href: "/manuals/service-order",
        icon: <ClipboardList className="w-8 h-8 text-blue-500" />,
        color: "bg-blue-50 border-blue-100",
        tags: ["Gestão", "Campo", "Web/Android"]
    },
    {
        title: "Manual de Inspeção de Árvores",
        description: "Guia completo sobre como realizar vistorias técnicas, com foco na metodologia TRAQ de avaliação de risco.",
        href: "/manuals/tree-inspection",
        icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
        color: "bg-green-50 border-green-100",
        tags: ["Técnico", "Risco", "TRAQ"]
    }
];

export default function ManualsHub() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-2xl mb-4">
                        <BookOpen className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Base de Conhecimento
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">
                        Central de manuais e guias práticos para operação do sistema TreeInspector.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {manuals.map((manual) => (
                        <Link
                            key={manual.href}
                            href={manual.href}
                            className={`group block p-6 rounded-2xl border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${manual.color} hover:bg-white`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                    {manual.icon}
                                </div>
                                <div className="flex gap-2">
                                    {manual.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-white/50 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                                {manual.title}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                {manual.description}
                            </p>

                            <div className="mt-6 flex items-center text-sm font-bold text-green-600">
                                Acessar manual
                                <Zap className="w-4 h-4 ml-1 fill-current" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        Suporte e Ajuda
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Caso encontre dificuldades não cobertas por estes manuais, entre em contato com o suporte técnico através do painel de administração ou e-mail corporativo.
                    </p>
                </div>
            </div>
        </div>
    );
}
