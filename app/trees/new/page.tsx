'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Species {
    id_especie: number;
    nome_comum: string;
    nome_cientifico: string;
}

export default function NewTreePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [speciesList, setSpeciesList] = useState<Species[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        numero_etiqueta: '',
        rua: '',
        numero: '',
        bairro: '',
        lat: '',
        lng: '',
        speciesId: ''
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (!['ADMIN', 'GESTOR', 'INSPETOR'].includes(role)) {
                router.push('/trees');
            }
        }
        fetchSpecies();
    }, [status, session, router]);

    async function fetchSpecies() {
        try {
            const res = await fetch('/api/species?limit=100'); // Get top 100
            const data = await res.json();
            setSpeciesList(data.data || []);
        } catch (error) {
            console.error('Erro ao buscar espécies:', error);
        }
    }

    const filteredSpecies = speciesList.filter(s =>
        s.nome_comum.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.speciesId) {
            alert('Por favor, selecione uma espécie');
            return;
        }
        setLoading(true);

        try {
            const res = await fetch('/api/trees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    speciesId: parseInt(formData.speciesId),
                    lat: formData.lat ? parseFloat(formData.lat) : null,
                    lng: formData.lng ? parseFloat(formData.lng) : null,
                })
            });

            if (res.ok) {
                router.push('/trees');
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao criar árvore');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    }

    if (status === 'loading') return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nova Árvore</h1>
                            <p className="text-gray-500 mt-1">Cadastre uma nova árvore no inventário urbano</p>
                        </div>
                        <Link
                            href="/trees"
                            className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-2 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
                            Voltar para Lista
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Identificação Section */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                            Identificação e Espécie
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Nº da Etiqueta</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: 012345"
                                    className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.numero_etiqueta}
                                    onChange={e => setFormData({ ...formData, numero_etiqueta: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Espécie *</label>
                                <select
                                    required
                                    className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
                                    value={formData.speciesId}
                                    onChange={e => setFormData({ ...formData, speciesId: e.target.value })}
                                >
                                    <option value="">Selecione uma espécie...</option>
                                    {speciesList.map(s => (
                                        <option key={s.id_especie} value={s.id_especie}>
                                            {s.nome_comum} ({s.nome_cientifico})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Localização Section */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                            Localização
                        </h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Rua / Logradouro</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Rua das Amendoeiras"
                                    className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.rua}
                                    onChange={e => setFormData({ ...formData, rua: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Número</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 450 ou S/N"
                                        className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        value={formData.numero}
                                        onChange={e => setFormData({ ...formData, numero: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Bairro</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Centro"
                                        className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        value={formData.bairro}
                                        onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-gray-50/80 p-6 rounded-2xl border border-dashed border-gray-200 mt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="-23.5505"
                                        className="w-full border-gray-200 border rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        value={formData.lat}
                                        onChange={e => setFormData({ ...formData, lat: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="-46.6333"
                                        className="w-full border-gray-200 border rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        value={formData.lng}
                                        onChange={e => setFormData({ ...formData, lng: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end items-center gap-4 pt-4">
                        <Link href="/trees" className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-all">
                            Descartar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-10 py-3 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 font-bold disabled:opacity-50 disabled:hover:shadow-none transition-all"
                        >
                            {loading ? 'Processando...' : 'Salvar Árvore'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
