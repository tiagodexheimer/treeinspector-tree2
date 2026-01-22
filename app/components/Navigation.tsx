"use client";

import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User as UserIcon, Settings, BarChart3, Map as MapIcon, TreeDeciduous, ClipboardList, ShieldAlert } from "lucide-react";

export default function Navigation() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    if (pathname === '/login') return null;

    const role = (session?.user as any)?.role;

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="font-bold text-xl text-green-600 flex items-center gap-2">
                                <TreeDeciduous className="w-6 h-6" />
                                TreeInspector
                            </span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/'
                                    ? 'border-green-500 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <MapIcon className="w-4 h-4 mr-1" />
                                Mapa
                            </Link>

                            {role !== 'OPERACIONAL' && (
                                <Link
                                    href="/trees"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/trees'
                                        ? 'border-green-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <TreeDeciduous className="w-4 h-4 mr-1" />
                                    Árvores
                                </Link>
                            )}

                            <Link
                                href="/statistics"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/statistics'
                                    ? 'border-green-500 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Estatísticas
                            </Link>

                            {['ADMIN', 'GESTOR', 'INSPETOR', 'OPERACIONAL'].includes(role) && (
                                <Link
                                    href="/service-orders"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === '/service-orders'
                                        ? 'border-green-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <ClipboardList className="w-4 h-4 mr-1" />
                                    Ordens de Serviço
                                </Link>
                            )}

                            {role === 'ADMIN' && (
                                <Link
                                    href="/admin/users"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname?.startsWith('/admin')
                                        ? 'border-green-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <ShieldAlert className="w-4 h-4 mr-1" />
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {status === "authenticated" ? (
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-900">{session.user?.name || session.user?.email}</span>
                                    <span className="text-xs text-gray-500 font-semibold">{role}</span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                    title="Sair"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Entrar
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
