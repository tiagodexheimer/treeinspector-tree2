'use client';

import { useState, useEffect } from 'react';

interface CreateOSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Tree {
    id_arvore: number;
    numero_etiqueta: string;
    rua: string;
    species: { nome_comum: string };
}

export default function CreateOSModal({ isOpen, onClose, onSuccess }: CreateOSModalProps) {
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Tree[]>([]);
    const [selectedTree, setSelectedTree] = useState<Tree | null>(null);

    const [actionType, setActionType] = useState('Poda');
    const [podaType, setPodaType] = useState('Levantamento de Copa');
    const [assignedTo, setAssignedTo] = useState('');
    const [observations, setObservations] = useState('');
    const [loading, setLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length > 2) {
                searchTrees();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    async function searchTrees() {
        try {
            const res = await fetch(`/api/trees?q=${searchTerm}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed', error);
        }
    }

    async function handleSubmit() {
        if (!selectedTree) return;
        setLoading(true);

        try {
            const response = await fetch('/api/service-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tree_id: selectedTree.id_arvore,
                    action_type: actionType,
                    poda_type: actionType === 'Poda' ? podaType : null,
                    assigned_to: assignedTo,
                    observations
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
                // Reset state
                setStep(1);
                setSelectedTree(null);
                setSearchTerm('');
            } else {
                alert('Erro ao criar OS');
            }
        } catch (e) {
            console.error(e);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
                <h2 className="text-xl font-bold mb-4">Nova Ordem de Serviço</h2>

                {step === 1 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Selecione a Árvore</label>
                        <input
                            type="text"
                            placeholder="Buscar por etiqueta ou rua..."
                            className="w-full border rounded p-2 mb-4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div className="max-h-60 overflow-y-auto border rounded divide-y">
                            {searchResults.length === 0 && searchTerm.length > 2 && (
                                <div className="p-4 text-gray-500 text-center">Nenhuma árvore encontrada.</div>
                            )}
                            {searchResults.map(tree => (
                                <div
                                    key={tree.id_arvore}
                                    className={`p-3 cursor-pointer hover:bg-green-50 ${selectedTree?.id_arvore === tree.id_arvore ? 'bg-green-100' : ''}`}
                                    onClick={() => setSelectedTree(tree)}
                                >
                                    <div className="font-semibold">{tree.species.nome_comum}</div>
                                    <div className="text-sm text-gray-600">
                                        ID: {tree.id_arvore} | Etiqueta: {tree.numero_etiqueta || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">{tree.rua}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-4">
                            <button onClick={onClose} className="mr-2 text-gray-600">Cancelar</button>
                            <button
                                disabled={!selectedTree}
                                onClick={() => setStep(2)}
                                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <strong>Árvore Selecionada:</strong> {selectedTree?.species.nome_comum} (ID: {selectedTree?.id_arvore})
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Tipo de Ação</label>
                            <select
                                value={actionType}
                                onChange={e => setActionType(e.target.value)}
                                className="w-full border rounded p-2"
                            >
                                <option value="Poda">Poda</option>
                                <option value="Supressão">Supressão</option>
                                <option value="Substituição">Substituição</option>
                                <option value="Tratamento">Tratamento</option>
                            </select>
                        </div>

                        {actionType === 'Poda' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo de Poda</label>
                                <select
                                    value={podaType}
                                    onChange={e => setPodaType(e.target.value)}
                                    className="w-full border rounded p-2"
                                >
                                    <option value="Levantamento de Copa">Levantamento de Copa</option>
                                    <option value="Afastamento de Rede">Afastamento de Rede</option>
                                    <option value="Afastamento de Edificação">Afastamento de Edificação</option>
                                    <option value="Limpeza">Limpeza</option>
                                    <option value="Raiz">Raiz</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Equipe Responsável</label>
                            <input
                                type="text"
                                value={assignedTo}
                                onChange={e => setAssignedTo(e.target.value)}
                                className="w-full border rounded p-2"
                                placeholder="Nome da equipe ou profissional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Observações</label>
                            <textarea
                                value={observations}
                                onChange={e => setObservations(e.target.value)}
                                className="w-full border rounded p-2 h-20"
                            />
                        </div>

                        <div className="flex justify-end mt-4">
                            <button onClick={() => setStep(1)} className="mr-2 text-gray-600">Voltar</button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {loading ? 'Criando...' : 'Criar Ordem de Serviço'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
