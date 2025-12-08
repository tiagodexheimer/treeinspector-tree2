'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Species {
    id_especie: number;
    nome_comum: string;
}

export default function NewTreePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [speciesList, setSpeciesList] = useState<Species[]>([]);

    const [formData, setFormData] = useState({
        numero_etiqueta: '',
        rua: '',
        numero: '',
        bairro: '',
        lat: '',
        lng: '',
        speciesId: ''
    });

    // Fetch species for dropdown (simplified)
    // Ideally we should have a /api/species endpoint or pass it via props/cache
    // For now, let's just cheat and assume user knows ID or we hardcode common ones,
    // OR we default to "Desconhecida" (ID 1 usually).
    // Let's create a quick species fetcher later maybe? 
    // For MVP, user types ID or we just default to 1.

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/trees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    speciesId: formData.speciesId || 1, // Default to 1 if empty
                    lat: formData.lat ? parseFloat(formData.lat) : null,
                    lng: formData.lng ? parseFloat(formData.lng) : null,
                })
            });

            if (res.ok) {
                router.push('/trees');
            } else {
                alert('Erro ao criar árvore');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Nova Árvore</h1>
                <Link href="/trees" className="text-gray-600 hover:text-gray-900">Voltar</Link>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Etiqueta</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.numero_etiqueta}
                            onChange={e => setFormData({ ...formData, numero_etiqueta: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ID Espécie (Temp)</label>
                        <input
                            type="number"
                            className="w-full border rounded p-2"
                            value={formData.speciesId}
                            onChange={e => setFormData({ ...formData, speciesId: e.target.value })}
                            placeholder="1 para Desconhecida"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Rua / Logradouro</label>
                    <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={formData.rua}
                        onChange={e => setFormData({ ...formData, rua: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Número</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.numero}
                            onChange={e => setFormData({ ...formData, numero: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Bairro</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.bairro}
                            onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                    <div>
                        <label className="block text-sm font-medium mb-1">Latitude</label>
                        <input
                            type="number"
                            step="any"
                            className="w-full border rounded p-2"
                            value={formData.lat}
                            onChange={e => setFormData({ ...formData, lat: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Longitude</label>
                        <input
                            type="number"
                            step="any"
                            className="w-full border rounded p-2"
                            value={formData.lng}
                            onChange={e => setFormData({ ...formData, lng: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Árvore'}
                    </button>
                </div>
            </form>
        </div>
    );
}
