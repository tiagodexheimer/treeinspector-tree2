'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TreeDetail {
    id: number;
    endereco: string;
    bairro: string;
    especie: string;
    saude: string;
    manejo: string;
    data_inspecao: string;
}

function GridDetailsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const [trees, setTrees] = useState<TreeDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lat || !lng) return;

        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/statistics/grid-details?lat=${lat}&lng=${lng}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTrees(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [lat, lng]);

    if (!lat || !lng) return <div className="p-8 text-center text-gray-500">Coordenadas inválidas.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Detalhamento da Micro-Região</h1>
                        <p className="text-sm text-gray-500">Coordenadas do bloco: {lat}, {lng}</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm"
                    >
                        Voltar para o Mapa
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <span className="font-semibold text-gray-700">Total de Árvores: {trees.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-100 text-gray-900 uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Endereço</th>
                                        <th className="px-4 py-3">Espécie</th>
                                        <th className="px-4 py-3">Saúde</th>
                                        <th className="px-4 py-3">Manejo Necessário</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {trees.map((tree) => (
                                        <tr key={tree.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 font-medium text-gray-900">#{tree.id}</td>
                                            <td className="px-4 py-3">{tree.endereco} <span className="text-xs text-gray-400 block">{tree.bairro}</span></td>
                                            <td className="px-4 py-3 italic">{tree.especie}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                                    ${tree.saude.includes('Bom') ? 'bg-green-100 text-green-800' :
                                                        tree.saude.includes('Ruim') ? 'bg-red-100 text-red-800' :
                                                            tree.saude.includes('Morta') ? 'bg-gray-800 text-white' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {tree.saude}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                                    ${tree.manejo === 'Sem necessidade' ? 'bg-gray-100 text-gray-500 border border-gray-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                    {tree.manejo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    href={`/trees/${tree.id}`}
                                                    className="text-blue-600 hover:text-blue-900 font-semibold text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
                                                >
                                                    Ver Detalhes
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {trees.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                Nenhuma árvore encontrada neste bloco.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GridDetailsPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
            <GridDetailsContent />
        </Suspense>
    );
}
