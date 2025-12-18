'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import SelectionMap to avoid SSR issues with Leaflet
const SelectionMap = dynamic(() => import('./SelectionMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
});

interface SelectedTree {
    id: number;
    etiqueta: string;
    species: string;
    bairro: string;
}

export default function NewServiceOrderPage() {
    const router = useRouter();
    const [selectedTrees, setSelectedTrees] = useState<SelectedTree[]>([]);
    const [actionType, setActionType] = useState<string>('Poda');
    const [podaType, setPodaType] = useState<string>('');
    const [assignedTo, setAssignedTo] = useState<string>('');
    const [observations, setObservations] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'rectangle' | 'click'>('rectangle');

    const handleTreeSelect = (tree: SelectedTree) => {
        setSelectedTrees(prev => {
            const exists = prev.find(t => t.id === tree.id);
            if (exists) {
                return prev.filter(t => t.id !== tree.id);
            }
            return [...prev, tree];
        });
    };

    const handleRectangleSelect = (trees: SelectedTree[]) => {
        setSelectedTrees(prev => {
            const newTrees = trees.filter(t => !prev.find(p => p.id === t.id));
            return [...prev, ...newTrees];
        });
    };

    const handleClearSelection = () => {
        setSelectedTrees([]);
    };

    const handleSubmit = async () => {
        if (selectedTrees.length === 0) {
            alert('Selecione pelo menos uma árvore!');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/service-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tree_ids: selectedTrees.map(t => t.id),
                    action_type: actionType,
                    poda_type: podaType,
                    assigned_to: assignedTo,
                    observations
                })
            });

            if (response.ok) {
                alert(`Ordem de Serviço criada com ${selectedTrees.length} árvore(s)!`);
                router.push('/service-orders');
            } else {
                const error = await response.json();
                alert(`Erro: ${error.error || 'Falha ao criar OS'}`);
            }
        } catch (error) {
            console.error('Error creating service order:', error);
            alert('Erro ao criar ordem de serviço');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Map Area */}
            <div className="flex-1 relative">
                <SelectionMap
                    onTreeSelect={handleTreeSelect}
                    onRectangleSelect={handleRectangleSelect}
                    selectedTreeIds={selectedTrees.map(t => t.id)}
                    selectionMode={selectionMode}
                />

                {/* Selection Mode Toggle */}
                <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg z-[1000]">
                    <div className="text-xs font-bold text-gray-600 mb-2">Modo de Seleção</div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectionMode('rectangle')}
                            className={`px-3 py-1 text-sm rounded ${selectionMode === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            📐 Retângulo
                        </button>
                        <button
                            onClick={() => setSelectionMode('click')}
                            className={`px-3 py-1 text-sm rounded ${selectionMode === 'click' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            👆 Ctrl+Click
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {selectionMode === 'rectangle'
                            ? 'Clique e arraste para selecionar área'
                            : 'Segure Ctrl e clique nas árvores'}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-96 bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Nova OS via Mapa</h1>
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Selected Trees */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-semibold text-gray-700">
                            Árvores Selecionadas ({selectedTrees.length})
                        </h2>
                        {selectedTrees.length > 0 && (
                            <button
                                onClick={handleClearSelection}
                                className="text-xs text-red-600 hover:underline"
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {selectedTrees.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <div className="text-4xl mb-2">🌳</div>
                            <p>Selecione árvores no mapa</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-auto">
                            {selectedTrees.map(tree => (
                                <div
                                    key={tree.id}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                                >
                                    <div>
                                        <div className="font-medium text-sm">#{tree.etiqueta || tree.id}</div>
                                        <div className="text-xs text-gray-500">{tree.species || 'Espécie desconhecida'}</div>
                                        <div className="text-xs text-gray-400">{tree.bairro || ''}</div>
                                    </div>
                                    <button
                                        onClick={() => handleTreeSelect(tree)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form */}
                <div className="p-4 border-t border-gray-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Ação
                        </label>
                        <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                            <option value="Poda">Poda</option>
                            <option value="Supressão">Supressão (Remoção)</option>
                            <option value="Substituição">Substituição</option>
                        </select>
                    </div>

                    {actionType === 'Poda' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Poda
                            </label>
                            <select
                                value={podaType}
                                onChange={(e) => setPodaType(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">Selecione...</option>
                                <option value="Levantamento de copa">Levantamento de copa</option>
                                <option value="Afastamento de rede">Afastamento de rede</option>
                                <option value="Limpeza">Limpeza</option>
                                <option value="Formação">Formação</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Responsável
                        </label>
                        <input
                            type="text"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            placeholder="Nome do responsável"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                        </label>
                        <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Observações adicionais..."
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={selectedTrees.length === 0 || isSubmitting}
                        className={`w-full py-3 rounded-lg font-bold text-white transition ${selectedTrees.length === 0 || isSubmitting
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {isSubmitting
                            ? 'Criando...'
                            : `Criar OS com ${selectedTrees.length} Árvore(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
