'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

interface Material {
    id: number;
    name: string;
    unit: string;
    unit_cost: number;
    auto_load: boolean;
    active: boolean;
}

export default function MaterialsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        unit: 'un',
        unit_cost: 0,
        auto_load: false,
        active: true
    });
    const [laborCost, setLaborCost] = useState('1.0');
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (!['ADMIN', 'GESTOR'].includes(role)) {
                router.push('/');
            }
        }
    }, [status, session, router]);

    const role = (session?.user as any)?.role;
    const canEdit = ['ADMIN', 'GESTOR'].includes(role);
    const canDelete = role === 'ADMIN';

    useEffect(() => {
        fetchMaterials();
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.labor_cost) {
                setLaborCost(data.labor_cost);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSaveLaborCost() {
        setSavingSettings(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'labor_cost', value: laborCost })
            });
            if (!res.ok) throw new Error('Falha ao salvar');
        } catch (error) {
            alert('Erro ao salvar custo de mão de obra');
        } finally {
            setSavingSettings(false);
        }
    }

    async function fetchMaterials() {
        try {
            const res = await fetch('/api/materials');
            const data = await res.json();
            setMaterials(data || []);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSave(id?: number) {
        const url = id ? `/api/materials/${id}` : '/api/materials';
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
        setFormData({ name: '', unit: 'un', unit_cost: 0, auto_load: false, active: true });
        fetchMaterials();
    }

    async function handleDelete(id: number) {
        if (!confirm('Deletar este material?')) return;
        const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchMaterials();
        } else {
            alert('Não foi possível deletar o material.');
        }
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <Link href="/settings" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold">Gerenciar Materiais</h1>
                    <p className="text-blue-100">Catálogo de insumos e materiais de consumo</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 py-8">
                {/* Global Settings Section */}
                {canEdit && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-indigo-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Custo de Mão de Obra</h2>
                        </div>
                        <div className="flex items-end gap-4">
                            <div className="flex-1 max-w-xs">
                                <label className="block text-[10px] font-black text-indigo-700 uppercase mb-1">Custo Homem-Hora (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-10 pr-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900"
                                        value={laborCost}
                                        onChange={(e) => setLaborCost(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSaveLaborCost}
                                disabled={savingSettings}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all font-bold shadow-md h-10"
                            >
                                {savingSettings ? 'Salvando...' : 'Atualizar Custo'}
                            </button>
                            <p className="text-xs text-gray-400 italic mb-2 flex-1">
                                Este valor será utilizado para calcular o custo total estimado das Ordens de Serviço (Equipe × Duração × Custo).
                            </p>
                        </div>
                    </div>
                )}
                {canEdit && (
                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setFormData({ name: '', unit: 'un', unit_cost: 0, auto_load: false, active: true });
                        }}
                        className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                    >
                        {showAddForm ? 'Cancelar' : '+ Adicionar Material'}
                    </button>
                )}

                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-100">
                        <MaterialForm
                            formData={formData}
                            setFormData={setFormData}
                            onSave={() => handleSave()}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Material</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unidade</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Auto-Load</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                {canEdit && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {materials.map((mat) => (
                                editing === mat.id ? (
                                    <tr key={mat.id} className="bg-blue-50/50">
                                        <td colSpan={5} className="px-6 py-8">
                                            <MaterialForm
                                                formData={formData}
                                                setFormData={setFormData}
                                                onSave={() => handleSave(mat.id)}
                                                onCancel={() => {
                                                    setEditing(null);
                                                    setFormData({ name: '', unit: 'un', unit_cost: 0, auto_load: false, active: true });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={mat.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{mat.name}</div>
                                            <div className="text-xs text-gray-400">Custo Ref: R$ {Number(mat.unit_cost).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{mat.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {mat.auto_load ? (
                                                <span className="text-green-600 font-bold" title="Carrega automaticamente na finalização">✓</span>
                                            ) : (
                                                <span className="text-gray-300">○</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${mat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {mat.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        {canEdit && (
                                            <td className="px-6 py-4 text-right space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setEditing(mat.id);
                                                        setFormData({
                                                            name: mat.name,
                                                            unit: mat.unit,
                                                            unit_cost: mat.unit_cost,
                                                            auto_load: mat.auto_load,
                                                            active: mat.active
                                                        });
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                                                >
                                                    Editar
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(mat.id)}
                                                        className="text-red-400 hover:text-red-600 font-medium text-sm"
                                                    >
                                                        Deletar
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                    {materials.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📦</div>
                            <div className="text-gray-500 font-medium">Nenhum material cadastrado</div>
                            <p className="text-sm text-gray-400 mt-1">Clique no botão acima para começar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MaterialForm({ formData, setFormData, onSave, onCancel }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Material / Insumo *</label>
                <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Tinta Selante, Inseticida..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Unidade *</label>
                <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                    placeholder="Ex: un, kg, L, m"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Custo Unitário (R$)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                />
            </div>

            <div className="lg:col-span-2 flex items-center gap-8 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.auto_load}
                            onChange={(e) => setFormData({ ...formData, auto_load: e.target.checked })}
                        />
                        <div className={`w-10 h-5 bg-gray-200 rounded-full shadow-inner transition-colors ${formData.auto_load ? 'bg-green-500' : ''}`}></div>
                        <div className={`absolute -left-1 -top-1 w-7 h-7 bg-white rounded-full shadow border border-gray-200 transition-transform ${formData.auto_load ? 'translate-x-5' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Pré-carregar na finalização</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <div className={`w-10 h-5 bg-gray-200 rounded-full shadow-inner transition-colors ${formData.active ? 'bg-green-500' : ''}`}></div>
                        <div className={`absolute -left-1 -top-1 w-7 h-7 bg-white rounded-full shadow border border-gray-200 transition-transform ${formData.active ? 'translate-x-5' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Ativo</span>
                </label>
            </div>

            <div className="lg:col-span-2 flex justify-end gap-3 items-end">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-gray-600"
                >
                    Cancelar
                </button>
                <button
                    onClick={onSave}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md"
                >
                    Salvar Material
                </button>
            </div>
        </div>
    );
}
