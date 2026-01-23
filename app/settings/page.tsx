'use client';

import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const userProfileCard = {
        title: 'Meu Perfil',
        description: 'Altere seu nome, e-mail e senha de acesso.',
        href: '/settings/profile',
        icon: (
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        color: 'from-emerald-400 to-emerald-600'
    };

    const managementCards = [
        {
            title: 'Gerenciar Espécies',
            description: 'Adicione, edite ou remova espécies. Configure porte, origem (nativa/exótica) e características.',
            href: '/settings/species',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            ),
            color: 'from-emerald-500 to-teal-600'
        },
        {
            title: 'Gerenciar Pragas',
            description: 'Gerencie o catálogo de pragas e doenças para uso em inspeções.',
            href: '/settings/pests',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            color: 'from-red-500 to-orange-600'
        }
    ];

    const adminCards = [
        {
            title: 'Importar Dados',
            description: 'Importe planilhas Excel com levantamentos. Acompanhe o progresso em tempo real.',
            href: '/settings/import',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            ),
            color: 'from-blue-500 to-indigo-600'
        },
        {
            title: 'Gestão de Usuários',
            description: 'Gerencie os usuários do sistema, altere permissões e adicione novos membros.',
            href: '/admin/users',
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: 'from-purple-500 to-indigo-600'
        }
    ];

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    const role = (session?.user as any)?.role;
    const canManageTechnical = ['ADMIN', 'GESTOR', 'INSPETOR'].includes(role);
    const isAdmin = role === 'ADMIN';

    const allCards = [
        userProfileCard,
        ...(canManageTechnical ? managementCards : []),
        ...(isAdmin ? adminCards : [])
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <Link href="/" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 mb-6">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar ao Início
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">Configurações do Projeto</h1>
                    <p className="text-emerald-100 text-lg">
                        Gerencie perfil, espécies, pragas, usuários e importe dados
                    </p>
                </div>
            </div>

            {/* Settings Cards */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allCards.map((card) => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                        >
                            {/* Icon Header */}
                            <div className={`bg-gradient-to-br ${card.color} p-6 text-white`}>
                                <div className="flex items-center justify-center">
                                    {card.icon}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                    {card.title}
                                </h2>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {card.description}
                                </p>
                                <div className="mt-4 flex items-center text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all">
                                    Acessar
                                    <svg className="w-4 h-4 ml-1 group-hover:ml-2 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Stats */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-l-emerald-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 uppercase font-semibold">Espécies Cadastradas</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1" id="species-count">-</p>
                            </div>
                            <svg className="w-12 h-12 text-emerald-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-l-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 uppercase font-semibold">Pragas Catalogadas</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1" id="pests-count">-</p>
                            </div>
                            <svg className="w-12 h-12 text-red-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-l-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 uppercase font-semibold">Árvores Totais</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1" id="trees-count">-</p>
                            </div>
                            <svg className="w-12 h-12 text-blue-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Load stats */}
            <script dangerouslySetInnerHTML={{
                __html: `
                fetch('/api/stats/dashboard')
                    .then(r => r.json())
                    .then(data => {
                        document.getElementById('species-count').textContent = data.species || 0;
                        document.getElementById('pests-count').textContent = data.pests || 0;
                        document.getElementById('trees-count').textContent = data.trees || 0;
                    })
                    .catch(() => {});
            ` }} />
        </div>
    );
}
