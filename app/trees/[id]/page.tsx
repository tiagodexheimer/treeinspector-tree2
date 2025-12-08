'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import Link from 'next/link';

// NOTE: In Next.js App Router, params are async in some versions/contexts but usually passed as props to the page component.
// However, since we are using 'use client', params is a prop.

export default function TreeDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [tree, setTree] = useState<any>(null); // Replace any with proper type
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    // Edit form state
    const [formData, setFormData] = useState({
        numero_etiqueta: '',
        rua: '',
        numero: '',
        bairro: '',
        lat: '',
        lng: ''
    });

    useEffect(() => {
        fetchTree();
    }, []); // eslint-disable-line

    async function fetchTree() {
        try {
            const res = await fetch(`/api/trees/${params.id}`);
            if (!res.ok) {
                if (res.status === 404) alert('Árvore não encontrada');
                return;
            }
            const data = await res.json();
            setTree(data);
            setFormData({
                numero_etiqueta: data.numero_etiqueta || '',
                rua: data.rua || '',
                numero: data.numero || '',
                bairro: data.bairro || '',
                lat: data.lat || '',
                lng: data.lng || ''
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        // Send PATCH
        try {
            const res = await fetch(`/api/trees/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setEditing(false);
                fetchTree(); // Refresh
            } else {
                alert('Falha ao atualizar');
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function handleDelete() {
        if (!confirm('Tem certeza que deseja apagar esta árvore? Isso é irreversível.')) return;
        try {
            const res = await fetch(`/api/trees/${params.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/trees');
            }
        } catch (e) { console.error(e); }
    }

    if (loading) return <div className="p-8">Carregando...</div>;
    if (!tree) return <div className="p-8">Árvore não encontrada</div>;

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/trees" className="text-gray-500 hover:text-gray-900">&larr;</Link>
                    <h1 className="text-3xl font-bold">{tree.species.nome_comum} <span className="text-lg text-gray-500 font-normal">#{tree.id_arvore}</span></h1>
                </div>
                <div className="flex gap-2">
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded">Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">Salvar</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditing(true)} className="px-4 py-2 border rounded hover:bg-gray-50">Editar</button>
                            <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50">Excluir</button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Details / Form */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Dados Cadastrais</h2>
                    <div className="space-y-4">
                        {editing ? (
                            // Edit Inputs
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase">Etiqueta</label>
                                        <input className="w-full border p-1 rounded" value={formData.numero_etiqueta} onChange={e => setFormData({ ...formData, numero_etiqueta: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase">Bairro</label>
                                        <input className="w-full border p-1 rounded" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase">Rua</label>
                                    <input className="w-full border p-1 rounded" value={formData.rua} onChange={e => setFormData({ ...formData, rua: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase">Número</label>
                                    <input className="w-full border p-1 rounded" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded">
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase">Lat</label>
                                        <input className="w-full border p-1 rounded" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase">Lng</label>
                                        <input className="w-full border p-1 rounded" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Display
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Etiqueta</span>
                                        <span className="font-medium">{tree.numero_etiqueta || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Espécie (Científico)</span>
                                        <span className="font-medium italic">{tree.species.nome_cientifico}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 uppercase">Endereço</span>
                                    <span className="font-medium">{tree.rua}, {tree.numero} - {tree.bairro}</span>
                                    <div className="text-xs text-gray-400 mt-1">{tree.endereco}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Latitude</span>
                                        <span className="font-mono">{tree.lat}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 uppercase">Longitude</span>
                                        <span className="font-mono">{tree.lng}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Inspections & History */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Últimas Inspeções</h2>
                        {tree.inspections.length === 0 ? <div className="text-gray-500">Nenhuma inspeção registrada.</div> : (
                            <ul className="space-y-4">
                                {tree.inspections.map((insp: any) => (
                                    <li key={insp.id_inspecao} className="border-b last:border-0 pb-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-green-700">{new Date(insp.data_inspecao).toLocaleDateString()}</span>
                                            <span className="text-sm text-gray-500">ID: {insp.id_inspecao}</span>
                                        </div>
                                        {/* Mini summary if available */}
                                        {insp.managementActions.length > 0 && (
                                            <div className="text-sm mt-1">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{insp.managementActions[0].action_type}</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
