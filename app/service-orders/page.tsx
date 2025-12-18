'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ServiceOrder {
    id: number;
    status: string;
    assigned_to: string | null;
    created_at: string;
    tree: {
        id_arvore: number;
        numero_etiqueta: string | null;
        species: {
            nome_comum: string;
        };
    };
    management: {
        action_type: string;
        poda_type: string | null;
    };
}

import CreateOSModal from '../components/CreateOSModal';

export default function ServiceOrdersPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    async function fetchOrders() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);

            const res = await fetch(`/api/service-orders?${params.toString()}`);
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Planejada': return 'bg-blue-100 text-blue-800';
            case 'Em Execução': return 'bg-yellow-100 text-yellow-800';
            case 'Concluída': return 'bg-green-100 text-green-800';
            case 'Cancelada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>

                <div className="flex gap-4">
                    <Link
                        href="/service-orders/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                        🗺️ Nova OS via Mapa
                    </Link>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                    >
                        + Nova O.S.
                    </button>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border px-4 py-2 rounded-lg bg-white"
                    >
                        <option value="">Todos os Status</option>
                        <option value="Planejada">Planejada</option>
                        <option value="Em Execução">Em Execução</option>
                        <option value="Concluída">Concluída</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>
            </div>

            <CreateOSModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchOrders}
            />

            {loading ? (
                <div className="text-center py-12">Carregando...</div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Árvore</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map((os) => (
                                <tr key={os.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{os.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{os.tree.species.nome_comum}</div>
                                        <div className="text-xs text-gray-400">ID: {os.tree.id_arvore} | Etiqueta: {os.tree.numero_etiqueta || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className="font-semibold">{os.management.action_type}</span>
                                        {os.management.poda_type && <span className="text-gray-500"> - {os.management.poda_type}</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {os.assigned_to || 'Não atribuído'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(os.status)}`}>
                                            {os.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(os.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Nenhuma ordem de serviço encontrada.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
