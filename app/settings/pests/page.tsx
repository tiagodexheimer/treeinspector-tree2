'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

interface Pest {
    id: number;
    nome_comum: string;
    nome_cientifico: string | null;
    tipo: string | null;
}

export default function PestsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [pests, setPests] = useState<Pest[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ nome_comum: '', nome_cientifico: '', tipo: '' });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (role !== 'ADMIN') {
                router.push('/');
            }
        }
    }, [status, session, router]);

    useEffect(() => {
        fetchPests();
    }, []);

    async function fetchPests() {
        const res = await fetch('/api/pests');
        const data = await res.json();
        setPests(data);
    }

    async function handleSave(id?: number) {
        const url = id ? `/api/pests/${id}` : '/api/pests';
        const method = id ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) {
            const error = await res.json();
            alert(error.error || 'Erro ao salvar');
            return;
        }

        setEditing(null);
        setShowAddForm(false);
        setFormData({ nome_comum: '', nome_cientifico: '', tipo: '' });
        fetchPests();
    }

    async function handleDelete(id: number) {
        if (!confirm('Deletar esta praga?')) return;
        await fetch(`/api/pests/${id}`, { method: 'DELETE' });
        fetchPests();
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <Link href="/settings" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold">Gerenciar Pragas</h1>
                    <p className="text-red-100">Catálogo de pragas e doenças</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 py-8">
                <button
                    onClick={() => { setShowAddForm(!showAddForm); setFormData({ nome_comum: '', nome_cientifico: '', tipo: '' }); }}
                    className="mb-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                    {showAddForm ? 'Cancelar' : '+ Adicionar Praga'}
                </button>

                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-red-200">
                        <PestForm formData={formData} setFormData={setFormData} onSave={() => handleSave()} onCancel={() => setShowAddForm(false)} />
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome Comum</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome Científico</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {pests.map((pest) => (
                                editing === pest.id ? (
                                    <tr key={pest.id} className="bg-red-50">
                                        <td colSpan={4} className="px-6 py-4">
                                            <PestForm
                                                formData={formData}
                                                setFormData={setFormData}
                                                onSave={() => handleSave(pest.id)}
                                                onCancel={() => { setEditing(null); setFormData({ nome_comum: '', nome_cientifico: '', tipo: '' }); }}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={pest.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{pest.nome_comum}</td>
                                        <td className="px-6 py-4 text-gray-600 italic">{pest.nome_cientifico || '-'}</td>
                                        <td className="px-6 py-4">
                                            {pest.tipo && (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                    {pest.tipo}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => { setEditing(pest.id); setFormData({ nome_comum: pest.nome_comum, nome_cientifico: pest.nome_cientifico || '', tipo: pest.tipo || '' }); }}
                                                className="text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pest.id)}
                                                className="text-gray-600 hover:text-gray-700 font-medium"
                                            >
                                                Deletar
                                            </button>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                    {pests.length === 0 && <div className="text-center py-8 text-gray-500">Nenhuma praga cadastrada</div>}
                </div>
            </div>
        </div>
    );
}

function PestForm({ formData, setFormData, onSave, onCancel }: any) {
    return (
        <div className="grid grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Comum *</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.nome_comum}
                    onChange={(e) => setFormData({ ...formData, nome_comum: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Científico</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.nome_cientifico}
                    onChange={(e) => setFormData({ ...formData, nome_cientifico: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                    <option value="">Selecione...</option>
                    <option value="Fungo">Fungo</option>
                    <option value="Inseto">Inseto</option>
                    <option value="Parasita">Parasita</option>
                    <option value="Urbano">Urbano</option>
                    <option value="Praga">Praga</option>
                </select>
            </div>
            <div className="col-span-3 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={onSave} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Salvar</button>
            </div>
        </div>
    );
}
