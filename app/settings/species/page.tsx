'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Species {
    id_especie: number;
    nome_comum: string;
    nome_cientifico: string;
    family: string | null;
    native_status: string | null;
    porte: string | null;
    growth_rate: string | null;
    max_height_m: number | null;
    description: string | null;
}

export default function SpeciesPage() {
    const [species, setSpecies] = useState<Species[]>([]);
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        nome_comum: '',
        nome_cientifico: '',
        family: '',
        native_status: '',
        porte: '',
        growth_rate: '',
        max_height_m: '',
        description: ''
    });

    useEffect(() => {
        fetchSpecies();
    }, [search]);

    async function fetchSpecies() {
        try {
            const res = await fetch(`/api/species?q=${search}`);
            const data = await res.json();
            setSpecies(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(id?: number) {
        try {
            const url = id ? `/api/species/${id}` : '/api/species';
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
            resetForm();
            fetchSpecies();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar espécie');
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Tem certeza que deseja deletar esta espécie?')) return;

        try {
            const res = await fetch(`/api/species/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'Erro ao deletar');
                return;
            }
            fetchSpecies();
        } catch (error) {
            console.error(error);
        }
    }

    function startEdit(sp: Species) {
        setEditing(sp.id_especie);
        setFormData({
            nome_comum: sp.nome_comum,
            nome_cientifico: sp.nome_cientifico,
            family: sp.family || '',
            native_status: sp.native_status || '',
            porte: sp.porte || '',
            growth_rate: sp.growth_rate || '',
            max_height_m: sp.max_height_m?.toString() || '',
            description: sp.description || ''
        });
    }

    function resetForm() {
        setFormData({
            nome_comum: '',
            nome_cientifico: '',
            family: '',
            native_status: '',
            porte: '',
            growth_rate: '',
            max_height_m: '',
            description: ''
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <Link href="/settings" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </Link>
                    <h1 className="text-3xl font-bold">Gerenciar Espécies</h1>
                    <p className="text-emerald-100">Adicione, edite ou remova espécies de árvores</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Search & Add */}
                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Buscar espécie..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                        onClick={() => { setShowAddForm(!showAddForm); resetForm(); }}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                        {showAddForm ? 'Cancelar' : '+ Adicionar Espécie'}
                    </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-emerald-200">
                        <h3 className="font-bold text-lg mb-4">Nova Espécie</h3>
                        <SpeciesForm formData={formData} setFormData={setFormData} onSave={() => handleSave()} onCancel={() => { setShowAddForm(false); resetForm(); }} />
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome Comum</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome Científico</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Origem</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Porte</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {species.map((sp) => (
                                editing === sp.id_especie ? (
                                    <tr key={sp.id_especie} className="bg-emerald-50">
                                        <td colSpan={5} className="px-6 py-4">
                                            <SpeciesForm
                                                formData={formData}
                                                setFormData={setFormData}
                                                onSave={() => handleSave(sp.id_especie)}
                                                onCancel={() => { setEditing(null); resetForm(); }}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={sp.id_especie} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{sp.nome_comum}</td>
                                        <td className="px-6 py-4 text-gray-600 italic">{sp.nome_cientifico}</td>
                                        <td className="px-6 py-4">
                                            {sp.native_status && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sp.native_status === 'Nativa' ? 'bg-green-100 text-green-800' :
                                                    sp.native_status === 'Exótica' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {sp.native_status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {sp.porte && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sp.porte === 'Pequeno' ? 'bg-blue-100 text-blue-800' :
                                                    sp.porte === 'Medio' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {sp.porte}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => startEdit(sp)}
                                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(sp.id_especie)}
                                                className="text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Deletar
                                            </button>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                    {loading && <div className="text-center py-8 text-gray-500">Carregando...</div>}
                    {!loading && species.length === 0 && <div className="text-center py-8 text-gray-500">Nenhuma espécie encontrada</div>}
                </div>
            </div>
        </div>
    );
}

function SpeciesForm({ formData, setFormData, onSave, onCancel }: any) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Comum *</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={formData.nome_comum}
                    onChange={(e) => setFormData({ ...formData, nome_comum: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Científico *</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={formData.nome_cientifico}
                    onChange={(e) => setFormData({ ...formData, nome_cientifico: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Família</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={formData.family}
                    onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={formData.native_status}
                    onChange={(e) => setFormData({ ...formData, native_status: e.target.value })}
                >
                    <option value="">Selecione...</option>
                    <option value="Nativa">Nativa</option>
                    <option value="Exótica">Exótica</option>
                    <option value="Desconhecida">Desconhecida</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={formData.porte}
                    onChange={(e) => setFormData({ ...formData, porte: e.target.value })}
                >
                    <option value="">Selecione...</option>
                    <option value="Pequeno">Pequeno (até 6m)</option>
                    <option value="Medio">Médio (6-12m)</option>
                    <option value="Grande">Grande (acima de 12m)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Crescimento</label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={formData.growth_rate}
                    onChange={(e) => setFormData({ ...formData, growth_rate: e.target.value })}
                >
                    <option value="">Selecione...</option>
                    <option value="Lento">Lento</option>
                    <option value="Médio">Médio</option>
                    <option value="Rápido">Rápido</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Altura Máxima (m)</label>
                <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={formData.max_height_m}
                    onChange={(e) => setFormData({ ...formData, max_height_m: e.target.value })}
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={onSave}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Salvar
                </button>
            </div>
        </div>
    );
}
