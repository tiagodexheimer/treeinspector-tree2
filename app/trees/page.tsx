'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tree {
    id_arvore: number;
    numero_etiqueta: string;
    species: { nome_comum: string };
    rua: string | null;
    numero: string | null;
    bairro: string | null;
    endereco: string | null;
}

export default function TreesPage() {
    const [trees, setTrees] = useState<Tree[]>([]);
    const [loading, setLoading] = useState(true);
    const [bairro, setBairro] = useState('');
    const [endereco, setEndereco] = useState('');

    useEffect(() => {
        fetchTrees();
    }, []);

    async function fetchTrees() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (bairro) params.append('bairro', bairro);
            if (endereco) params.append('endereco', endereco);

            const res = await fetch(`/api/trees?${params.toString()}`);
            const data = await res.json();
            setTrees(data);
        } catch (error) {
            console.error('Failed to fetch trees', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Listagem de Árvores</h1>
                <div className="flex gap-4">
                    <Link href="/trees/new" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium">
                        + Nova Árvore
                    </Link>
                    <Link href="/" className="text-green-600 hover:text-green-800 font-medium flex items-center">
                        Ver Mapa
                    </Link>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input
                        type="text"
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Filtrar por bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                        type="text"
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Rua ou endereço"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchTrees}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                    Filtrar
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Carregando...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etiqueta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Espécie</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endereço</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bairro</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trees.map((tree) => (
                                <tr key={tree.id_arvore} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{tree.id_arvore}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.numero_etiqueta}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{tree.species.nome_comum}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {tree.rua ? `${tree.rua}, ${tree.numero}` : tree.endereco}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.bairro || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/trees/${tree.id_arvore}`} className="text-green-600 hover:text-green-900">
                                            Detalhes
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
